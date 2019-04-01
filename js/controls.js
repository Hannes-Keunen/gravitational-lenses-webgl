/** Controls for a single source plane. */
function SourcePlaneControls(view, sourcePlane, simulation, removeCallback) {
    this.redshiftSlider     = view.querySelector("#sourceplane_redshift_slider");
    this.redshiftDisplay    = view.querySelector("#sourceplane_redshift_value");
    this.xSlider            = view.querySelector("#sourceplane_x_slider");
    this.xDisplay           = view.querySelector("#sourceplane_x_value");
    this.ySlider            = view.querySelector("#sourceplane_y_slider");
    this.yDisplay           = view.querySelector("#sourceplane_y_value");
    this.radiusSlider       = view.querySelector("#sourceplane_radius_slider");
    this.radiusDisplay      = view.querySelector("#sourceplane_radius_value");
    this.deleteButton       = view.querySelector("#sourceplane_delete");

    this.sourcePlane        = sourcePlane;
    this.simulation         = simulation;
    this.removeCallback     = removeCallback;

    this.setCallbacks = function() {
        this.redshiftSlider .addEventListener("input", this.redshiftSliderCallback.bind(this));
        this.xSlider        .addEventListener("input", this.xSliderCallback.bind(this));
        this.ySlider        .addEventListener("input", this.ySliderCallback.bind(this));
        this.radiusSlider   .addEventListener("input", this.radiusSliderCallback.bind(this));
        this.deleteButton   .addEventListener("click", this.deleteCallback.bind(this));
    }

    this.initDefaults = function() {
        this.redshiftDisplay.innerHTML  = this.sourcePlane.redshift;
        this.redshiftSlider.value       = this.sourcePlane.redshift * 100;
        this.xDisplay.innerHTML         = this.sourcePlane.x;
        this.xSlider.value              = this.sourcePlane.x;
        this.xDisplay.innerHTML         = this.sourcePlane.y;
        this.ySlider.value              = this.sourcePlane.y;
        this.radiusDisplay.innerHTML    = this.sourcePlane.radius;
        this.radiusSlider.value         = this.sourcePlane.radius * 10;
    }

    this.redshiftSliderCallback = function() {
        this.redshiftDisplay.innerHTML = this.redshiftSlider.value / 100;
        this.sourcePlane.setRedshiftValue(this.redshiftSlider.value / 100, this.simulation.lensPlane.redshift);
    }

    this.xSliderCallback = function() {
        this.sourcePlane.x = this.xSlider.value / 10;
        this.xDisplay.innerHTML = this.sourcePlane.x;
    }

    this.ySliderCallback = function() {
        this.sourcePlane.y = this.ySlider.value / 10;
        this.yDisplay.innerHTML = this.sourcePlane.y;
    }

    this.radiusSliderCallback = function() {
        this.sourcePlane.radius = this.radiusSlider.value / 10;
        this.radiusDisplay.innerHTML = this.sourcePlane.radius;
    }

    this.deleteCallback = function() {
        var index = this.simulation.removeSourcePlane(sourcePlane);
        this.removeCallback(index);
    }

    this.setCallbacks();
    this.initDefaults();
}

/** Controls for parameters specific to the plummer model */
function PlummerControls(view, params) {
    this.massSlider             = view.querySelector("#plummer_mass_slider");
    this.massDisplay            = view.querySelector("#plummer_mass_value");
    this.angularWidthSlider     = view.querySelector("#plummer_angularwidth_slider");
    this.angularWidthDisplay    = view.querySelector("#plummer_angularwidth_value");

    this.params = params;

    this.setCallbacks = function() {
        this.massSlider         .addEventListener("input", this.massCallback.bind(this));
        this.angularWidthSlider .addEventListener("input", this.angularWidthCallback.bind(this));
    }

    this.initDefaults = function() {
        this.massDisplay.innerHTML          = this.params.mass.toExponential(2);
        this.massSlider.value               = this.params.mass;
        this.angularWidthDisplay.innerHTML  = this.params.angularWidth.toFixed(1);
        this.angularWidthSlider.value       = this.params.angularWidth * 10;
    }

    this.massCallback = function() {
        this.params.mass = parseInt(this.massSlider.value);
        this.massDisplay.innerHTML = this.params.mass.toExponential(2);
    }

    this.angularWidthCallback = function() {
        this.params.angularWidth = this.angularWidthSlider.value / 10;
        this.angularWidthDisplay.innerHTML = this.params.angularWidth.toFixed(1);
    }

    this.setCallbacks();
    this.initDefaults();
}

