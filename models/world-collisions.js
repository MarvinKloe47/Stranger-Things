/**
 * Collision and damage logic for World.
 */
World.prototype.checkCollisions = function () {
    this.enemies.forEach((enemy) => {
        if (!this.enemyHitsCharacter(enemy) || !this.canTakeDamage()) return;
        this.applyCharacterDamage(20);
    });
};

/**
 * Checks whether one enemy currently hits the character.
 * @param {MovableObjects} enemy Enemy to evaluate.
 * @returns {boolean} True if the enemy hits the character now.
 */
World.prototype.enemyHitsCharacter = function (enemy) {
    const isActiveEndboss = enemy instanceof Endboss && enemy.isActivated;
    const allowsContactDamage = this.enemyAllowsContactDamage(enemy, isActiveEndboss);
    const isRegularEnemyTouch = allowsContactDamage && this.isColliding(this.character, enemy);
    const isAttackHit = this.isEnemyAttackHit(enemy, isActiveEndboss);
    return isRegularEnemyTouch || isAttackHit;
};

/**
 * Checks whether enemy may deal passive touch damage.
 * @param {MovableObjects} enemy Enemy instance.
 * @param {boolean} isActiveEndboss Whether this enemy is the active endboss.
 * @returns {boolean} True when contact damage is allowed.
 */
World.prototype.enemyAllowsContactDamage = function (enemy, isActiveEndboss) {
    if (isActiveEndboss) return false;
    const hasAttackHitbox = typeof enemy.getAttackBox === "function";
    const hasAttackState = typeof enemy.isAttacking === "boolean";
    return !(hasAttackHitbox && hasAttackState);
};

/**
 * Checks whether an enemy attack box currently hits the character.
 * @param {MovableObjects} enemy Enemy instance.
 * @param {boolean} isActiveEndboss Whether this enemy is the active endboss.
 * @returns {boolean} True when attack hit conditions are fulfilled.
 */
World.prototype.isEnemyAttackHit = function (enemy, isActiveEndboss) {
    if (isActiveEndboss) return this.isBossAttackHit(enemy, true);
    if (!enemy.isAttacking || typeof enemy.getAttackBox !== "function") return false;
    if (!this.isColliding(this.character, enemy.getAttackBox())) return false;
    if (typeof enemy.tryConsumeAttackDamage !== "function") return true;
    return enemy.tryConsumeAttackDamage();
};

/**
 * Checks whether an active endboss attack hits the character.
 * @param {MovableObjects} enemy Enemy instance.
 * @param {boolean} isActiveEndboss Whether this enemy is the active endboss.
 * @returns {boolean} True if a boss attack hit is confirmed.
 */
World.prototype.isBossAttackHit = function (enemy, isActiveEndboss) {
    const isEndbossAttack = isActiveEndboss && enemy.isAttacking;
    if (!isEndbossAttack) return false;
    if (typeof enemy.isInAttackHitWindow === "function" && !enemy.isInAttackHitWindow()) return false;
    if (typeof enemy.isTargetInAttackArc === "function" && !enemy.isTargetInAttackArc(this.character)) return false;
    if (!this.isColliding(this.character, enemy.getAttackBox())) return false;
    return enemy.tryConsumeAttackDamage();
};

/**
 * Applies damage to the character and updates related state.
 * @param {number} damage Incoming damage amount.
 */
World.prototype.applyCharacterDamage = function (damage) {
    this.character.lastHit = Date.now();
    this.character.isHurt = true;
    this.audioManager?.playHurtSound();
    this.character.energy -= damage;
    if (this.character.energy <= 0) return this.setCharacterDead();
    this.statusBar.setPercentage(this.character.energy);
};

/**
 * Sets character death state and clamps health to zero.
 */
World.prototype.setCharacterDead = function () {
    this.character.isDead = true;
    this.character.energy = 0;
    this.statusBar.setPercentage(this.character.energy);
};

/**
 * Determines whether the player can take damage again.
 * @returns {boolean} True if the hurt cooldown has passed.
 */
