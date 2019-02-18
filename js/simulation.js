function Simulation(canvasID, size) {
    this.canvas = document.getElementById(canvasID);
    this.canvas.width = size;
    this.canvas.height = size;

    this.setSize = function(size) {
        this.canvas.width = size;
        this.canvas.height = size;
    }
}