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

/** Controls for paramaters specific to the plummer model */
function PlummerControls(parameterCallback) {
    this.view = document.getElementById("plummer_controls");
    this.massSlider = this.view.querySelector("#plummer_mass_slider");
    this.massDisplay = this.view.querySelector("#plummer_mass_value");
    this.angularWidthSlider = this.view.querySelector("#plummer_angularwidth_slider");
    this.angularWidthDisplay = this.view.querySelector("#plummer_angularwidth_value");

    this.params = { mass: 1e14, angularWidth: 60 };
    this.parameterCallback = parameterCallback;

    this.enable = function() {
        this.view.hidden = false;
        this.massSlider.addEventListener("input", this.massCallback.bind(this));
        this.angularWidthSlider.addEventListener("input", this.angularWidthCallback.bind(this));
    }

    this.disable = function() {
        this.view.hidden = true;
        this.massSlider.removeEventListener("input", this.massCallback.bind(this));
        this.angularWidthSlider.removeEventListener("input", this.angularWidthCallback.bind(this));
    }

    this.initDefaults = function() {
        this.massDisplay.innerHTML = this.params.mass.toExponential();
        this.angularWidthDisplay.innerHTML = this.params.angularWidth;
    }

    this.massCallback = function() {
        this.params.mass = this.massSlider.value;
        this.massDisplay.innerHTML = Math.round(this.params.mass).toExponential();
        this.parameterCallback(this.params);
    }

    this.angularWidthCallback = function() {
        this.params.angularWidth = this.angularWidthSlider.value;
        this.angularWidthDisplay.innerHTML = this.params.angularWidth;
        this.parameterCallback(this.params);
    }

}

/** Controls for paramaters specific to the SIS model */
function SISControls(parameterCallback) {
    this.view = document.getElementById("sis_controls");
    this.velocityDispersionSlider = this.view.querySelector("#sis_velocitydispersion_slider");
    this.velocityDispersionDisplay = this.view.querySelector("#sis_velocitydispersion_value");

    this.params = { velocityDispersion: 0 };
    this.parameterCallback = parameterCallback;

    this.enable = function() {
        this.view.hidden = false;
        this.velocityDispersionSlider.addEventListener("input", this.velocityDispersionCallback.bind(this));
    }

    this.disable = function() {
        this.view.hidden = true;
        this.velocityDispersionSlider.removeEventListener("input", this.velocityDispersionCallback.bind(this));
    }

    this.initDefaults = function() {
        this.velocityDispersionDisplay.innerHTML = this.params.velocityDispersion;
        this.velocityDispersionSlider.value = this.params.velocityDispersion;
    }

    this.velocityDispersionCallback = function() {
        this.params.velocityDispersion = this.velocityDispersionSlider.value;
        this.velocityDispersionDisplay.innerHTML = this.params.velocityDispersion;
        this.parameterCallback(this.params);
    }

}

/** Controls for paramaters specific to the NSIS model */
function NSISControls(parameterCallback) {
    this.view = document.getElementById("nsis_controls");
    this.velocityDispersionSlider = this.view.querySelector("#nsis_velocitydispersion_slider");
    this.velocityDispersionDisplay = this.view.querySelector("#nsis_velocitydispersion_value");
    this.angularCoreRadiusSlider = this.view.querySelector("#nsis_angularcoreradius_slider");
    this.angularCoreRadiusDisplay = this.view.querySelector("#nsis_angularcoreradius_value");

    this.params = { velocityDispersion: 0, angularCoreRadius: 0 };
    this.parameterCallback = parameterCallback;

    this.enable = function() {
        this.view.hidden = false;
        this.velocityDispersionSlider.addEventListener("input", this.velocityDispersionCallback.bind(this));
        this.angularCoreRadiusSlider.addEventListener("input", this.angularCoreRadiusCallback.bind(this));
    }

    this.disable = function() {
        this.view.hidden = true;
        this.velocityDispersionSlider.removeEventListener("input", this.velocityDispersionCallback.bind(this));
        this.angularCoreRadiusSlider.removeEventListener("input", this.angularCoreRadiusCallback.bind(this));
    }

    this.initDefaults = function() {
        this.velocityDispersionDisplay.innerHTML = this.params.velocityDispersion;
        this.velocityDispersionSlider.value = this.params.velocityDispersion;
        this.angularCoreRadiusDisplay.innerHTML = this.params.angularCoreRadius;
        this.angularCoreRadiusSlider.value = this.params.angularCoreRadius;
    }

    this.velocityDispersionCallback = function() {
        this.params.velocityDispersion = this.velocityDispersionSlider.value;
        this.velocityDispersionDisplay.innerHTML = this.params.velocityDispersion;
        this.parameterCallback(this.params);
    }

    this.angularCoreRadiusCallback = function() {
        this.params.angularCoreRadius = this.angularCoreRadiusSlider.value;
        this.angularCoreRadiusDisplay.innerHTML = this.params.angularCoreRadius;
        this.parameterCallback(this.params);
    }

}

