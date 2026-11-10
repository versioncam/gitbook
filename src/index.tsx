import { createComponent, createIntegration } from "@gitbook/runtime";

import { blockFor } from "./clip";

/**
 * The `clip` block. Pasting a version.cam link into a GitBook page runs
 * `@link.unfurl`, which keeps only the link: what the block shows is
 * decided when it renders (`blockFor`), so a block written by hand in Git
 * Sync Markdown (`{% @versioncam/clip url="…" %}`) works the same.
 */
const clipBlock = createComponent<{ url?: string }>({
  componentId: "clip",

  async action(element, action) {
    if (action.action === "@link.unfurl") return { props: { url: action.url } };
    return element;
  },

  async render(element) {
    const block = await blockFor(element.props.url ?? "");
    if (block.kind === "card") {
      return (
        <block>
          <card
            title={block.title}
            hint="This link doesn't point to a public clip on version.cam."
            onPress={{ action: "@ui.url.open", url: block.link }}
          />
        </block>
      );
    }
    return (
      <block>
        <webframe source={{ url: block.frame }} aspectRatio={block.aspectRatio} />
      </block>
    );
  },
});

export default createIntegration({
  components: [clipBlock],
});
