#include <iostream>
#include <string>

#include <grale/compositelens.h>
#include <grale/plummerlens.h>
#include <grale/masssheetlens.h>
#include <grale/nsislens.h>
#include <grale/nsielens.h>
#include <grale/sielens.h>
#include <grale/sislens.h>

#include <emscripten/emscripten.h>

extern "C" {

grale::PlummerLens *EMSCRIPTEN_KEEPALIVE createPlummerLens(double D_d, double mass, double angularWidth) {
    grale::PlummerLens *lens = new grale::PlummerLens;
    grale::PlummerLensParams params(mass, angularWidth);
    lens->init(D_d, &params);
    return lens;
}

grale::SISLens *EMSCRIPTEN_KEEPALIVE createSISLens(double D_d, double velocityDispersion) {
    grale::SISLens *lens = new grale::SISLens;
    grale::SISLensParams params(velocityDispersion);
    lens->init(D_d, &params);
    return lens;
}

grale::NSISLens *EMSCRIPTEN_KEEPALIVE createNSISLens(double D_d, double velocityDispersion, double angularCoreRadius) {
    grale::NSISLens *lens = new grale::NSISLens;
    grale::NSISLensParams params(velocityDispersion, angularCoreRadius);
    lens->init(D_d, &params);
    return lens;
}

grale::SIELens *EMSCRIPTEN_KEEPALIVE createSIELens(double D_d, double velocityDispersion, double ellipticity) {
    grale::SIELens *lens = new grale::SIELens;
    grale::SIELensParams params(velocityDispersion, ellipticity);
    lens->init(D_d, &params);
    return lens;
}

grale::NSIELens *EMSCRIPTEN_KEEPALIVE createNSIELens(double D_d, double velocityDispersion, double ellipticity, double angularCoreRadius) {
    grale::NSIELens *lens = new grale::NSIELens;
    grale::NSIELensParams params(velocityDispersion, ellipticity, angularCoreRadius);
    lens->init(D_d, &params);
    return lens;
}

grale::MassSheetLens *EMSCRIPTEN_KEEPALIVE createMassSheetLens(double D_d, double density) {
    grale::MassSheetLens *lens = new grale::MassSheetLens;
    grale::MassSheetLensParams params(density);
    lens->init(D_d, &params);
    return lens;
}

grale::GravitationalLens *EMSCRIPTEN_KEEPALIVE loadLensFromFile(const char *filename) {
    std::string error;
    grale::GravitationalLens *lens;
    if (!grale::GravitationalLens::load(filename, &lens, error)) {
        std::cout << error << std::endl;
        return nullptr;
    }
    return lens;
}

void EMSCRIPTEN_KEEPALIVE saveLensToFile(grale::GravitationalLens *lens, const char *filename) {
    lens->save(filename);
}

void EMSCRIPTEN_KEEPALIVE calculateAlphaVectors(grale::GravitationalLens *lens, double theta_x, double theta_y, float *buffer, int offset) {
    grale::Vector2Dd alpha;
    lens->getAlphaVector(grale::Vector2Dd(theta_x, theta_y), &alpha);
    buffer[  offset  ] = alpha.getX() / grale::ANGLE_ARCSEC;
    buffer[offset + 1] = alpha.getY() / grale::ANGLE_ARCSEC;
}

void EMSCRIPTEN_KEEPALIVE calculateAlphaVectorDerivatives(
        grale::GravitationalLens *lens, double theta_x, double theta_y, float *buffer, int offset) {
    double axx, ayy, axy;
    lens->getAlphaVectorDerivatives(grale::Vector2Dd(theta_x, theta_y), axx, ayy, axy);
    buffer[  offset  ] = axx;
    buffer[offset + 1] = ayy;
    buffer[offset + 2] = axy;
}

grale::CompositeLensParams *EMSCRIPTEN_KEEPALIVE createCompositeLensParams() {
    return new grale::CompositeLensParams();
}

void EMSCRIPTEN_KEEPALIVE addLensToComposite(
        grale::CompositeLensParams *params, double factor, double pos_x, double pos_y, double angle, const grale::GravitationalLens *lens) {
    params->addLens(factor, grale::Vector2Dd(pos_x, pos_y), angle, *lens);
}

grale::CompositeLens *EMSCRIPTEN_KEEPALIVE createCompositeLens(double D_d, const grale::CompositeLensParams *params) {
    grale::CompositeLens *lens = new grale::CompositeLens;
    lens->init(D_d, params);
    return lens;
}

void EMSCRIPTEN_KEEPALIVE destroyLensParams(grale::GravitationalLensParams *params) {
    delete params;
}

void EMSCRIPTEN_KEEPALIVE destroyLens(grale::GravitationalLens *lens) {
    delete lens;
}

}
