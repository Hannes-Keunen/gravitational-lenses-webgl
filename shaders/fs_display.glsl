#version 300 es

precision highp float;

uniform sampler2D u_texture;

in vec2 v_texpos;

out vec4 o_fragmentColor;

void main() {
    o_fragmentColor = texture(u_texture, v_texpos);
}
