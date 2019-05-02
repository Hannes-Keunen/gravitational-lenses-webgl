#version 300 es

precision highp float;

struct lens {
    float strength;
    vec2 position;
    float angle;
};

struct source_plane {
    float D_ds;     //< Distance to the lens, in Mpc
    float D_s;      //< Distance to the viewer, in Mpc
    vec2 origin;
    float radius;
};

uniform lens u_lenses[16];                              //< Lens parameters
uniform highp sampler2DArray u_alphaTextureArray;       //< Texture array containing alpha vectors
uniform highp sampler2DArray u_derivativeTextureArray;  //< Texture array containing alpha derivatives for the critical lines
uniform float u_num_lenses;

uniform source_plane u_source_planes[16];
uniform float u_num_source_planes;

uniform float u_angularRadius;      //< Angular size of the simulation, in arcseconds

in vec2 v_pos;
in vec2 v_texpos;

out vec4 o_fragmentColor;

uniform float u_size;

/** Converts an angle to texture coordinates */
vec2 angleToTexcoords(vec2 angle) {
    return angle / u_angularRadius / 2.0 + vec2(0.5, 0.5);
}

vec2 transformTheta(vec2 theta, lens theLens) {
    vec2 theta0 = theta - theLens.position;
    return vec2(theta0.x*cos(theLens.angle) + theta0.y*sin(theLens.angle),
                -theta0.x*sin(theLens.angle) + theta0.y*cos(theLens.angle));
}

vec3 calculateAlphaDerivatives(vec2 theta, vec2 offset) {
    float axx = 0.0;
	float ayy = 0.0;
	float axy = 0.0;

	for (int i = 0; i < int(u_num_lenses); i++) {
		float ca = cos(u_lenses[i].angle);
		float sa = sin(u_lenses[i].angle);
		float ca2 = ca*ca;
		float sa2 = sa*sa;
		float csa = ca*sa;

        vec2 theta0 = transformTheta(theta, u_lenses[i]);
        vec2 texcoord = angleToTexcoords(theta0) + offset;
        vec4 derivatives = texture(u_derivativeTextureArray, vec3(texcoord, i));

		float axx0 = derivatives.x * u_lenses[i].strength;
		float ayy0 = derivatives.y * u_lenses[i].strength;
		float axy0 = derivatives.z * u_lenses[i].strength;

		float axx1 = axx0*ca2-2.0*axy0*csa+ayy0*sa2;
		float ayy1 = axx0*sa2+2.0*axy0*csa+ayy0*ca2;
		float axy1 = (axx0-ayy0)*csa+axy0*(2.0*ca2-1.0);

		axx += axx1;
		ayy += ayy1;
		axy += axy1;
	}

    return vec3(axx, ayy, axy);
}

float calculateQ(vec2 theta, float D_ds, float D_s, vec2 offset) {
    vec3 derivatives = calculateAlphaDerivatives(theta, offset);
	return (1.0 - (D_ds/D_s) * derivatives.x) * (1.0 - (D_ds/D_s) * derivatives.y) - pow((D_ds/D_s) * derivatives.z, 2.0);
}

bool isOnCriticalLine(vec2 theta, int i) {
    float offset = 0.002;

    // use nearby points to check if there is a zero value inbetween
    float right  = calculateQ(theta, u_source_planes[i].D_ds, u_source_planes[i].D_s,  vec2(0, offset));
    float left   = calculateQ(theta, u_source_planes[i].D_ds, u_source_planes[i].D_s, -vec2(0, offset));
    float bottom = calculateQ(theta, u_source_planes[i].D_ds, u_source_planes[i].D_s, -vec2(offset, 0));
    float top    = calculateQ(theta, u_source_planes[i].D_ds, u_source_planes[i].D_s,  vec2(offset, 0));

    if      (left > 0.0 && right < 0.0)   return true;
    else if (left < 0.0 && right > 0.0)   return true;
    else if (bottom < 0.0 && right > 0.0) return true;
    else if (bottom > 0.0 && right < 0.0) return true;
    else return false;
}

vec2 calculateAlpha(vec2 theta) {
    vec2 sum = vec2(0.0, 0.0);
    for (int i = 0; i < int(u_num_lenses); i++) {
        vec2 theta0 = transformTheta(theta, u_lenses[i]);
        vec2 alpha = vec2(texture(u_alphaTextureArray, vec3(angleToTexcoords(theta0), i)));
        alpha *= u_lenses[i].strength;
        alpha = vec2(alpha.x*cos(u_lenses[i].angle) - alpha.y*sin(u_lenses[i].angle),
                     alpha.x*sin(u_lenses[i].angle) + alpha.y*cos(u_lenses[i].angle));
        sum += alpha;
    }
    return sum;
}

vec2 calculateBeta(vec2 theta, vec2 alpha, int i) {
    return theta - (u_source_planes[i].D_ds / u_source_planes[i].D_s) * alpha;
}

vec2 angleToAbsolutePosition(vec2 angle) {
    vec2 pos = angle / u_angularRadius; // to [-1.0, 1.0]
    pos.y *= -1.0;                      // invert y
    pos = pos / 2.0 + vec2(0.5, 0.5);   // to [0.0, 1.0]
    return pos; // * u_size;                // to [0, u_size]
}

void main() {
    vec2 theta = v_pos * u_angularRadius;
    vec2 alpha = calculateAlpha(theta);
    o_fragmentColor = vec4(0.0, 0.0, 0.0, 1.0);
    for (int i = 0; i < int(u_num_source_planes); i++) {
        if (isOnCriticalLine(theta, i)) {
            vec2 beta = calculateBeta(theta, alpha, i);
            // vec2 position = (beta / u_angularRadius) / 2.0 + vec2(1.0, ) * u_size;
            o_fragmentColor = vec4(angleToAbsolutePosition(beta), 0.0, 1.0);
        }
    }
}
