import { createComponent, createIntegration } from "@gitbook/runtime";

import { clipAddress, clipInfo } from "./clip";

/**
 * The `clip` block. Pasting a version.cam link into a GitBook page runs
 * `@link.unfurl`, which keeps only the link: everything else is read when
 * the block renders, so a block written by hand in Git Sync Markdown
 * (`{% @versioncam/clip url="…" %}`) works the same, and a clip whose size
 * changes is framed at its new size without anyone editing the page.
 */
const clipBlock = createComponent<{ url?: string }>({
  componentId: "clip",

  async action(element, action) {
    if (action.action === "@link.unfurl") return { props: { url: action.url } };
    return element;
  },

  async render(element) {
    const url = element.props.url ?? "";
    // Spike only (docs/wp22-gitbook.md, G1): frames a test page that asks
    // GitBook to resize it, to learn whether readers' pages honour that.
    if (url.includes("spike=resize")) {
      return (
        <block>
          <webframe
            source={{ url: "https://petbul.github.io/versioncam-embeds/gitbook-resize.html" }}
            aspectRatio={16 / 10}
          />
        </block>
      );
    }
    const clip = clipAddress(url);
    const info = clip ? await clipInfo(clip) : null;
    // Spike only: `gitbook integration tail` shows how often readers'
    // pages make GitBook render the block.
    console.log(`render ${url} ${info ? `${info.width}x${info.height}` : "no clip"}`);
    if (!clip || !info) {
      return (
        <block>
          <card
            title={url || "version.cam"}
            hint="This link doesn't point to a public clip on version.cam."
            onPress={{ action: "@ui.url.open", url: url || "https://version.cam" }}
          />
        </block>
      );
    }
    // The embed page plays the clip's newest passing version (or the
    // pinned one), so however long GitBook keeps this render, the video
    // isn't stale.
    return (
      <block>
        <webframe source={{ url: `${clip}/embed` }} aspectRatio={info.width / info.height} />
      </block>
    );
  },
});

export default createIntegration({
  components: [clipBlock],
});
