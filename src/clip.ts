/**
 * Which version.cam links the block can play, and what it shows for each.
 * Kept apart from the ContentKit code so the tests can run it without
 * GitBook's runtime: `src/index.tsx` only turns a `Block` into elements.
 */

const HOST = "clips.version.cam";

/**
 * The clip's own address for a pasted link, or null when the link isn't a
 * clip. A clip is `/<owner>/<repo>/<clip>`, and `<clip>` may carry a pinned
 * version as `@<commit>`. Someone may paste the embed page's address, so a
 * trailing `/embed` is dropped; so is any query or fragment, which the
 * embed page doesn't read. Files (`/_/…`) and anything deeper, such as a
 * comparison, aren't clips.
 */
export function clipAddress(input: string): string | null {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" || url.hostname !== HOST) return null;
  const parts = url.pathname.split("/").filter(Boolean);
  if (parts.length === 4 && parts[3] === "embed") parts.pop();
  if (parts.length !== 3 || parts[0].startsWith("_")) return null;
  return `https://${HOST}/${parts.join("/")}`;
}

/**
 * A clip's size, from the JSON that `embed.js` reads on other sites. Null
 * for a private or missing clip (version.cam answers 404 for both, so a
 * private clip's existence isn't given away) and for any failure: the
 * block then shows a link instead of an error in someone's docs.
 *
 * Only the desktop size: GitBook ignores a frame's `@webframe.resize` on
 * published pages (docs/wp22-gitbook.md, G1), so a clip's phone version
 * can't change the frame's shape there.
 */
export async function clipSize(
  clip: string,
  get: typeof fetch = fetch,
): Promise<{ width: number; height: number } | null> {
  try {
    const response = await get(`${clip}?format=json`);
    if (!response.ok) return null;
    const { width, height } = (await response.json()) as { width?: unknown; height?: unknown };
    if (typeof width !== "number" || typeof height !== "number") return null;
    if (!(width > 0 && height > 0)) return null;
    return { width, height };
  } catch {
    return null;
  }
}

/** What the block shows: the clip's player, or a card with the link. */
export type Block =
  | { kind: "player"; frame: string; aspectRatio: number }
  | { kind: "card"; title: string; link: string };

/**
 * The block for a link, read each time GitBook renders it, so a block
 * written by hand in Git Sync Markdown needs only the link, and a clip
 * whose size changes is framed at its new size without anyone editing
 * the page.
 *
 * The frame loads the clip's embed page, which plays its newest passing
 * version (or the pinned one). However long GitBook keeps a render, the
 * video isn't stale; at worst the frame's shape lags.
 */
export async function blockFor(url: string, get: typeof fetch = fetch): Promise<Block> {
  const clip = clipAddress(url);
  const size = clip ? await clipSize(clip, get) : null;
  if (!clip || !size) {
    return { kind: "card", title: url || "version.cam", link: url || "https://version.cam" };
  }
  return { kind: "player", frame: `${clip}/embed`, aspectRatio: size.width / size.height };
}
