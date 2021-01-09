const 𝝿 = Math.PI;

function msToText(ms) {
  const h = parseInt(ms / (1000 * 60 * 60)) % 24;
  const m = parseInt(ms / (1000 * 60)) % 60;
  const s = parseInt(ms / 1000) % 60;
  return `${h ? h + "h" : ""} ${m ? m + "m" : ""} ${s ? s + "s" : ""}`;
}
export default class Clock {
  constructor(second) {
    this.start = -0.5 * 𝝿;
    this.end = 1.5 * 𝝿;
    this.time = second * 1000;
    const now = new Date().getTime();
    this.startTime = now;
    this.endTime = now + second * 1000;
    this.rest = this.time;
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
    this.rest = this.endTime - now;
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
    ctx.font = "8vw Do Hyeon";
    ctx.fillStyle = "#cccccc";
    const text = msToText(this.rest);
    const textWidth = ctx.measureText(text).width;
    const textHeight = 0;
    ctx.fillText(
      text,
      (stageWidth - textWidth) / 2,
      (stageHeight - textHeight) / 2
    );
  }
}
