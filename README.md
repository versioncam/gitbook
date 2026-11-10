# version.cam for GitBook

A GitBook integration that plays a [version.cam](https://version.cam) clip
in a GitBook page. Paste a clip's link from `clips.version.cam` into a page
and it becomes the clip's player, at the clip's own size. When CI records a
new version of the clip, the page plays it without anyone editing the page.

If you write your docs in a repository with Git Sync, add a clip with:

```
{% @versioncam/clip url="https://clips.version.cam/<owner>/<repo>/<clip>" %}
```

A link that isn't a public clip shows as a link card. To embed clips from a
private project, make its clips unlisted in the project's settings on
version.cam.

## Development

```bash
npm ci
npm run typecheck && npm test && npm run check
```

`npm run publish-integration` publishes a new version to GitBook. It needs
`gitbook auth` with a personal access token from
https://app.gitbook.com/account/developer; the browser sign-in can't
publish.

`src/clip.ts` decides which links are clips and reads a clip's size from
its `?format=json`. `src/index.tsx` is the block. The plan and its log are
`docs/wp22-gitbook.md` in version.cam's private repository.
