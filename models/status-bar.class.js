/**
 * Displays the player health bar image based on current percentage.
 */
class StatusBar extends DrawableObject {
    IMAGES = [
        "assets/img/6_statusbar/Purple/0.png",
        "assets/img/6_statusbar/Purple/20.png",
        "assets/img/6_statusbar/Purple/40.png",
        "assets/img/6_statusbar/Purple/60.png",
        "assets/img/6_statusbar/Purple/80.png",
        "assets/img/6_statusbar/Purple/100.png",
    ];

    percentage = 100;

    /**
     * Creates and initializes the player health bar.
     */
    constructor() {
        super();
        this.loadImages(this.IMAGES);
        this.x = 20;
        this.y = 20;
        this.width = 200;
        this.height = 60;
        this.setPercentage(100);
    }

    /**
     * Updates the health percentage and displayed status bar image.
     * @param {number} percentage Current player health percentage.
     */
    setPercentage(percentage) {
        this.percentage = Math.max(0, Math.min(100, percentage));
        this.img = this.imageCache[this.IMAGES[this.resolveImageIndex()]];
    }

    /**
     * Resolves the image index for the current percentage bucket.
     * @returns {number} The image index from 0 to 5.
     */
    resolveImageIndex() {
        if (this.percentage >= 100) return 5;
        if (this.percentage >= 80) return 4;
        if (this.percentage >= 60) return 3;
        if (this.percentage >= 40) return 2;
        if (this.percentage >= 20) return 1;
        return 0;
    }
}
