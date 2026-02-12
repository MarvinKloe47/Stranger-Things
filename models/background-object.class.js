class BackgroundObject extends MovableObjects {
    constructor(imagePath, x = 0, y = 0, width = 720, height = 480) {
        super();
        this.loadImage(imagePath);
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }
}
