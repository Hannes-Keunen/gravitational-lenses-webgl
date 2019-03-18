/** Constants */
const MASS_SUN      = 1.98855e30;
const DIST_PC       = 3.0856775714409184e16;
const DIST_KPC      = 1000.0 * DIST_PC;
const DIST_MPC      = 1000.0 * DIST_KPC;
const SPEED_C       = 299792458.0;
const ANGLE_DEGREE  = Math.PI / 180.0;
const ANGLE_ARCMIN  = ANGLE_DEGREE / 60;
const ANGLE_ARCSEC  = ANGLE_ARCMIN / 60;

/** A circular source plane. */
function SourcePlane(redshift, lensRedshift, x, y, radius) {
    this.redshift = redshift;   /** The redshift value */
    this.D_s;                   /** Viewing distance, in Mpc */
    this.D_ds;                  /** Distance to the lens, in Mpc */
    this.x = x;                 /** X coordinate */
    this.y = y;                 /** Y coordinate */
    this.radius = radius        /** Radius */

    this.constructor = function() {
        this.D_s = calculateAngularDiameterDistance(0.0, redshift);
        this.D_ds = calculateAngularDiameterDistance(lensRedshift, redshift);
    }

    this.setRedshiftValue = function(redshift, lensRedshift) {
        this.redshift = redshift;
        this.D_s = calculateAngularDiameterDistance(0.0, redshift);
        this.D_ds = calculateAngularDiameterDistance(lensRedshift, redshift);
    }

    this.constructor();
}

/** Gravitational lenses */
function GravitationalLens(model) {
    this.model;             /** Lens model for alpha calculation */
    this.params;            /** Model-specific parameters */
    this.strength = 1;
    this.translationX = 0;
    this.translationY = 0;
    this.angle = 0;

    this.setParams = function(params) {
        if (!this.checkParams(this.model, params))
            throw new Error("invalid parameters for lens model " + this.model);
        this.params = params;
    }

    this.setTranslation = function(x, y) {
        this.translationX = x;
        this.translationY = y;
    }

    this.setAngle = function(angle) {
        this.angle = angle;
    }

    this.createHandle = function(D_d) {
        switch (this.model) {
            case GravitationalLens.PLUMMER: return createPlummerLens(D_d*DIST_MPC, this.params.mass*MASS_SUN, this.params.angularWidth*ANGLE_ARCSEC);
            case GravitationalLens.SIS:     return createSISLens(D_d*DIST_MPC, this.params.velocityDispersion*1000);
            case GravitationalLens.NSIS:    return createNSISLens(D_d*DIST_MPC, this.params.velocityDispersion*1000, this.params.angularCoreRadius);
            case GravitationalLens.SIE:     return createSIELens(D_d*DIST_MPC, this.params.velocityDispersion*1000, this.params.ellipticity);
            case GravitationalLens.NSIE:    return createNSIELens(D_d*DIST_MPC, this.params.velocityDispersion*1000, this.params.ellipticity, this.params.angularCoreRadius);
            // case GravitationalLens.MASS_SHEET: var lens = createMassSheetLens(this.D_d*DIST_MPC, this.params.density); break;
            default: throw new Error("Invalid lens model: " + model);
        }
    }

    this.checkParams = function(model, params) {
        switch (model) {
            case GravitationalLens.PLUMMER: return "mass" in params && "angularWidth" in params;
            case GravitationalLens.SIS:     return "velocityDispersion" in params;
            case GravitationalLens.NSIS:    return "velocityDispersion" in params && "angularCoreRadius" in params;
            case GravitationalLens.SIE:     return "velocityDispersion" in params && "ellipticity" in params;
            case GravitationalLens.NSIE:    return "velocityDispersion" in params && "ellipticity" in params && "angularCoreRadius" in params;
            // case GravitationalLens.MASS_SHEET: return "density" in params;
            default: throw new Error("Invalid lens model: " + model);
        }
    }

    this.model = model;
    this.setParams(GravitationalLens.GetDefaultParams(model));
}

/** Lens models */
GravitationalLens.PLUMMER = 1;
GravitationalLens.SIS = 2;
GravitationalLens.NSIS = 3;
GravitationalLens.SIE = 4;
GravitationalLens.NSIE = 5;
GravitationalLens.MASS_SHEET = 6;

GravitationalLens.GetDefaultParams = function(model) {
    switch (model) {
        case GravitationalLens.PLUMMER: return { mass: 1e14, angularWidth: 5 };
        case GravitationalLens.SIS:     return { velocityDispersion: 150 };
        case GravitationalLens.NSIS:    return { velocityDispersion: 150, angularCoreRadius: 5 };
        case GravitationalLens.SIE:     return { velocityDispersion: 150, ellipticity: 0.5 };
        case GravitationalLens.NSIE:    return { velocityDispersion: 150, ellipticity: 0.5, angularCoreRadius: 5 };
        default: throw new Error("Invalid lens model: " + model);
    }
}