PlummerControls.CreateView = function() {
    return `mass: <span id="plummer_mass_value"></span> solar masses
            <div class="slider-container">
                <input type="range" min="1e13" max="1e15" id="plummer_mass_slider">
            </div>
            angular width: <span id="plummer_angularwidth_value"></span>"
            <div class="slider-container">
                <input type="range" min="1" max="100" id="plummer_angularwidth_slider">
            </div>`
}

/** Controls for paramaters specific to the SIS model */
function SISControls(view, params) {
    this.velocityDispersionSlider   = view.querySelector("#sis_velocitydispersion_slider");
    this.velocityDispersionDisplay  = view.querySelector("#sis_velocitydispersion_value");

    this.params = params;

    this.setCallbacks = function() {
        this.velocityDispersionSlider.addEventListener("input", this.velocityDispersionCallback.bind(this));
    }

    this.initDefaults = function() {
        this.velocityDispersionDisplay.innerHTML    = this.params.velocityDispersion;
        this.velocityDispersionSlider.value         = this.params.velocityDispersion;
    }

    this.velocityDispersionCallback = function() {
        this.params.velocityDispersion = this.velocityDispersionSlider.value;
        this.velocityDispersionDisplay.innerHTML = this.params.velocityDispersion;
    }

    this.setCallbacks();
    this.initDefaults();
}

SISControls.CreateView = function() {
    return `velocity dispersion: <span id="sis_velocitydispersion_value"></span> km/s
            <div class="slider-container">
                <input type="range" min="50" max="500" id="sis_velocitydispersion_slider">
            </div>`
}

/** Controls for paramaters specific to the NSIS model */
function NSISControls(view, params) {
    this.view = document.getElementById("nsis_controls");
    this.velocityDispersionSlider   = view.querySelector("#nsis_velocitydispersion_slider");
    this.velocityDispersionDisplay  = view.querySelector("#nsis_velocitydispersion_value");
    this.angularCoreRadiusSlider    = view.querySelector("#nsis_angularcoreradius_slider");
    this.angularCoreRadiusDisplay   = view.querySelector("#nsis_angularcoreradius_value");

    this.params = params;

    this.setCallbacks = function() {
        this.velocityDispersionSlider   .addEventListener("input", this.velocityDispersionCallback.bind(this));
        this.angularCoreRadiusSlider    .addEventListener("input", this.angularCoreRadiusCallback.bind(this));
    }

    this.initDefaults = function() {
        this.velocityDispersionDisplay.innerHTML    = this.params.velocityDispersion;
        this.velocityDispersionSlider.value         = this.params.velocityDispersion;
        this.angularCoreRadiusDisplay.innerHTML     = this.params.angularCoreRadius;
        this.angularCoreRadiusSlider.value          = this.params.angularCoreRadius * 10;
    }

    this.velocityDispersionCallback = function() {
        this.params.velocityDispersion = this.velocityDispersionSlider.value;
        this.velocityDispersionDisplay.innerHTML = this.params.velocityDispersion;
    }

    this.angularCoreRadiusCallback = function() {
        this.params.angularCoreRadius = this.angularCoreRadiusSlider.value / 10;
        this.angularCoreRadiusDisplay.innerHTML = this.params.angularCoreRadius.toFixed(1);
    }

    this.setCallbacks();
    this.initDefaults();
}

NSISControls.CreateView = function() {
    return `velocity dispersion: <span id="nsis_velocitydispersion_value"></span> km/s
            <div class="slider-container">
                <input type="range" min="50" max="500" id="nsis_velocitydispersion_slider">
            </div>
            angular core radius: <span id="nsis_angularcoreradius_value"></span>"
            <div class="slider-container">
                <input type="range" min="1" max="100" id="nsis_angularcoreradius_slider">
            </div>`
}

