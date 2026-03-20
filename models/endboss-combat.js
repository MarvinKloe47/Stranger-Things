/**
 * Behavior and combat logic for Endboss.
 */
Endboss.prototype.updateBehavior = function (character) {
    if (!this.isActivated) return;
    if (this.isState("awakening") || this.isState("dead") || this.isState("hurt")) return;
    if (this.isState("attack")) return;

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
};

/**
 * Moves boss toward the character until stop distance is reached.
 * @param {number} distanceToCharacter Signed center-to-center x distance.
 */
Endboss.prototype.moveTowardsCharacter = function (distanceToCharacter) {
    if (Math.abs(distanceToCharacter) <= this.chaseStopDistance) {
        this.setState("idle");
        return;
    }

    this.setState("run");

    if (distanceToCharacter < 0) {
        this.x -= this.speed;
        return;
    }

    this.x += this.speed;
};

/**
 * Checks whether a new attack should start based on distance and cooldown.
 * @param {{x:number, width:number}} character Player character.
 * @returns {boolean} True when boss should attack.
 */
Endboss.prototype.shouldAttack = function (character) {
    if (!this.canAttack()) return false;
    return Math.abs(this.getDistanceToCharacter(character)) <= this.attackRange;
};

/**
 * Computes signed x distance from boss center to character center.
 * @param {{x:number, width:number}} character Player character.
 * @returns {number} Signed distance in pixels.
 */
Endboss.prototype.getDistanceToCharacter = function (character) {
    const characterCenterX = this.getCharacterCenterX(character);
    const bossCenterX = this.x + this.width / 2;
    return characterCenterX - bossCenterX;
};

/**
 * Returns character center x coordinate.
 * @param {{x:number, width?:number}} character Player character.
 * @returns {number} Center x coordinate.
 */
Endboss.prototype.getCharacterCenterX = function (character) {
    return character.x + (character.width ?? 0) / 2;
};

/**
 * Checks whether attack cooldown and recovery rules allow an attack.
 * @returns {boolean} True when attack is allowed.
 */
Endboss.prototype.canAttack = function () {
    return !this.isRecovering && Date.now() >= this.nextAttackAllowedAt;
};

/**
 * Starts one boss attack sequence with recovery phase.
 */
Endboss.prototype.attack = function () {
    if (!this.canStartAttackSequence()) return;
    this.beginAttackSequence();
    gameSetTimeout(() => this.finishAttackSequence(), this.attackDuration);
};

/**
 * Checks whether the boss can begin an attack sequence now.
 * @returns {boolean} True when the attack can begin.
 */
Endboss.prototype.canStartAttackSequence = function () {
    return !this.isState("attack") && !this.isState("dead") && !this.isState("awakening") && !this.isRecovering;
};

/**
 * Initializes attack state and timers.
 */
Endboss.prototype.beginAttackSequence = function () {
    this.setState("attack");
    this.lastAttackTime = Date.now();
    this.attackStartedAt = this.lastAttackTime;
    this.nextAttackAllowedAt = Number.MAX_SAFE_INTEGER;
    this.hasAppliedAttackDamage = false;
};

/**
 * Completes the attack animation and starts recovery.
 */
Endboss.prototype.finishAttackSequence = function () {
    if (this.isState("dead")) return;
    this.resetAttackToIdle();
    this.startRecovery();
};

/**
 * Resets attack state back to idle when appropriate.
 */
Endboss.prototype.resetAttackToIdle = function () {
    if (this.isState("attack")) {
        this.setState("idle");
    }
};

/**
 * Starts recovery timer after an attack.
 */
Endboss.prototype.startRecovery = function () {
    this.isRecovering = true;
    this.nextAttackAllowedAt = Date.now() + this.attackCooldown;
    gameSetTimeout(() => this.finishRecovery(), this.recoveryDuration);
};

/**
 * Finishes recovery and returns to idle when allowed.
 */
Endboss.prototype.finishRecovery = function () {
    if (this.isState("dead")) return;
    this.isRecovering = false;
    if (!this.isState("hurt") && !this.isState("attack")) {
        this.setState("idle");
    }
};

/**
 * Allows exactly one successful damage application per attack state.
 * @returns {boolean}
 */
Endboss.prototype.tryConsumeAttackDamage = function () {
    if (!this.isInAttackHitWindow() || this.hasAppliedAttackDamage) return false;
    this.hasAppliedAttackDamage = true;
    return true;
};

/**
 * Checks whether the attack animation is currently inside its active hit window.
 * @returns {boolean} True when the hitbox should be damaging.
 */
Endboss.prototype.isInAttackHitWindow = function () {
    if (!this.isState("attack")) return false;
    const elapsed = Date.now() - this.attackStartedAt;
    return elapsed >= this.attackHitStart && elapsed <= this.attackHitEnd;
};

/**
 * Checks whether the target is in front of the boss and within attack range.
 * @param {{x:number,width:number}} character Player character.
 * @returns {boolean} True when the target is inside the active attack arc.
 */
Endboss.prototype.isTargetInAttackArc = function (character) {
    const distance = this.getDistanceToCharacter(character);
    if (Math.abs(distance) > this.attackRange) return false;
    return this.otherDirection ? distance < 0 : distance > 0;
};

/**
 * Builds the boss melee attack collision box.
 * @returns {{x:number, y:number, width:number, height:number, offset:{top:number,right:number,bottom:number,left:number}}}
 */
Endboss.prototype.getAttackBox = function () {
    const attackWidth = 96;
    const attackHeight = this.height - 118;
    const attackY = this.y + 72;
    const attackX = this.otherDirection
        ? this.x - attackWidth + 28
        : this.x + this.width - 28;
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
};

/**
 * Applies incoming damage and handles hurt/death transitions.
 * @param {number} [damage=25] Incoming damage amount.
 * @param {number|string} [attackTime=0] Unique identifier to deduplicate same player attack.
 */
Endboss.prototype.takeHit = function (damage = 25, attackTime = 0) {
    if (this.isState("dead") || this.lastPlayerAttackTime === attackTime) return;

    this.lastPlayerAttackTime = attackTime;
    this.energy = Math.max(0, this.energy - damage);
    this.isRecovering = true;

    if (this.energy === 0) {
        this.setState("dead");
        this.isRecovering = false;
        this.deadAnimationFinished = false;
        return;
    }

    this.setState("hurt");

    gameSetTimeout(() => {
        if (this.isState("dead")) return;
        this.isRecovering = false;
        this.setState("idle");
    }, this.hurtDuration);
};