GravitationalLens.GetModelName = function(model) {
    switch (model) {
        case GravitationalLens.PLUMMER: return "Plummer";
        case GravitationalLens.SIS:     return "SIS";
        case GravitationalLens.NSIS:    return "NSIS";
        case GravitationalLens.SIE:     return "SIE";
        case GravitationalLens.NSIE:    return "NSIE";
        default: throw new Error("Invalid lens model: " + model);
    }
}

function LensPlane(redshift) {
    this.redshift;          /** The redshift value */
    this.D_d;               /** The angular diameter distance, in Mpc */
    this.lenses = [];       /** A list of GravitationalLenses */
    this.alphaTexture;      /** A WebGL texture where alphas will be stored */
    this.QTextures = [];    /** An array of WebGL textures where Q values will be stored for calculating critical lines */

    this.setRedshiftValue = function(redshift) {
        this.redshift = redshift;
        this.D_d = calculateAngularDiameterDistance(this.redshift, 0.0);
    }

    this.addLens = function(lens) {
        this.lenses.push(lens);
    }

    this.removeLens = function(lens) {
        var index = this.lenses.indexOf(lens);
        this.lenses.splice(index, 1);
        return index;
    }

    this.calculateAlphaVectors = function(simulationSize, angularSize, glhelper, sourcePlanes) {
        var handles = [];
        var params = createCompositeLensParams();
        for (let lens of this.lenses) {
            var handle = lens.createHandle(this.D_d);
            addLensToComposite(params, lens.strength, lens.translationX*ANGLE_ARCSEC, lens.translationY*ANGLE_ARCSEC, lens.angle, handle);
            handles.push(handle);
        }
        var lens = createCompositeLens(this.D_d, params);

        var alphas = new Float32Array(simulationSize * simulationSize * 2);
        var qs = [];
        for (let i = 0; i < sourcePlanes.length; i++)
            qs.push(new Float32Array(simulationSize * simulationSize));
        for (let y = 0; y < simulationSize; y++) {
            for (let x = 0; x < simulationSize; x++) {
                // alpha vector
                var theta_x = (x - simulationSize / 2) / simulationSize * angularSize;
                var theta_y = (y - simulationSize / 2) / simulationSize * angularSize;
                var alpha_x = calculateLensAlphaX(lens, theta_x*ANGLE_ARCSEC, theta_y*ANGLE_ARCSEC) / ANGLE_ARCSEC;
                var alpha_y = calculateLensAlphaY(lens, theta_x*ANGLE_ARCSEC, theta_y*ANGLE_ARCSEC) / ANGLE_ARCSEC;
                alphas[  (x + simulationSize * y) * 2  ] = alpha_x;
                alphas[(x + simulationSize * y) * 2 + 1] = alpha_y;

                // critical lines
                for (let i = 0; i < sourcePlanes.length; i++) {
                    var q = calculateLensQ(lens, theta_x*ANGLE_ARCSEC, theta_y*ANGLE_ARCSEC, sourcePlanes[i].D_s, sourcePlanes[i].D_ds)
                    qs[i][x + simulationSize * y] = q;
                }
            }
        }

        // alpha texture
        if (this.alphaTexture != undefined)
            glhelper.gl.deleteTexture(this.alphaTexture);
        this.alphaTexture = glhelper.createTexture(simulationSize, simulationSize, glhelper.gl.RG32F, glhelper.gl.RG, glhelper.gl.FLOAT, alphas);
        // critical line textures
        if (this.QTextures != [])
            for (texture in this.QTextures)
                glhelper.gl.deleteTexture(this.texture);
        for (let i = 0; i < sourcePlanes.length; i++)
            this.QTextures[i] = glhelper.createTexture(simulationSize, simulationSize, glhelper.gl.R32F, glhelper.gl.RED, glhelper.gl.FLOAT, qs[i]);
        
        destroyLens(lens);
        destroyLensParams(params);
        for (let handle of handles)
            destroyLens(handle);
    }

    this.setRedshiftValue(redshift);
}

