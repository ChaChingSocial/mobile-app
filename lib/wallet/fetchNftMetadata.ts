import { clusterApiUrl, Connection, PublicKey } from "@solana/web3.js";

export type NftMetadata = {
  mint: string;
  name: string;
  imageUri: string;
};

const METADATA_PROGRAM_ID = new PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
);

async function getMetadataPDA(mint: PublicKey): Promise<PublicKey> {
  const [pda] = await PublicKey.findProgramAddress(
    [
      Buffer.from("metadata"),
      METADATA_PROGRAM_ID.toBuffer(),
      mint.toBuffer(),
    ],
    METADATA_PROGRAM_ID
  );
  return pda;
}

function readString(
  data: Buffer,
  offset: number
): { value: string; nextOffset: number } {
  const length = data.readUInt32LE(offset);
  const strBytes = data.slice(offset + 4, offset + 4 + length);
  const value = strBytes.toString("utf-8").replace(/\0/g, "").trim();
  return { value, nextOffset: offset + 4 + length };
}

function parseMetadata(data: Buffer): { name: string; uri: string } | null {
  try {
    // Layout: key (1) + update_authority (32) + mint (32) = 65 bytes before name
    let offset = 1 + 32 + 32;

    const { value: name, nextOffset: afterName } = readString(data, offset);
    offset = afterName;

    // skip symbol
    const { nextOffset: afterSymbol } = readString(data, offset);
    offset = afterSymbol;

    const { value: uri } = readString(data, offset);

    if (!uri) return null;
    return { name, uri };
  } catch {
    return null;
  }
}

function resolveUri(uri: string): string {
  if (uri.startsWith("ipfs://")) {
    return uri.replace("ipfs://", "https://ipfs.io/ipfs/");
  }
  if (uri.startsWith("ar://")) {
    return uri.replace("ar://", "https://arweave.net/");
  }
  return uri;
}

/** AbortSignal.timeout() is not available in React Native's Hermes — use this instead */
function fetchWithTimeout(url: string, ms: number): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  return fetch(url, { signal: controller.signal }).finally(() =>
    clearTimeout(id)
  );
}

async function fetchOffchainImage(uri: string): Promise<string | null> {
  try {
    const resolved = resolveUri(uri);
    const res = await fetchWithTimeout(resolved, 8000);
    if (!res.ok) {
      console.log("[NFT] off-chain fetch failed", resolved, res.status);
      return null;
    }
    const json = await res.json();

    // 1. Standard Metaplex v1.1+ — top-level "image" field
    const image: unknown = json?.image;
    if (typeof image === "string" && image.length > 0) {
      return resolveUri(image);
    }

    // 2. Metaplex v1.0 — image nested under properties.files[]
    const files: unknown = json?.properties?.files;
    if (Array.isArray(files)) {
      for (const file of files) {
        const fileUri: unknown = file?.uri ?? file?.url;
        const fileType: unknown = file?.type ?? file?.mediaType ?? "";
        // Prefer explicit image types; fall back to first entry if no type info
        if (
          typeof fileUri === "string" &&
          fileUri.length > 0 &&
          (String(fileType).startsWith("image") || fileType === "")
        ) {
          return resolveUri(fileUri);
        }
      }
    }

    // 3. Animated / video NFTs may only carry animation_url at the top level
    const animationUrl: unknown = json?.animation_url;
    if (typeof animationUrl === "string" && animationUrl.length > 0) {
      return resolveUri(animationUrl);
    }

    console.log("[NFT] no image field in off-chain JSON", resolved, json);
    return null;
  } catch (e) {
    console.log("[NFT] fetchOffchainImage error", uri, e);
    return null;
  }
}

async function fetchMagicEdenMetadata(mint: string): Promise<NftMetadata | null> {
  try {
    const res = await fetchWithTimeout(
      `https://api-mainnet.magiceden.dev/v2/tokens/${mint}`,
      6000
    );
    if (!res.ok) {
      console.log("[NFT] ME fetch failed", mint, res.status);
      return null;
    }
    const json = await res.json();
    const image: unknown = json?.image;
    const name: unknown = json?.name;
    if (typeof image !== "string" || !image) {
      console.log("[NFT] ME no image for", mint, json);
      return null;
    }
    return {
      mint,
      name: typeof name === "string" && name ? name : mint.slice(0, 8),
      imageUri: resolveUri(image),
    };
  } catch (e) {
    console.log("[NFT] fetchMagicEdenMetadata error", mint, e);
    return null;
  }
}

async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 2,
  delayMs = 800
): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    if (retries <= 0) throw e;
    await new Promise((res) => setTimeout(res, delayMs));
    return withRetry(fn, retries - 1, delayMs * 2);
  }
}

export async function fetchNftMetadata(
  mints: string[],
  cluster: "mainnet-beta" | "devnet"
): Promise<NftMetadata[]> {
  if (mints.length === 0) return [];

  const connection = new Connection(clusterApiUrl(cluster), "confirmed");

  const mintPubkeys = mints.map((m) => new PublicKey(m));
  const pdas = await Promise.all(mintPubkeys.map(getMetadataPDA));

  let accountInfos: Awaited<ReturnType<typeof connection.getMultipleAccountsInfo>>;
  try {
    accountInfos = await withRetry(() => connection.getMultipleAccountsInfo(pdas));
  } catch (e) {
    console.warn(`[NFT] getMultipleAccountsInfo failed for ${cluster}:`, e);
    return [];
  }

  const withAccount = accountInfos.filter(Boolean).length;
  console.log(`[NFT] ${cluster}: ${mints.length} mints, ${withAccount} metadata accounts found`);

  const metadataResults = accountInfos.map((info, i) => {
    if (!info?.data) return null;
    const parsed = parseMetadata(Buffer.from(info.data));
    if (!parsed) console.log("[NFT] parse failed for mint", mints[i]);
    if (!parsed) return null;
    return { mint: mints[i], ...parsed };
  });

  const imageResults = await Promise.all(
    metadataResults.map(async (result) => {
      if (!result) return null;
      const imageUri = await fetchOffchainImage(result.uri);
      if (!imageUri) return null;
      return {
        mint: result.mint,
        name: result.name,
        imageUri,
      } satisfies NftMetadata;
    })
  );

  const enriched = imageResults.filter((r): r is NftMetadata => r !== null);

  // For mints that failed Metaplex, fall back to Magic Eden (mainnet only)
  if (cluster === "mainnet-beta") {
    const enrichedMints = new Set(enriched.map((n) => n.mint));
    const failedMints = mints.filter((m) => !enrichedMints.has(m));

    const meFallbacks = await Promise.all(
      failedMints.map(fetchMagicEdenMetadata)
    );

    for (const fb of meFallbacks) {
      if (fb) enriched.push(fb);
    }
  }

  return enriched;
}