/** Controls for paramaters specific to the SIE model */
function SIEControls(view, params) {
    this.velocityDispersionSlider   = view.querySelector("#sie_velocitydispersion_slider");
    this.velocityDispersionDisplay  = view.querySelector("#sie_velocitydispersion_value");
    this.ellipticitySlider          = view.querySelector("#sie_ellipticity_slider");
    this.ellipticityDisplay         = view.querySelector("#sie_ellipticity_value");

    this.params = params;

    this.setCallbacks = function() {
        this.velocityDispersionSlider   .addEventListener("input", this.velocityDispersionCallback.bind(this));
        this.ellipticitySlider          .addEventListener("input", this.ellipticityCallback.bind(this));
    }

    this.initDefaults = function() {
        this.velocityDispersionDisplay.innerHTML    = this.params.velocityDispersion;
        this.velocityDispersionSlider.value         = this.params.velocityDispersion;
        this.ellipticityDisplay.innerHTML           = this.params.ellipticity * 100;
        this.ellipticitySlider.value                = this.params.ellipticity * 100;
    }

    this.velocityDispersionCallback = function() {
        this.params.velocityDispersion = this.velocityDispersionSlider.value;
        this.velocityDispersionDisplay.innerHTML = this.params.velocityDispersion;
    }

    this.ellipticityCallback = function() {
        this.params.ellipticity = this.ellipticitySlider.value / 100;
        this.ellipticityDisplay.innerHTML = this.ellipticitySlider.value;
    }

    this.setCallbacks();
    this.initDefaults();
}

SIEControls.CreateView = function() {
    return `velocity dispersion: <span id="sie_velocitydispersion_value"></span> km/s
            <div class="slider-container">
                <input type="range" min="50" max="500" id="sie_velocitydispersion_slider">
            </div>
            ellipticity: <span id="sie_ellipticity_value"></span> %
            <div class="slider-container">
                <input type="range" min="1" max="99" id="sie_ellipticity_slider">
            </div>`
}

/** Controls for paramaters specific to the NSIE model */
function NSIEControls(view, params) {
    this.velocityDispersionSlider   = view.querySelector("#nsie_velocitydispersion_slider");
    this.velocityDispersionDisplay  = view.querySelector("#nsie_velocitydispersion_value");
    this.ellipticitySlider          = view.querySelector("#nsie_ellipticity_slider");
    this.ellipticityDisplay         = view.querySelector("#nsie_ellipticity_value");
    this.angularCoreRadiusSlider    = view.querySelector("#nsie_angularcoreradius_slider");
    this.angularCoreRadiusDisplay   = view.querySelector("#nsie_angularcoreradius_value");

    this.params = params;

    this.setCallbacks = function() {
        this.velocityDispersionSlider   .addEventListener("input", this.velocityDispersionCallback.bind(this));
        this.ellipticitySlider          .addEventListener("input", this.ellipticityCallback.bind(this));
        this.angularCoreRadiusSlider    .addEventListener("input", this.angularCoreRadiusCallback.bind(this));
    }

    this.initDefaults = function() {
        this.velocityDispersionDisplay.innerHTML    = this.params.velocityDispersion;
        this.velocityDispersionSlider.value         = this.params.velocityDispersion;
        this.ellipticityDisplay.innerHTML           = this.params.ellipticity * 100;
        this.ellipticitySlider.value                = this.params.ellipticity * 100;
        this.angularCoreRadiusDisplay.innerHTML     = this.params.angularCoreRadius.toFixed(1);
        this.angularCoreRadiusSlider.value          = this.params.angularCoreRadius * 10;
    }

    this.velocityDispersionCallback = function() {
        this.params.velocityDispersion = this.velocityDispersionSlider.value;
        this.velocityDispersionDisplay.innerHTML = this.params.velocityDispersion;
    }

    this.ellipticityCallback = function() {
        this.params.ellipticity = this.ellipticitySlider.value / 100;
        this.ellipticityDisplay.innerHTML = this.ellipticitySlider.value;
    }

    this.angularCoreRadiusCallback = function() {
        this.params.angularCoreRadius = this.angularCoreRadiusSlider.value / 10;
        this.angularCoreRadiusDisplay.innerHTML = this.params.angularCoreRadius.toFixed(1);
    }

    this.setCallbacks();
    this.initDefaults();
}