function Simulation(canvasID, size, angularSize) {
    this.size = size;               /** Simulation size in pixels */
    this.angularSize = angularSize; /** Simulation size in arcseconds */
    this.canvas;                    /** HtmlCanvasObject */
    this.gl;                        /** WebGL2RenderingContext */
    this.helper;                    /** GLHelper */
    this.simulationShader;          /** WebGLProgram */
    this.displayShader;             /** WebGLProgram */
    this.fbtexture;                 /** WebGLTexture */
    this.framebuffer;               /** WebGLFramebuffer */
    this.uniforms = {};
    this.started = false;

    this.lens;                      /** GravitationalLens */
    this.sourcePlanes = [];         /** SourcePlane[] */

    this.constructor = function() {
        this.canvas = document.getElementById(canvasID);
        this.canvas.width = size;
        this.canvas.height = size;
        this.gl = canvas.getContext("webgl2");
        this.helper = new GLHelper(this.gl);
        loadResources(
            ["shaders/vs_simulation.glsl", "shaders/fs_simulation.glsl",
             "shaders/vs_display.glsl", "shaders/fs_display.glsl"],
            this.loadShaders.bind(this));
        this.fbtexture = this.helper.createTexture(size, size);
        this.framebuffer = this.helper.createFramebuffer(this.fbtexture);

        this.lensPlane = new LensPlane(0.5);

        this.uniforms["u_size"] = new Uniform(Uniform.FLOAT, this.size);
        this.uniforms["u_angularSize"] = new Uniform(Uniform.FLOAT, this.angularSize);
        this.uniforms["u_num_source_planes"] = new Uniform(Uniform.FLOAT, 0);
        this.uniforms["u_enabled"] = new Uniform(Uniform.FLOAT, 0);
        this.uniforms["u_D_d"] = new Uniform(Uniform.FLOAT, this.lensPlane.D_d);
        this.uniforms["u_lensStrength"] = new Uniform(Uniform.FLOAT, 1);
    }

    this.destroy = function() {
        this.gl.deleteTexture(this.lensPlane.alphaTexture);
        this.gl.deleteFramebuffer(this.framebuffer);
        this.gl.deleteTexture(this.fbtexture);
        this.gl.deleteProgram(this.simulationShader.program);
        this.gl.deleteProgram(this.displayShader.program);
        this.gl.deleteShader(this.simulationShader.vertexShader);
        this.gl.deleteShader(this.simulationShader.fragmentShader);
        this.gl.deleteShader(this.displayShader.vertexShader);
        this.gl.deleteShader(this.displayShader.fragmentShader);
    }

    this.setSize = function(size) {
        this.size = size;
        this.canvas.width = size;
        this.canvas.height = size;
        this.gl.viewport(0, 0, size, size);
        // TODO: this doesn't work as expected
    }

    this.setAngularSize = function(angularSize) {
        this.angularSize = angularSize;
    }

    this.enableLensEffect = function() {
        this.uniforms["u_enabled"].value = 1;
    }

    this.disableLensEffect = function() {
        this.uniforms["u_enabled"].value = 0;
    }

    this.start = function() {
        this.uniforms["u_angularSize"].value = this.angularSize;
        for (let sourcePlane of this.sourcePlanes)
            sourcePlane.setRedshiftValue(sourcePlane.redshift, this.lensPlane.redshift);
        this.lensPlane.calculateAlphaVectors(this.size, this.angularSize, this.helper, this.sourcePlanes);
        this.enableLensEffect();
        this.started = true;
    }

    this.addSourcePlane = function(sourcePlane) {
        this.sourcePlanes.push(sourcePlane);
    }

    this.removeSourcePlane = function(sourcePlane) {
        var index = this.sourcePlanes.indexOf(sourcePlane);
        this.sourcePlanes.splice(index, 1);
        return index;
    }

    this.isReady = function() {
        return this.started && this.displayShader != undefined && this.simulationShader != undefined;
    }

    this.update = function() {
        this.updateUniforms();
        var textures = { u_alphaTexture: this.lensPlane.alphaTexture, u_qTextures: this.lensPlane.QTextures };
        this.helper.runProgram(this.simulationShader.program, textures, this.uniforms, this.framebuffer);
        this.helper.runProgram(this.displayShader.program, {u_texture: this.fbtexture}, {}, null);
    }

    this.updateUniforms = function() {
        this.uniforms["u_size"].value = this.size;
        this.uniforms["u_num_source_planes"].value = this.sourcePlanes.length;
        this.uniforms["u_D_d"].value = this.lensPlane.D_d;
        this.uniforms["u_lensStrength"].value = 1;
        for (let i = 0; i < this.sourcePlanes.length; i++) {
            let sourcePlane = this.sourcePlanes[i];
            this.uniforms["u_source_planes["+i+"].origin"] = new Uniform(Uniform.VEC2, [sourcePlane.x, sourcePlane.y]);
            this.uniforms["u_source_planes["+i+"].radius"] = new Uniform(Uniform.FLOAT, sourcePlane.radius);
            this.uniforms["u_source_planes["+i+"].D_s"] = new Uniform(Uniform.FLOAT, sourcePlane.D_s);
            this.uniforms["u_source_planes["+i+"].D_ds"] = new Uniform(Uniform.FLOAT, sourcePlane.D_ds);
        }
    }

    this.loadShaders = function(sources) {
        this.simulationShader = this.helper.createProgram(sources["shaders/vs_simulation.glsl"], sources["shaders/fs_simulation.glsl"]);
        this.displayShader = this.helper.createProgram(sources["shaders/vs_display.glsl"], sources["shaders/fs_display.glsl"]);
    }

    this.constructor();
}
