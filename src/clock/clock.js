const 𝝿 = Math.PI;

export default class Clock {
  constructor(second) {
    this.start = -0.5 * 𝝿;
    this.end = 1.5 * 𝝿;
    this.time = second * 1000;
    const now = new Date().getTime();
    this.startTime = now;
    this.endTime = now + second * 1000;
  }

  update() {
    const now = new Date().getTime();

    if (now >= this.endTime) {
      this.end = -0.5 * 𝝿;
      const event = new Event("timeOut");
      window.dispatchEvent(event);
      return;
    }
    this.end = 1.5 * 𝝿 - (2 * 𝝿 * (now - this.startTime)) / this.time;
  }

  draw(stageWidth, stageHeight, ctx) {
    this.update();
    ctx.beginPath();
    ctx.fillStyle = "#FF3300";
    ctx.arc(
      stageWidth / 2,
      stageHeight / 2,
      stageWidth / 3,
      this.start,
      this.end
    );
    ctx.lineTo(stageWidth / 2, stageHeight / 2);
    ctx.fill();
  }
}
