class Character extends MovableObjects {

    world;
    offset = {
        top: 28,
        right: 42,
        bottom: 12,
        left: 42,
    };
    // Bewegung
    speed = 10;
    // Positive Werte verschieben den Character nach oben, negative nach unten.
    yOffset = -30;

    //Lebensenergie
    energy = 100;
    coins = 0;

     // Status
     isHurt = false;
     isDead = false;
     isAttacking = false;
     lastHit = 0;
     lastAttackTime = 0;
     specialUnlocked = false;
     specialCooldown = 4500;
     lastSpecialTime = -4500;

    // SpriteSheets
    SPRITE_WALK = "assets/img/2_character_will/2_walk/Walk.png";
    IMAGES_JUMP = ["assets/img/2_character_will/3_jump/Jump.png"];
    SPRITE_HURT = "assets/img/2_character_will/4_hurt/Hurt.png";
    SPRITE_DEAD = "assets/img/2_character_will/5_dead/Dead.png";
    SPRITE_ATTACK = "assets/img/2_character_will/6_attack/Attack_1.png";
    walkFrameCount = 8;
    jumpFrameCount = 12;
    hurtFrameCount = 2;
    deadFrameCount = 4;
    attackFrameCount = 5;
    frameCount = this.walkFrameCount;
    currentFrame = 0;
    frameInterval = 100;
    lastFrameTime = 0;
    currentAnimation = "walk";
    deadAnimationFinished = false;
    attackDuration = 300;
    attackCooldown = 900;

    constructor() {
        super();
        this.loadImage(this.SPRITE_WALK);
        this.loadImages([
            this.SPRITE_WALK,
            ...this.IMAGES_JUMP,
            this.SPRITE_HURT,
            this.SPRITE_DEAD,
            this.SPRITE_ATTACK,
        ]);
        this.setSize(130, 220);
        this.applyGravity();
        this.alignToGround();

        this.animate();
    }

    alignToGround(groundY = this.groundY) {
        super.alignToGround(groundY - this.yOffset);
    }

    isAboveGround() {
        return this.y < (this.groundY - this.yOffset - this.height);
    }

    setYOffset(offset) {
        this.yOffset = offset;
        this.alignToGround();
    }

    animate() {

        // Bewegung + Kamera
        gameSetInterval(() => {
            if (this.isDead) {
                this.world.camera_x = -this.x;
                return;
            }

            if (this.world?.keyboard?.RIGHT && this.x < (this.world?.level?.level_end_x ?? Infinity)) {
                this.x += this.speed;
                this.otherDirection = false;
            }

            if (this.world?.keyboard?.LEFT && this.x > 0) {
                this.x -= this.speed;
                this.otherDirection = true;
            }

            if (this.world?.keyboard?.SPACE && !this.isAboveGround()) {
                this.jump();
            }

            if (this.world?.keyboard?.D) {
                this.attack();
            }

            this.world.camera_x = -this.x;
        }, 1000 / 30);

        // Laufanimation (Frames wechseln)
        gameSetInterval(() => {
            const isMoving = this.world?.keyboard &&
                (this.world.keyboard.RIGHT || this.world.keyboard.LEFT);
            const isJumping = this.isAboveGround() || this.speedY > 0;

            if (this.isDead) {
                this.activateDeadAnimation();
                if (!this.deadAnimationFinished) {
                    if (this.currentFrame < this.frameCount - 1) {
                        this.currentFrame++;
                    } else {
                        this.deadAnimationFinished = true;
                    }
                }
            } else if (this.isAttacking) {
                this.activateAttackAnimation();
                this.currentFrame = (this.currentFrame + 1) % this.frameCount;
            } else if (this.isHurt) {
                this.activateHurtAnimation();
                this.currentFrame = (this.currentFrame + 1) % this.frameCount;
            } else if (isJumping) {
                this.activateJumpAnimation();
                this.currentFrame = (this.currentFrame + 1) % this.frameCount;
            } else {
                this.activateWalkAnimation();
                if (isMoving) {
                    this.currentFrame = (this.currentFrame + 1) % this.frameCount;
                } else {
                    this.currentFrame = 0;
                }
            }
        }, this.frameInterval);
    }