/** Controls for paramaters specific to the SIE model */
function SIEControls(parameterCallback) {
    this.view = document.getElementById("sie_controls");
    this.velocityDispersionSlider = this.view.querySelector("#sie_velocitydispersion_slider");
    this.velocityDispersionDisplay = this.view.querySelector("#sie_velocitydispersion_value");
    this.ellipticitySlider = this.view.querySelector("#sie_ellipticity_slider");
    this.ellipticityDisplay = this.view.querySelector("#sie_ellipticity_value");

    this.params = { velocityDispersion: 0, ellipticity: 0 };
    this.parameterCallback = parameterCallback;

    this.enable = function() {
        this.view.hidden = false;
        this.velocityDispersionSlider.addEventListener("input", this.velocityDispersionCallback.bind(this));
        this.ellipticitySlider.addEventListener("input", this.ellipticityCallback.bind(this));
    }

    this.disable = function() {
        this.view.hidden = true;
        this.velocityDispersionSlider.removeEventListener("input", this.velocityDispersionCallback.bind(this));
        this.ellipticitySlider.removeEventListener("input", this.ellipticityCallback.bind(this));
    }

    this.initDefaults = function() {
        this.velocityDispersionDisplay.innerHTML = this.params.velocityDispersion;
        this.velocityDispersionSlider.value = this.params.velocityDispersion;
        this.ellipticityDisplay.innerHTML = this.params.ellipticity;
        this.ellipticitySlider.value = this.params.ellipticity;
    }

    this.velocityDispersionCallback = function() {
        this.params.velocityDispersion = this.velocityDispersionSlider.value;
        this.velocityDispersionDisplay.innerHTML = this.params.velocityDispersion;
        this.parameterCallback(this.params);
    }

    this.ellipticityCallback = function() {
        this.params.ellipticity = this.ellipticitySlider.value;
        this.ellipticityDisplay.innerHTML = this.params.ellipticity;
        this.parameterCallback(this.params);
    }

}

/** Controls for paramaters specific to the NSIE model */
function NSIEControls(parameterCallback) {
    this.view = document.getElementById("nsie_controls");
    this.velocityDispersionSlider = this.view.querySelector("#nsie_velocitydispersion_slider");
    this.velocityDispersionDisplay = this.view.querySelector("#nsie_velocitydispersion_value");
    this.ellipticitySlider = this.view.querySelector("#nsie_ellipticity_slider");
    this.ellipticityDisplay = this.view.querySelector("#nsie_ellipticity_value");
    this.angularCoreRadiusSlider = this.view.querySelector("#nsie_angularcoreradius_slider");
    this.angularCoreRadiusDisplay = this.view.querySelector("#nsie_angularcoreradius_value");

    this.params = { velocityDispersion: 0, ellipticity: 0, angularCoreRadius: 0 };
    this.parameterCallback = parameterCallback;

    this.enable = function() {
        this.view.hidden = false;
        this.velocityDispersionSlider.addEventListener("input", this.velocityDispersionCallback.bind(this));
        this.ellipticitySlider.addEventListener("input", this.ellipticityCallback.bind(this));
        this.angularCoreRadiusSlider.addEventListener("input", this.angularCoreRadiusCallback.bind(this));
    }
    
    this.disable = function() {
        this.view.hidden = true;
        this.velocityDispersionSlider.removeEventListener("input", this.velocityDispersionCallback.bind(this));
        this.ellipticitySlider.removeEventListener("input", this.ellipticityCallback.bind(this));
        this.angularCoreRadiusSlider.removeEventListener("input", this.angularCoreRadiusCallback.bind(this));
    }

    this.initDefaults = function() {
        this.velocityDispersionDisplay.innerHTML = this.params.velocityDispersion;
        this.velocityDispersionSlider.value = this.params.velocityDispersion;
        this.ellipticityDisplay.innerHTML = this.params.ellipticity;
        this.ellipticitySlider.value = this.params.ellipticity;
        this.angularCoreRadiusDisplay.innerHTML = this.params.angularCoreRadius;
        this.angularCoreRadiusSlider.value = this.params.angularCoreRadius;
    }

    this.velocityDispersionCallback = function() {
        this.params.velocityDispersion = this.velocityDispersionSlider.value;
        this.velocityDispersionDisplay.innerHTML = this.params.velocityDispersion;
        this.parameterCallback(this.params);
    }

    this.ellipticityCallback = function() {
        this.params.ellipticity = this.ellipticitySlider.value;
        this.ellipticityDisplay.innerHTML = this.params.ellipticity;
        this.parameterCallback(this.params);
    }

    this.angularCoreRadiusCallback = function() {
        this.params.angularCoreRadius = this.angularCoreRadiusSlider.value;
        this.angularCoreRadiusDisplay.innerHTML = this.params.angularCoreRadius;
        this.parameterCallback(this.params);
    }

}

