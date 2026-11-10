import assert from "node:assert/strict";
import { test } from "node:test";

import { clipAddress, clipInfo } from "../src/clip.ts";

const CLIP = "https://clips.version.cam/versioncam/versioncam/01-create-a-shipment";

test("a clip's link is its own address", () => {
  assert.equal(clipAddress(CLIP), CLIP);
  assert.equal(clipAddress(`${CLIP}/`), CLIP);
});

test("a pinned version keeps its pin", () => {
  assert.equal(clipAddress(`${CLIP}@f76139c7446d`), `${CLIP}@f76139c7446d`);
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

/** A fetch that answers one address with one response. */
function answering(status: number, body: unknown): typeof fetch {
  return (async (input: RequestInfo | URL) => {
    assert.equal(String(input), `${CLIP}?format=json`);
    return new Response(JSON.stringify(body), { status });
  }) as typeof fetch;
}

test("reads a clip's title and size", async () => {
  const info = await clipInfo(
    CLIP,
    answering(200, { title: "Create a shipment", width: 1280, height: 800, mobile: null }),
  );
  assert.deepEqual(info, { title: "Create a shipment", width: 1280, height: 800, mobile: null });
});

test("reads a phone version's size", async () => {
  const info = await clipInfo(
    CLIP,
    answering(200, {
      title: "Create a shipment",
      width: 1280,
      height: 800,
      mobile: { clip: "01-create-a-shipment-mobile", width: 390, height: 844, fps: 60 },
    }),
  );
  assert.deepEqual(info?.mobile, { width: 390, height: 844 });
});

test("a private or missing clip, a broken answer and a failed fetch give nothing", async () => {
  assert.equal(await clipInfo(CLIP, answering(404, { error: "No such clip." })), null);
  assert.equal(await clipInfo(CLIP, answering(200, { title: "No size" })), null);
  const failing = (async () => {
    throw new TypeError("fetch failed");
  }) as typeof fetch;
  assert.equal(await clipInfo(CLIP, failing), null);
});