World.prototype.canTakeDamage = function () {
    return !this.character.isDead && Date.now() - this.character.lastHit >= 500;
};

/**
 * Collects coins that overlap with the player.
 */
World.prototype.checkCoinCollisions = function () {
    this.coins = this.coins.filter((coin) => {
        if (!this.isColliding(this.character, coin)) return true;
        this.character.coins += 1;
        this.coinCounter.setValue(this.character.coins);
        this.saveStoredCoins();
        this.onShopUiChange?.();
        this.audioManager?.playCollectSound();
        return false;
    });
};

/**
 * Applies melee damage to enemies hit by the player.
 */
World.prototype.checkAttackCollisions = function () {
    if (!this.character.isInAttackHitWindow()) return;

    const attackBox = this.character.getAttackBox();
    this.enemies = this.enemies.filter((enemy) => this.keepEnemyAfterAttackCheck(enemy, attackBox));
};

/**
 * Routes player attack checks to boss or regular enemy handling.
 * @param {MovableObjects} enemy The enemy to evaluate.
 * @param {Object} attackBox The current player attack box.
 * @returns {boolean} True if the enemy remains in the world.
 */
World.prototype.keepEnemyAfterAttackCheck = function (enemy, attackBox) {
    if (enemy instanceof Endboss) {
        return this.checkBossHitDuringAttack(enemy, attackBox);
    }

    return this.checkEnemyHitDuringAttack(enemy, attackBox);
};

/**
 * Resolves one regular enemy hit during the current player attack.
 * @param {MovableObjects} enemy The enemy to check.
 * @param {Object} attackBox The current player attack box.
 * @returns {boolean} True if the enemy remains alive.
 */
World.prototype.checkEnemyHitDuringAttack = function (enemy, attackBox) {
    if (!this.shouldApplyPlayerAttackHit(enemy, attackBox)) return true;
    this.character.markTargetHitInCurrentAttack(enemy);
    return this.keepEnemyAfterPlayerAttack(enemy);
};

/**
 * Applies player melee damage resolution to regular enemies.
 * @param {MovableObjects} enemy The enemy to apply damage logic to.
 * @returns {boolean} True if the enemy survives this hit.
 */
World.prototype.keepEnemyAfterPlayerAttack = function (enemy) {
    if (typeof enemy.takeHit === "function") {
        return enemy.takeHit(1);
    }

    return false;
};

/**
 * Resolves one boss hit during the current player attack.
 * @param {Endboss} boss The boss to check.
 * @param {Object} attackBox The current player attack box.
 * @returns {boolean} True because the boss remains in the enemy list.
 */
World.prototype.checkBossHitDuringAttack = function (boss, attackBox) {
    if (!this.shouldApplyPlayerAttackHit(boss, attackBox)) return true;
    this.character.markTargetHitInCurrentAttack(boss);
    boss.takeHit(25, this.character.lastAttackTime);
    this.bossStatusBar.setPercentage(boss.energy);
    return true;
};

/**
 * Checks whether the target may receive damage in the current attack.
 * @param {MovableObjects} target The collision target.
 * @param {Object} attackBox The current player attack box.
 * @returns {boolean} True if this target can be hit now.
 */
World.prototype.shouldApplyPlayerAttackHit = function (target, attackBox) {
    return this.isColliding(attackBox, target)
        && !this.character.hasHitTargetInCurrentAttack(target);
};

/**
 * Checks axis-aligned collision boxes with offsets.
 * @param {Object} a The first box.
 * @param {Object} b The second box.
 * @returns {boolean} True if both boxes overlap.
 */
World.prototype.isColliding = function (a, b) {
    return (
        a.x + a.offset.left < b.x + b.width - b.offset.right &&
        a.x + a.width - a.offset.right > b.x + b.offset.left &&
        a.y + a.offset.top < b.y + b.height - b.offset.bottom &&
        a.y + a.height - a.offset.bottom > b.y + b.offset.top
    );
};