NSIEControls.CreateView = function() {
    return `velocity dispersion: <span id="nsie_velocitydispersion_value"></span> km/s
            <div class="slider-container">
                <input type="range" min="50" max="500" id="nsie_velocitydispersion_slider">
            </div>
            ellipticity: <span id="nsie_ellipticity_value"></span> %
            <div class="slider-container">
                <input type="range" min="1" max="99" id="nsie_ellipticity_slider">
            </div>
            angular core radius: <span id="nsie_angularcoreradius_value"></span>"
            <div class="slider-container">
                <input type="range" min=1 max="100" id="nsie_angularcoreradius_slider">
            </div>`
}

function LensImportControls(view, params) {
    this.fileInput = view.querySelector("#import_file_input");

    this.params = params;

    this.setCallbacks = function() {
        this.fileInput.addEventListener("change", this.fileCallback.bind(this));
    }

    this.fileCallback = function() {
        if (this.fileInput.files.length != 1) return;
        var file = this.fileInput.files[0];
        var reader = new FileReader;
        reader.onloadend = function() {
            var data = new Uint8Array(reader.result);
            Module.FS_createDataFile("/", file.name, data, true, true, true);
            this.params.file = file.name;
        }.bind(this);
        reader.readAsArrayBuffer(this.fileInput.files[0]);
    }

    this.setCallbacks();
}

LensImportControls.CreateView = function() {
    return `file: <input type="file" id="import_file_input">`;
}

/** Controls for paramaters specific to the mass sheet model */
function MassSheetControls(view, params) {
    this.densitySlider  = view.querySelector("#masssheet_density_slider");
    this.densityDisplay = view.querySelector("#masssheet_density_value");

    this.params = params;

    this.setCallbacks = function() {
        this.densitySlider.addEventListener("input", this.densityCallback.bind(this));
    }

    this.initDefaults = function() {
        this.densityDisplay.innerHTML   = this.params.density;
        this.densitySlider.value        = this.params.density;
    }

    this.densityCallback = function() {
        this.params.density = this.densitySlider.value;
        this.densityDisplay.innerHTML = this.params.density;
    }

    this.setCallbacks();
    this.initDefaults();
}

MassSheetControls.CreateView = function() {
    return `density: <span id="masssheet_density_value"></span> kg/m2
            <div class="slider-container">
                <input type="range" min="0" max="120" id="masssheet_density_slider">
            </div>`
}

