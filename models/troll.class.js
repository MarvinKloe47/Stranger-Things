/**
 * Ground enemy that walks from right to left and requires multiple hits.
 */
class Troll extends MovableObjects 
{
    offset = {
        top: 24,
        right: 58,
        bottom: 16,
        left: 58,
    };
    IMAGES_WALKING = [
        "assets/img/3_enemies_troll/1_walk/Troll_01_1_WALK_001.png",
        "assets/img/3_enemies_troll/1_walk/Troll_01_1_WALK_002.png",
        "assets/img/3_enemies_troll/1_walk/Troll_01_1_WALK_003.png",
        "assets/img/3_enemies_troll/1_walk/Troll_01_1_WALK_004.png",
        "assets/img/3_enemies_troll/1_walk/Troll_01_1_WALK_005.png",
        "assets/img/3_enemies_troll/1_walk/Troll_01_1_WALK_006.png",
        "assets/img/3_enemies_troll/1_walk/Troll_01_1_WALK_007.png",
        "assets/img/3_enemies_troll/1_walk/Troll_01_1_WALK_008.png",
        "assets/img/3_enemies_troll/1_walk/Troll_01_1_WALK_009.png",
    ];
    IMAGES_ATTACK = [
        "assets/img/3_enemies_troll/1_walk/Troll_01_1_ATTACK_000.png",
        "assets/img/3_enemies_troll/1_walk/Troll_01_1_ATTACK_001.png",
        "assets/img/3_enemies_troll/1_walk/Troll_01_1_ATTACK_002.png",
        "assets/img/3_enemies_troll/1_walk/Troll_01_1_ATTACK_003.png",
        "assets/img/3_enemies_troll/1_walk/Troll_01_1_ATTACK_006.png",
        "assets/img/3_enemies_troll/1_walk/Troll_01_1_ATTACK_007.png",
        "assets/img/3_enemies_troll/1_walk/Troll_01_1_ATTACK_008.png",
        "assets/img/3_enemies_troll/1_walk/Troll_01_1_ATTACK_009.png",
    ];
    IMAGES_DEAD = [
        "assets/img/3_enemies_troll/1_walk/Troll_01_1_DIE_000.png",
        "assets/img/3_enemies_troll/1_walk/Troll_01_1_DIE_001.png",
        "assets/img/3_enemies_troll/1_walk/Troll_01_1_DIE_002.png",
        "assets/img/3_enemies_troll/1_walk/Troll_01_1_DIE_003.png",
        "assets/img/3_enemies_troll/1_walk/Troll_01_1_DIE_004.png",
        "assets/img/3_enemies_troll/1_walk/Troll_01_1_DIE_005.png",
        "assets/img/3_enemies_troll/1_walk/Troll_01_1_DIE_006.png",
        "assets/img/3_enemies_troll/1_walk/Troll_01_1_DIE_007.png",
        "assets/img/3_enemies_troll/1_walk/Troll_01_1_DIE_008.png",
        "assets/img/3_enemies_troll/1_walk/Troll_01_1_DIE_009.png",
    ];
    remainingHealth = 2;
    maxRemainingHealth = 2;
    state = "walk";
    isAttacking = false;
    isDead = false;
    deadAnimationFinished = false;
    hasAppliedAttackDamage = false;
    lastAttackTime = 0;
    attackStartTime = 0;
    attackCooldown = 1700;
    attackDuration = 650;
    attackRange = 92;
    attackHitWindowStart = 220;
    attackHitWindowEnd = 560;
    animationInterval = 160;

