#version 300 es

precision highp float;

const float CONST_PI        = 3.1415926535;
const float ANGLE_DEGREE    = CONST_PI / 180.0;
const float ANGLE_ARCMIN    = ANGLE_DEGREE / 60.0;
const float ANGLE_ARCSEC    = ANGLE_ARCMIN / 60.0;
const float DIST_PC         = 3.0856775714409184e16;
const float DIST_KPC        = 1000.0 * DIST_PC;
const float DIST_MPC        = 1000.0 * DIST_KPC;

const float NaN = 0.0/0.0;

struct lens {
    float strength;
    vec2 position;
    float angle;
    int model;
    float param1;
    float param2;
    float param3;
};

const int PLUMMER   = 1;
const int SIS       = 2;
const int NSIS      = 3;
const int SIE       = 4;
const int NSIE      = 5;
const int IMPORT    = 7;

struct source_plane {
    float D_ds;     //< Distance to the lens, in Mpc
    float D_s;      //< Distance to the viewer, in Mpc
    vec2 origin;
    float radius;
};

uniform lens u_lenses[16];                              //< Lens parameters
uniform highp sampler2DArray u_alphaTextureArray;       //< Texture array containing alpha vectors
uniform highp sampler2DArray u_derivativeTextureArray;  //< Texture array containing alpha derivatives for the critical lines
uniform highp sampler2D u_causticsTexture;              //< Texture containing positions for caustics
uniform float u_num_lenses;

uniform source_plane u_source_planes[16];
uniform float u_num_source_planes;

uniform float u_size;               //< Canvas size, in pixels
uniform float u_angularRadius;      //< Angular size of the simulation, in arcseconds
uniform float u_D_d;                //< Lens distance, in Mpc

uniform float u_show_source_plane;
uniform float u_show_image_plane;
uniform float u_show_density;
uniform float u_show_critical_lines;
uniform float u_show_caustics;

in vec2 v_pos;
in vec2 v_texpos;

out vec4 o_fragmentColor;

/** Converts an angle to texture coordinates */
vec2 angleToTexcoords(vec2 angle) {
    return angle / u_angularRadius / 2.0 + vec2(0.5, 0.5);
}

/** Checks if the point is on the i'th source plane. */
bool isOnSourcePlane(vec2 beta, int i) {
    return length(beta - u_source_planes[i].origin) < u_source_planes[i].radius;
}

vec2 transformTheta(vec2 theta, lens theLens) {
    vec2 theta0 = theta - theLens.position;
    return vec2(theta0.x*cos(theLens.angle) + theta0.y*sin(theLens.angle),
                -theta0.x*sin(theLens.angle) + theta0.y*cos(theLens.angle));
}

