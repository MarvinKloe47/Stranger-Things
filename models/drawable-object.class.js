/**
 * Base drawable entity with image loading, rendering, and debug box support.
 */
class DrawableObject {
    static debugMode = false;

    x = 120;
    y = 250;
    img;
    height = 150;
    width = 100;
    imageCache = {};
    currentImageIndex = 0;
    otherDirection = false;

    /**
     * Loads a single image and assigns it as current sprite.
     * @param {string} path Image path.
     */
    loadImage(path) {
        this.img = new Image();
        this.img.src = path;
    }

    /**
     * Preloads multiple images into the internal cache.
     * @param {string[]} arr Image paths.
     */
    loadImages(arr) {
        arr.forEach((path) => {
            let img = new Image();
            img.src = path;
            this.imageCache[path] = img;
        });
    }

    /**
     * Updates render size for this object.
     * @param {number} width Render width.
     * @param {number} height Render height.
     */
    setSize(width, height) {
        this.width = width;
        this.height = height;
    }

    /**
     * Draws the current sprite and mirrors it when facing left.
     * @param {CanvasRenderingContext2D} ctx Render context.
     */
    draw(ctx) {
        if (!this.img) return;
        const flipped = this.applyMirrorTransform(ctx);
        this.renderImage(ctx);
        if (flipped) ctx.restore();
    }

    applyMirrorTransform(ctx) {
        if (!this.otherDirection) return false;
        ctx.save();
        ctx.translate(this.x + this.width / 2, 0);
        ctx.scale(-1, 1);
        ctx.translate(-this.x - this.width / 2, 0);
        return true;
    }

    renderImage(ctx) {
        ctx.drawImage(this.img, this.x, this.y, this.width, this.height);
    }

    /**
     * Draws collision debug rectangle when debug mode is enabled.
     * @param {CanvasRenderingContext2D} ctx Render context.
     */
    drawDebugRect(ctx) {
        if (!DrawableObject.debugMode || !this.hasCollisionBox()) return;
        this.drawCollisionBox(ctx);
    }

    hasCollisionBox() {
        return typeof this.offset !== "undefined" && typeof this.width !== "undefined" && typeof this.height !== "undefined";
    }

    drawCollisionBox(ctx) {
        ctx.beginPath();
        ctx.lineWidth = "3";
        ctx.strokeStyle = "blue";
        ctx.rect(
            this.x + this.offset.left,
            this.y + this.offset.top,
            this.width - this.offset.left - this.offset.right,
            this.height - this.offset.top - this.offset.bottom
        );
        ctx.stroke();
    }
}
