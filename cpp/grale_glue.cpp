#include <grale/circularsource.h>
#include <emscripten/emscripten.h>

extern "C" {

const char *EMSCRIPTEN_KEEPALIVE test() {
    grale::Vector2Dd vec;
    grale::CircularSource source(vec, 0, 0);
    return source.getObjectName().c_str();
}

}
