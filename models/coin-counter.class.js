class CoinCounter extends DrawableObject {
    ICON = "assets/img/8_collectables/coin counter.png";

    value = 0;
    textOffsetX = 0;
    textOffsetY = -2;

    constructor() {
        super();
        this.loadImage(this.ICON);
        this.x = 30;
        this.y = 50;
        this.width = 210;
        this.height = 120;
    }

    setValue(value) {
        this.value = value;
    }

    draw(ctx) {
        super.draw(ctx);

        const textX = this.x + this.width / 2 + this.textOffsetX;
        const textY = this.y + this.height / 2 + this.textOffsetY;

        ctx.save();
        ctx.fillStyle = "white";
        ctx.strokeStyle = "rgba(0, 0, 0, 0.75)";
        ctx.lineWidth = 4;
        ctx.font = "bold 25px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.strokeText(`${this.value}`, textX, textY);
        ctx.fillText(`${this.value}`, textX, textY);
        ctx.restore();
    }
}
