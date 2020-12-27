import Clock from "./clock.js";

export default class App {
  constructor() {
    this.canvas = document.createElement("canvas");
    this.ctx = this.canvas.getContext("2d");
    document.body.appendChild(this.canvas);
    window.addEventListener("resize", this.resize.bind(this));
    window.addEventListener("timeOut", this.endFrame.bind(this));
    this.resize();
  }

  resize() {
    try {
      this.stageWidth = document.body.clientWidth;
      this.stageHeight = document.body.clientHeight;
      this.canvas.width = this.stageWidth * 2;
      this.canvas.height = this.stageHeight * 2;
      this.ctx.scale(2, 2);
    } catch (e) {}
  }

  startFrame(second) {
    this.clock = new Clock(second);
    this.loop = setInterval(this.animate.bind(this), 20);
  }

  endFrame(e) {
    console.log("END", e);
    clearTimeout(this.loop);
  }

  animate(t) {
    this.ctx.clearRect(0, 0, this.stageWidth, this.stageHeight);
    this.clock.draw(this.stageWidth, this.stageHeight, this.ctx);
  }
}
