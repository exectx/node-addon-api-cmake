cmake_minimum_required(VERSION 3.15)
project(node_addon_api_addon VERSION 1.0.0 LANGUAGES CXX)
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)

set(CMAKE_CXX_STANDARD 23)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# ── 1. Load variables written by configure.js ─────────────────────────────────
#   NODE_INCLUDE_DIR   – path to node_api.h (Node.js built-in C headers)
#   NAPI_INCLUDE_DIR   – path to napi.h     (node-addon-api C++ headers)
include("${CMAKE_BINARY_DIR}/node_vars.cmake")

message(STATUS "Node.js        : ${NODE_VERSION}")
message(STATUS "Node headers   : ${NODE_INCLUDE_DIR}")
message(STATUS "node-addon-api : ${NAPI_INCLUDE_DIR}")
message(STATUS "ABI            : ${NODE_MODULE_VERSION}")

# ── 2. Build target ───────────────────────────────────────────────────────────
add_library(${PROJECT_NAME} SHARED src/addon.cpp)

set_target_properties(${PROJECT_NAME} PROPERTIES
  PREFIX      ""
  SUFFIX      ".node"
  OUTPUT_NAME "addon"
)

# ── 3. Include directories ────────────────────────────────────────────────────
target_include_directories(${PROJECT_NAME} PRIVATE
  "${NODE_INCLUDE_DIR}"    # node_api.h (required by napi.h internally)
  "${NAPI_INCLUDE_DIR}"    # napi.h, napi-inl.h
)

# ── 4. Compile definitions ────────────────────────────────────────────────────
target_compile_definitions(${PROJECT_NAME} PRIVATE
  NAPI_VERSION=10           # N-API version to target
  NODE_ADDON_API_DISABLE_DEPRECATED   # optional: hide deprecated symbols
)

# ── 5. Platform linker configuration ─────────────────────────────────────────
if(APPLE)
    target_link_options(${PROJECT_NAME} PRIVATE
    -undefined dynamic_lookup
  )
elseif(WIN32)
    target_link_libraries(${PROJECT_NAME} PRIVATE
    "${NODE_INCLUDE_DIR}/../node.lib"
  )
    target_link_options(${PROJECT_NAME} PRIVATE /DELAYLOAD:node.exe)
    target_compile_options(${PROJECT_NAME} PRIVATE /wd4251)
else()  # Linux
    target_link_options(${PROJECT_NAME} PRIVATE
    -Wl,--allow-shlib-undefined
  )
endif()

# ── 6. Warnings ───────────────────────────────────────────────────────────────
if(MSVC)
    target_compile_options(${PROJECT_NAME} PRIVATE /W4)
else()
    target_compile_options(${PROJECT_NAME} PRIVATE -Wall -Wextra -Wpedantic)
endif()

# ── 7. Install ────────────────────────────────────────────────────────────────
install(TARGETS ${PROJECT_NAME}
  LIBRARY DESTINATION "${CMAKE_SOURCE_DIR}/build"
  RUNTIME DESTINATION "${CMAKE_SOURCE_DIR}/build"
)
