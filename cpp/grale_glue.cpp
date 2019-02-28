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

float EMSCRIPTEN_KEEPALIVE calculateLensAlphaX(grale::GravitationalLens *lens, double theta_x, double theta_y) {
    grale::Vector2Dd alpha;
    lens->getAlphaVector(grale::Vector2Dd(theta_x, theta_y), &alpha);
    return alpha.getX();
}

float EMSCRIPTEN_KEEPALIVE calculateLensAlphaY(grale::GravitationalLens *lens, double theta_x, double theta_y) {
    grale::Vector2Dd alpha;
    lens->getAlphaVector(grale::Vector2Dd(theta_x, theta_y), &alpha);
    return alpha.getY();
}

void EMSCRIPTEN_KEEPALIVE destroyLens(grale::GravitationalLens *lens) {
    delete lens;
}

}
