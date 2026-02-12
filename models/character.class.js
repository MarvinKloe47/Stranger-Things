class Character extends MovableObjects 
{

    constructor()
    {
        super();
        this.loadImage("../img/2_character_will/2_walk/W-21.png");
        this.setSize(130, 220);
        this.alignToGround();
    }

    jump() 
    {

    }
}
