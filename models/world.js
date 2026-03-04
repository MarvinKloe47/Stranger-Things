class World {
    constructor(canvas, keyboard) {
        this.ctx = canvas.getContext("2d");
        this.keyboard = keyboard;
        this.worldWidth = this.ctx.canvas.width;
        this.worldHeight = this.ctx.canvas.height;
        this.groundY = this.worldHeight - 20;

        
        this.character = new Character();
        this.level = level1;
        this.enemies = this.level.enemies;
        this.clouds = this.level.clouds;  

        const brightLayers = [
            { path: "img/5_background/bright/Sky.png", y: 0 },
            { path: "img/5_background/bright/City2.png", y: 0 },
            { path: "img/5_background/bright/back.png", y: 0 },
            { path: "img/5_background/bright/houses1.png", y: 0 },
            { path: "img/5_background/bright/houses3.png", y: 0 },
            { path: "img/5_background/bright/minishop&callbox.png", y: 0 },
            { path: "img/5_background/bright/road&lamps.png", y: 0 },
        ];
        this.backgroundObjects = [];
        for (let i = -1; i <= 3; i++) {
            const x = i * this.worldWidth;
            brightLayers.forEach((layer) => {
                this.backgroundObjects.push(
                    new BackgroundObject(layer.path, x, layer.y, this.worldWidth, this.worldHeight)
                );
            });
        }

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
        // If an object provides its own draw(ctx) (e.g. SpriteSheet rendering), use it.
        // This allows SpriteSheets (like Walk.png) to be rendered frame-by-frame.
        if (typeof mo.draw === 'function') {
            mo.draw(this.ctx);
            return;
        }

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
