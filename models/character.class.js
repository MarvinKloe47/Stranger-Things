class Character extends MovableObjects 
{

    IMAGES_WALKING = [
        "img/2_character_will/2_walk/W-23.png",
        "img/2_character_will/2_walk/W-24.png",
        "img/2_character_will/2_walk/W-25.png",
        "img/2_character_will/2_walk/W-26.png",
        "img/2_character_will/2_walk/W-27.png",
    ];



    constructor()
    {
        super();
        this.loadImage("img/2_character_will/2_walk/W-23.png");
        this.loadImages(this.IMAGES_WALKING);
        this.setSize(130, 220);
        this.alignToGround();
        this.animate();
    }

    animate() {
        setInterval(() => {
        let i = this.currentImageIndex % this.IMAGES_WALKING.length;
        let path = this.IMAGES_WALKING[i]; 
        this.img = this.imageCache[path]
        this.currentImageIndex++;
        }, 100);
        
    }

    jump() 
    {

    }
}
