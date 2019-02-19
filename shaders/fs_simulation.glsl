#version 300 es

precision mediump float;

in vec2 v_texpos;

out vec4 o_fragmentColor;

void main() {
    float x = v_texpos.x;
    float y = v_texpos.y;
    o_fragmentColor = vec4(x, y, 1.0-x/2.0-y/2.0, 1.0);
}
