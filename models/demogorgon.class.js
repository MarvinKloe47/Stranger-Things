class Demogorgon extends MovableObjects 
{
    offset = {
        top: 24,
        right: 58,
        bottom: 16,
        left: 58,
    };
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

    constructor(x = 700) {
        super();
        this.loadImage("img/3_enemies_demogorgon/1_walk/Troll_01_1_WALK_001.png");
        this.loadImages(this.IMAGES_WALKING);
        this.setSize(170, 200);
        this.x = x;
        this.speed = 0.18 + Math.random() * 0.35;
        this.otherDirection = true;
        this.alignToGround();
        this.animate();
    }


     animate() {
        gameSetInterval(() => {
            this.moveLeft();
        }, 1000 / 60);
        gameSetInterval(() => {
        let i = this.currentImageIndex % this.IMAGES_WALKING.length;
        let path = this.IMAGES_WALKING[i]; 
        this.img = this.imageCache[path]
        this.currentImageIndex++;
        }, 200);
        
    }
}
