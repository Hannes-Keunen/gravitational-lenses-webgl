#version 300 es

precision highp float;

struct source_plane {
    float D_ds;                     //< Distance to the lens, in Mpc
    float D_s;                      //< Distance to the viewer, in Mpc
    vec2 origin;
    float radius;
};

uniform sampler2D u_alphaTexture;   //< Texture containing alpha vectors

uniform source_plane u_source_planes[32];
uniform float u_num_source_planes;
uniform float u_size;               //< Canvas size, in pixels
uniform float u_angularsize;        //< Angular size of the simulation, in arcseconds

in vec2 v_pos;
in vec2 v_texpos;

out vec4 o_fragmentColor;

/** Converts a coordinate in the range [-1, 1] to a angle. */
vec2 relativePositionToAngle(vec2 position) {
    return position * u_angularsize;
}

/** Converts an angle to a coordinate in the range [-u_size, u_size]. */
vec2 angleToAbsolutePosition(vec2 angle) {
    return angle / u_angularsize * u_size;
}

/** 
 * Tries to intersect an angle beta with all source planes and returns the index of the closest intersecting source
 * plane, or -1 if no intersection is found.
 */
int traceBeta(vec2 beta) {
    int closest_index = -1;
    float closest_Ds = -1.0;
    for (int i = 0; i < int(u_num_source_planes); i++) {
        if (length(angleToAbsolutePosition(beta) - u_source_planes[i].origin) < u_source_planes[i].radius) {
            // intersection found, check if it is the closest
            if (closest_Ds < 0.0 || closest_Ds > u_source_planes[i].D_s) {
                closest_index = i;
                closest_Ds = u_source_planes[i].D_s;
            }
        }
    }
    return closest_index;
}

void main() {
    vec2 theta = v_pos * u_angularsize;

    // TODO: calculate beta

    int index = traceBeta(theta);
    if (index >= 0)
        o_fragmentColor = vec4(1.0, 1.0, 1.0, 1.0);
    else
        o_fragmentColor = vec4(0.0, 0.0, 0.0, 1.0);
    // o_fragmentColor = texture(u_alphaTexture, v_texpos);
}
