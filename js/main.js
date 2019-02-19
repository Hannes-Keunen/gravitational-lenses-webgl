var sim = null;

window.onload = function() {
    // TODO: configurable simulation size
    sim = new Simulation("canvas", Math.min(window.innerHeight, window.innerWidth));
    (function render() {
        sim.update();
        window.requestAnimationFrame(render);
    })();
}

window.onresize = function() {
    if (sim != null)
        // TODO: configurable simulation size
        sim.setSize(Math.min(window.innerHeight, window.innerWidth));
}
