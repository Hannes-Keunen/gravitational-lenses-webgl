/** Constants */
const MASS_SUN      = 1.98855e30;
const DIST_PC       = 3.0856775714409184e16;
const DIST_KPC      = 1000.0 * DIST_PC;
const DIST_MPC      = 1000.0 * DIST_KPC;
const SPEED_C       = 299792458.0;
const ANGLE_DEGREE  = Math.PI / 180.0;
const ANGLE_ARCMIN  = ANGLE_DEGREE / 60;
const ANGLE_ARCSEC  = ANGLE_ARCMIN / 60;

/** Calculates the angular distance in Mpc between two object, based on their redshifts. */
function calculateAngularDiameterDistance(z1, z2) {
    var h   = 0.7;          /* Hubble constant */
    var W_m = 0.3;          /* Matter density */
    var W_r = 0.0;          /* Radiation density */
    var W_v = 0.7;          /* Vacuum density */
    var c   = 299792458.0   /* Light speed */
    var TH  = 1.0/100000.0
    var w   = -1.0;
    var num = 10000;

    var sum = 0.0;
    var R2 = 1.0/(1.0+Math.min(z1, z2));
    var R1 = 1.0/(1.0+Math.max(z1, z2));
    var dR = (R2-R1)/(1.0*num);
    var R = R1;

    var W_k = 1.0 - W_v - W_r - W_m;

    if (Math.abs(W_k) < 1e-7) // flat enough
    {
        // console.log("Assuming Wk = 0 (is really " + W_k + ")");
        W_k = 0.0;
    }

    for (var i = 0 ; i < num ; i++, R += dR)
    {
        var term1 = W_v*Math.pow(R,1.0-3.0*w);
        var term2 = W_m*R;
        var term3 = W_r;
        var term4 = W_k*R*R;

        var val1 = 1.0/Math.sqrt(term1+term2+term3+term4);

        term1 = W_v*Math.pow(R+dR,1.0-3.0*w);
        term2 = W_m*(R+dR);
        term3 = W_r;
        term4 = W_k*(R+dR)*(R+dR);

        var val2 = 1.0/Math.sqrt(term1+term2+term3+term4);

        sum += ((val1+val2)/2.0)*dR; // trapezium rule
    }

    var A = 0.0;

    if (W_k == 0.0)
        A = sum;
    else if (W_k > 0)
        A = (1.0/Math.sqrt(W_k))*Math.sinh(Math.sqrt(W_k)*sum);
    else // W_k < 0
        A = (1.0/Math.sqrt(-W_k))*Math.sin(Math.sqrt(-W_k)*sum);

    var result = c*A*((1.0/(1.0+Math.max(z1, z2)))*TH)/h;
    return result;
}

/** Loads multiple resources in parallel. */
function ResourceLoader() {

    this.load = function(names, callback) {
        var complete = false;
        var resources = {};
        var requests = {};

        for (let name of names) {
            requests[name] = new XMLHttpRequest;
            requests[name].onreadystatechange = function() {
                if (this.readyState == 4 && this.status == 200) {
                    resources[name] = this.responseText;
                    if (Object.keys(resources).length == names.length)
                        complete = true;
                }
            }
            requests[name].open("GET", name, true);
            requests[name].send();
        }

        setTimeout(function waitForCompletion() {
            if (complete)
                callback(resources);
            else
                setTimeout(waitForCompletion, 100); 
        });
    }

}

/** Helper for shader uniforms. */
function Uniform(type, value) {
    this.type = type;
    this.value = value;
}

Uniform.FLOAT = 1;
Uniform.VEC2 = 2;

