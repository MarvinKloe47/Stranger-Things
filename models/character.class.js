class Character extends MovableObjects {

    world;
    // Bewegung
    speed = 10;

    // SpriteSheet
    SPRITE_WALK = "img/2_character_will/2_walk/Walk.png";
    frameCount = 8;
    currentFrame = 0;
    frameInterval = 100;
    lastFrameTime = 0;

    constructor() {
        super();
        this.loadImage(this.SPRITE_WALK);
        this.setSize(130, 220);
        this.alignToGround();
        this.animate();
    }

    animate() {

        // Bewegung + Kamera
        setInterval(() => {
            if (this.world?.keyboard?.RIGHT && this.x < (this.world?.level?.level_end_x ?? Infinity)) {
                this.x += this.speed;
                this.otherDirection = false;
            }

            if (this.world?.keyboard?.LEFT && this.x > 0) {
                this.x -= this.speed;
                this.otherDirection = true;
            }

            this.world.camera_x = -this.x;
        }, 1000 / 30);

        // Laufanimation (Frames wechseln)
        setInterval(() => {
            const isMoving = this.world?.keyboard &&
                (this.world.keyboard.RIGHT || this.world.keyboard.LEFT);

            if (isMoving) {
                this.currentFrame = (this.currentFrame + 1) % this.frameCount;
            } else {
                this.currentFrame = 0;
            }
        }, this.frameInterval);
    }

    draw(ctx) {
        if (!this.img || !this.img.complete || this.img.naturalWidth === 0) return;

        const frameWidth = this.img.width / this.frameCount;
        const frameHeight = this.img.height;

        if (!frameWidth || !frameHeight) return;

        ctx.save();

        if (this.otherDirection) {
            // Spiegeln nach links
            ctx.translate(this.x + this.width, this.y);
            ctx.scale(-1, 1);

            ctx.drawImage(
                this.img,
                this.currentFrame * frameWidth,
                0,
                frameWidth,
                frameHeight,
                0,
                0,
                this.width,
                this.height
            );
        } else {
            ctx.drawImage(
                this.img,
                this.currentFrame * frameWidth,
                0,
                frameWidth,
                frameHeight,
                this.x,
                this.y,
                this.width,
                this.height
            );
        }

        ctx.restore();
    }

    jump() {
        // später
    }
}
