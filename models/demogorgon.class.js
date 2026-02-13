class demogorgon extends MovableObjects 
{
    IMAGES_WALKING = [
        "img/3_enemies_demogorgon/1_walk/2_w.png",
        "img/3_enemies_demogorgon/1_walk/3_w.png",
        "img/3_enemies_demogorgon/1_walk/4_w.png",
        ];

    
    constructor()
    {
        super();
        this.loadImage("img/3_enemies_demogorgon/1_walk/2_w.png");
        this.loadImages(this.IMAGES_WALKING);
        this.setSize(170, 200);
        this.x = 350 + Math.random() * 600;
        this.speed = 0.15 + Math.random() * 0.5;
        this.alignToGround();
        this.animate();
        
    }

     animate() {
        this.moveLeft();
        setInterval(() => {
        let i = this.currentImageIndex % this.IMAGES_WALKING.length;
        let path = this.IMAGES_WALKING[i]; 
        this.img = this.imageCache[path]
        this.currentImageIndex++;
        }, 200);
        
    }
}
