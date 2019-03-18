#version 300 es

precision highp float;

const float PI = 3.1415926535897932384626433832795;
const float ANGLE_DEGREE = PI / 180.0;
const float ANGLE_ARCMIN = ANGLE_DEGREE / 60.0;
const float ANGLE_ARCSEC = ANGLE_ARCMIN / 60.0;

struct source_plane {
    float D_ds;                         //< Distance to the lens, in Mpc
    float D_s;                          //< Distance to the viewer, in Mpc
    vec2 origin;
    float radius;
};

uniform sampler2D u_alphaTexture;   //< Texture containing alpha vectors
uniform sampler2D u_qTextures[32];  //< Texture q values for the critical lines

uniform source_plane u_source_planes[32];
uniform float u_num_source_planes;
uniform float u_size;               //< Canvas size, in pixels
uniform float u_angularSize;        //< Angular size of the simulation, in arcseconds
uniform float u_lensStrength;       //< Strength factor for the lens effect
uniform float u_D_d;                //< Lens distance, in Mpc
uniform float u_enabled;            //< Whether the lens effect is enabled or not

in vec2 v_pos;
in vec2 v_texpos;

out vec4 o_fragmentColor;

/** Converts a coordinate in the range [-1, 1] to a angle. */
vec2 relativePositionToAngle(vec2 position) {
    return position * u_angularSize;
}

/** Converts an angle to a coordinate in the range [-u_size, u_size]. */
vec2 angleToAbsolutePosition(vec2 angle) {
    return angle / u_angularSize * u_size;
}

/** Checks if the point is on the i'th source plane. */
bool isOnSourcePlane(vec2 beta, int i) {
    return length(beta - u_source_planes[i].origin) < u_source_planes[i].radius;
}

int traceTheta(vec2 theta) {
    vec2 alpha = vec2(texture(u_alphaTexture, v_texpos)) * u_lensStrength;

    int closest_index = -1;
    float closest_Ds = -1.0;
    for (int i = 0; i < int(u_num_source_planes); i++) {
        int index = -1;
        vec2 beta;
        if (u_enabled == 1.0 && u_source_planes[i].D_s > u_D_d) {
            // source plane is further away than the lens and the lens effect is enabled
            beta = theta*ANGLE_ARCSEC - (u_source_planes[i].D_ds / u_source_planes[i].D_s) * alpha*ANGLE_ARCSEC;
            beta = beta / ANGLE_ARCSEC;
        } else {
            // source plane is closer than the lens or the lens effect is disabled
            beta = theta;
        }

        if (isOnSourcePlane(angleToAbsolutePosition(beta), i)) {
            if (closest_Ds < 0.0 || closest_Ds > u_source_planes[i].D_s) {
                closest_index = i;
                closest_Ds = u_source_planes[i].D_s;
            }
        }
    }
    return closest_index;
}

void main() {
    float q = texture(u_qTextures[0], v_texpos).r;
    if (q < 0.02 && q > -0.02) {
        o_fragmentColor = vec4(1.0, 0.0, 0.0, 1.0);
    } else {
        vec2 theta = v_pos * u_angularSize;
        int index = traceTheta(theta);
        if (index >= 0)
            o_fragmentColor = vec4(1.0, 1.0, 1.0, 1.0);
        else
            o_fragmentColor = vec4(0.0, 0.0, 0.0, 1.0);
    }
}
