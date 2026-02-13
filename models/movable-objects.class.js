class MovableObjects 
{
    x = 120;
    y = 250;
    img;
    height = 150;
    width = 100;
    groundY = 400;
    imageCache = {};
    currentImageIndex = 0;
    speed = 0.15;
    otherDirection = false;

    loadImage(path)
    {
        this.img = new Image();
        this.img.src = path;
    }

    loadImages(arr)
    {
        arr.forEach((path) => {
            let img = new Image();
            img.src = path;
            this.imageCache[path] = img;
        });
    }

    setSize(width, height)
    {
        this.width = width;
        this.height = height;
    }

    alignToGround(groundY = this.groundY)
    {
        this.y = groundY - this.height;
    }
    
    moveRight()
    {
        setInterval(() => {
            this.x += this.speed;
        }, 1000 / 60);
    }

    moveLeft()
    {
        setInterval(() => {
            this.x -= this.speed;
        }, 1000 / 60);
    }
}
