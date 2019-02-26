var sim = null;
var controls = null;

window.onload = function() {
    sim = new Simulation("canvas", Math.min(window.innerHeight, window.innerWidth));
    controls = new Controls(sim);
    (function render() {
        sim.update();
        window.requestAnimationFrame(render);
    })();
}
