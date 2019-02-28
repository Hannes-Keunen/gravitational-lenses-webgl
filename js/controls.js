/** Controls for a single source plane. */
function SourcePlaneControls(element, sourcePlane, simulation, removeCallback) {
    this.redshiftSlider = element.querySelector("#sourceplane_redshift_slider");
    this.redshiftDisplay = element.querySelector("#sourceplane_redshift_value");
    this.xSlider = element.querySelector("#sourceplane_x_slider");
    this.xDisplay = element.querySelector("#sourceplane_x_value");
    this.ySlider = element.querySelector("#sourceplane_y_slider");
    this.yDisplay = element.querySelector("#sourceplane_y_value");
    this.radiusSlider = element.querySelector("#sourceplane_radius_slider");
    this.radiusDisplay = element.querySelector("#sourceplane_radius_value");
    this.deleteButton = element.querySelector("#sourceplane_delete");

    this.sourcePlane = sourcePlane;
    this.simulation = simulation;
    this.removeCallback = removeCallback;

    this.setCallbacks = function() {
        this.redshiftSlider.addEventListener("input", this.redshiftSliderCallback.bind(this));
        this.xSlider.addEventListener("input", this.xSliderCallback.bind(this));
        this.ySlider.addEventListener("input", this.ySliderCallback.bind(this));
        this.radiusSlider.addEventListener("input", this.radiusSliderCallback.bind(this));
        this.deleteButton.addEventListener("click", this.deleteCallback.bind(this));
    }

    this.initDefaults = function() {
        this.redshiftDisplay.innerHTML = this.redshiftSlider.value / 100;
        this.xDisplay.innerHTML = this.xSlider.value / 100 * this.simulation.size;
        this.xDisplay.innerHTML = this.xSlider.value / 100 * this.simulation.size;
        this.radiusDisplay.innerHTML = this.radiusSlider.value / 100 * this.simulation.size;
    }

    this.redshiftSliderCallback = function() {
        this.redshiftDisplay.innerHTML = this.redshiftSlider.value / 100;
        this.sourcePlane.setRedshiftValue(this.redshiftSlider.value / 100, this.simulation.lens.redshift);
    }

    this.xSliderCallback = function() {
        this.xDisplay.innerHTML = this.xSlider.value / 100 * this.simulation.size;
        this.sourcePlane.x = this.xSlider.value / 100 * this.simulation.size;
    }

    this.ySliderCallback = function() {
        this.yDisplay.innerHTML = this.ySlider.value / 100 * this.simulation.size;
        this.sourcePlane.y = this.ySlider.value / 100 * this.simulation.size;
    }

    this.radiusSliderCallback = function() {
        this.radiusDisplay.innerHTML = this.radiusSlider.value / 100 * this.simulation.size;
        this.sourcePlane.radius = this.radiusSlider.value / 100 * this.simulation.size;
    }

    this.deleteCallback = function() {
        var index = this.simulation.removeSourcePlane(sourcePlane);
        this.removeCallback(index);
    }

    this.setCallbacks();
    this.initDefaults();
}

