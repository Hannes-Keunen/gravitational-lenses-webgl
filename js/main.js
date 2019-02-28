var sim = null;
var controls = null;

window.onload = function() {
    sim = new Simulation("canvas", Math.min(window.innerHeight, window.innerWidth), 120);
    controls = new Controls(sim);
    (function render() {
        if (sim.isReady())
            sim.update();
        window.requestAnimationFrame(render);
    })();
}
