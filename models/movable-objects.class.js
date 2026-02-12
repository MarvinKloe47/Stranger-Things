class MovableObjects 
{
    x = 120;
    y = 250;
    img;
    height = 150;
    width = 100;
    groundY = 400;

    loadImage(path)
    {
        this.img = new Image();
        this.img.src = path;
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
        console.log("move right");
    }

    moveLeft()
    {
        console.log("move left");
    }
}
