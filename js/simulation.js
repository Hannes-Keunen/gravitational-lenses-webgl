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
    this.runProgram = function(program, textures, framebuffer) {
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

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexbuffer);
        gl.enableVertexAttribArray(0);  // Vertex positions are hardcoded at location 0
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
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

function Simulation(canvasID, size) {
    this.canvas;            /* HtmlCanvasObject */
    this.gl;                /* WebGL2RenderingContext */
    this.helper;            /* GLHelper */
    this.simulationShader;  /* WebGLProgram */
    this.displayShader;     /* WebGLProgram */
    this.fbtexture;         /* WebGLTexture */
    this.framebuffer;       /* WebGLFramebuffer */

    this.constructor = function() {
        this.canvas = document.getElementById(canvasID);
        this.canvas.width = size;
        this.canvas.height = size;
        this.gl = canvas.getContext("webgl2");
        this.helper = new GLHelper(this.gl);
        new ResourceLoader().load(
            ["shaders/vs.glsl", "shaders/fs_simulation.glsl", "shaders/fs_display.glsl"],
            this.loadShaders.bind(this));
        this.fbtexture = this.helper.createTexture(size, size);
        this.framebuffer = this.helper.createFramebuffer(this.fbtexture);
    }

    this.setSize = function(size) {
        this.canvas.width = size;
        this.canvas.height = size;
    }

    this.update = function() {
        if (this.displayShader && this.simulationShader) {
            this.helper.runProgram(this.simulationShader, [], this.framebuffer);
            this.helper.runProgram(this.displayShader, [{texture: this.fbtexture, name: "u_texture"}], null);
        }
    }

    this.loadShaders = function(sources) {
        this.simulationShader = this.helper.createProgram(sources["shaders/vs.glsl"], sources["shaders/fs_simulation.glsl"]);
        this.displayShader = this.helper.createProgram(sources["shaders/vs.glsl"], sources["shaders/fs_display.glsl"]);
    }

    this.constructor();
}
