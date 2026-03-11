class DrawableObject {
    x = 120;
    y = 250;
    img;
    height = 150;
    width = 100;
    imageCache = {};
    currentImageIndex = 0;
    otherDirection = false;

    loadImage(path) {
        this.img = new Image();
        this.img.src = path;
    }

    loadImages(arr) {
        arr.forEach((path) => {
            let img = new Image();
            img.src = path;
            this.imageCache[path] = img;
        });
    }

    setSize(width, height) {
        this.width = width;
        this.height = height;
    }

    draw(ctx) {
        if (!this.img) return;

        if (this.otherDirection) {
            ctx.save();
            ctx.translate(this.x + this.width / 2, 0);
            ctx.scale(-1, 1);
            ctx.translate(-this.x - this.width / 2, 0);
        }

        ctx.drawImage(this.img, this.x, this.y, this.width, this.height);

        if (this.otherDirection) {
            ctx.restore();
        }
    }

    drawDebugRect(ctx) {
        if (typeof debugMode === "undefined" || !debugMode) return;

        const hasCollisionBox =
            typeof this.offset !== "undefined" &&
            typeof this.width !== "undefined" &&
            typeof this.height !== "undefined";

        if (!hasCollisionBox) return;

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
