# version.cam for GitBook

A GitBook integration that plays a [version.cam](https://version.cam) clip
in a GitBook page. Paste a clip's link from `clips.version.cam` into a page
and it becomes the clip's player, at the clip's own size. When CI records a
new version of the clip, the page plays it without anyone editing the page.
To show one version that never changes, paste that version's link instead:
it ends in `@` and a commit.

If you write your docs in a repository with Git Sync, add a clip with:

```
{% @versioncam/clip url="https://clips.version.cam/<owner>/<repo>/<clip>" %}
```

A link to a private clip, or to something that isn't a clip, shows as a
link card. To play a private project's clips in your docs, make them
unlisted in the project's settings on version.cam.

The frame has the clip's desktop shape on every screen, phones included,
because GitBook doesn't let a frame change its shape on a published page.

## Development

```bash
npm ci
npm run typecheck && npm test && npm run check
```

CI runs the same three on every push. `npm run check` builds the script
and loads it in GitBook's local runtime, without signing in.

`npm run publish-integration` publishes a new version to GitBook. It needs
`gitbook auth` with a personal access token from
https://app.gitbook.com/account/developer; the browser sign-in can't
publish.

`src/clip.ts` decides what the block shows for a link, and reads a clip's
size from its `?format=json`. `src/index.tsx` turns that into GitBook's
elements. The preview images in `assets/` are the published test pages on
version.cam's own GitBook site. The plan and its log are
`docs/wp22-gitbook.md` in version.cam's private repository.
