#version 300 es

layout (location = 0) in vec2 a_position;

out vec2 v_pos;
out vec2 v_real_pos;

uniform float u_size;

void main() {
    v_pos = a_position;
    v_real_pos = a_position * u_size;
    gl_Position = vec4(a_position, 0, 1);
}
