import AsyncStorage from "@react-native-async-storage/async-storage";
import { base58 } from "@scure/base";
import * as Linking from "expo-linking";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import nacl from "tweetnacl";
import { SendOptions, Transaction } from "@solana/web3.js";
import { Buffer } from "buffer";

type SolanaCluster = "mainnet-beta" | "devnet" | "testnet";

type PhantomConnectionData = {
  public_key: string;
  session: string;
  cluster?: SolanaCluster;
};

type PendingRequest = {
  type:
    | "connect"
    | "disconnect"
    | "signMessage"
    | "signTransaction"
    | "signAndSendTransaction"
    | "signAllTransactions";
  resolve: (value?: any) => void;
  reject: (error: Error) => void;
  timeoutId: ReturnType<typeof setTimeout>;
};

type UsePhantomClusterConnectorProps = {
  appUrl: string;
  redirectUri: string;
  autoReconnect?: boolean;
};

type DecryptPayload = Record<string, any>;

const PHANTOM_BASE_URL = "https://phantom.app";
const WALLET_ID = "phantom_encryption_public_key";
const KEYPAIR_STORAGE_KEY = "wallet_keypair";
const PHANTOM_SECRET_KEY_STORAGE = `${PHANTOM_BASE_URL}-key`;
const PHANTOM_CONNECTION_STORAGE = `${PHANTOM_BASE_URL}-data`;
const REQUEST_TIMEOUT_MS = 120000;

const buildDeepLink = (method: string, params: URLSearchParams) =>
  `${PHANTOM_BASE_URL}/ul/v1/${method}?${params.toString()}`;

const serializeKeyPair = (keyPair: nacl.BoxKeyPair) =>
  JSON.stringify({
    publicKey: Array.from(keyPair.publicKey),
    secretKey: Array.from(keyPair.secretKey),
  });

const deserializeKeyPair = (serialized: string): nacl.BoxKeyPair => {
  const parsed = JSON.parse(serialized) as {
    publicKey: number[];
    secretKey: number[];
  };
  return {
    publicKey: new Uint8Array(parsed.publicKey),
    secretKey: new Uint8Array(parsed.secretKey),
  };
};

const decodeSessionCluster = (session: string): SolanaCluster | undefined => {
  try {
    const bytes = base58.decode(session);
    if (bytes.length <= 64) return undefined;
    const messageBytes = bytes.slice(64);
    const parsed = JSON.parse(Buffer.from(messageBytes).toString("utf8")) as {
      cluster?: string;
    };
    const cluster = parsed.cluster;
    if (
      cluster === "mainnet-beta" ||
      cluster === "devnet" ||
      cluster === "testnet"
    ) {
      return cluster;
    }
  } catch {}
  return undefined;
};

const encryptPayload = (payload: object, sharedSecret: Uint8Array) => {
  const nonce = nacl.randomBytes(24);
  const encrypted = nacl.box.after(
    Buffer.from(JSON.stringify(payload)),
    nonce,
    sharedSecret
  );
  return {
    nonce: base58.encode(nonce),
    data: base58.encode(encrypted),
  };
};

const decryptPayload = (
  encryptedData: string,
  nonce: string,
  sharedSecret: Uint8Array
) => {
  const decrypted = nacl.box.open.after(
    base58.decode(encryptedData),
    base58.decode(nonce),
    sharedSecret
  );
  if (!decrypted) {
    throw new Error("Unable to decrypt wallet response");
  }
  return JSON.parse(Buffer.from(decrypted).toString("utf8")) as DecryptPayload;
};

