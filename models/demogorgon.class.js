class demogorgon extends MovableObjects 
{
    constructor()
    {
        super();
        this.loadImage("../img/3_enemies_demogorgon/1_walk/1_w.png");
        this.setSize(170, 200);
        this.x = 350 + Math.random() * 600;
        this.alignToGround();
    }
}
