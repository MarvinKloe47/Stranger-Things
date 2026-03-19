/**
 * Animated collectible coin object.
 */
class Coin extends DrawableObject {
    IMAGES = [
        "assets/img/8_collectables/coin_1.png",
        "assets/img/8_collectables/coin_2.png",
    ];

    offset = {
        top: 20,
        right: 20,
        bottom: 20,
        left: 20,
    };

    /**
     * @param {number} x Initial x position.
     * @param {number} y Initial y position.
     */
    constructor(x, y) {
        super();
        this.x = x;
        this.y = y;
        this.width = 72;
        this.height = 72;
        this.loadImage(this.IMAGES[0]);
        this.loadImages(this.IMAGES);
        this.animate();
    }

    /**
     * Starts coin spin animation.
     */
    animate() {
        gameSetInterval(() => {
            const imageIndex = this.currentImageIndex % this.IMAGES.length;
            const path = this.IMAGES[imageIndex];
            this.img = this.imageCache[path];
            this.currentImageIndex++;
        }, 250);
    }
}
