/**
 * Moving cloud background element.
 */
class Cloud extends MovableObjects

{
    height = 250;
    width = 500;
   
    /**
     * @param {number} [x=0] Initial x position.
     * @param {number} [y=20] Initial y position.
     */
     constructor(x = 0, y = 20)
    {
        super();
        this.loadImage("assets/img/4_clouds/1.png");
        this.x = x;
        this.y = y;
        this.speed = 0.2;
        this.animate();
    }  

    /**
     * Starts continuous cloud movement.
     */
    animate() {
        gameSetInterval(() => {
            this.moveLeft();
        }, 1000 / 60);
    }

    
}
