#version 300 es

layout (location = 0) in vec2 a_position;

out vec2 v_texpos;

void main() {
    v_texpos = (a_position + 1.0)/2.0;
    gl_Position = vec4(a_position, 0, 1);
}