    /**
     * @param {number} [x=700] Initial x position.
     */
    constructor(x = 700) {
        super();
        this.loadImage("assets/img/3_enemies_troll/1_walk/Troll_01_1_WALK_001.png");
        this.loadImages([...this.IMAGES_WALKING, ...this.IMAGES_ATTACK, ...this.IMAGES_DEAD]);
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
            this.updateMovement();
        }, 1000 / 60);

        gameSetInterval(() => {
            this.updateAnimationFrame();
        }, this.animationInterval);
    }

    /**
     * Updates movement and attack intent.
     */
    updateMovement() {
        if (this.isDead || this.isAttacking) return;
        this.tryStartAttack();
        if (this.isAttacking) return;
        this.moveLeft();
    }

    /**
     * Updates sprite frame according to active state.
     */
    updateAnimationFrame() {
        const frames = this.getCurrentFrames();
        const index = this.currentImageIndex % frames.length;
        const path = frames[index];
        this.img = this.imageCache[path];
        if (this.state !== "dead") return this.currentImageIndex++;
        if (this.currentImageIndex < frames.length - 1) return this.currentImageIndex++;
        this.deadAnimationFinished = true;
    }

    /**
     * Returns current frame list by state.
     * @returns {string[]} Active frame list.
     */
    getCurrentFrames() {
        if (this.state === "dead") return this.IMAGES_DEAD;
        if (this.state === "attack") return this.IMAGES_ATTACK;
        return this.IMAGES_WALKING;
    }

    /**
     * Attempts to start an attack when the character is close and cooldown is ready.
     */
    tryStartAttack() {
        if (!this.world?.character || !this.canAttack()) return;
        if (!this.isCharacterInAttackRange()) return;
        this.startAttack();
    }

    /**
     * Checks whether attack cooldown has elapsed.
     * @returns {boolean} True when attack may start.
     */
    canAttack() {
        return Date.now() - this.lastAttackTime >= this.attackCooldown;
    }

    /**
     * Checks whether the player is within attack range.
     * @returns {boolean} True when player center is close enough.
     */
    isCharacterInAttackRange() {
        const characterCenter = this.world.character.x + this.world.character.width / 2;
        const ownCenter = this.x + this.width / 2;
        return Math.abs(characterCenter - ownCenter) <= this.attackRange;
    }

    /**
     * Starts one attack sequence and returns to walking afterward.
     */
    startAttack() {
        this.lastAttackTime = Date.now();
        this.attackStartTime = this.lastAttackTime;
        this.isAttacking = true;
        this.hasAppliedAttackDamage = false;
        this.state = "attack";
        this.currentImageIndex = 0;
        gameSetTimeout(() => this.finishAttack(), this.attackDuration);
    }

    /**
     * Ends the current attack if the enemy is still alive.
     */
    finishAttack() {
        if (this.isDead) return;
        this.isAttacking = false;
        this.attackStartTime = 0;
        this.state = "walk";
        this.currentImageIndex = 0;
    }

    /**
     * Starts death animation sequence.
     */
    startDeathAnimation() {
        this.isDead = true;
        this.isAttacking = false;
        this.state = "dead";
        this.currentImageIndex = 0;
        this.deadAnimationFinished = false;
    }

    /**
     * Returns whether this enemy can be removed after death animation.
     * @returns {boolean} True when death animation is complete.
     */
    shouldBeRemoved() {
        return this.isDead && this.deadAnimationFinished;
    }

    /**
     * Allows exactly one successful damage application per attack sequence.
     * @returns {boolean} True when attack damage may be applied.
     */
    tryConsumeAttackDamage() {
        if (!this.isInAttackHitWindow() || this.hasAppliedAttackDamage) return false;
        this.hasAppliedAttackDamage = true;
        return true;
    }

    /**
     * Checks whether the attack is inside its active damage window.
     * @returns {boolean} True while attack can apply damage.
     */
    isInAttackHitWindow() {
        if (!this.isAttacking || this.attackStartTime === 0) return false;
        const elapsed = Date.now() - this.attackStartTime;
        return elapsed >= this.attackHitWindowStart && elapsed <= this.attackHitWindowEnd;
    }

    /**
     * Builds the troll melee attack collision box.
     * @returns {{x:number,y:number,width:number,height:number,offset:{top:number,right:number,bottom:number,left:number}}}
     */
    getAttackBox() {
        const attackWidth = 68;
        const attackHeight = this.height - 90;
        const attackY = this.y + 32;
        const attackX = this.otherDirection ? this.x - attackWidth + 38 : this.x + this.width - 38;
        return { x: attackX, y: attackY, width: attackWidth, height: attackHeight, offset: { top: 0, right: 0, bottom: 0, left: 0 } };
    }

    /**
     * Applies melee damage and returns whether the troll survives.
     * @param {number} [damage=1] Incoming damage points.
     * @returns {boolean} True while the troll is still alive.
     */
    takeHit(damage = 1) {
        if (this.isDead) return true;
        this.remainingHealth = Math.max(0, this.remainingHealth - damage);
        if (this.remainingHealth > 0) return true;
        this.startDeathAnimation();
        return true;
    }
}

