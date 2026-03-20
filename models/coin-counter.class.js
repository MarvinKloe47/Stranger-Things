/**
 * HUD element that displays collected coin count.
 */
class CoinCounter extends DrawableObject {
    ICON = "assets/img/8_collectables/coin counter.png";

    value = 0;
    textOffsetX = 0;
    textOffsetY = -2;

    /**
     * Creates the coin counter and icon position.
     */
    constructor() {
        super();
        this.loadImage(this.ICON);
        this.x = 30;
        this.y = 50;
        this.width = 210;
        this.height = 120;
    }

    /**
     * Updates the displayed coin value.
     * @param {number} value Current coin count.
     */
    setValue(value) {
        this.value = value;
    }

    /**
     * Draws the icon plus centered coin value text.
     * @param {CanvasRenderingContext2D} ctx Render context.
     */
    draw(ctx) {
        super.draw(ctx);
        const { textX, textY } = this.getTextPosition();
        this.drawValue(ctx, textX, textY);
    }

    getTextPosition() {
        return { textX: this.x + this.width / 2 + this.textOffsetX, textY: this.y + this.height / 2 + this.textOffsetY };
    }

    drawValue(ctx, textX, textY) {
        this.applyTextStyle(ctx);
        ctx.strokeText(`${this.value}`, textX, textY);
        ctx.fillText(`${this.value}`, textX, textY);
        ctx.restore();
    }

    applyTextStyle(ctx) {
        ctx.save();
        ctx.fillStyle = "white";
        ctx.strokeStyle = "rgba(0, 0, 0, 0.75)";
        ctx.lineWidth = 4;
        ctx.font = "bold 25px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
    }
}
