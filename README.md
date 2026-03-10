# node-addon-api-cmake-addon

A Node.js native addon built with **node-addon-api** (the C++ wrapper) and **CMake only** —  
no node-gyp, no cmake-js, no binding.gyp.

## How it works

```
configure.js          ← discovers Node.js + node-addon-api headers, writes build/node_vars.cmake
CMakeLists.txt        ← consumes node_vars.cmake; includes both Node + NAPI headers
src/addon.cpp         ← C++ API: Napi::Function, Napi::ObjectWrap<Counter> …
index.js              ← require() the built .node from build/
```

### Two include paths
node-addon-api is a header-only C++ wrapper **over** N-API.  
CMake must include **both**:
- `NODE_INCLUDE_DIR` → `node_api.h` (the underlying C API in Node.js itself)
- `NAPI_INCLUDE_DIR` → `napi.h`, `napi-inl.h` (the C++ wrapper classes)

`configure.js` resolves `NAPI_INCLUDE_DIR` from the locally installed
`node-addon-api` package and installs it automatically if missing.

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | ≥ 12 |
| CMake | ≥ 3.15 |
| C++ compiler | GCC 8+ / Clang 8+ / MSVC 2019+ |

## Quick start

```bash
npm install          # installs node-addon-api (the C++ headers)
npm run build        # configure.js + cmake -S . -B build + cmake --build
npm test
```

### Step-by-step

```bash
npm install
node configure.js
cmake -S . -B build -DCMAKE_BUILD_TYPE=Release
cmake --build build --config Release
node test.js
```

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
| Extra dependency | None | `npm i node-addon-api` |
| ABI stability | ✓ | ✓ (thin C++ header over N-API) |
| Boilerplate | More | Less |
| Compile-time overhead | Less | Slightly more (templates) |
