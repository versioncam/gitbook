/**
 * Which version.cam links the block can play, and what it needs to know
 * about a clip to frame it. Kept apart from the ContentKit code so the
 * tests can run it without GitBook's runtime.
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

/** What `?format=json` tells the block about a clip. */
export interface ClipInfo {
  title: string;
  width: number;
  height: number;
  /** The phone version's size, when the clip has one. */
  mobile: { width: number; height: number } | null;
}

/**
 * Reads the clip's JSON, the same answer `embed.js` reads on other sites.
 * Null for a private or missing clip (version.cam answers 404 for both,
 * so a private clip's existence isn't given away) and for any failure:
 * the block then shows a link instead of an error in someone's docs.
 */
export async function clipInfo(
  clip: string,
  get: typeof fetch = fetch,
): Promise<ClipInfo | null> {
  try {
    const response = await get(`${clip}?format=json`);
    if (!response.ok) return null;
    const info = (await response.json()) as Partial<ClipInfo>;
    if (!info.width || !info.height) return null;
    const mobile =
      info.mobile && info.mobile.width && info.mobile.height
        ? { width: info.mobile.width, height: info.mobile.height }
        : null;
    return {
      title: info.title ?? "A clip on version.cam",
      width: info.width,
      height: info.height,
      mobile,
    };
  } catch {
    return null;
  }
}
