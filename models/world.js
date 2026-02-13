class World {
    constructor(canvas) {
        this.ctx = canvas.getContext("2d");
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
            new BackgroundObject("img/5_background/layers/layer3.png", 0, 0, this.worldWidth, this.worldHeight),
            new BackgroundObject("img/5_background/layers/layer2.png", 0, 80, this.worldWidth, this.worldHeight),
            new BackgroundObject("img/5_background/layers/layer1.png", 0, 80, this.worldWidth, this.worldHeight),
        ];

        this.character.alignToGround(this.groundY);
        this.enemies.forEach((enemy) => enemy.alignToGround(this.groundY));

        this.draw();
    }

    draw() {
        this.ctx.clearRect(0, 0, this.worldWidth, this.worldHeight);

        this.addObjectstoMap(this.backgroundObjects);
        this.clouds.forEach((cloud) => this.addToMap(cloud));
        this.addObjectstoMap(this.enemies);
        this.addToMap(this.character);

        requestAnimationFrame(() => this.draw());
    }

    addObjectstoMap(objects) {
        objects.forEach((obj) => this.addToMap(obj));
    }

    addToMap(mo) {
        this.ctx.drawImage(mo.img, mo.x, mo.y, mo.width, mo.height);
    }
}
