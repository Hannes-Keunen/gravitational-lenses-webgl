emcc \
    cpp/grale_glue.cpp \
    bin/libgrale2core.so \
    bin/libserut.so \
    bin/libgslcblas.so \
    bin/libgsl.so \
    -g4 \
    -s WASM=1 \
    -s EXTRA_EXPORTED_RUNTIME_METHODS='["ccall", "cwrap"]' \
    -s ASSERTIONS=2 \
    -s ALLOW_MEMORY_GROWTH=1 \
    -s FORCE_FILESYSTEM=1 \
    -s SAFE_HEAP=1 \
    -o bin/grale.js \
    -I/usr/local/include
