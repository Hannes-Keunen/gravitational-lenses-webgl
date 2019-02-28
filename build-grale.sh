emcc cpp/grale_glue.cpp bin/libgrale2core.a -s WASM=1 -s EXTRA_EXPORTED_RUNTIME_METHODS='["ccall", "cwrap"]' -s -o bin/grale.js -I/usr/local/include
