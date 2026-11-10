import assert from "node:assert/strict";
import { test } from "node:test";

import { blockFor, clipAddress, clipSize } from "../src/clip.ts";

const CLIP = "https://clips.version.cam/versioncam/versioncam/01-create-a-shipment";
const PINNED = `${CLIP}@f76139c7446d`;

test("a clip's link is its own address", () => {
  assert.equal(clipAddress(CLIP), CLIP);
  assert.equal(clipAddress(`${CLIP}/`), CLIP);
});

test("a pinned version keeps its pin", () => {
  assert.equal(clipAddress(PINNED), PINNED);
});

test("the embed page's address, a query and a fragment come back as the clip", () => {
  assert.equal(clipAddress(`${CLIP}/embed`), CLIP);
  assert.equal(clipAddress(`${CLIP}?format=gif`), CLIP);
  assert.equal(clipAddress(`${CLIP}#top`), CLIP);
});

test("anything that isn't a clip on version.cam is not played", () => {
  for (const link of [
    "https://clips.version.cam/versioncam/versioncam",
    "https://clips.version.cam/_/v/ver_0paq26dzf3vj5hqrxxsp/mp4",
    `${CLIP}/compare`,
    "http://clips.version.cam/versioncam/versioncam/01-create-a-shipment",
    "https://clips.version.cam.example.com/versioncam/versioncam/01-create-a-shipment",
    "https://version.cam/more/version-cam/",
    "not a link",
    "",
  ]) {
    assert.equal(clipAddress(link), null, link);
  }
});

/** A fetch that answers one clip's JSON with one response. */
function answering(clip: string, status: number, body: unknown): typeof fetch {
  return (async (input: RequestInfo | URL) => {
    assert.equal(String(input), `${clip}?format=json`);
    return new Response(JSON.stringify(body), { status });
  }) as typeof fetch;
}

/** A fetch the test expects never to be called. */
const never = (async (input: RequestInfo | URL) => {
  assert.fail(`fetched ${String(input)}`);
}) as typeof fetch;

const failing = (async () => {
  throw new TypeError("fetch failed");
}) as typeof fetch;

test("reads a clip's size", async () => {
  const size = await clipSize(CLIP, answering(CLIP, 200, { width: 1280, height: 800 }));
  assert.deepEqual(size, { width: 1280, height: 800 });
});

test("a private or missing clip, a broken answer and a failed fetch have no size", async () => {
  assert.equal(await clipSize(CLIP, answering(CLIP, 404, { error: "No such clip." })), null);
  assert.equal(await clipSize(CLIP, answering(CLIP, 200, { title: "No size" })), null);
  assert.equal(await clipSize(CLIP, answering(CLIP, 200, { width: "1280", height: 800 })), null);
  assert.equal(await clipSize(CLIP, answering(CLIP, 200, { width: 0, height: 800 })), null);
  assert.equal(await clipSize(CLIP, failing), null);
});

test("a clip plays from its embed page at its own shape", async () => {
  const block = await blockFor(CLIP, answering(CLIP, 200, { width: 1280, height: 800 }));
  assert.deepEqual(block, { kind: "player", frame: `${CLIP}/embed`, aspectRatio: 1.6 });
});

test("a pasted embed page's address plays the same clip", async () => {
  const block = await blockFor(`${CLIP}/embed`, answering(CLIP, 200, { width: 1280, height: 800 }));
  assert.deepEqual(block, { kind: "player", frame: `${CLIP}/embed`, aspectRatio: 1.6 });
});

test("a pinned version plays that version", async () => {
  const block = await blockFor(PINNED, answering(PINNED, 200, { width: 1280, height: 800 }));
  assert.deepEqual(block, { kind: "player", frame: `${PINNED}/embed`, aspectRatio: 1.6 });
});

test("a clip with a phone version is framed at the desktop clip's shape", async () => {
  const block = await blockFor(
    CLIP,
    answering(CLIP, 200, {
      width: 1280,
      height: 800,
      mobile: { clip: "01-create-a-shipment-mobile", width: 390, height: 844, fps: 60 },
    }),
  );
  assert.deepEqual(block, { kind: "player", frame: `${CLIP}/embed`, aspectRatio: 1.6 });
});

test("a private or missing clip, and a failed fetch, show the link as a card", async () => {
  const card = { kind: "card", title: CLIP, link: CLIP };
  assert.deepEqual(await blockFor(CLIP, answering(CLIP, 404, { error: "No such clip." })), card);
  assert.deepEqual(await blockFor(CLIP, failing), card);
});

test("a project's page or another site shows a card without asking version.cam", async () => {
  for (const link of ["https://clips.version.cam/versioncam/versioncam", "https://example.com/"]) {
    assert.deepEqual(await blockFor(link, never), { kind: "card", title: link, link });
  }
});

test("a block with no link points to version.cam", async () => {
  assert.deepEqual(await blockFor("", never), {
    kind: "card",
    title: "version.cam",
    link: "https://version.cam",
  });
});
