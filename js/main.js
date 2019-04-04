var sim = null;
var controls = null;
var mouseControls = null;

window.onload = function() {
    sim = new Simulation("canvas", Math.min(window.innerHeight, window.innerWidth), 30);
    controls = new Controls(sim);
    mouseControls = new SourcePlaneMouseControls(sim);
    (function render() {
        if (sim.isReady())
            sim.update();
        window.requestAnimationFrame(render);
    })();
}

window.onunload = function() {
    sim.destroy();
}
