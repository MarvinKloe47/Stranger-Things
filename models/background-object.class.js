/**
 * Represents a static background image layer in the level.
 */
class BackgroundObject extends MovableObjects {
    /**
     * @param {string} imagePath Path to the background image.
     * @param {number} [x=0] Initial x position.
     * @param {number} [y=0] Initial y position.
     * @param {number} [width=720] Render width.
     * @param {number} [height=480] Render height.
     * @param {number} [opacity=1] Optional opacity value for layered rendering.
     */
    constructor(imagePath, x = 0, y = 0, width = 720, height = 480, opacity = 1) {
        super();
        this.loadImage(imagePath);
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.opacity = opacity;
    }
}
