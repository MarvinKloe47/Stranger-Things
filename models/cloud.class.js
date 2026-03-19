class Cloud extends MovableObjects

{
    height = 250;
    width = 500;
   
     constructor(x = 0, y = 20)
    {
        super();
        this.loadImage("assets/img/4_clouds/1.png");
        this.x = x;
        this.y = y;
        this.speed = 0.2;
        this.animate();
    }  

    animate() {
        gameSetInterval(() => {
            this.moveLeft();
        }, 1000 / 60);
    }

    
}
