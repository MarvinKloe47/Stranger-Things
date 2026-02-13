class Character extends MovableObjects 
{

    IMAGES_WALKING = [
        "img/2_character_will/2_walk/W-23.png",
        "img/2_character_will/2_walk/W-24.png",
        "img/2_character_will/2_walk/W-25.png",
        "img/2_character_will/2_walk/W-26.png",
        "img/2_character_will/2_walk/W-27.png",
    ];

    world;
    currentImageIndex = 0;
    speed = 10;



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
       if (this.world && this.world.keyboard && this.world.keyboard.RIGHT) {
            this.x += this.speed;
            this.otherDirection = false;
        }
        if (this.world && this.world.keyboard && this.world.keyboard.LEFT) {
            this.x -= this.speed;
            this.otherDirection = true;
        }
        this.world.camera_x = -this.x;
    }, 1000 / 30);

        //Walk animation 
        setInterval(() => {
        const isMoving = this.world && this.world.keyboard &&
            (this.world.keyboard.RIGHT || this.world.keyboard.LEFT);

        if (isMoving) {
            let i = this.currentImageIndex % this.IMAGES_WALKING.length;
            let path = this.IMAGES_WALKING[i]; 
            this.img = this.imageCache[path];
            this.currentImageIndex++;
        } else {
            this.img = this.imageCache[this.IMAGES_WALKING[0]];
            this.currentImageIndex = 0;
        }
        }, 100);
        
    }

    jump() 
    {

    }
}