/** Controls for the common parameters of a single lens plane. */
function LensControls(view, lens, simulation, removeCallback) {
    this.modelNameDisplay       = view.querySelector("#lens_model_name");
    this.strengthDisplay        = view.querySelector("#lens_strength_value");
    this.strengthSlider         = view.querySelector("#lens_strength_slider");
    this.translationXDisplay    = view.querySelector("#lens_translation_x_value");
    this.translationXSlider     = view.querySelector("#lens_translation_x_slider");
    this.translationYDisplay    = view.querySelector("#lens_translation_y_value");
    this.translationYSlider     = view.querySelector("#lens_translation_y_slider");
    this.angleDisplay           = view.querySelector("#lens_angle_value");
    this.angleSlider            = view.querySelector("#lens_angle_slider");
    this.modelParamsContainer   = view.querySelector("#lens_model_params");
    this.deleteButton           = view.querySelector("#lens_delete");
    this.parameterControls;

    this.lens                   = lens;
    this.simulation             = simulation;
    this.removeCallback         = removeCallback;

    switch (this.lens.model) {
        case GravitationalLens.PLUMMER:
            this.modelParamsContainer.innerHTML = PlummerControls.CreateView();
            this.parameterControls = new PlummerControls(this.modelParamsContainer, this.lens.params);
            break;
        case GravitationalLens.SIS:
            this.modelParamsContainer.innerHTML = SISControls.CreateView();
            this.parameterControls = new SISControls(this.modelParamsContainer, this.lens.params);
            break;
        case GravitationalLens.NSIS:
            this.modelParamsContainer.innerHTML = NSISControls.CreateView();
            this.parameterControls = new NSISControls(this.modelParamsContainer, this.lens.params);
            break;
        case GravitationalLens.SIE:
            this.modelParamsContainer.innerHTML = SIEControls.CreateView();
            this.parameterControls = new SIEControls(this.modelParamsContainer, this.lens.params);
            break;
        case GravitationalLens.NSIE:
            this.modelParamsContainer.innerHTML = NSIEControls.CreateView();
            this.parameterControls = new NSIEControls(this.modelParamsContainer, this.lens.params);
            break;
        case GravitationalLens.IMPORT:
            this.modelParamsContainer.innerHTML = LensImportControls.CreateView();
            this.parameterControls = new LensImportControls(this.modelParamsContainer, this.lens.params);
            break;
        default: throw new Error("Unknown lens model: " + this.lens.model);
    }

    this.setCallbacks = function() {
        this.strengthSlider     .addEventListener("input", this.strengthCallback.bind(this));
        this.translationXSlider .addEventListener("input", this.translationXCallback.bind(this));
        this.translationYSlider .addEventListener("input", this.translationYCallback.bind(this));
        this.angleSlider        .addEventListener("input", this.angleCallback.bind(this));
        this.deleteButton       .addEventListener("click", this.deleteCallback.bind(this));
    }

    this.initDefaults = function() {
        this.strengthDisplay.innerHTML      = this.lens.strength;
        this.strengthSlider.value           = this.lens.strength * 10;
        this.translationXDisplay.innerHTML  = this.lens.translationX;
        this.translationXSlider.value       = this.lens.translationX * 10;
        this.translationYDisplay.innerHTML  = this.lens.translationY;
        this.translationYSlider.value       = this.lens.translationY * 10;
        this.angleDisplay.innerHTML         = this.lens.angle;
        this.angleSlider.value              = this.lens.angle;
        this.modelNameDisplay.innerHTML     = GravitationalLens.GetModelName(this.lens.model);
    }

    this.strengthCallback = function() {
        this.lens.strength = this.strengthSlider.value / 10;
        this.strengthDisplay.innerHTML = this.lens.strength;
    }

    this.translationXCallback = function() {
        this.lens.translationX = this.translationXSlider.value / 10;
        this.translationXDisplay.innerHTML = this.lens.translationX;
    }

    this.translationYCallback = function() {
        this.lens.translationY = this.translationYSlider.value / 10;
        this.translationYDisplay.innerHTML = this.lens.translationY;
    }

    this.angleCallback = function() {
        this.lens.angle = this.angleSlider.value;
        this.angleDisplay.innerHTML = this.lens.angle;
    }

    this.deleteCallback = function() {
        var index = simulation.lensPlane.removeLens(this.lens);
        this.removeCallback(index);
    }

    this.setCallbacks();
    this.initDefaults();
}

