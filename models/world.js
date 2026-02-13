class World {
    constructor(canvas, keyboard) {
        this.ctx = canvas.getContext("2d");
        this.keyboard = keyboard;
        this.worldWidth = this.ctx.canvas.width;
        this.worldHeight = this.ctx.canvas.height;
        this.groundY = this.worldHeight - 20;

        this.character = new Character();
        this.enemies = [
            new demogorgon(this.worldWidth + 80),
            new demogorgon(this.worldWidth + 320),
            new demogorgon(this.worldWidth + 560),
        ];
        this.clouds = [
            new Cloud(this.worldWidth),
        ];
        this.backgroundObjects = [
            new BackgroundObject("img/5_background/layers/layer3.png", -720, 0, this.worldWidth, this.worldHeight),
            new BackgroundObject("img/5_background/layers/layer2.png", -720, 80, this.worldWidth, this.worldHeight),
            new BackgroundObject("img/5_background/layers/layer1.png", -720, 80, this.worldWidth, this.worldHeight),

            new BackgroundObject("img/5_background/layers/layer3.png", 0, 0, this.worldWidth, this.worldHeight),
            new BackgroundObject("img/5_background/layers/layer2.png", 0, 80, this.worldWidth, this.worldHeight),
            new BackgroundObject("img/5_background/layers/layer1.png", 0, 80, this.worldWidth, this.worldHeight),
            new BackgroundObject("img/5_background/layers/layer3.png", 720, 0, this.worldWidth, this.worldHeight),
            new BackgroundObject("img/5_background/layers/layer2.png", 720, 80, this.worldWidth, this.worldHeight),
            new BackgroundObject("img/5_background/layers/layer1.png", 720, 80, this.worldWidth, this.worldHeight),

            new BackgroundObject("img/5_background/layers/layer3.png", 720*2, 0, this.worldWidth, this.worldHeight),
            new BackgroundObject("img/5_background/layers/layer2.png", 720*2, 80, this.worldWidth, this.worldHeight),
            new BackgroundObject("img/5_background/layers/layer1.png", 720*2, 80, this.worldWidth, this.worldHeight),

            new BackgroundObject("img/5_background/layers/layer3.png", 720*3, 0, this.worldWidth, this.worldHeight),
            new BackgroundObject("img/5_background/layers/layer2.png", 720*3, 80, this.worldWidth, this.worldHeight),
            new BackgroundObject("img/5_background/layers/layer1.png", 720*3, 80, this.worldWidth, this.worldHeight),
        ];

        this.camera_x = 0;
        this.character.alignToGround(this.groundY);
        this.enemies.forEach((enemy) => enemy.alignToGround(this.groundY));

        this.setWorld();
        this.draw();
    }

    setWorld() {
        this.character.world = this;
    }

    draw() {

        this.ctx.clearRect(0, 0, this.worldWidth, this.worldHeight);

        this.ctx.translate(this.camera_x, 0);

        this.addObjectstoMap(this.backgroundObjects);
        this.clouds.forEach((cloud) => this.addToMap(cloud));
        this.addObjectstoMap(this.enemies);
        this.addToMap(this.character);

        this.ctx.translate(-this.camera_x, 0);

        requestAnimationFrame(() => this.draw());
    }

    addObjectstoMap(objects) {
        objects.forEach((obj) => this.addToMap(obj));
    }

    addToMap(mo) {
        if (mo.otherDirection) {
            this.ctx.save();
            this.ctx.translate(mo.x + mo.width / 2, 0);
            this.ctx.scale(-1, 1);
            this.ctx.translate(-mo.x - mo.width / 2, 0);
        }
        this.ctx.drawImage(mo.img, mo.x, mo.y, mo.width, mo.height);
        if (mo.otherDirection) {
            this.ctx.restore();
        }
    }
}
