var sim = null;
var controls = null;
var mouseControls = null;

window.onload = function() {
    sim = new Simulation("canvas", Math.min(window.innerHeight, window.innerWidth), 15);
    controls = new Controls(sim);
    mouseControls = new SourcePlaneMouseControls(sim);
    mouseControls.setMoveCallback(controls.sourcePlaneMoveCallback.bind(controls));
    (function render() {
        if (sim.isReady())
            sim.update();
        window.requestAnimationFrame(render);
    })();
}

window.onunload = function() {
    sim.destroy();
}