/** Contains helper methods for common WebGL operations. */
function GLHelper(gl) {
    this.gl = gl;
    this.vertexbuffer;          /* WebGLBuffer */
    this.uniformLocations = {}; /* [WebGLProgram => [String => WebGLUniformLocation]] */

    this.constructor = function() {
        vertexdata = new Float32Array([
            -1.0, -1.0, 
            -1.0, 1.0,
            1.0, -1.0,
            1.0, 1.0 ]);
        this.vertexbuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexbuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertexdata, gl.STATIC_DRAW);
    }

    /** Creates a single shader. */
    this.createShader = function(type, source) {
        var shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        var compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
        if (!compiled) {
            var error = gl.getShaderInfoLog(shader);
            gl.deleteShader(shader);
            throw new Error("Error compiling shader: " + error);
        }

        return shader;
    }

    /** Creates a basic shader program with vertex and fragment shaders. */
    this.createProgram = function(vertexSource, fragmentSource) {
        var vertexShader = this.createShader(gl.VERTEX_SHADER, vertexSource);
        var fragmentShader = this.createShader(gl.FRAGMENT_SHADER, fragmentSource);
        var program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        var linked = gl.getProgramParameter(program, gl.LINK_STATUS);
        if (!linked) {
            var error = gl.getProgramInfoLog(program);
            gl.deleteProgram(program);
            throw new Error("Error linking program: " + error);
        }
        return program;
    }

    /** Creates a new texture. */
    this.createTexture = function(width, height, internalFormat = gl.RGBA, format = gl.RGBA, type = gl.UNSIGNED_BYTE, data = null) {
        var texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, width, height, 0, format, type, data);
        return texture;
    }

    /** Creates a new framebuffer with the given texture as it's color attachment. */
    this.createFramebuffer = function(texture) {
        var fb = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

        var status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
        if (status != gl.FRAMEBUFFER_COMPLETE)
            throw new Error("Framebuffer is not complete, return value is " + status);
        
        return fb;
    }

    /** 
     * Runs a shader program and stores it's output in the given framebuffer,
     * or the default framebuffer if the framebuffer is null.
     */
    this.runProgram = function(program, textures, uniforms, framebuffer) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);

        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.useProgram(program);

        // Bind textures
        var i = 0;
        Object.keys(textures).forEach(function(key) {
            gl.activeTexture(gl.TEXTURE0 + i);
            gl.bindTexture(gl.TEXTURE_2D, textures[key]);
            var loc = this.getUniformLocation(program, key);
            gl.uniform1i(loc, i);
            i++;
        }.bind(this));

        // Bind uniforms
        Object.keys(uniforms).forEach(function(key) {
            this.applyUniform(program, key, uniforms[key]);
        }.bind(this));

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexbuffer);
        gl.enableVertexAttribArray(0);  // Vertex positions are hardcoded at location 0
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    this.applyUniform = function(program, name, uniform) {
        var loc = this.getUniformLocation(program, name);
        switch (uniform.type) {
            case Uniform.FLOAT: gl.uniform1f(loc, uniform.value); break;
            case Uniform.VEC2: gl.uniform2f(loc, uniform.value[0], uniform.value[1]); break;
            default: throw new Error("Invalid uniform type: " + uniform.type + "(value: " + uniform.value + ")");
        }
    }

    /** Returns the location of a shader uniform variable. */
    this.getUniformLocation = function(program, name) {
        if (!(program in this.uniformLocations))
            this.uniformLocations[program] = {};

        if (name in this.uniformLocations[program]) {
            return this.uniformLocations[program][name];
        } else {
            loc = gl.getUniformLocation(program, name);
            this.uniformLocations[program][name] = loc;
            return loc;
        }
    }

    this.constructor();
}

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
function GravitationalLens(redshift, strength, model, params) {
    this.redshift = redshift;   /** The redshift value */
    this.strength = strength;   /** Strength factor */
    this.D_d;                   /** The angular diameter distance, in Mpc */
    this.model = model;         /** Lens model for alpha calculation */
    this.params = params;       /** Model-specific parameters */
    this.alphaTexture = null;   /** WebGL texture where alpha vectors are stored */

    this.constructor = function() {
        this.D_d = calculateAngularDiameterDistance(this.redshift, 0.0);
    }

    this.setRedshiftValue = function(redshift) {
        this.redshift = redshift;
        this.D_d = calculateAngularDiameterDistance(this.redshift, 0.0);
    }

    this.setModel = function(model, params) {
        if (!this.checkParams(params))
            throw new Error("invalid parameters for lens model " + this.model);
        this.model = model;
        this.params = params;
    }

    this.calculateAlphaVectors = function(simulationSize, angularSize, glhelper) {
        switch (this.model) {
            case GravitationalLens.PLUMMER: var lens = createPlummerLens(this.D_d*DIST_MPC, this.params.mass*MASS_SUN, this.params.angularWidth*ANGLE_ARCSEC); break;
            case GravitationalLens.SIS: var lens = createSISLens(this.D_d*DIST_MPC, this.params.velocityDispersion); break;
            case GravitationalLens.NSIS: var lens = createNSISLens(this.D_d*DIST_MPC, this.params.velocityDispersion, this.params.angularCoreRadius); break;
            case GravitationalLens.SIE: var lens = createSIELens(this.D_d*DIST_MPC, this.params.velocityDispersion, this.params.ellipticity); break;
            case GravitationalLens.NSIE: var lens = createNSIELens(this.D_d*DIST_MPC, this.params.velocityDispersion, this.params.ellipticity, this.params.angularCoreRadius); break;
            case GravitationalLens.MASS_SHEET: var lens = createMassSheetLens(this.D_d*DIST_MPC, this.params.density); break;
        }

        var alphas = new Float32Array(simulationSize * simulationSize * 2);
        // var min_x, min_y, max_x, max_y;
        for (let y = 0; y < simulationSize; y++) {
            for (let x = 0; x < simulationSize; x++) {
                var theta_x = (x - simulationSize / 2) / simulationSize * angularSize;
                var theta_y = (y - simulationSize / 2) / simulationSize * angularSize;
                var alpha_x = calculateLensAlphaX(lens, theta_x*ANGLE_ARCSEC, theta_y*ANGLE_ARCSEC) / ANGLE_ARCSEC; // + 0.5;
                var alpha_y = calculateLensAlphaY(lens, theta_x*ANGLE_ARCSEC, theta_y*ANGLE_ARCSEC) / ANGLE_ARCSEC; // + 0.5;
                alphas[  (x + simulationSize * y) * 2  ] = alpha_x;
                alphas[(x + simulationSize * y) * 2 + 1] = alpha_y;
                // if (min_x === undefined || isNaN(min_x)) min_x = alpha_x;
                // if (min_y === undefined || isNaN(min_y)) min_y = alpha_y;
                // if (max_x === undefined || isNaN(max_x)) max_x = alpha_x;
                // if (max_y === undefined || isNaN(max_y)) max_y = alpha_y;
                // if (alpha_x < min_x) min_x = alpha_x;
                // if (alpha_x > max_x) max_x = alpha_x;
                // if (alpha_y < min_y) min_y = alpha_y;
                // if (alpha_y > max_y) max_y = alpha_y;
            }
        }

        // console.log("min: ("+min_x+","+min_y+"); max: ("+max_x+","+max_y+")");
        if (this.alphaTexture != null)
            glhelper.gl.deleteTexture(this.alphaTexture);
        this.alphaTexture = glhelper.createTexture(simulationSize, simulationSize, glhelper.gl.RG32F, glhelper.gl.RG, glhelper.gl.FLOAT, alphas);
        destroyLens(lens);
    }

    this.checkParams = function(params) {
        switch (this.model) {
            case GravitationalLens.PLUMMER: return "mass" in params && "angularWidth" in params;
            case GravitationalLens.SIS: return "velocityDispersion" in params;
            case GravitationalLens.NSIS: return "velocityDispersion" in params && "angularCoreRadius" in params;
            case GravitationalLens.SIE: return "velocityDispersion" in params && "ellipticity" in params;
            case GravitationalLens.NSIE: return "velocityDispersion" in params && "ellipticity" in params && "angularCoreRadius" in params;
            case GravitationalLens.MASS_SHEET: return "density" in params;
        }
    }

    var createPlummerLens = Module.cwrap("createPlummerLens", "number", ["number", "number", "number"]);
    var createSISLens = Module.cwrap("createSISLens", "number", ["number", "number"]);
    var createNSISLens = Module.cwrap("createNSISLens", "number", ["number", "number", "number"]);
    var createSIELens = Module.cwrap("createSIELens", "number", ["number", "number", "number"]);
    var createNSIELens = Module.cwrap("createNSIELens", "number", ["number", "number", "number", "number"]);
    var createMassSheetLens = Module.cwrap("createMassSheetLens", "number", ["number", "number"]);
    var calculateLensAlphaX = Module.cwrap("calculateLensAlphaX", "number", ["number", "number", "number", "number", "number"]);
    var calculateLensAlphaY = Module.cwrap("calculateLensAlphaY", "number", ["number", "number", "number", "number", "number"]);
    var destroyLens = Module.cwrap("destroyLens", null, ["number"]);

    this.constructor();
}

