emcc \
    cpp/grale_glue.cpp \
    bin/libgrale2core.so \
    bin/libserut.so \
    bin/libgslcblas.so \
    bin/libgsl.so \
    -s WASM=1 \
    -s EXTRA_EXPORTED_RUNTIME_METHODS='["ccall", "cwrap"]' \
    -s ASSERTIONS=2 \
    -o bin/grale.js \
    -I/usr/local/include
