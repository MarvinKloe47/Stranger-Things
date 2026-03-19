class Endboss extends MovableObjects {
    offset = {
        top: 32,
        right: 72,
        bottom: 20,
        left: 72,
    };

    IMAGES_WALKING = [
        'assets/img/5_endboss/Walk_000.png',
        'assets/img/5_endboss/Walk_001.png',
        'assets/img/5_endboss/Walk_002.png',
        'assets/img/5_endboss/Walk_003.png',
        'assets/img/5_endboss/Walk_004.png',
        'assets/img/5_endboss/Walk_005.png',
        'assets/img/5_endboss/Walk_006.png',
        'assets/img/5_endboss/Walk_007.png',
        'assets/img/5_endboss/Walk_008.png',
        'assets/img/5_endboss/Walk_009.png',
    ];

    IMAGES_IDLE = [
        'assets/img/5_endboss/Idle_000.png',
        'assets/img/5_endboss/Idle_001.png',
        'assets/img/5_endboss/Idle_002.png',
        'assets/img/5_endboss/Idle_003.png',
        'assets/img/5_endboss/Idle_004.png',
        'assets/img/5_endboss/Idle_005.png',
        'assets/img/5_endboss/Idle_006.png',
        'assets/img/5_endboss/Idle_007.png',
        'assets/img/5_endboss/Idle_008.png',
        'assets/img/5_endboss/Idle_009.png',
    ];

    IMAGES_RUN = [
        'assets/img/5_endboss/Run_000.png',
        'assets/img/5_endboss/Run_001.png',
        'assets/img/5_endboss/Run_002.png',
        'assets/img/5_endboss/Run_003.png',
        'assets/img/5_endboss/Run_004.png',
        'assets/img/5_endboss/Run_005.png',
        'assets/img/5_endboss/Run_006.png',
        'assets/img/5_endboss/Run_007.png',
        'assets/img/5_endboss/Run_008.png',
        'assets/img/5_endboss/Run_009.png',
    ];

    IMAGES_ATTACK = [
        'assets/img/5_endboss/Attack_000.png',
        'assets/img/5_endboss/Attack_001.png',
        'assets/img/5_endboss/Attack_002.png',
        'assets/img/5_endboss/Attack_003.png',
        'assets/img/5_endboss/Attack_004.png',
        'assets/img/5_endboss/Attack_005.png',
        'assets/img/5_endboss/Attack_006.png',
        'assets/img/5_endboss/Attack_007.png',
        'assets/img/5_endboss/Attack_008.png',
        'assets/img/5_endboss/Attack_009.png',
    ];

    IMAGES_HURT = [
        'assets/img/5_endboss/Hurt_000.png',
        'assets/img/5_endboss/Hurt_001.png',
        'assets/img/5_endboss/Hurt_002.png',
        'assets/img/5_endboss/Hurt_003.png',
        'assets/img/5_endboss/Hurt_004.png',
        'assets/img/5_endboss/Hurt_005.png',
        'assets/img/5_endboss/Hurt_006.png',
        'assets/img/5_endboss/Hurt_007.png',
        'assets/img/5_endboss/Hurt_008.png',
        'assets/img/5_endboss/Hurt_009.png',
    ];

    IMAGES_DEAD = [
        'assets/img/5_endboss/Dead_000.png',
        'assets/img/5_endboss/Dead_001.png',
        'assets/img/5_endboss/Dead_002.png',
        'assets/img/5_endboss/Dead_003.png',
        'assets/img/5_endboss/Dead_004.png',
        'assets/img/5_endboss/Dead_005.png',
        'assets/img/5_endboss/Dead_006.png',
        'assets/img/5_endboss/Dead_007.png',
        'assets/img/5_endboss/Dead_008.png',
        'assets/img/5_endboss/Dead_009.png',
    ];

    state = 'idle';
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
    attackRange = 220;
    chaseStopDistance = 24;
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

        this.syncFlagsWithState();
        this.animate();
    }

    setState(nextState) {
        if (this.state === 'dead' && nextState !== 'dead') return false;
        if (this.state === nextState) return false;

        this.state = nextState;
        this.currentAnimation = nextState;
        this.currentImageIndex = 0;
        this.syncFlagsWithState();
        return true;
    }

    isState(state) {
        return this.state === state;
    }

    syncFlagsWithState() {
        this.isAwakening = this.state === 'awakening';
        this.isAttacking = this.state === 'attack';
        this.isHurt = this.state === 'hurt';
        this.isDead = this.state === 'dead';

        if (this.isDead) {
            this.isActivated = false;
        }
    }

    animate() {
        gameSetInterval(() => {
            const frames = this.getCurrentFrames();
            const index = this.currentImageIndex % frames.length;
            const path = frames[index];
            this.img = this.imageCache[path];

            if (this.isState('dead')) {
                this.updateDeadAnimation(frames.length);
                return;
            }

            this.currentImageIndex++;
        }, this.animationInterval);
    }

    updateDeadAnimation(frameCount) {
        if (this.deadAnimationFinished) return;

        if (this.currentImageIndex < frameCount - 1) {
            this.currentImageIndex++;
            return;
        }

        this.deadAnimationFinished = true;
    }

    draw(ctx) {
        if (!this.img) return;

        if (this.otherDirection) {
            ctx.save();
            ctx.translate(this.x + this.width / 2, 0);
            ctx.scale(-1, 1);
            ctx.translate(-this.x - this.width / 2, 0);
        }

        ctx.drawImage(this.img, this.x, this.y, this.width, this.height);

        if (this.otherDirection) {
            ctx.restore();
        }
    }

    getCurrentFrames() {
        switch (this.state) {
            case 'dead':
                return this.IMAGES_DEAD;
            case 'hurt':
                return this.IMAGES_HURT;
            case 'attack':
                return this.IMAGES_ATTACK;
            case 'awakening':
                return this.IMAGES_IDLE;
            case 'run':
                return this.IMAGES_RUN;
            case 'idle':
            default:
                return this.IMAGES_IDLE;
        }
    }

    activate() {
        if (this.isActivated || this.isState('awakening') || this.isState('dead')) return;

        this.isActivated = true;
        this.setState('awakening');

        gameSetTimeout(() => {
            if (this.isState('dead')) return;
            this.setState('idle');
        }, 1200);
    }

    updateBehavior(character) {
        if (!this.isActivated) return;
        if (this.isState('awakening') || this.isState('dead') || this.isState('hurt')) return;
        if (this.isState('attack')) return;

        const distanceToCharacter = this.getDistanceToCharacter(character);
        this.otherDirection = distanceToCharacter < 0;

        if (this.isRecovering) {
            this.setState('idle');
            return;
        }

        if (this.shouldAttack(character)) {
            this.attack();
            return;
        }

        this.moveTowardsCharacter(distanceToCharacter);
    }

    moveTowardsCharacter(distanceToCharacter) {
        if (Math.abs(distanceToCharacter) <= this.chaseStopDistance) {
            this.setState('idle');
            return;
        }

        this.setState('run');

        if (distanceToCharacter < 0) {
            this.x -= this.speed;
            return;
        }

        this.x += this.speed;
    }

    shouldAttack(character) {
        if (!this.canAttack()) return false;
        return Math.abs(this.getDistanceToCharacter(character)) <= this.attackRange;
    }

    getDistanceToCharacter(character) {
        const characterCenterX = this.getCharacterCenterX(character);
        const bossCenterX = this.x + this.width / 2;
        return characterCenterX - bossCenterX;
    }

    getCharacterCenterX(character) {
        return character.x + (character.width ?? 0) / 2;
    }

    canAttack() {
        return !this.isRecovering && Date.now() - this.lastAttackTime >= this.attackCooldown;
    }

    attack() {
        if (this.isState('attack') || this.isState('dead') || this.isState('awakening') || this.isRecovering) return;

        this.setState('attack');
        this.lastAttackTime = Date.now();

        gameSetTimeout(() => {
            if (this.isState('dead')) return;

            if (this.isState('attack')) {
                this.setState('idle');
            }

            this.isRecovering = true;

            gameSetTimeout(() => {
                if (this.isState('dead')) return;
                this.isRecovering = false;

                if (!this.isState('hurt') && !this.isState('attack')) {
                    this.setState('idle');
                }
            }, this.recoveryDuration);
        }, this.attackDuration);
    }

    getAttackBox() {
        const attackWidth = 145;
        const attackHeight = this.height - 70;
        const attackY = this.y + 24;
        const attackX = this.otherDirection
            ? this.x - attackWidth + 20
            : this.x + this.width - 20;

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
        if (this.isState('dead') || this.lastPlayerAttackTime === attackTime) return;

        this.lastPlayerAttackTime = attackTime;
        this.energy = Math.max(0, this.energy - damage);
        this.isRecovering = true;

        if (this.energy === 0) {
            this.setState('dead');
            this.isRecovering = false;
            this.deadAnimationFinished = false;
            return;
        }

        this.setState('hurt');

        gameSetTimeout(() => {
            if (this.isState('dead')) return;
            this.isRecovering = false;
            this.setState('idle');
        }, this.hurtDuration);
    }
}