/** Controls for paramaters specific to the mass sheet model */
function MassSheetControls(parameterCallback) {
    this.view = document.getElementById("mass_sheet_controls");
    this.densitySlider = this.view.querySelector("#masssheet_density_slider");
    this.densityDisplay = this.view.querySelector("#masssheet_density_value");

    this.params = { density: 0 };
    this.parameterCallback = parameterCallback;

    this.enable = function() {
        this.view.hidden = false;
        this.densitySlider.addEventListener("input", this.densityCallback.bind(this));
    }

    this.disable = function() {
        this.view.hidden = true;
        this.densitySlider.removeEventListener("input", this.densityCallback.bind(this));
    }

    this.initDefaults = function() {
        this.densityDisplay.innerHTML = this.params.density;
        this.densitySlider.value = this.params.density;
    }

    this.densityCallback = function() {
        this.params.density = this.densitySlider.value;
        this.densityDisplay.innerHTML = this.params.density;
        this.parameterCallback(this.params);
    }

}

/** Controls for the whole simulation. */
function Controls(sim) {
    this.sizePicker = document.getElementById("size_picker");
    this.angularSizeSlider = document.getElementById("angularsize_slider");
    this.angularSizeDisplay = document.getElementById("angularsize_value");
    this.sourcePlaneList = document.getElementById("source_plane_list");
    this.lensRedshiftSlider = document.getElementById("lens_redshift_slider");
    this.lensStrengthDisplay = document.getElementById("lens_strength_value");
    this.lensStrengthSlider = document.getElementById("lens_strength_slider");
    this.lensRedshiftDisplay = document.getElementById("lens_redshift_value");
    this.lensModelPicker = document.getElementById("lens_model_picker");
    this.startSimulationButton = document.getElementById("start_simulation");
    this.sourcePlaneList = document.getElementById("source_plane_list");
    this.addSourcePlaneButton = document.getElementById("add_source_plane");
    this.lensModelParamsList = document.getElementById("lens_params_list");
    this.lensControls = [];
    this.sourcePlaneControls = [];

    this.simulation = sim;
    this.simulationSize;
    this.lensRedshift;
    this.lensModel = GravitationalLens.PLUMMER;

    this.setCallbacks = function() {
        this.sizePicker.addEventListener("change", this.simulationSizeCallback.bind(this));
        this.angularSizeSlider.addEventListener("input", this.angularSizeCallback.bind(this));
        this.lensRedshiftSlider.addEventListener("input", this.lensRedshiftCallback.bind(this));
        this.lensStrengthSlider.addEventListener("input", this.lensStrengthCallback.bind(this));
        this.lensModelPicker.addEventListener("change", this.lensModelCallback.bind(this));
        this.addSourcePlaneButton.addEventListener("click", this.addSourcePlane.bind(this));
        this.startSimulationButton.addEventListener("click", this.startSimulationCallback.bind(this));

        this.lensControls = [
            new PlummerControls(this.lensParameterCallback.bind(this)),
            new SISControls(this.lensParameterCallback.bind(this)),
            new NSISControls(this.lensParameterCallback.bind(this)),
            new SIEControls(this.lensParameterCallback.bind(this)),
            new NSIEControls(this.lensParameterCallback.bind(this)),
            new MassSheetControls(this.lensParameterCallback.bind(this)),
        ];
        this.lensControls[0].enable();

        window.onresize = this.resizeCallback.bind(this);
        Module.onRuntimeInitialized = this.emscriptenCallback.bind(this);
    }

    this.initDefaults = function() {
        this.lensRedshift = this.lensRedshiftSlider.value / 100;
        this.lensRedshiftDisplay.innerHTML = this.lensRedshiftSlider.value / 100;
        this.lensStrengthDisplay.innerHTML = this.lensStrengthSlider.value;
        this.simulationSize = this.sizePicker.value;
        this.angularSizeDisplay.innerHTML = this.angularSizeSlider.value;
        for (let controls of this.lensControls)
            controls.initDefaults();
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

    this.angularSizeCallback = function() {
        this.simulation.setAngularSize(this.angularSizeSlider.value);
        this.angularSizeDisplay.innerHTML = this.angularSizeSlider.value;
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
        this.lensModel = parseInt(this.lensModelPicker.value);
        for (let i = 0; i < this.lensControls.length; i++)
            if (i === this.lensModel-1)
                this.lensControls[i].enable();
            else
                this.lensControls[i].disable();
        this.simulation.setLensModel(this.lensModel, this.lensControls[this.lensModel-1].params);
    }

    this.lensParameterCallback = function(params) {
        this.simulation.setLensModel(this.lensModel, params);
    }

    this.addSourcePlane = function() {
        // Add a new default source plane to the simulation
        var sourcePlane = new SourcePlane(1.5, this.lensRedshift, 0, 0, 128);
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
