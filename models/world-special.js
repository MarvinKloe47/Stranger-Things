/**
 * Special attack effects for World.
 */
World.prototype.triggerSpecialAttack = function () {
    if (this.gameFinished || !this.character.activateSpecial()) return false;
    this.audioManager?.playLaserSound();
    this.activeSpecialEffects.push(this.createSpecialEffect());
    return true;
};

/**
 * Builds a new special beam effect payload.
 * @returns {{x:number,y:number,width:number,height:number,direction:number,damage:number,hitIds:Set,createdAt:number,durationMs:number,baseWidth:number,baseHeight:number,offset:{top:number,right:number,bottom:number,left:number}}} Effect payload.
 */
World.prototype.createSpecialEffect = function () {
    const direction = this.character.otherDirection ? -1 : 1;
    const x = direction < 0 ? this.character.x + 18 : this.character.x + this.character.width - 18;
    return {
        x, direction, damage: 55, hitIds: new Set(), createdAt: Date.now(), durationMs: 520,
        y: this.character.y + 76, width: 360, height: 72, baseWidth: 360, baseHeight: 72,
        offset: { top: 8, right: 14, bottom: 8, left: 14 },
    };
};

/**
 * Updates the active special attack beam collisions and lifetime.
 */
World.prototype.updateSpecialEffects = function () {
    if (this.activeSpecialEffects.length === 0) return;

    const now = Date.now();
    this.activeSpecialEffects = this.activeSpecialEffects
        .filter((effect) => this.updateSpecialEffect(effect, now));
};

/**
 * Updates one special effect instance and resolves its collisions.
 * @param {Object} effect Active special effect.
 * @param {number} now Current timestamp.
 * @returns {boolean} True while the effect remains active.
 */
World.prototype.updateSpecialEffect = function (effect, now) {
    const progress = Math.min(1, (now - effect.createdAt) / effect.durationMs);
    const collisionBox = this.buildSpecialCollisionBox(effect, progress);
    this.enemies = this.enemies
        .filter((enemy) => this.keepEnemyAfterSpecialHit(enemy, effect, collisionBox, now));
    return now - effect.createdAt <= effect.durationMs;
};

/**
 * Builds the active collision area of a special beam by progress.
 * @param {Object} effect Active special effect.
 * @param {number} progress Normalized effect progress.
 * @returns {{x:number,y:number,width:number,height:number,offset:Object}} Active collision box.
 */
World.prototype.buildSpecialCollisionBox = function (effect, progress) {
    const activeWidth = effect.baseWidth * (progress < 0.18 ? progress / 0.18 : 1);
    return {
        x: effect.direction < 0 ? effect.x - activeWidth : effect.x,
        y: effect.y, width: activeWidth, height: effect.baseHeight, offset: effect.offset,
    };
};

/**
 * Resolves whether an enemy remains after a special attack collision.
 * @param {MovableObjects} enemy The enemy being checked.
 * @param {Object} effect The current special attack effect.
 * @param {Object} collisionBox The active collision area.
 * @param {number} now The current timestamp.
 * @returns {boolean} True if the enemy stays alive.
 */
World.prototype.keepEnemyAfterSpecialHit = function (enemy, effect, collisionBox, now) {
    if (effect.hitIds.has(enemy) || !this.isColliding(collisionBox, enemy)) return true;
    effect.hitIds.add(enemy);

    if (enemy instanceof Endboss) {
        enemy.takeHit(effect.damage, `${now}-${collisionBox.x}`);
        this.bossStatusBar.setPercentage(enemy.energy);
        return true;
    }

    return false;
};

/**
 * Draws all active special attack effects.
 */
World.prototype.drawSpecialEffects = function () {
    this.activeSpecialEffects.forEach((effect) => this.drawSpecialEffect(effect));
};

/**
 * Draws one special beam effect.
 * @param {Object} effect Active special effect.
 */
World.prototype.drawSpecialEffect = function (effect) {
    if (!this.specialEffectImage.complete || this.specialEffectImage.naturalWidth === 0) return;
    const metrics = this.getSpecialDrawMetrics(effect);
    this.ctx.save();
    this.ctx.globalAlpha = metrics.alpha;
    if (effect.direction < 0) return this.drawMirroredSpecialEffect(effect, metrics);
    this.ctx.drawImage(this.specialEffectImage, effect.x, metrics.drawY, metrics.drawWidth, metrics.drawHeight);
    this.ctx.restore();
};

/**
 * Draws one mirrored special beam effect.
 * @param {Object} effect Active special effect.
 * @param {{drawY:number,drawWidth:number,drawHeight:number}} metrics Render metrics.
 */
World.prototype.drawMirroredSpecialEffect = function (effect, metrics) {
    this.ctx.translate(effect.x, metrics.drawY);
    this.ctx.scale(-1, 1);
    this.ctx.drawImage(this.specialEffectImage, 0, 0, metrics.drawWidth, metrics.drawHeight);
    this.ctx.restore();
};

/**
 * Computes draw metrics for one special beam frame.
 * @param {Object} effect Active special effect.
 * @returns {{alpha:number,drawY:number,drawWidth:number,drawHeight:number}} Beam draw metrics.
 */
World.prototype.getSpecialDrawMetrics = function (effect) {
    const elapsed = Date.now() - effect.createdAt;
    const progress = Math.min(1, elapsed / effect.durationMs);
    const growth = progress < 0.2 ? 0.18 + (progress / 0.2) * 0.82 : 1 + ((progress - 0.2) / 0.8) * 0.35;
    const alpha = progress < 0.75 ? 0.98 : 0.98 - ((progress - 0.75) / 0.25) * 0.45;
    const drawWidth = effect.baseWidth * growth;
    const drawHeight = effect.baseHeight * (0.82 + Math.sin(progress * Math.PI * 5) * 0.04);
    const drawY = effect.y + (effect.baseHeight - drawHeight) / 2;
    return { alpha, drawY, drawWidth, drawHeight };
};
