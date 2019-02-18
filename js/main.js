function min(val1, val2) {
    return val1 < val2 ? val1 : val2;
}

var sim = null;

window.onload = function() {
    sim = new Simulation("canvas", min(window.innerHeight, window.innerWidth));
}

window.onresize = function() {
    if (sim != null)
        sim.setSize(min(window.innerHeight, window.innerWidth));
}
