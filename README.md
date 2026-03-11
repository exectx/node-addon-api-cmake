# node-addon-api-cmake-addon

A Node.js native addon built with **node-addon-api** (the C++ wrapper) and **CMake only** —  
no node-gyp, no cmake-js, no binding.gyp.

## How it works

```
CMakeLists.txt        ← configures the addon target and loads the helper module
cmake/NodeAddon.cmake ← asks Node for header paths, sets platform linker rules
src/addon.cpp         ← C++ API: Napi::Function, Napi::ObjectWrap<Counter> …
index.js              ← require() the built .node from build/
```

## Shipping prebuilt binaries with npm

This repository follows the napi-rs packaging model: one root JavaScript package plus one npm package per native target.

The root package is `node-addon-api-cmake-addon` and declares these platform packages as `optionalDependencies`:

- `node-addon-api-cmake-addon-darwin-universal`
- `node-addon-api-cmake-addon-win32-ia32`
- `node-addon-api-cmake-addon-win32-x64`
- `node-addon-api-cmake-addon-win32-arm64`

At runtime, `index.js` first looks for a local binary in `build/` for development, then checks generated `npm/<target>/addon.node` files in CI, and finally falls back to the installed platform package.

### Release flow

GitHub Actions builds each target on its own runner, uploads the resulting `addon.node` files as workflow artifacts, tests them on matching runners, then a publish job generates `npm/<target>/package.json` manifests, copies the binaries into those directories, publishes the platform packages, and finally publishes the root package.

- `.github/workflows/changesets-release.yml` opens or updates stable release PRs for `master`
- `.github/workflows/changesets-prerelease.yml` opens or updates prerelease release PRs for `release/next`
- `.github/workflows/publish.yml` publishes tagged stable and prerelease releases
- `.github/workflows/canary.yml` publishes manual canary snapshots from CI

### Versioning every release lane

This repository uses Changesets for release intent and root package versioning, while custom scripts keep the generated native packages in sync.

- `master` is the stable lane
- `release/next` is the prerelease lane
- `workflow_dispatch` on `.github/workflows/canary.yml` publishes a canary snapshot with npm tag `canary`

Contributors add a changeset for user-facing changes with:

```bash
npm run changeset
```

When a release is ready, Changesets updates `package.json`, then `scripts/sync-release-versions.js` rewrites the root `optionalDependencies` so every native package stays on the same version as the root package.

#### Stable releases

1. Merge changesets into `master`.
2. Let the release PR from `.github/workflows/changesets-release.yml` update versions.
3. Merge that release PR.
4. Tag the merge commit as `vX.Y.Z`.
5. `.github/workflows/publish.yml` publishes the root package and native target packages with npm tag `latest`.

#### Prereleases

1. Cherry-pick or merge release candidates into `release/next`.
2. Enter prerelease mode once:

```bash
npm run release:pre:enter
```

3. Merge the prerelease release PR from `.github/workflows/changesets-prerelease.yml`.
4. Tag the prerelease commit as `vX.Y.Z-next.N`.
5. `.github/workflows/publish.yml` publishes the release with npm tag `next`.
6. Exit prerelease mode when the lane is complete:

```bash
npm run release:pre:exit
```

#### Canary snapshots

Run the `Canary` workflow manually from GitHub Actions. It uses Changesets snapshot versioning, syncs the root `optionalDependencies`, prepares the generated native packages, and publishes everything with npm tag `canary` without requiring a git tag.

### Manual package preparation

If you already have CI artifacts unpacked locally under `artifacts/`, assemble the publishable package directories with:

```bash
npm run prepare:npm
npm run pack:check
```

This expects the following files to exist:

```text
artifacts/darwin-universal/addon.node
artifacts/win32-ia32/addon.node
artifacts/win32-x64/addon.node
artifacts/win32-arm64/addon.node
```

### Two include paths
node-addon-api is a header-only C++ wrapper **over** N-API.  
CMake must include **both**:
- `NODE_API_HEADERS_INCLUDE_DIR` → `node_api.h` from `node-api-headers`
- `NODE_ADDON_API_INCLUDE_DIR` → `napi.h`, `napi-inl.h` from `node-addon-api`

At configure time, CMake runs `node -p` against the local npm packages to
discover those paths. On Windows it also reads the `.def` files exported by
`node-api-headers` and generates the import libraries needed by MSVC.

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | 24.x LTS |
| CMake | ≥ 3.15 |
| C++ compiler | GCC 8+ / Clang 8+ / MSVC 2019+ |

## Quick start

```bash
npm install          # installs node-addon-api + node-api-headers
npm run build        # cmake -S . -B build + cmake --build
npm test
```

### Step-by-step

```bash
npm install
cmake -S . -B build -DCMAKE_BUILD_TYPE=Release
cmake --build build --config Release
node test.js
```

### Platform notes

- macOS uses `-undefined dynamic_lookup`, so the addon resolves Node symbols at load time.
- Windows uses the `node-api-headers` `.def` files to generate `js_native_api.lib` and `node_api.lib` during CMake configure.
- This setup targets plain Node.js on Windows, not Electron.

## Exported API

```ts
add(a: number, b: number): number
greet(name: string): string
fibonacci(n: number): number
createPoint(x: number, y: number): { x, y, distanceFromOrigin }

class Counter {
  constructor(initial?: number)
  increment(step?: number): number
  decrement(step?: number): number
  reset(): void
  readonly value: number
}
```

## N-API (C) vs Node-Addon-API (C++) — comparison

| Aspect | N-API / `napi-cmake` | Node-Addon-API / this project |
|---|---|---|
| API surface | C functions (`napi_*`) | C++ classes (`Napi::*`) |
| Error handling | Check `napi_status` manually | C++ exceptions |
| String handling | Manual buffer + length | `.Utf8Value()` |
| Object wrapping | Complex manual setup | `Napi::ObjectWrap<T>` |
| Extra dependency | None | `npm i node-addon-api node-api-headers` |
| ABI stability | ✓ | ✓ (thin C++ header over N-API) |
| Boilerplate | More | Less |
| Compile-time overhead | Less | Slightly more (templates) |
