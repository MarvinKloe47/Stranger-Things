class Orc extends MovableObjects {
    offset = {
        top: 18,
        right: 34,
        bottom: 10,
        left: 34,
    };

    IMAGES_WALKING = [
        "assets/img/3_enemies_demogorgon/2_enemies_orc/0_Orc_Walking_000.png",
        "assets/img/3_enemies_demogorgon/2_enemies_orc/0_Orc_Walking_001.png",
        "assets/img/3_enemies_demogorgon/2_enemies_orc/0_Orc_Walking_002.png",
        "assets/img/3_enemies_demogorgon/2_enemies_orc/0_Orc_Walking_003.png",
        "assets/img/3_enemies_demogorgon/2_enemies_orc/0_Orc_Walking_004.png",
        "assets/img/3_enemies_demogorgon/2_enemies_orc/0_Orc_Walking_005.png",
        "assets/img/3_enemies_demogorgon/2_enemies_orc/0_Orc_Walking_006.png",
        "assets/img/3_enemies_demogorgon/2_enemies_orc/0_Orc_Walking_007.png",
        "assets/img/3_enemies_demogorgon/2_enemies_orc/0_Orc_Walking_008.png",
        "assets/img/3_enemies_demogorgon/2_enemies_orc/0_Orc_Walking_009.png",
        "assets/img/3_enemies_demogorgon/2_enemies_orc/0_Orc_Walking_010.png",
        "assets/img/3_enemies_demogorgon/2_enemies_orc/0_Orc_Walking_011.png",
        "assets/img/3_enemies_demogorgon/2_enemies_orc/0_Orc_Walking_012.png",
        "assets/img/3_enemies_demogorgon/2_enemies_orc/0_Orc_Walking_013.png",
        "assets/img/3_enemies_demogorgon/2_enemies_orc/0_Orc_Walking_014.png",
        "assets/img/3_enemies_demogorgon/2_enemies_orc/0_Orc_Walking_015.png",
        "assets/img/3_enemies_demogorgon/2_enemies_orc/0_Orc_Walking_016.png",
        "assets/img/3_enemies_demogorgon/2_enemies_orc/0_Orc_Walking_017.png",
        "assets/img/3_enemies_demogorgon/2_enemies_orc/0_Orc_Walking_018.png",
        "assets/img/3_enemies_demogorgon/2_enemies_orc/0_Orc_Walking_019.png",
        "assets/img/3_enemies_demogorgon/2_enemies_orc/0_Orc_Walking_020.png",
        "assets/img/3_enemies_demogorgon/2_enemies_orc/0_Orc_Walking_021.png",
        "assets/img/3_enemies_demogorgon/2_enemies_orc/0_Orc_Walking_022.png",
        "assets/img/3_enemies_demogorgon/2_enemies_orc/0_Orc_Walking_023.png",
    ];

    constructor(x = 500 + Math.random() * 900) {
        super();
        this.loadImage(this.IMAGES_WALKING[0]);
        this.loadImages(this.IMAGES_WALKING);
        this.setSize(110, 130);
        this.x = x;
        this.speed = 0.4 + Math.random() * 0.5;
        this.otherDirection = true;
        this.alignToGround();
        this.animate();
    }

    animate() {
        gameSetInterval(() => {
            this.moveLeft();
        }, 1000 / 60);
        gameSetInterval(() => {
            const i = this.currentImageIndex % this.IMAGES_WALKING.length;
            const path = this.IMAGES_WALKING[i];
            this.img = this.imageCache[path];
            this.currentImageIndex++;
        }, 120);
    }
}
