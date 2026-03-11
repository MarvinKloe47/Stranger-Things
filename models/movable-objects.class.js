class MovableObjects extends DrawableObject
{
    groundY = 400;
    speed = 0.15;
    speedY = 0;
    acceleration = 1; 
    offset = {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
    };

    applyGravity() {
        setInterval(() => {
            if (this.isAboveGround() || this.speedY > 0)  {
                this.y -= this.speedY;
                this.speedY -= this.acceleration;
            } else {
                this.alignToGround();
                this.speedY = 0;
            }
        }, 1000 / 60);
    }
    isAboveGround() {
        return this.y < this.groundY - this.height;
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
