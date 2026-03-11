# Changesets

Add a changeset for user-facing changes with:

```bash
npm run changeset
```

Stable releases are cut from `master`.
Prereleases are cut from `release/next` after entering prerelease mode with:

```bash
npm run release:pre:enter
```

When the prerelease lane is complete, exit it with:

```bash
npm run release:pre:exit
```
