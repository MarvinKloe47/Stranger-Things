class BossStatusBar extends DrawableObject {
    IMAGES = [
        "assets/img/5_endboss/status_bar_orange/0.png",
        "assets/img/5_endboss/status_bar_orange/20.png",
        "assets/img/5_endboss/status_bar_orange/40.png",
        "assets/img/5_endboss/status_bar_orange/60.png",
        "assets/img/5_endboss/status_bar_orange/80.png",
        "assets/img/5_endboss/status_bar_orange/100.png",
    ];

    percentage = 100;

    constructor() {
        super();
        this.loadImages(this.IMAGES);
        this.x = 220;
        this.y = 18;
        this.width = 280;
        this.height = 70;
        this.setPercentage(100);
    }

    setPercentage(percentage) {
        this.percentage = Math.max(0, Math.min(100, percentage));
        this.img = this.imageCache[this.IMAGES[this.resolveImageIndex()]];
    }

    resolveImageIndex() {
        if (this.percentage >= 100) return 5;
        if (this.percentage >= 80) return 4;
        if (this.percentage >= 60) return 3;
        if (this.percentage >= 40) return 2;
        if (this.percentage >= 20) return 1;
        return 0;
    }
}
