class Cloud extends MovableObjects

{
    y = 20; 
    height = 250;
    width = 500;
     constructor()
    {
        super();
        this.loadImage("../img/4_clouds/1.png");
        this.x = Math.random() * 500;
    }  
}