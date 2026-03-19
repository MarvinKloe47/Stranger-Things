/**
 * Main playable character with movement, combat, animation, and cooldown states.
 */
class Character extends MovableObjects {

    world;
    offset = {
        top: 28,
        right: 42,
        bottom: 12,
        left: 42,
    };
    
    speed = 10;
    
    yOffset = -30;

    
    energy = 100;
    coins = 0;

    
     isHurt = false;
     isDead = false;
     isAttacking = false;
     lastHit = 0;
     lastAttackTime = 0;
    attackStartTime = 0;
    attackHitWindowStart = 90;
    attackHitWindowEnd = 210;
    attackSoundPlayed = false;
    attackedTargetsInCurrentAttack = new Set();
     specialUnlocked = false;
     specialCooldown = 4500;
     lastSpecialTime = -4500;

   
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

    /**
     * Creates the character, loads sprite assets, and starts animation loops.
     */
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

    /**
     * Aligns the character to ground while applying its configured y offset.
     * @param {number} [groundY=this.groundY] Ground y coordinate.
     */
    alignToGround(groundY = this.groundY) {
        super.alignToGround(groundY - this.yOffset);
    }

    /**
     * Checks if the character is currently airborne.
     * @returns {boolean} True if above ground.
     */
    isAboveGround() {
        return this.y < (this.groundY - this.yOffset - this.height);
    }

    /**
     * Updates y offset and realigns to ground.
     * @param {number} offset Vertical offset from the ground line.
     */
    setYOffset(offset) {
        this.yOffset = offset;
        this.alignToGround();
    }

