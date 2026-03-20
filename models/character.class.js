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
        this.setupSprites();
        this.setupDimensions();
        this.applyGravity();
        this.alignToGround();
        this.animate();
    }

    setupSprites() {
        this.loadImage(this.SPRITE_WALK);
        this.loadImages([
            this.SPRITE_WALK,
            ...this.IMAGES_JUMP,
            this.SPRITE_HURT,
            this.SPRITE_DEAD,
            this.SPRITE_ATTACK,
        ]);
    }

    setupDimensions() {
        this.setSize(130, 220);
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
        this.startMovementLoop();
        this.startAnimationLoop();
    }

    startMovementLoop() {
        gameSetInterval(() => this.handleMovementTick(), 1000 / 30);
    }

    startAnimationLoop() {
        gameSetInterval(() => this.handleAnimationTick(), this.frameInterval);
    }

    handleMovementTick() {
        if (this.isDead) return this.handleDeadMovementTick();
        this.applyHorizontalInput();
        this.applyJumpInput();
        this.applyAttackInput();
        this.updateAttackState();
        this.playAttackSoundIfNeeded();
        this.updateCamera();
    }

    handleDeadMovementTick() {
        this.updateAttackState();
        this.updateCamera();
    }

    applyHorizontalInput() {
        if (this.canMoveRight()) return this.moveRight();
        if (this.canMoveLeft()) this.moveLeft();
    }

    canMoveRight() {
        return this.world?.keyboard?.RIGHT && this.x < (this.world?.level?.level_end_x ?? Infinity);
    }

    canMoveLeft() {
        return this.world?.keyboard?.LEFT && this.x > 0;
    }

    moveRight() {
        this.x += this.speed;
        this.otherDirection = false;
    }

    moveLeft() {
        this.x -= this.speed;
        this.otherDirection = true;
    }

    applyJumpInput() {
        if (this.world?.keyboard?.SPACE && !this.isAboveGround()) this.jump();
    }

    applyAttackInput() {
        if (this.world?.keyboard?.D) this.startAttack();
    }

    playAttackSoundIfNeeded() {
        if (this.shouldPlayAttackSound()) this.world?.audioManager?.playAttackSound();
    }

    updateCamera() {
        this.world.camera_x = -this.x;
    }

    handleAnimationTick() {
        const isMoving = this.isMovingHorizontally();
        const isJumping = this.isJumpingNow();
        if (this.isDead) return this.updateDeadAnimationFrame();
        if (this.isAttacking) return this.updateAttackAnimationFrame();
        if (this.isHurt) return this.updateHurtAnimationFrame();
        if (isJumping) return this.updateJumpAnimationFrame();
        this.updateWalkAnimationFrame(isMoving);
    }

    isMovingHorizontally() {
        return this.world?.keyboard && (this.world.keyboard.RIGHT || this.world.keyboard.LEFT);
    }

    isJumpingNow() {
        return this.isAboveGround() || this.speedY > 0;
    }

    updateDeadAnimationFrame() {
        this.activateDeadAnimation();
        if (this.deadAnimationFinished) return;
        if (this.currentFrame < this.frameCount - 1) {
            this.currentFrame++;
            return;
        }
        this.deadAnimationFinished = true;
    }

    updateAttackAnimationFrame() {
        this.activateAttackAnimation();
        this.advanceFrame();
    }

    updateHurtAnimationFrame() {
        this.activateHurtAnimation();
        this.advanceFrame();
    }

    updateJumpAnimationFrame() {
        this.activateJumpAnimation();
        this.advanceFrame();
    }

    updateWalkAnimationFrame(isMoving) {
        this.activateWalkAnimation();
        this.currentFrame = isMoving ? (this.currentFrame + 1) % this.frameCount : 0;
    }

    advanceFrame() {
        this.currentFrame = (this.currentFrame + 1) % this.frameCount;
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
        if (!this.canDraw()) return;
        const metrics = this.getFrameMetrics();
        if (!metrics) return;
        this.drawFrame(ctx, metrics);
    }

    canDraw() {
        return this.img && this.img.complete && this.img.naturalWidth !== 0;
    }

    getFrameMetrics() {
        const frameWidth = this.img.width / this.frameCount;
        const frameHeight = this.img.height;
        if (!frameWidth || !frameHeight) return null;
        return { frameWidth, frameHeight };
    }

    drawFrame(ctx, metrics) {
        ctx.save();
        if (this.otherDirection) this.drawMirroredFrame(ctx, metrics);
        else this.drawNormalFrame(ctx, metrics);
        ctx.restore();
    }

    drawMirroredFrame(ctx, metrics) {
        ctx.translate(this.x + this.width, this.y);
        ctx.scale(-1, 1);
        this.drawImageFrame(ctx, metrics, 0, 0);
    }

    drawNormalFrame(ctx, metrics) {
        this.drawImageFrame(ctx, metrics, this.x, this.y);
    }

    drawImageFrame(ctx, metrics, dx, dy) {
        ctx.drawImage(
            this.img,
            this.currentFrame * metrics.frameWidth,
            0,
            metrics.frameWidth,
            metrics.frameHeight,
            dx,
            dy,
            this.width,
            this.height
        );
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

}
