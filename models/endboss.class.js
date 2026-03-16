class Endboss extends MovableObjects {
    offset = {
        top: 32,
        right: 72,
        bottom: 20,
        left: 72,
    };
    IMAGES_WALKING = [
        'img/5_endboss/Walk_000.png',
        'img/5_endboss/Walk_001.png',
        'img/5_endboss/Walk_002.png',
        'img/5_endboss/Walk_003.png',
        'img/5_endboss/Walk_004.png',   
        'img/5_endboss/Walk_005.png',
        'img/5_endboss/Walk_006.png',
        'img/5_endboss/Walk_007.png',
        'img/5_endboss/Walk_008.png',
        'img/5_endboss/Walk_009.png',
    ];
    IMAGES_IDLE = [
        'img/5_endboss/Idle_000.png',
        'img/5_endboss/Idle_001.png',
        'img/5_endboss/Idle_002.png',
        'img/5_endboss/Idle_003.png',
        'img/5_endboss/Idle_004.png',
        'img/5_endboss/Idle_005.png',
        'img/5_endboss/Idle_006.png',
        'img/5_endboss/Idle_007.png',
        'img/5_endboss/Idle_008.png',
        'img/5_endboss/Idle_009.png',
    ];
    IMAGES_RUN = [
        'img/5_endboss/Run_000.png',
        'img/5_endboss/Run_001.png',
        'img/5_endboss/Run_002.png',
        'img/5_endboss/Run_003.png',
        'img/5_endboss/Run_004.png',
        'img/5_endboss/Run_005.png',
        'img/5_endboss/Run_006.png',
        'img/5_endboss/Run_007.png',
        'img/5_endboss/Run_008.png',
        'img/5_endboss/Run_009.png',
    ];
    IMAGES_ATTACK = [
        'img/5_endboss/Attack_000.png',
        'img/5_endboss/Attack_001.png',
        'img/5_endboss/Attack_002.png',
        'img/5_endboss/Attack_003.png',
        'img/5_endboss/Attack_004.png',
        'img/5_endboss/Attack_005.png',
        'img/5_endboss/Attack_006.png',
        'img/5_endboss/Attack_007.png',
        'img/5_endboss/Attack_008.png',
        'img/5_endboss/Attack_009.png',
    ];
    IMAGES_HURT = [
        'img/5_endboss/Hurt_000.png',
        'img/5_endboss/Hurt_001.png',
        'img/5_endboss/Hurt_002.png',
        'img/5_endboss/Hurt_003.png',
        'img/5_endboss/Hurt_004.png',
        'img/5_endboss/Hurt_005.png',
        'img/5_endboss/Hurt_006.png',
        'img/5_endboss/Hurt_007.png',
        'img/5_endboss/Hurt_008.png',
        'img/5_endboss/Hurt_009.png',
    ];
    IMAGES_DEAD = [
        'img/5_endboss/Dead_000.png',
        'img/5_endboss/Dead_001.png',
        'img/5_endboss/Dead_002.png',
        'img/5_endboss/Dead_003.png',
        'img/5_endboss/Dead_004.png',
        'img/5_endboss/Dead_005.png',
        'img/5_endboss/Dead_006.png',
        'img/5_endboss/Dead_007.png',
        'img/5_endboss/Dead_008.png',
        'img/5_endboss/Dead_009.png',
    ];
    isActivated = false;
    isAwakening = false;
    isAttacking = false;
    isHurt = false;
    isDead = false;
    isRecovering = false;
    deadAnimationFinished = false;
    currentAnimation = 'idle';
    lastAttackTime = 0;
    lastPlayerAttackTime = 0;
    energy = 100;
    attackCooldown = 2600;
    attackDuration = 650;
    attackRange = 120;
    chaseRange = 230;
    retreatRange = 135;
    recoveryDuration = 950;
    hurtDuration = 500;
    animationInterval = 140;

    constructor(x = 2000) {
        super();
        this.loadImage(this.IMAGES_IDLE[0]);
        this.loadImages([
            ...this.IMAGES_IDLE,
            ...this.IMAGES_WALKING,
            ...this.IMAGES_RUN,
            ...this.IMAGES_ATTACK,
            ...this.IMAGES_HURT,
            ...this.IMAGES_DEAD,
        ]);
        this.x = x;
        this.y = 50;
        this.width = 250;
        this.height = 250;
        this.speed = 1.15;
        this.otherDirection = true;
        this.animate();
    }

    animate() {
        gameSetInterval(() => {
            const frames = this.getCurrentFrames();
            const i = this.currentImageIndex % frames.length;
            const path = frames[i];
            this.img = this.imageCache[path];
            if (this.isDead) {
                if (!this.deadAnimationFinished) {
                    if (this.currentImageIndex < frames.length - 1) {
                        this.currentImageIndex++;
                    } else {
                        this.deadAnimationFinished = true;
                    }
                }
                return;
            }

            this.currentImageIndex++;
        }, this.animationInterval);
    }

    getCurrentFrames() {
        if (this.isDead) return this.IMAGES_DEAD;
        if (this.isHurt) return this.IMAGES_HURT;
        if (this.isAttacking) return this.IMAGES_ATTACK;
        if (this.isActivated) return this.IMAGES_RUN;
        return this.IMAGES_IDLE;
    }

    activate() {
        if (this.isActivated || this.isAwakening) return;

        this.isAwakening = true;
        this.currentImageIndex = 0;

        gameSetTimeout(() => {
            this.isAwakening = false;
            this.isActivated = true;
            this.currentAnimation = 'run';
            this.currentImageIndex = 0;
        }, 1200);
    }

    updateBehavior(character) {
        if (!this.isActivated || this.isAwakening || this.isDead || this.isHurt) return;

        const distanceToCharacter = character.x - this.x;
        const absoluteDistance = Math.abs(distanceToCharacter);
        this.otherDirection = distanceToCharacter < 0;

        if (this.isAttacking) return;

        if (this.isRecovering) {
            this.repositionAfterAttack(distanceToCharacter);
            return;
        }

        if (absoluteDistance <= this.attackRange && this.canAttack()) {
            this.attack();
            return;
        }

        if (absoluteDistance < this.retreatRange) {
            this.repositionAfterAttack(distanceToCharacter);
            return;
        }

        if (absoluteDistance <= this.chaseRange) return;

        if (distanceToCharacter < -8) {
            this.x -= this.speed;
        } else if (distanceToCharacter > 8) {
            this.x += this.speed;
        }
    }

    canAttack() {
        return !this.isRecovering && Date.now() - this.lastAttackTime >= this.attackCooldown;
    }

    attack() {
        if (this.isAttacking || this.isDead || this.isRecovering) return;

        this.isAttacking = true;
        this.lastAttackTime = Date.now();
        this.currentImageIndex = 0;

        gameSetTimeout(() => {
            this.isAttacking = false;
            this.isRecovering = true;
            this.currentImageIndex = 0;

            gameSetTimeout(() => {
                this.isRecovering = false;
            }, this.recoveryDuration);
        }, this.attackDuration);
    }

    repositionAfterAttack(distanceToCharacter) {
        const retreatSpeed = this.speed * 0.8;

        if (distanceToCharacter < 0) {
            this.x += retreatSpeed;
        } else {
            this.x -= retreatSpeed;
        }
    }

    getAttackBox() {
        const attackWidth = 90;
        const attackHeight = this.height - 85;
        const attackY = this.y + 35;
        const attackX = this.otherDirection
            ? this.x - attackWidth + 40
            : this.x + this.width - 40;

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

    takeHit(damage = 25, attackTime = 0) {
        if (this.isDead || this.lastPlayerAttackTime === attackTime) return;

        this.lastPlayerAttackTime = attackTime;
        this.energy = Math.max(0, this.energy - damage);
        this.isHurt = true;
        this.isAttacking = false;
        this.isRecovering = true;
        this.currentImageIndex = 0;

        if (this.energy === 0) {
            this.isDead = true;
            this.isActivated = false;
            this.isHurt = false;
            this.isRecovering = false;
            this.currentImageIndex = 0;
            return;
        }

        gameSetTimeout(() => {
            this.isHurt = false;
            this.currentImageIndex = 0;
            this.isRecovering = false;
        }, this.hurtDuration);
    }
}