export const usePhantomClusterConnector = ({
  appUrl,
  redirectUri,
  autoReconnect = true,
}: UsePhantomClusterConnectorProps) => {
  const [connection, setConnection] = useState<PhantomConnectionData | null>(
    null
  );
  const connectionRef = useRef<PhantomConnectionData | null>(null);
  const sharedSecretRef = useRef<Uint8Array | null>(null);
  const keyPairRef = useRef<nacl.BoxKeyPair | null>(null);
  const pendingRequestRef = useRef<PendingRequest | null>(null);

  const setConnectionState = useCallback(
    (nextConnection: PhantomConnectionData | null) => {
      connectionRef.current = nextConnection;
      setConnection(nextConnection);
    },
    []
  );

  const clearPendingRequest = useCallback(() => {
    if (pendingRequestRef.current) {
      clearTimeout(pendingRequestRef.current.timeoutId);
      pendingRequestRef.current = null;
    }
  }, []);

  const ensureKeyPair = useCallback(async () => {
    if (keyPairRef.current) {
      return keyPairRef.current;
    }

    const storedKeyPair = await AsyncStorage.getItem(KEYPAIR_STORAGE_KEY);
    if (storedKeyPair) {
      const parsed = deserializeKeyPair(storedKeyPair);
      keyPairRef.current = parsed;
      return parsed;
    }

    const generated = nacl.box.keyPair();
    keyPairRef.current = generated;
    await AsyncStorage.setItem(KEYPAIR_STORAGE_KEY, serializeKeyPair(generated));
    return generated;
  }, []);

  const setPendingRequest = useCallback(
    (
      type: PendingRequest["type"],
      resolve: PendingRequest["resolve"],
      reject: PendingRequest["reject"]
    ) => {
      if (pendingRequestRef.current) {
        pendingRequestRef.current.reject(
          new Error("A wallet request is already in progress")
        );
        clearTimeout(pendingRequestRef.current.timeoutId);
      }

      const timeoutId = setTimeout(() => {
        if (pendingRequestRef.current?.type === type) {
          pendingRequestRef.current.reject(new Error("Signature request timed out"));
          pendingRequestRef.current = null;
        }
      }, REQUEST_TIMEOUT_MS);

      pendingRequestRef.current = {
        type,
        resolve,
        reject,
        timeoutId,
      };
    },
    []
  );

  const connect = useCallback(
    async (cluster: SolanaCluster = "mainnet-beta") => {
      const keyPair = await ensureKeyPair();
      const params = new URLSearchParams({
        app_url: appUrl,
        dapp_encryption_public_key: base58.encode(keyPair.publicKey),
        redirect_link: `${Linking.createURL(
          redirectUri
        )}?wallet_action=onConnect&wallet_id=${WALLET_ID}`,
        cluster,
      });

      const deeplink = buildDeepLink("connect", params);

      return new Promise<void>((resolve, reject) => {
        setPendingRequest("connect", resolve, reject);
        Linking.openURL(deeplink).catch((error) => {
          clearPendingRequest();
          reject(
            error instanceof Error
              ? error
              : new Error("Could not open Phantom wallet")
          );
        });
      });
    },
    [appUrl, clearPendingRequest, ensureKeyPair, redirectUri, setPendingRequest]
  );

  const disconnect = useCallback(async () => {
    const activeConnection = connectionRef.current;
    const sharedSecret = sharedSecretRef.current;
    if (!activeConnection || !sharedSecret) {
      setConnectionState(null);
      await AsyncStorage.multiRemove([
        PHANTOM_CONNECTION_STORAGE,
        PHANTOM_SECRET_KEY_STORAGE,
      ]);
      return;
    }
    setConnectionState(null);
    setConnection(null);
    sharedSecretRef.current = null;
    await AsyncStorage.multiRemove([
      PHANTOM_CONNECTION_STORAGE,
      PHANTOM_SECRET_KEY_STORAGE,
    ]);

    try {
      const keyPair = await ensureKeyPair();
      const payload = encryptPayload(
        { session: activeConnection.session },
        sharedSecret
      );
      const params = new URLSearchParams({
        nonce: payload.nonce,
        dapp_encryption_public_key: base58.encode(keyPair.publicKey),
        redirect_link: `${Linking.createURL(
          redirectUri
        )}?wallet_action=onDisconnect&wallet_id=${WALLET_ID}`,
        payload: payload.data,
      });
      const deeplink = buildDeepLink("disconnect", params);
      await Linking.openURL(deeplink);
    } catch {}
  }, [ensureKeyPair, redirectUri, setConnectionState]);

  const signTransaction = useCallback(
    async (transaction: Transaction) => {
      const activeConnection = connectionRef.current;
      const sharedSecret = sharedSecretRef.current;
      if (!activeConnection || !sharedSecret) {
        throw new Error("Wallet not connected");
      }

      const keyPair = await ensureKeyPair();
      const payload = encryptPayload(
        {
          session: activeConnection.session,
          transaction: base58.encode(
            transaction.serialize({ requireAllSignatures: false })
          ),
        },
        sharedSecret
      );

      const params = new URLSearchParams({
        nonce: payload.nonce,
        dapp_encryption_public_key: base58.encode(keyPair.publicKey),
        redirect_link: `${Linking.createURL(
          redirectUri
        )}?wallet_action=onSignTransaction&wallet_id=${WALLET_ID}`,
        payload: payload.data,
      });

      const deeplink = buildDeepLink("signTransaction", params);

      return new Promise<{ transaction: string }>((resolve, reject) => {
        setPendingRequest("signTransaction", resolve, reject);
        Linking.openURL(deeplink).catch((error) => {
          clearPendingRequest();
          reject(
            error instanceof Error
              ? error
              : new Error("Could not open Phantom wallet")
          );
        });
      });
    },
    [clearPendingRequest, ensureKeyPair, redirectUri, setPendingRequest]
  );

  const signAndSendTransaction = useCallback(
    async (transaction: Transaction, sendOptions?: SendOptions) => {
      const activeConnection = connectionRef.current;
      const sharedSecret = sharedSecretRef.current;
      if (!activeConnection || !sharedSecret) {
        throw new Error("Wallet not connected");
      }

      const keyPair = await ensureKeyPair();
      const payload = encryptPayload(
        {
          session: activeConnection.session,
          transaction: base58.encode(
            transaction.serialize({ requireAllSignatures: false })
          ),
          sendOptions,
        },
        sharedSecret
      );

      const params = new URLSearchParams({
        nonce: payload.nonce,
        dapp_encryption_public_key: base58.encode(keyPair.publicKey),
        redirect_link: `${Linking.createURL(
          redirectUri
        )}?wallet_action=onSignAndSendTransaction&wallet_id=${WALLET_ID}`,
        payload: payload.data,
      });

      const deeplink = buildDeepLink("signAndSendTransaction", params);

      return new Promise<{ signature: string }>((resolve, reject) => {
        setPendingRequest("signAndSendTransaction", resolve, reject);
        Linking.openURL(deeplink).catch((error) => {
          clearPendingRequest();
          reject(
            error instanceof Error
              ? error
              : new Error("Could not open Phantom wallet")
          );
        });
      });
    },
    [clearPendingRequest, connection, ensureKeyPair, redirectUri, setPendingRequest]
  );

  const signMessage = useCallback(async (_message: string) => {
    throw new Error("This method is not supported");
  }, []);

  const signAllTransactions = useCallback(async (_transactions: Transaction[]) => {
    throw new Error("This method is not supported");
  }, []);

  const handleRedirect = useCallback(
    async (url: string) => {
      try {
        const params = new URL(url).searchParams;
        const walletId = params.get("wallet_id");
        if (!walletId || walletId !== WALLET_ID) return;

        if (params.get("errorCode")) {
          const message = params.get("errorMessage") || "Wallet request failed";
          if (pendingRequestRef.current) {
            pendingRequestRef.current.reject(new Error(message));
            clearPendingRequest();
          } else {
            console.error("Error from wallet provider: ", message);
          }
          return;
        }

        const action = params.get("wallet_action");

        if (action === "onDisconnect") {
          setConnectionState(null);
          sharedSecretRef.current = null;
          await AsyncStorage.multiRemove([
            PHANTOM_CONNECTION_STORAGE,
            PHANTOM_SECRET_KEY_STORAGE,
          ]);
          if (pendingRequestRef.current?.type === "disconnect") {
            pendingRequestRef.current.resolve();
            clearPendingRequest();
          }
          return;
        }

        const encryptedData = params.get("data");
        const nonce = params.get("nonce");
        if (!encryptedData || !nonce) return;

        if (action === "onConnect") {
          const walletPublicKey = params.get(WALLET_ID);
          const keyPair = await ensureKeyPair();
          if (!walletPublicKey) {
            throw new Error("Missing Phantom encryption public key");
          }

          const sharedSecret = nacl.box.before(
            base58.decode(walletPublicKey),
            keyPair.secretKey
          );
          sharedSecretRef.current = sharedSecret;

          const decrypted = decryptPayload(encryptedData, nonce, sharedSecret);
          const parsedConnection: PhantomConnectionData = {
            public_key: decrypted.public_key,
            session: decrypted.session,
            cluster: decodeSessionCluster(decrypted.session),
          };
          setConnectionState(parsedConnection);
          await AsyncStorage.multiSet([
            [
              PHANTOM_SECRET_KEY_STORAGE,
              Buffer.from(sharedSecret).toString("base64"),
            ],
            [PHANTOM_CONNECTION_STORAGE, JSON.stringify(parsedConnection)],
          ]);

          if (pendingRequestRef.current?.type === "connect") {
            pendingRequestRef.current.resolve();
            clearPendingRequest();
          }
          return;
        }

        const sharedSecret = sharedSecretRef.current;
        if (!sharedSecret) {
          throw new Error("Missing shared secret");
        }
        const decrypted = decryptPayload(encryptedData, nonce, sharedSecret);

        if (
          action === "onSignTransaction" &&
          pendingRequestRef.current?.type === "signTransaction"
        ) {
          pendingRequestRef.current.resolve(decrypted);
          clearPendingRequest();
          return;
        }

        if (
          action === "onSignAndSendTransaction" &&
          pendingRequestRef.current?.type === "signAndSendTransaction"
        ) {
          pendingRequestRef.current.resolve(decrypted);
          clearPendingRequest();
          return;
        }
      } catch (error) {
        if (pendingRequestRef.current) {
          pendingRequestRef.current.reject(
            error instanceof Error ? error : new Error("Wallet request failed")
          );
          clearPendingRequest();
        } else {
          console.error("Error processing wallet redirect:", error);
        }
      }
    },
    [clearPendingRequest, ensureKeyPair, setConnectionState]
  );

  useEffect(() => {
    if (!autoReconnect) return;

    let isMounted = true;
    (async () => {
      const [storedSecret, storedConnection] = await AsyncStorage.multiGet([
        PHANTOM_SECRET_KEY_STORAGE,
        PHANTOM_CONNECTION_STORAGE,
      ]);
      if (!isMounted) return;

      const secretValue = storedSecret[1];
      const connectionValue = storedConnection[1];
      if (secretValue && connectionValue) {
        try {
          const parsedConnection = JSON.parse(
            connectionValue
          ) as PhantomConnectionData;
          sharedSecretRef.current = Uint8Array.from(
            Buffer.from(secretValue, "base64")
          );
          setConnectionState({
            ...parsedConnection,
            cluster:
              parsedConnection.cluster ??
              decodeSessionCluster(parsedConnection.session),
          });
        } catch {}
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [autoReconnect, setConnectionState]);

  useEffect(() => {
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleRedirect(url);
      }
    });

    const subscription = Linking.addEventListener("url", ({ url }) => {
      handleRedirect(url);
    });

    return () => {
      subscription.remove();
      clearPendingRequest();
    };
  }, [clearPendingRequest, handleRedirect]);

  return useMemo(
    () => ({
      address: connection?.public_key,
      isConnected: !!connection?.public_key,
      sessionCluster: connection?.cluster,
      connect,
      disconnect,
      signMessage,
      signTransaction,
      signAndSendTransaction,
      signAllTransactions,
    }),
    [
      connect,
      connection?.cluster,
      connection?.public_key,
      disconnect,
      signAllTransactions,
      signAndSendTransaction,
      signMessage,
      signTransaction,
    ]
  );
};