/** Controls for the whole simulation. */
function Controls(sim) {
    this.sizePicker = document.getElementById("size_picker")
    this.sourcePlaneList = document.getElementById("source_plane_list");
    this.lensRedshiftSlider = document.getElementById("lens_redshift_slider");
    this.lensStrengthDisplay = document.getElementById("lens_strength_value");
    this.lensStrengthSlider = document.getElementById("lens_strength_slider");
    this.lensRedshiftDisplay = document.getElementById("lens_redshift_value");
    this.lensModelPicker = document.getElementById("lens_model_picker");
    this.startSimulationButton = document.getElementById("start_simulation");
    this.sourcePlaneList = document.getElementById("source_plane_list");
    this.addSourcePlaneButton = document.getElementById("add_source_plane");
    this.sourcePlaneControls = [];

    this.simulation = sim;
    this.simulationSize;
    this.lensRedshift;

    this.setCallbacks = function() {
        this.sizePicker.addEventListener("change", this.simulationSizeCallback.bind(this));
        this.lensRedshiftSlider.addEventListener("input", this.lensRedshiftCallback.bind(this));
        this.lensStrengthSlider.addEventListener("input", this.lensStrengthCallback.bind(this));
        this.lensModelPicker.addEventListener("change", this.lensModelCallback.bind(this));
        this.addSourcePlaneButton.addEventListener("click", this.addSourcePlane.bind(this));
        this.startSimulationButton.addEventListener("click", this.startSimulationCallback.bind(this));
        window.onresize = this.resizeCallback.bind(this);
        Module.onRuntimeInitialized = this.emscriptenCallback.bind(this);
    }

    this.initDefaults = function() {
        this.lensRedshift = this.lensRedshiftSlider.value / 100;
        this.lensRedshiftDisplay.innerHTML = this.lensRedshiftSlider.value / 100;
        this.lensStrengthDisplay.innerHTML = this.lensStrengthSlider.value;
        this.simulationSize = this.sizePicker.value;
    }

    this.resizeCallback = function() {
        if (this.simulationSize === "auto")
            this.simulation.setSize(window.innerHeight);
    }
    
    this.simulationSizeCallback = function() {
        this.simulationSize = this.sizePicker.value;
        if (this.simulationSize === "auto")
            this.simulation.setSize(window.innerHeight);
        else 
            this.simulation.setSize(parseInt(this.simulationSize));
    }

    this.lensRedshiftCallback = function() {
        this.lensRedshift = this.lensRedshiftSlider.value / 100;
        this.simulation.setLensRedshiftValue(this.lensRedshift);
        this.lensRedshiftDisplay.innerHTML = this.lensRedshift;
    }

    this.lensStrengthCallback = function() {
        this.simulation.lens.strength = this.lensStrengthSlider.value;
        this.lensStrengthDisplay.innerHTML = this.lensStrengthSlider.value;
    }

    this.lensModelCallback = function() {
        this.simulation.setLensModel(parseInt(this.lensModelPicker.value));
    }

    this.addSourcePlane = function() {
        // Add a new default source plane to the simulation
        var sourcePlane = new SourcePlane(0.5, this.lensRedshift, 0, 0, 128);
        this.simulation.addSourcePlane(sourcePlane);

        // Add controls for the new source plane
        var row = document.createElement("li");
        row.className = "source-plane-controls";
        row.innerHTML = 
            `redshift (z): <span id="sourceplane_redshift_value">1.5</span>
             <div class="slider-container">
                <input id="sourceplane_redshift_slider" type="range" min="50" max="300" value="150">
             </div>
             origin x: <span id="sourceplane_x_value">0</span>
             <div class="slider-container">
                <input id="sourceplane_x_slider" type="range" min="-100" max="100" value="0">
             </div>
             origin y: <span id="sourceplane_y_value">0</span>
             <div class="slider-container">
                <input id="sourceplane_y_slider" type="range" min="-100" max="100" value="0">
             </div>
             radius: <span id="sourceplane_radius_value"></span>
             <div class="slider-container">
                <input id="sourceplane_radius_slider" type="range" min="0" max="200" value="12">
             </div>
             <button id="sourceplane_delete">Delete</button>`
        this.sourcePlaneList.appendChild(row);

        // Create a new controller
        this.sourcePlaneControls.push(
            new SourcePlaneControls(row, sourcePlane, this.simulation, this.sourcePlaneRemoveCallback.bind(this)));
    }

    this.sourcePlaneRemoveCallback = function(index) {
        this.sourcePlaneList.removeChild(this.sourcePlaneList.childNodes[index]);
        this.sourcePlaneControls.splice(index, 1);
    }

    this.emscriptenCallback = function() {
        this.startSimulationButton.disabled = false;
    }

    this.startSimulationCallback = function() {
        sim.start();
    }

    this.setCallbacks();
    this.initDefaults();
}
