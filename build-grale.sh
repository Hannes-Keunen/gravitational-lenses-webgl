emcc cpp/grale_glue.cpp wasm/libgrale2core.a -O3 -s WASM=1 -s EXTRA_EXPORTED_RUNTIME_METHODS='["ccall", "cwrap"]' -o wasm/grale.js -I/usr/local/include
