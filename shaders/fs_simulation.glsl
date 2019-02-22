#version 300 es

precision highp float;

struct source_plane {
    float D_ds;                 //< Distance to the lens, in Mpc
    float D_s;                  //< Distance to the viewer, in Mpc
    vec2 origin;
    float radius;
};

uniform source_plane u_source;
uniform float u_size;           //< Canvas size, in pixels
uniform float u_angularsize;    //< Angular size of the simulation, in arcseconds

in vec2 v_pos;
in vec2 v_real_pos;

out vec4 o_fragmentColor;

/** Converts a coordinate in the range [-1, 1] to a angle. */
vec2 relativePositionToAngle(vec2 position) {
    return position * u_angularsize;
}

/** Converts an angle to a coordinate in the range [-u_size, u_size]. */
vec2 angleToAbsolutePosition(vec2 angle) {
    return angle / u_angularsize * u_size;
}

bool traceBeta(vec2 beta) {
    vec2 pos = angleToAbsolutePosition(beta);
    return length(pos - u_source.origin) < u_source.radius;
}

void main() {
    vec2 theta = v_pos * u_angularsize;

    // TODO: calculate beta

    if (traceBeta(theta))
        o_fragmentColor = vec4(1.0, 1.0, 1.0, 1.0);
    else
        o_fragmentColor = vec4(0.0, 0.0, 0.0, 1.0);
}
