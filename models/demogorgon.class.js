/**
 * Ground enemy that walks from right to left and requires multiple hits.
 */
class Demogorgon extends MovableObjects 
{
    offset = {
        top: 24,
        right: 58,
        bottom: 16,
        left: 58,
    };
    IMAGES_WALKING = [
        "assets/img/3_enemies_demogorgon/1_walk/Troll_01_1_WALK_001.png",
        "assets/img/3_enemies_demogorgon/1_walk/Troll_01_1_WALK_002.png",
        "assets/img/3_enemies_demogorgon/1_walk/Troll_01_1_WALK_003.png",
        "assets/img/3_enemies_demogorgon/1_walk/Troll_01_1_WALK_004.png",
        "assets/img/3_enemies_demogorgon/1_walk/Troll_01_1_WALK_005.png",
        "assets/img/3_enemies_demogorgon/1_walk/Troll_01_1_WALK_006.png",
        "assets/img/3_enemies_demogorgon/1_walk/Troll_01_1_WALK_007.png",
        "assets/img/3_enemies_demogorgon/1_walk/Troll_01_1_WALK_008.png",
        "assets/img/3_enemies_demogorgon/1_walk/Troll_01_1_WALK_009.png",
        ];
    remainingHealth = 2;
    maxRemainingHealth = 2;

    /**
     * @param {number} [x=700] Initial x position.
     */
    constructor(x = 700) {
        super();
        this.loadImage("assets/img/3_enemies_demogorgon/1_walk/Troll_01_1_WALK_001.png");
        this.loadImages(this.IMAGES_WALKING);
        this.setSize(170, 200);
        this.x = x;
        this.speed = 0.18 + Math.random() * 0.35;
        this.otherDirection = true;
        this.alignToGround();
        this.animate();
    }


    /**
     * Starts movement and frame animation loops.
     */
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

    /**
     * Applies melee damage and returns whether the demogorgon survives.
     * @param {number} [damage=1] Incoming damage points.
     * @returns {boolean} True while the demogorgon is still alive.
     */
    takeHit(damage = 1) {
        this.remainingHealth = Math.max(0, this.remainingHealth - damage);
        return this.remainingHealth > 0;
    }
}
