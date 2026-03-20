/**
 * Combat and cooldown logic for Character.
 */
Character.prototype.startAttack = function () {
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
};

/**
 * Checks whether a new attack can be started.
 * @returns {boolean} True if dead/state/cooldown checks pass.
 */
Character.prototype.canStartAttack = function () {
    return !this.isDead && !this.isAttacking && this.canAttack();
};

/**
 * Advances the attack lifecycle based on elapsed time.
 * Handles clean reset when the character dies or the attack duration ends.
 */
Character.prototype.updateAttackState = function () {
    if (!this.isAttacking) return;

    if (this.isDead) {
        this.resetAttackState();
        return;
    }

    const elapsed = Date.now() - this.attackStartTime;
    if (elapsed >= this.attackDuration) {
        this.resetAttackState();
    }
};

/**
 * Returns whether the current attack is inside its active damage window.
 * @returns {boolean} True while the hit window is active.
 */
Character.prototype.isInAttackHitWindow = function () {
    if (!this.isAttacking) return false;
    const elapsed = Date.now() - this.attackStartTime;
    return elapsed >= this.attackHitWindowStart && elapsed <= this.attackHitWindowEnd;
};

/**
 * Emits a one-time sound signal during the active hit window.
 * The method does not play audio itself; it only exposes the signal.
 * @returns {boolean} True exactly once per attack in the hit window.
 */
Character.prototype.shouldPlayAttackSound = function () {
    if (this.attackSoundPlayed || !this.isInAttackHitWindow()) return false;
    this.attackSoundPlayed = true;
    return true;
};

/**
 * Resets all transient attack state fields.
 */
Character.prototype.resetAttackState = function () {
    this.isAttacking = false;
    this.attackStartTime = 0;
    this.attackSoundPlayed = false;
    this.attackedTargetsInCurrentAttack.clear();
};

/**
 * Checks whether a target was already hit in the current attack lifecycle.
 * @param {Object} target The collision target reference.
 * @returns {boolean} True if the target has already been hit.
 */
Character.prototype.hasHitTargetInCurrentAttack = function (target) {
    return this.attackedTargetsInCurrentAttack.has(target);
};

/**
 * Marks a target as hit for the current attack lifecycle.
 * @param {Object} target The collision target reference.
 */
Character.prototype.markTargetHitInCurrentAttack = function (target) {
    this.attackedTargetsInCurrentAttack.add(target);
};

/**
 * Checks whether the attack cooldown has elapsed.
 * @returns {boolean} True if a new attack can be triggered.
 */
Character.prototype.canAttack = function () {
    return Date.now() - this.lastAttackTime >= this.attackCooldown;
};

/**
 * Returns normalized attack cooldown progress.
 * @returns {number} Value between 0 and 1.
 */
Character.prototype.getAttackCooldownProgress = function () {
    const elapsed = Date.now() - this.lastAttackTime;
    return Math.max(0, Math.min(1, elapsed / this.attackCooldown));
};

/**
 * Checks if the character can currently use the special ability.
 * @returns {boolean} True if unlocked and cooldown is ready.
 */
Character.prototype.canUseSpecial = function () {
    return this.specialUnlocked && !this.isDead && Date.now() - this.lastSpecialTime >= this.specialCooldown;
};

/**
 * Attempts to activate the special ability and start its cooldown.
 * @returns {boolean} True when the special was activated.
 */
Character.prototype.activateSpecial = function () {
    if (!this.canUseSpecial()) return false;

    this.lastSpecialTime = Date.now();
    return true;
};

/**
 * Returns normalized special cooldown progress.
 * @returns {number} Value between 0 and 1.
 */
Character.prototype.getSpecialCooldownProgress = function () {
    if (!this.specialUnlocked) return 0;

    const elapsed = Date.now() - this.lastSpecialTime;
    return Math.max(0, Math.min(1, elapsed / this.specialCooldown));
};

/**
 * Builds the active melee attack collision box.
 * @returns {{x:number, y:number, width:number, height:number, offset:{top:number,right:number,bottom:number,left:number}}}
 */
Character.prototype.getAttackBox = function () {
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
};
