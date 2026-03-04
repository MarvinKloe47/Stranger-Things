class demogorgon extends MovableObjects 
{
    IMAGES_WALKING = [
        "img/3_enemies_demogorgon/1_walk/Troll_01_1_WALK_001.png",
        "img/3_enemies_demogorgon/1_walk/Troll_01_1_WALK_002.png",
        "img/3_enemies_demogorgon/1_walk/Troll_01_1_WALK_003.png",
        "img/3_enemies_demogorgon/1_walk/Troll_01_1_WALK_004.png",
        "img/3_enemies_demogorgon/1_walk/Troll_01_1_WALK_005.png",
        "img/3_enemies_demogorgon/1_walk/Troll_01_1_WALK_006.png",
        "img/3_enemies_demogorgon/1_walk/Troll_01_1_WALK_007.png",
        "img/3_enemies_demogorgon/1_walk/Troll_01_1_WALK_008.png",
        "img/3_enemies_demogorgon/1_walk/Troll_01_1_WALK_009.png",
        ];

    
    constructor() {
    super();
    this.loadImage("img/3_enemies_demogorgon/1_walk/Troll_01_1_WALK_001.png");
    this.loadImages(this.IMAGES_WALKING);
    this.setSize(170, 200);
    this.x = 350 + Math.random() * 600;
    this.speed = 0.15 + Math.random() * 0.5;
    this.otherDirection = true; 
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