/** Controls for the whole simulation. */
function Controls(sim) {
    this.sizePicker             = document.getElementById("size_picker");
    this.angularSizeSlider      = document.getElementById("angularsize_slider");
    this.angularSizeDisplay     = document.getElementById("angularsize_value");
    this.sourcePlaneList        = document.getElementById("source_plane_list");

    this.lensRedshiftSlider     = document.getElementById("lens_redshift_slider");
    this.lensRedshiftDisplay    = document.getElementById("lens_redshift_value");
    this.disableButton          = document.getElementById("disable_lenses");
    this.startSimulationButton  = document.getElementById("start_simulation");

    this.lensModelPicker        = document.getElementById("lens_model_picker");
    this.addLensButton          = document.getElementById("add_lens");
    this.lensList               = document.getElementById("lens_list");
    this.lensControls           = [];

    this.addSourcePlaneButton   = document.getElementById("add_source_plane");
    this.sourcePlaneList        = document.getElementById("source_plane_list");
    this.sourcePlaneControls    = [];

    this.simulation             = sim;
    this.simulationSize;
    this.lensesEnabled          = false;
    this.lensRedshift;

    this.setCallbacks = function() {
        this.sizePicker             .addEventListener("change", this.simulationSizeCallback.bind(this));
        this.angularSizeSlider      .addEventListener("input",  this.angularSizeCallback.bind(this));
        this.lensRedshiftSlider     .addEventListener("input",  this.lensRedshiftCallback.bind(this));
        this.disableButton          .addEventListener("click",  this.disableCallback.bind(this));
        this.addLensButton          .addEventListener("click",  this.addLensCallback.bind(this));
        this.addSourcePlaneButton   .addEventListener("click",  this.addSourcePlane.bind(this));
        this.startSimulationButton  .addEventListener("click",  this.startSimulationCallback.bind(this));

        window.onresize = this.resizeCallback.bind(this);
        Module.onRuntimeInitialized = this.emscriptenCallback.bind(this);
    }

    this.initDefaults = function() {
        this.lensRedshiftDisplay.innerHTML  = this.simulation.lensPlane.redshift;
        this.lensRedshiftSlider.value       = this.simulation.lensPlane.redshift * 100;
        this.simulationSize                 = this.sizePicker.value;
        this.angularSizeDisplay.innerHTML   = this.simulation.angularSize;
        this.angularSizeSlider.value        = this.simulation.angularSize;
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
        this.simulation.lensPlane.setRedshiftValue(this.lensRedshiftSlider.value / 100);
        this.lensRedshiftDisplay.innerHTML = this.lensRedshiftSlider.value / 100;
    }

    this.disableCallback = function() {
        if (this.lensesEnabled) {
            this.simulation.disableLensEffect();
            this.disableButton.innerHTML = "enable effect";
            this.lensesEnabled = false;
        } else {
            this.simulation.enableLensEffect();
            this.disableButton.innerHTML = "disable effect";
            this.lensesEnabled = true;
        }
    }

    this.startSimulationCallback = function() {
        sim.start();
    }

    this.addLensCallback = function() {
        // Create a new lens plane
        var lens = new GravitationalLens(parseInt(this.lensModelPicker.value));
        this.simulation.lensPlane.addLens(lens);

        // Create the controls view
        var row = document.createElement("li");
        row.className = "controls-list-item";
        row.innerHTML =
            `Model: <span id="lens_model_name"></span><br>
             Strength: <span id="lens_strength_value"></span>
             <div class="slider-container">
                 <input type="range" min="1" max="100" id="lens_strength_slider">
             </div>
             Translation x: <span id="lens_translation_x_value"></span>"
             <div class="slider-container">
                 <input type="range" min="-300" max="300" id="lens_translation_x_slider">
             </div>
             Translation y: <span id="lens_translation_y_value"></span>"
             <div class="slider-container">
                 <input type="range" min="-300" max="300" id="lens_translation_y_slider">
             </div>
             Angle: <span id="lens_angle_value"></span>°
             <div class="slider-container">
                 <input type="range" min="-90" max="90" id="lens_angle_slider">
             </div>
             <div id="lens_model_params"></div>
             <button id="lens_delete">Delete</button>`
        this.lensList.appendChild(row);

        // Add a controller to the view
        this.lensControls.push(new LensControls(row, lens, this.simulation, this.lensRemoveCallback.bind(this)));
    }

    this.lensRemoveCallback = function(index) {
        this.lensList.removeChild(this.lensList.childNodes[index]);
        this.lensControls.splice(index, 1);
    }

    this.addSourcePlane = function() {
        // Add a new default source plane to the simulation
        var sourcePlane = new SourcePlane(1.5, this.lensRedshift, 0, 0, 5);
        this.simulation.addSourcePlane(sourcePlane);

        // Add controls for the new source plane
        var row = document.createElement("li");
        row.className = "controls-list-item";
        row.innerHTML =
            `Redshift (z): <span id="sourceplane_redshift_value"></span>
             <div class="slider-container">
                <input id="sourceplane_redshift_slider" type="range" min="100" max="300">
             </div>
             Origin x: <span id="sourceplane_x_value">0</span>"
             <div class="slider-container">
                <input id="sourceplane_x_slider" type="range" min="-300" max="300">
             </div>
             Origin y: <span id="sourceplane_y_value">0</span>"
             <div class="slider-container">
                <input id="sourceplane_y_slider" type="range" min="-300" max="300">
             </div>
             Radius: <span id="sourceplane_radius_value"></span>"
             <div class="slider-container">
                <input id="sourceplane_radius_slider" type="range" min="0" max="150">
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
        this.disableButton.disabled = false;
        this.lensesEnabled = true;
        this.simulation.enableLensEffect();
    }

    this.setCallbacks();
    this.initDefaults();
}