vec3 calculateLensAlphaDerivatives(vec2 theta, int index) {
    if (u_lenses[index].model == PLUMMER) {
        float scale = u_lenses[index].param1;   // (4*G*M) / (c^2*Dd)
        float width = u_lenses[index].param2;

        vec2 scaledTheta = theta * ANGLE_ARCSEC;
        float x = scaledTheta.x;
        float y = scaledTheta.y;
        float x2 = x * x;
        float y2 = y * y;
        float w2 = width * width;
        float denom = pow(x2 + y2 + w2, 2.0);

        float axx = -scale * (x2 - y2 - w2) / denom;
        float ayy = -scale * (y2 - x2 - w2) / denom;
        float axy = -scale *   2.0 * x * y  / denom;
        return vec3(axx, ayy, axy);
    } else if (u_lenses[index].model == SIS) {
        float scale = u_lenses[index].param1;   // (4*PI*Sv^2) / c^2

        vec2 scaledTheta = theta * ANGLE_ARCSEC;
        float x = scaledTheta.x;
        float y = scaledTheta.y;
        float x2 = x * x;
        float y2 = y * y;
        float denom = pow(x2 + y2, 3.0/2.0);

        float axx = scale *   y2  / denom;
        float ayy = scale *   x2  / denom;
        float axy = scale * x * y / denom;
        return vec3(axx, ayy, axy);
    } else if (u_lenses[index].model == NSIS) {
        // NOTE: this is an approximation using NSIE with f = 0.99
        float scale = u_lenses[index].param1;   // (4*PI*Sv^2) / c^2
        float r = u_lenses[index].param2;
        float f = 0.99;

        vec2 scaledTheta = theta * ANGLE_ARCSEC;
        float x = scaledTheta.x;
        float y = scaledTheta.y;
        float x2 = x * x;
        float y2 = y * y;
        float r2 = r * r;
        float f2 = f * f;

        float ff = sqrt(1.0 - f*f);
        float factor = scale * sqrt(f) / ff;
        float g = sqrt(f2*y2 + r2 + x2);
        float denom = (f2*y2 + r2 + 2.0*f*r*g + f2*r2 + x2*f2) * g;

        float axx = factor * ff * (f2*y2 + r2 + f*r*g) / denom;
        float ayy = factor * f * ff * (f*r2 + f*x2 + r*g) / denom;
        float axy = -factor * x * y * f2 * ff / denom;
        return vec3(axx, ayy, axy);
    } else if (u_lenses[index].model == SIE) {
        float scale = u_lenses[index].param1;   // (4*PI*Sv^2) / c^2
        float f = u_lenses[index].param3;

        vec2 scaledTheta = theta * ANGLE_ARCSEC;
        float x = scaledTheta.x;
        float y = scaledTheta.y;
        float x2 = x * x;
        float y2 = y * y;
        float factor = scale * sqrt(f) / ((x2 + y2)*sqrt(f*f*y2 + x2));
        
        float axx = factor * y2;
        float ayy = factor * x2;
        float axy = factor * x * y;
        return vec3(axx, ayy, axy);
    } else if (u_lenses[index].model == NSIE) {
        float scale = u_lenses[index].param1;   // (4*PI*Sv^2) / c^2
        float r = u_lenses[index].param2;
        float f = u_lenses[index].param3;

        vec2 scaledTheta = theta * ANGLE_ARCSEC;
        float x = scaledTheta.x;
        float y = scaledTheta.y;
        float x2 = x * x;
        float y2 = y * y;
        float r2 = r * r;
        float f2 = f * f;

        float ff = sqrt(1.0 - f*f);
        float factor = scale * sqrt(f) / ff;
        float g = sqrt(f2*y2 + r2 + x2);
        float denom = (f2*y2 + r2 + 2.0*f*r*g + f2*r2 + x2*f2) * g;

        float axx = factor * ff * (f2*y2 + r2 + f*r*g) / denom;
        float ayy = factor * f * ff * (f*r2 + f*x2 + r*g) / denom;
        float axy = -factor * x * y * f2 * ff / denom;
        return vec3(axx, ayy, axy);
    } else {
        vec2 texcoord = angleToTexcoords(theta);
        return texture(u_derivativeTextureArray, vec3(texcoord, index)).xyz;
    }
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
        // Prevent sampling outside alpha texture:
        // Return NaN if outside texture, so when adding up alphas, the result
        // will always be NaN as well.
        if (u_lenses[i].model == IMPORT &&
            (theta0.x > u_angularRadius || theta0.x < -u_angularRadius
            || theta0.y > u_angularRadius || theta0.y < -u_angularRadius))
            return vec3(NaN, NaN, NaN);
        vec3 derivatives = calculateLensAlphaDerivatives(theta0 + offset * u_angularRadius, i);

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

float calculateDensity(vec2 theta) {
    vec3 derivatives = calculateAlphaDerivatives(theta, vec2(0.0, 0.0));
    return (derivatives.x + derivatives.y) / 32.0;
}

bool isOnCriticalLine(vec2 theta, int i) {
    float offset = 0.005;

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

bool isOnCaustic() {
    // for (float y = u_size - 1.0; y >= 0.0; y--) {
    //     for (float x = 0.0; x < u_size; x++) {
    //         vec2 texcoords = vec2(x / u_size, y / u_size);
    //         vec2 pos = vec2(texture(u_causticsTexture, texcoords));
    //         if (pos == v_pos) return true;
    //     }
    // }
    // return false;
    return texture(u_causticsTexture, v_texpos).r == 1.0;
}

vec2 calculateLensAlpha(vec2 theta, int index) {
    if (u_lenses[index].model == PLUMMER) {
        float scale = u_lenses[index].param1;   // (4*G*M) / (c^2*Dd)
        float width = u_lenses[index].param2;

        vec2 scaledTheta = theta * ANGLE_ARCSEC;
        float factor = dot(scaledTheta, scaledTheta) + pow(width, 2.0);
        return theta * scale / factor;
    } else if (u_lenses[index].model == SIS) {
        float scale = u_lenses[index].param1;   // (4*PI*Sv^2) / c^2
        vec2 e = normalize(theta);
        return scale * e / ANGLE_ARCSEC;
    } else if (u_lenses[index].model == NSIS) {
        float scale = u_lenses[index].param1;   // (4*PI*Sv^2) / c^2
        float r = u_lenses[index].param2;

        vec2 scaledTheta = theta * ANGLE_ARCSEC;
        float x = scaledTheta.x;
        float y = scaledTheta.y;
        float x2 = x * x;
        float y2 = y * y;
        float r2 = r * r;

        float denom = x2 + y2;
        float factor = scale * (sqrt(x2 + y2 + r2) - r);
        return vec2(factor * x / denom, factor * y / denom) / ANGLE_ARCSEC;
    } else if (u_lenses[index].model == SIE) {
        float scale = u_lenses[index].param1;   // (4*PI*Sv^2) / c^2
        float ff = u_lenses[index].param2;      // sqrt(1 - f^2)
        float f = u_lenses[index].param3;

        float factor = scale * sqrt(f) / ff;
        float x = factor * asinh((ff/f)*theta.x/length(theta));
        float y = factor * asin(ff*theta.y/length(theta));
        return vec2(x, y) / ANGLE_ARCSEC;
    } else if (u_lenses[index].model == NSIE) {
        float scale = u_lenses[index].param1;   // (4*PI*Sv^2) / c^2
        float r = u_lenses[index].param2;
        float f = u_lenses[index].param3;

        vec2 scaledTheta = theta * ANGLE_ARCSEC;
        float x = scaledTheta.x;
        float y = scaledTheta.y;
        float x2 = x * x;
        float y2 = y * y;
        float r2 = r * r;
        float f2 = f * f;

        float ff = sqrt(1.0 - f*f);
        float factor = scale * sqrt(f) / ff;
        float xfrac = (x * ff) / (sqrt(f2*y2 + r2 + x2) + f*r);
        float yfrac = (f * y * ff) / (f * sqrt(f2*y2 + r2 + x2) + r);
        return vec2(factor * atanh(xfrac), factor * atan(yfrac)) / ANGLE_ARCSEC;
    } else {
        return texture(u_alphaTextureArray, vec3(angleToTexcoords(theta), index)).xy;
    }
}

vec2 calculateAlpha(vec2 theta) {
    vec2 sum = vec2(0.0, 0.0);
    for (int i = 0; i < int(u_num_lenses); i++) {
        vec2 theta0 = transformTheta(theta, u_lenses[i]);
        // Prevent sampling outside alpha texture:
        // Return NaN if outside texture, so when adding up alphas, the result
        // will always be NaN as well.
        if (u_lenses[i].model == IMPORT &&
            (theta0.x > u_angularRadius || theta0.x < -u_angularRadius
            || theta0.y > u_angularRadius || theta0.y < -u_angularRadius))
            return vec2(NaN, NaN);
        vec2 alpha = calculateLensAlpha(theta0, i);
        alpha = vec2(alpha.x*cos(u_lenses[i].angle) - alpha.y*sin(u_lenses[i].angle),
                     alpha.x*sin(u_lenses[i].angle) + alpha.y*cos(u_lenses[i].angle));
        alpha *= u_lenses[i].strength;
        sum += alpha;
    }
    return sum;
}

vec2 calculateBeta(vec2 theta, vec2 alpha, int index) {
    if (isnan(alpha.x + alpha.y))
        return theta;
    else
        return theta - (u_source_planes[index].D_ds / u_source_planes[index].D_s) * alpha;
}

vec4 traceTheta(vec2 theta) {
    if (u_show_caustics == 1.0 && isOnCaustic())
        return vec4(0.0, 0.0, 1.0, 1.0);

    vec2 alpha = calculateAlpha(theta);
    // return vec4(alpha, 0.0, 1.0);
    for (int i = 0; i < int(u_num_source_planes); i++) {
        vec2 beta = calculateBeta(theta, alpha, i);
        if (u_show_critical_lines == 1.0 && isOnCriticalLine(theta, i))     // critical line
            return vec4(1.0, 0.0, 0.0, 1.0);
        else if (u_show_source_plane == 1.0 && isOnSourcePlane(theta, i))   // source plane
            return vec4(0.0, 1.0, 0.0, 1.0);
        else if (u_show_image_plane == 1.0 && isOnSourcePlane(beta, i))     // image plane
            return vec4(1.0, 1.0, 1.0, 1.0);
    }

    if (u_show_density == 1.0) {
        float density = calculateDensity(theta);
        return vec4(density, density, 0.0, 1.0);
    } else {
        return vec4(0.0, 0.0, 0.0, 1.0);
    }
}

void main() {
    vec2 theta = v_pos * u_angularRadius;
    o_fragmentColor = traceTheta(theta);
}