    /**
     * Starts movement/input and animation frame update loops.
     */
    animate() {

        
        gameSetInterval(() => {
            if (this.isDead) {
                this.updateAttackState();
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
                this.startAttack();
            }

            this.updateAttackState();

            if (this.shouldPlayAttackSound()) {
                this.world?.audioManager?.playAttackSound();
            }

            this.world.camera_x = -this.x;
        }, 1000 / 30);

       
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

    /**
     * Switches to walk animation sprite.
     */
    activateWalkAnimation() {
        if (this.currentAnimation === "walk") return;
        this.img = this.imageCache[this.SPRITE_WALK] || this.img;
        this.frameCount = this.walkFrameCount;
        this.currentFrame = 0;
        this.currentAnimation = "walk";
    }

    /**
     * Switches to jump animation sprite.
     */
    activateJumpAnimation() {
        if (this.currentAnimation === "jump") return;
        const jumpSprite = this.IMAGES_JUMP[0];
        this.img = this.imageCache[jumpSprite] || this.img;
        this.frameCount = this.jumpFrameCount;
        this.currentFrame = 0;
        this.currentAnimation = "jump";
    }

    /**
     * Switches to hurt animation sprite.
     */
    activateHurtAnimation() {
        if (this.currentAnimation === "hurt") return;
        this.img = this.imageCache[this.SPRITE_HURT] || this.img;
        this.frameCount = this.hurtFrameCount;
        this.currentFrame = 0;
        this.currentAnimation = "hurt";
    }

    /**
     * Switches to dead animation sprite.
     */
    activateDeadAnimation() {
        if (this.currentAnimation === "dead") return;
        this.img = this.imageCache[this.SPRITE_DEAD] || this.img;
        this.frameCount = this.deadFrameCount;
        this.currentFrame = 0;
        this.currentAnimation = "dead";
    }

    /**
     * Switches to attack animation sprite.
     */
    activateAttackAnimation() {
        if (this.currentAnimation === "attack") return;
        this.img = this.imageCache[this.SPRITE_ATTACK] || this.img;
        this.frameCount = this.attackFrameCount;
        this.currentFrame = 0;
        this.currentAnimation = "attack";
    }

    /**
     * Draws the current character frame, including horizontal flip when facing left.
     * @param {CanvasRenderingContext2D} ctx Render context.
     */
    draw(ctx) {
        if (!this.img || !this.img.complete || this.img.naturalWidth === 0) return;

        const frameWidth = this.img.width / this.frameCount;
        const frameHeight = this.img.height;

        if (!frameWidth || !frameHeight) return;

        ctx.save();

        if (this.otherDirection) {
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

    /**
     * Triggers a jump impulse and jump sound.
     */
    jump() {
        this.speedY = 20;
        this.world?.audioManager?.playJumpSound();
    }

    /**
     * Backward-compatible attack entry point.
     */
    attack() {
        this.startAttack();
    }

    /**
     * Starts a new melee attack if the character is allowed to attack.
     * Initializes the full combat state for one attack lifecycle.
     * @returns {boolean} True when the attack was started.
     */
    startAttack() {
        if (!this.canStartAttack()) return false;

        const now = Date.now();
        this.isAttacking = true;
        this.lastAttackTime = now;
        this.attackStartTime = now;
        this.attackSoundPlayed = false;
        this.attackedTargetsInCurrentAttack.clear();
        this.currentFrame = 0;
        this.activateAttackAnimation();
        return true;
    }

    /**
     * Checks whether a new attack can be started.
     * @returns {boolean} True if dead/state/cooldown checks pass.
     */
    canStartAttack() {
        return !this.isDead && !this.isAttacking && this.canAttack();
    }

    /**
     * Advances the attack lifecycle based on elapsed time.
     * Handles clean reset when the character dies or the attack duration ends.
     */
    updateAttackState() {
        if (!this.isAttacking) return;

        if (this.isDead) {
            this.resetAttackState();
            return;
        }

        const elapsed = Date.now() - this.attackStartTime;
        if (elapsed >= this.attackDuration) {
            this.resetAttackState();
        }
    }

    /**
     * Returns whether the current attack is inside its active damage window.
     * @returns {boolean} True while the hit window is active.
     */
    isInAttackHitWindow() {
        if (!this.isAttacking) return false;
        const elapsed = Date.now() - this.attackStartTime;
        return elapsed >= this.attackHitWindowStart && elapsed <= this.attackHitWindowEnd;
    }

    /**
     * Emits a one-time sound signal during the active hit window.
     * The method does not play audio itself; it only exposes the signal.
     * @returns {boolean} True exactly once per attack in the hit window.
     */
    shouldPlayAttackSound() {
        if (this.attackSoundPlayed || !this.isInAttackHitWindow()) return false;
        this.attackSoundPlayed = true;
        return true;
    }

    /**
     * Resets all transient attack state fields.
     */
    resetAttackState() {
        this.isAttacking = false;
        this.attackStartTime = 0;
        this.attackSoundPlayed = false;
        this.attackedTargetsInCurrentAttack.clear();
    }

    /**
     * Checks whether a target was already hit in the current attack lifecycle.
     * @param {Object} target The collision target reference.
     * @returns {boolean} True if the target has already been hit.
     */
    hasHitTargetInCurrentAttack(target) {
        return this.attackedTargetsInCurrentAttack.has(target);
    }

    /**
     * Marks a target as hit for the current attack lifecycle.
     * @param {Object} target The collision target reference.
     */
    markTargetHitInCurrentAttack(target) {
        this.attackedTargetsInCurrentAttack.add(target);
    }

    /**
     * Checks whether the attack cooldown has elapsed.
     * @returns {boolean} True if a new attack can be triggered.
     */
    canAttack() {
        return Date.now() - this.lastAttackTime >= this.attackCooldown;
    }

    /**
     * Returns normalized attack cooldown progress.
     * @returns {number} Value between 0 and 1.
     */
    getAttackCooldownProgress() {
        const elapsed = Date.now() - this.lastAttackTime;
        return Math.max(0, Math.min(1, elapsed / this.attackCooldown));
    }

    /**
     * Checks if the character can currently use the special ability.
     * @returns {boolean} True if unlocked and cooldown is ready.
     */
    canUseSpecial() {
        return this.specialUnlocked && !this.isDead && Date.now() - this.lastSpecialTime >= this.specialCooldown;
    }

    /**
     * Attempts to activate the special ability and start its cooldown.
     * @returns {boolean} True when the special was activated.
     */
    activateSpecial() {
        if (!this.canUseSpecial()) return false;

        this.lastSpecialTime = Date.now();
        return true;
    }

    /**
     * Returns normalized special cooldown progress.
     * @returns {number} Value between 0 and 1.
     */
    getSpecialCooldownProgress() {
        if (!this.specialUnlocked) return 0;

        const elapsed = Date.now() - this.lastSpecialTime;
        return Math.max(0, Math.min(1, elapsed / this.specialCooldown));
    }

    /**
     * Builds the active melee attack collision box.
     * @returns {{x:number, y:number, width:number, height:number, offset:{top:number,right:number,bottom:number,left:number}}}
     */
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
