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
            throw "Error compiling shader: " + error;
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
            throw "Error linking program: " + error;
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
            throw "Framebuffer is not complete, return value is " + status;
        
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

        for (let i = 0; i < textures.length; i++) {
            gl.activeTexture(gl.TEXTURE0 + i);
            gl.bindTexture(gl.TEXTURE_2D, textures[i].texture);
            var loc = this.getUniformLocation(program, textures[i].name);
            gl.uniform1i(loc, i);
        }

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
            default: throw "Invalid uniform type: " + uniform.type;
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
function SourcePlane(redshift, x, y, radius) {
    this.redshift = redshift;   /** The redshift value */
    this.angulardistance;       /** Viewing distance, in Mpc */
    this.x = x;                 /** X coordinate */
    this.y = y;                 /** Y coordinate */
    this.r = radius             /** Radius */

    this.constructor = function() {
        this.distance = calculateAngularDiameterDistance(0.0, redshift);
    }

    this.constructor();
}

/** Gravitational lenses */
function GravitationalLens(redshift, model, params) {
    this.redshift = redshift;   /** The redshift value */
    this.angulardistance;       /** The angular diameter distance, in Mpc */
    this.model = model;         /** Lens model for alpha calculation */

    this.constructor = function() {
        this.angulardistance = calculateAngularDiameterDistance(redshift, 0.0);
    }

    this.constructor();
}

/** Lens models */
GravitationalLens.PLUMMER = 1;
GravitationalLens.SIS = 2;
GravitationalLens.NSIS = 3;
GravitationalLens.SIE = 4;
GravitationalLens.NSIE = 5;
GravitationalLens.MASS_SHEET = 6;

function Simulation(canvasID, size) {
    this.size = size;       /* Number */
    this.canvas;            /* HtmlCanvasObject */
    this.gl;                /* WebGL2RenderingContext */
    this.helper;            /* GLHelper */
    this.simulationShader;  /* WebGLProgram */
    this.displayShader;     /* WebGLProgram */
    this.fbtexture;         /* WebGLTexture */
    this.framebuffer;       /* WebGLFramebuffer */
    this.uniforms = {};

    this.lens;              /* GravitationalLens */
    this.sourcePlanes = []; /* SourcePlane[] */

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

        this.uniforms["u_size"] = new Uniform(Uniform.FLOAT, this.size);
        this.uniforms["u_angularsize"] = new Uniform(Uniform.FLOAT, 120);
        this.uniforms["u_source.origin"] = new Uniform(Uniform.VEC2, [0.0, 0.0]);
        this.uniforms["u_source.radius"] = new Uniform(Uniform.FLOAT, 128.0);
        this.uniforms["u_source.D_s"] = new Uniform(Uniform.FLOAT, calculateAngularDiameterDistance(0.0, 2.0));
    }

    this.setSize = function(size) {
        this.canvas.width = size;
        this.canvas.height = size;
        this.gl.viewport(0, 0, size, size);
        this.uniforms["u_size"].value = size;
    }

    this.update = function() {
        if (this.displayShader && this.simulationShader) {
            this.helper.runProgram(this.simulationShader, [], this.uniforms, this.framebuffer);
            this.helper.runProgram(this.displayShader, [{texture: this.fbtexture, name: "u_texture"}], {}, null);
        }
    }

    this.loadShaders = function(sources) {
        this.simulationShader = this.helper.createProgram(sources["shaders/vs_simulation.glsl"], sources["shaders/fs_simulation.glsl"]);
        this.displayShader = this.helper.createProgram(sources["shaders/vs_display.glsl"], sources["shaders/fs_display.glsl"]);
    }

    this.constructor();
}
