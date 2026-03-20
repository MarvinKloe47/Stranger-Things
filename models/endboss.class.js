/**
 * Endboss AI with explicit state-driven movement, attacks, and animations.
 */
class Endboss extends MovableObjects {
    offset = {
        top: 32,
        right: 72,
        bottom: 20,
        left: 72,
    };

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
    attackStartedAt = 0;
    nextAttackAllowedAt = 0;
    lastPlayerAttackTime = 0;
    hasAppliedAttackDamage = false;
    maxEnergy = 100;
    energy = 100;

    attackCooldown = 3200;
    attackDuration = 820;
    attackRange = 170;
    attackHitStart = 320;
    attackHitEnd = 610;
    chaseStopDistance = 34;
    recoveryDuration = 950;
    hurtDuration = 500;
    animationInterval = 140;

    /**
     * @param {number} [x=2000] Initial x position.
     */
    constructor(x = 2000) {
        super();
        this.loadImage(this.IMAGES_IDLE[0]);
        this.loadImages([
            ...this.IMAGES_IDLE,
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

    /**
     * Sets the boss state and synchronizes compatibility flags.
     * @param {'idle'|'run'|'attack'|'hurt'|'dead'|'awakening'} nextState Target state.
     * @returns {boolean} True when state changed.
     */
    setState(nextState) {
        if (this.state === 'dead' && nextState !== 'dead') return false;
        if (this.state === nextState) return false;

        this.state = nextState;
        this.currentAnimation = nextState;
        this.currentImageIndex = 0;
        this.syncFlagsWithState();
        return true;
    }

    /**
     * Checks whether the boss is currently in the given state.
     * @param {string} state State to compare.
     * @returns {boolean} True when current state matches.
     */
    isState(state) {
        return this.state === state;
    }

    /**
     * Mirrors explicit state into legacy boolean flags used by other systems.
     */
    syncFlagsWithState() {
        this.isAwakening = this.state === 'awakening';
        this.isAttacking = this.state === 'attack';
        this.isHurt = this.state === 'hurt';
        this.isDead = this.state === 'dead';

        if (this.isDead) {
            this.isActivated = false;
        }
    }

    /**
     * Starts the sprite animation loop.
     */
    animate() {
        gameSetInterval(() => this.animationTick(), this.animationInterval);
    }

/**
* Handles animationTick.
 */
    animationTick() {
        const frames = this.getCurrentFrames();
        this.setFrameImage(frames);
        if (this.isState('dead')) return this.updateDeadAnimation(frames.length);
        this.currentImageIndex++;
    }

/**
* Handles setFrameImage.
 * @param {*} frames
 */
    setFrameImage(frames) {
        const index = this.currentImageIndex % frames.length;
        const path = frames[index];
        this.img = this.imageCache[path];
    }

    /**
     * Advances dead animation until the final frame and marks it as finished.
     * @param {number} frameCount Number of available dead frames.
     */
    updateDeadAnimation(frameCount) {
        if (this.deadAnimationFinished) return;

        if (this.currentImageIndex < frameCount - 1) {
            this.currentImageIndex++;
            return;
        }

        this.deadAnimationFinished = true;
    }

    /**
     * Draws the current boss sprite with optional horizontal mirroring.
     * @param {CanvasRenderingContext2D} ctx Render context.
     */
    draw(ctx) {
        if (!this.img) return;
        const flipped = this.applyMirrorTransform(ctx);
        this.renderFrame(ctx);
        if (flipped) ctx.restore();
    }

/**
* Handles applyMirrorTransform.
 * @param {*} ctx
 */
    applyMirrorTransform(ctx) {
        if (!this.otherDirection) return false;
        ctx.save();
        ctx.translate(this.x + this.width / 2, 0);
        ctx.scale(-1, 1);
        ctx.translate(-this.x - this.width / 2, 0);
        return true;
    }

/**
* Handles renderFrame.
 * @param {*} ctx
 */
    renderFrame(ctx) {
        ctx.drawImage(this.img, this.x, this.y, this.width, this.height);
    }

    /**
     * Returns animation frame set for the current state.
     * @returns {string[]} Frame path list.
     */
    getCurrentFrames() {
        const frames = this.frameMap();
        return frames[this.state] || this.IMAGES_IDLE;
    }

/**
* Handles frameMap.
 */
    frameMap() {
        return { dead: this.IMAGES_DEAD, hurt: this.IMAGES_HURT, attack: this.IMAGES_ATTACK, awakening: this.IMAGES_IDLE, run: this.IMAGES_RUN, idle: this.IMAGES_IDLE };
    }

    /**
     * Activates the encounter and plays awakening state before idle.
     */
    activate() {
        if (this.isActivated || this.isState('awakening') || this.isState('dead')) return;

        this.isActivated = true;
        this.setState('awakening');

        gameSetTimeout(() => {
            if (this.isState('dead')) return;
            this.setState('idle');
        }, 1200);
    }

}