/** Lens models */
GravitationalLens.PLUMMER = 1;
GravitationalLens.SIS = 2;
GravitationalLens.NSIS = 3;
GravitationalLens.SIE = 4;
GravitationalLens.NSIE = 5;
GravitationalLens.MASS_SHEET = 6;

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
        new ResourceLoader().load(
            ["shaders/vs_simulation.glsl", "shaders/fs_simulation.glsl",
             "shaders/vs_display.glsl", "shaders/fs_display.glsl"],
            this.loadShaders.bind(this));
        this.fbtexture = this.helper.createTexture(size, size);
        this.framebuffer = this.helper.createFramebuffer(this.fbtexture);

        this.lens = new GravitationalLens(1.0, 10.0, GravitationalLens.PLUMMER, {mass: 1e14, angularWidth: 60});

        this.uniforms["u_size"] = new Uniform(Uniform.FLOAT, this.size);
        this.uniforms["u_angularSize"] = new Uniform(Uniform.FLOAT, this.angularSize);
        this.uniforms["u_num_source_planes"] = new Uniform(Uniform.FLOAT, 0);
        this.uniforms["u_D_d"] = new Uniform(Uniform.FLOAT, this.lens.D_d);
        this.uniforms["u_lensStrength"] = new Uniform(Uniform.FLOAT, this.lens.strength);
    }

    this.setSize = function(size) {
        this.size = size;
        this.canvas.width = size;
        this.canvas.height = size;
        this.gl.viewport(0, 0, size, size);
        // TODO: this doesn't work as expected
    }

    this.setLensRedshiftValue = function(value) {
        this.lens.setRedshiftValue(value);
        // update the distance to the lens for all source planes
        for (let sourcePlane of this.sourcePlanes)
            sourcePlane.setRedshiftValue(sourcePlane.redshift, this.lens.redshift);
    }

    this.setLensModel = function(model, params) {
        this.lens.setModel(model, params);
    }

    this.start = function() {
        this.lens.calculateAlphaVectors(this.size, this.angularSize, this.helper);
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
        return this.started && this.displayShader && this.simulationShader;
    }

    this.update = function() {
        this.updateUniforms();
        this.helper.runProgram(this.simulationShader, {u_alphaTexture: this.lens.alphaTexture}, this.uniforms, this.framebuffer);
        this.helper.runProgram(this.displayShader, {u_texture: this.fbtexture}, {}, null);
    }

    this.updateUniforms = function() {
        this.uniforms["u_size"].value = this.size;
        this.uniforms["u_num_source_planes"].value = this.sourcePlanes.length;
        this.uniforms["u_D_d"].value = this.lens.D_d;
        this.uniforms["u_lensStrength"].value = this.lens.strength;
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
