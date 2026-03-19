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
    lastPlayerAttackTime = 0;
    hasAppliedAttackDamage = false;
    maxEnergy = 100;
    energy = 100;

    attackCooldown = 2600;
    attackDuration = 650;
    attackRange = 220;
    chaseStopDistance = 24;
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

    /**
     * Returns animation frame set for the current state.
     * @returns {string[]} Frame path list.
     */
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

    /**
     * Updates behavior state machine according to player position and current boss state.
     * @param {{x:number, width:number}} character Player character.
     */
    updateBehavior(character) {
        if (!this.isActivated) return;
        if (this.isState('awakening') || this.isState('dead') || this.isState('hurt')) return;
        if (this.isState('attack')) return;

        const distanceToCharacter = this.getDistanceToCharacter(character);
        this.otherDirection = distanceToCharacter < 0;

        if (this.isRecovering) {
            this.moveTowardsCharacter(distanceToCharacter);
            return;
        }

        if (this.shouldAttack(character)) {
            this.attack();
            return;
        }

        this.moveTowardsCharacter(distanceToCharacter);
    }

    /**
     * Moves boss toward the character until stop distance is reached.
     * @param {number} distanceToCharacter Signed center-to-center x distance.
     */
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

    /**
     * Checks whether a new attack should start based on distance and cooldown.
     * @param {{x:number, width:number}} character Player character.
     * @returns {boolean} True when boss should attack.
     */
    shouldAttack(character) {
        if (!this.canAttack()) return false;
        return Math.abs(this.getDistanceToCharacter(character)) <= this.attackRange;
    }

    /**
     * Computes signed x distance from boss center to character center.
     * @param {{x:number, width:number}} character Player character.
     * @returns {number} Signed distance in pixels.
     */
    getDistanceToCharacter(character) {
        const characterCenterX = this.getCharacterCenterX(character);
        const bossCenterX = this.x + this.width / 2;
        return characterCenterX - bossCenterX;
    }

    /**
     * Returns character center x coordinate.
     * @param {{x:number, width?:number}} character Player character.
     * @returns {number} Center x coordinate.
     */
    getCharacterCenterX(character) {
        return character.x + (character.width ?? 0) / 2;
    }

    /**
     * Checks whether attack cooldown and recovery rules allow an attack.
     * @returns {boolean} True when attack is allowed.
     */
    canAttack() {
        return !this.isRecovering && Date.now() - this.lastAttackTime >= this.attackCooldown;
    }

    /**
     * Starts one boss attack sequence with recovery phase.
     */
    attack() {
        if (this.isState('attack') || this.isState('dead') || this.isState('awakening') || this.isRecovering) return;

        this.setState('attack');
        this.lastAttackTime = Date.now();
        this.hasAppliedAttackDamage = false;

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

    /**
     * Allows exactly one successful damage application per attack state.
     * @returns {boolean}
     */
    tryConsumeAttackDamage() {
        if (!this.isState('attack') || this.hasAppliedAttackDamage) return false;
        this.hasAppliedAttackDamage = true;
        return true;
    }

    /**
     * Builds the boss melee attack collision box.
     * @returns {{x:number, y:number, width:number, height:number, offset:{top:number,right:number,bottom:number,left:number}}}
     */
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

    /**
     * Applies incoming damage and handles hurt/death transitions.
     * @param {number} [damage=25] Incoming damage amount.
     * @param {number|string} [attackTime=0] Unique identifier to deduplicate same player attack.
     */
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