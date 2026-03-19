/**
 * Base class for drawable objects that can move and be affected by gravity.
 */
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

    /**
     * Applies gravity simulation to this object.
     */
    applyGravity() {
        gameSetInterval(() => {
            if (this.isAboveGround() || this.speedY > 0)  {
                this.y -= this.speedY;
                this.speedY -= this.acceleration;
            } else {
                this.alignToGround();
                this.speedY = 0;
            }
        }, 1000 / 60);
    }

    /**
     * Checks whether the object is above ground.
     * @returns {boolean} True if the object is airborne.
     */
    isAboveGround() {
        return this.y < this.groundY - this.height;
    }

    /**
     * Aligns the object to the given ground line.
     * @param {number} [groundY=this.groundY] Ground y coordinate.
     */
    alignToGround(groundY = this.groundY)
    {
        this.y = groundY - this.height;
    }
    
    /**
     * Moves the object to the right by current speed.
     */
    moveRight()
    {
        this.x += this.speed;
    }

    /**
     * Moves the object to the left by current speed.
     */
    moveLeft()
    {
        this.x -= this.speed;
    }
}