    activateWalkAnimation() {
        if (this.currentAnimation === "walk") return;
        this.img = this.imageCache[this.SPRITE_WALK] || this.img;
        this.frameCount = this.walkFrameCount;
        this.currentFrame = 0;
        this.currentAnimation = "walk";
    }

    activateJumpAnimation() {
        if (this.currentAnimation === "jump") return;
        const jumpSprite = this.IMAGES_JUMP[0];
        this.img = this.imageCache[jumpSprite] || this.img;
        this.frameCount = this.jumpFrameCount;
        this.currentFrame = 0;
        this.currentAnimation = "jump";
    }

    activateHurtAnimation() {
        if (this.currentAnimation === "hurt") return;
        this.img = this.imageCache[this.SPRITE_HURT] || this.img;
        this.frameCount = this.hurtFrameCount;
        this.currentFrame = 0;
        this.currentAnimation = "hurt";
    }

    activateDeadAnimation() {
        if (this.currentAnimation === "dead") return;
        this.img = this.imageCache[this.SPRITE_DEAD] || this.img;
        this.frameCount = this.deadFrameCount;
        this.currentFrame = 0;
        this.currentAnimation = "dead";
    }

    activateAttackAnimation() {
        if (this.currentAnimation === "attack") return;
        this.img = this.imageCache[this.SPRITE_ATTACK] || this.img;
        this.frameCount = this.attackFrameCount;
        this.currentFrame = 0;
        this.currentAnimation = "attack";
    }

    draw(ctx) {
        if (!this.img || !this.img.complete || this.img.naturalWidth === 0) return;

        const frameWidth = this.img.width / this.frameCount;
        const frameHeight = this.img.height;

        if (!frameWidth || !frameHeight) return;

        ctx.save();

        if (this.otherDirection) {
            // Spiegeln nach links
            ctx.translate(this.x + this.width, this.y);
            ctx.scale(-1, 1);

            ctx.drawImage(
                this.img,
                this.currentFrame * frameWidth,
                0,
                frameWidth,
                frameHeight,
                0,
                0,
                this.width,
                this.height
            );
        } else {
            ctx.drawImage(
                this.img,
                this.currentFrame * frameWidth,
                0,
                frameWidth,
                frameHeight,
                this.x,
                this.y,
                this.width,
                this.height
            );
        }

        ctx.restore();
    }

    jump() {
        this.speedY = 20;
        this.world?.audioManager?.playJumpSound();
    }

    attack() {
        if (this.isDead || this.isAttacking || !this.canAttack()) return;

        this.isAttacking = true;
        this.lastAttackTime = Date.now();
        this.currentFrame = 0;
        this.world?.audioManager?.playAttackSound();

        gameSetTimeout(() => {
            this.isAttacking = false;
        }, this.attackDuration);
    }

    canAttack() {
        return Date.now() - this.lastAttackTime >= this.attackCooldown;
    }

    getAttackCooldownProgress() {
        const elapsed = Date.now() - this.lastAttackTime;
        return Math.max(0, Math.min(1, elapsed / this.attackCooldown));
    }

    canUseSpecial() {
        return this.specialUnlocked && !this.isDead && Date.now() - this.lastSpecialTime >= this.specialCooldown;
    }

    activateSpecial() {
        if (!this.canUseSpecial()) return false;

        this.lastSpecialTime = Date.now();
        return true;
    }

    getSpecialCooldownProgress() {
        if (!this.specialUnlocked) return 0;

        const elapsed = Date.now() - this.lastSpecialTime;
        return Math.max(0, Math.min(1, elapsed / this.specialCooldown));
    }

    getAttackBox() {
        const attackWidth = 42;
        const attackHeight = this.height - 90;
        const attackY = this.y + 40;
        const attackX = this.otherDirection
            ? this.x - attackWidth + 26
            : this.x + this.width - 26;

        return {
            x: attackX,
            y: attackY,
            width: attackWidth,
            height: attackHeight,
            offset: {
                top: 0,
                right: 0,
                bottom: 0,
                left: 0,
            },
        };
    }
}
