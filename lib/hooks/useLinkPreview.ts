import { useState, useEffect, useRef } from "react";
import { LinkPreview } from "@/types/post";

// ── OG parsers ────────────────────────────────────────────────────────────────

function parseMeta(html: string, names: string[]): string | null {
  for (const name of names) {
    const pattern = new RegExp(
      `<meta[^>]+(?:property|name)=["']${name}["'][^>]*content=["']([^"']+)["'][^>]*>`,
      "i"
    );
    const m = html.match(pattern);
    if (m?.[1]) return m[1];
  }
  return null;
}

function parseTitle(html: string): string | null {
  const og = parseMeta(html, ["og:title", "twitter:title"]);
  if (og) return og;
  const m = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return m?.[1] ?? null;
}

function parseDescription(html: string): string | null {
  return parseMeta(html, [
    "og:description",
    "twitter:description",
    "description",
  ]);
}

function parseImage(html: string): string | null {
  return parseMeta(html, ["og:image:secure_url", "og:image", "twitter:image"]);
}

// ── URL extractor ─────────────────────────────────────────────────────────────

export function extractFirstUrl(text: string): string | null {
  // Prefer explicit href attributes (rich-text editors produce these)
  const href = text.match(/href=["'](https?:\/\/[^"']+)["']/i);
  if (href) return href[1];
  // Fall back to bare URLs in plain / stripped text
  const plain = text.match(/(https?:\/\/[^\s<>"']+)/i);
  return plain ? plain[1] : null;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * Given an HTML string (e.g. a comment body), detects the first URL,
 * fetches its Open Graph metadata and returns a LinkPreview object.
 * Returns null while loading or if no URL / fetch fails.
 */
export function useLinkPreview(html: string): LinkPreview | null {
  const [linkPreview, setLinkPreview] = useState<LinkPreview | null>(null);
  // Track which URL we already fetched so we don't re-fetch on every render
  const fetchedUrl = useRef<string | null>(null);

  useEffect(() => {
    const url = extractFirstUrl(html);

    if (!url) {
      setLinkPreview(null);
      fetchedUrl.current = null;
      return;
    }

    // Skip if we already fetched this exact URL
    if (url === fetchedUrl.current) return;
    fetchedUrl.current = url;

    fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1",
      },
    })
      .then((res) => res.text())
      .then((pageHtml) => {
        setLinkPreview({
          url,
          title: parseTitle(pageHtml) ?? "",
          description: (parseDescription(pageHtml) ?? "").slice(0, 300),
          image: parseImage(pageHtml) ?? "",
          tags: [],
          publisher: "",
          publisherPicUrl: "",
        });
      })
      .catch(() => setLinkPreview(null));
  }, [html]);

  return linkPreview;
}
