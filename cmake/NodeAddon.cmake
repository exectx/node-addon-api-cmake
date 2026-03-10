function(_node_run output_var script)
  if(NOT NODE_EXECUTABLE)
    find_program(NODE_EXECUTABLE NAMES node node.exe REQUIRED)
  endif()

  execute_process(
    COMMAND "${NODE_EXECUTABLE}" "-p" "${script}"
    WORKING_DIRECTORY "${CMAKE_SOURCE_DIR}"
    RESULT_VARIABLE result
    OUTPUT_VARIABLE output
    ERROR_VARIABLE error
    OUTPUT_STRIP_TRAILING_WHITESPACE
  )

  if(NOT result EQUAL 0)
    string(STRIP "${error}" error)
    message(FATAL_ERROR "Node command failed: ${script}\n${error}")
  endif()

  set(${output_var} "${output}" PARENT_SCOPE)
endfunction()

function(node_addon_init)
  _node_run(NODE_ADDON_API_INCLUDE_DIR "require('path').resolve(require('node-addon-api').include_dir)")
  _node_run(NODE_API_HEADERS_INCLUDE_DIR "require('node-api-headers').include_dir")

  set(NODE_ADDON_API_INCLUDE_DIR "${NODE_ADDON_API_INCLUDE_DIR}" CACHE INTERNAL "node-addon-api include directory")
  set(NODE_API_HEADERS_INCLUDE_DIR "${NODE_API_HEADERS_INCLUDE_DIR}" CACHE INTERNAL "node-api-headers include directory")

  if(WIN32)
    if(NOT MSVC)
      message(FATAL_ERROR "Windows builds currently require the MSVC toolchain.")
    endif()

    _node_run(JS_NATIVE_API_DEF_PATH "require('node-api-headers').def_paths.js_native_api_def")
    _node_run(NODE_API_DEF_PATH "require('node-api-headers').def_paths.node_api_def")

    set(JS_NATIVE_API_DEF_PATH "${JS_NATIVE_API_DEF_PATH}" CACHE INTERNAL "js_native_api.def path")
    set(NODE_API_DEF_PATH "${NODE_API_DEF_PATH}" CACHE INTERNAL "node_api.def path")
  endif()

  message(STATUS "Node executable : ${NODE_EXECUTABLE}")
  message(STATUS "Node headers    : ${NODE_API_HEADERS_INCLUDE_DIR}")
  message(STATUS "node-addon-api  : ${NODE_ADDON_API_INCLUDE_DIR}")
endfunction()

function(_node_addon_generate_import_lib output_var def_path lib_name)
  set(output_path "${CMAKE_BINARY_DIR}/${lib_name}.lib")

  if(NOT EXISTS "${output_path}" OR "${def_path}" IS_NEWER_THAN "${output_path}")
    execute_process(
      COMMAND "${CMAKE_AR}" "/def:${def_path}" "/out:${output_path}" ${CMAKE_STATIC_LINKER_FLAGS}
      RESULT_VARIABLE result
      OUTPUT_VARIABLE output
      ERROR_VARIABLE error
      OUTPUT_STRIP_TRAILING_WHITESPACE
      ERROR_STRIP_TRAILING_WHITESPACE
    )

    if(NOT result EQUAL 0)
      message(FATAL_ERROR "Failed to generate ${lib_name}.lib\n${output}\n${error}")
    endif()
  endif()

  set(${output_var} "${output_path}" PARENT_SCOPE)
endfunction()

function(target_enable_node_addon target_name)
  target_include_directories(${target_name} PRIVATE
    "${NODE_API_HEADERS_INCLUDE_DIR}"
    "${NODE_ADDON_API_INCLUDE_DIR}"
  )

  if(APPLE)
    target_link_options(${target_name} PRIVATE -undefined dynamic_lookup)
  elseif(WIN32)
    _node_addon_generate_import_lib(JS_NATIVE_API_LIB "${JS_NATIVE_API_DEF_PATH}" "js_native_api")
    _node_addon_generate_import_lib(NODE_API_LIB "${NODE_API_DEF_PATH}" "node_api")

    target_link_libraries(${target_name} PRIVATE
      "${JS_NATIVE_API_LIB}"
      "${NODE_API_LIB}"
      delayimp
    )
    target_link_options(${target_name} PRIVATE /DELAYLOAD:node.exe)
    target_compile_options(${target_name} PRIVATE /wd4251)
  else()
    target_link_options(${target_name} PRIVATE -Wl,--allow-shlib-undefined)
  endif()
endfunction()

function(target_compile_warnings target_name)
  if(MSVC)
    target_compile_options(${target_name} PRIVATE /W4)
  else()
    target_compile_options(${target_name} PRIVATE -Wall -Wextra -Wpedantic)
  endif()
endfunction()
