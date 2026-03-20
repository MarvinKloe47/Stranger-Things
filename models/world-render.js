/**
 * Rendering helpers for World.
 */
World.prototype.draw = function () {
    if (this.isDisposed) return;
    this.ctx.clearRect(0, 0, this.worldWidth, this.worldHeight);
    this.drawWorldLayer();
    this.drawHudLayer();
    gameRequestAnimationFrame(() => this.draw());
};

/**
 * Draws world-space objects affected by camera and shake transforms.
 */
World.prototype.drawWorldLayer = function () {
    this.applyScreenShake();
    this.ctx.translate(this.camera_x, 0);
    this.addObjectstoMap(this.backgroundObjects);
    this.clouds.forEach((cloud) => this.addToMap(cloud));
    this.addObjectstoMap(this.coins);
    this.addObjectstoMap(this.enemies);
    this.drawEnemyHealthBars();
    this.drawSpecialEffects();
    this.addToMap(this.character);
    this.ctx.translate(-this.camera_x, 0);
    this.resetScreenShake();
};

/**
 * Draws HUD-space elements.
 */
World.prototype.drawHudLayer = function () {
    this.addToMap(this.statusBar);
    this.addToMap(this.coinCounter);
    drawAttackCooldown(this);
    drawSpecialCooldown(this);
};

/**
 * Draws overhead health bars for active enemies.
 */
World.prototype.drawEnemyHealthBars = function () {
    this.enemies.forEach((enemy) => this.drawEnemyHealthBar(enemy));
};

/**
 * Draws one overhead health bar for the given enemy when health data is available.
 * @param {MovableObjects} enemy The enemy to draw a health bar for.
 */
World.prototype.drawEnemyHealthBar = function (enemy) {
    const healthData = this.resolveEnemyHealthData(enemy);
    if (!healthData) return;

    const percentage = this.getHealthPercentage(healthData.current, healthData.max);
    if (percentage <= 0) return;

    const barRect = this.getEnemyHealthBarRect(enemy);
    this.drawEnemyHealthBarFrame(barRect, percentage);
    if (enemy instanceof Endboss) this.drawEndbossNameLabel(enemy, barRect.y);
};

/**
 * Returns render geometry for an enemy health bar.
 * @param {MovableObjects} enemy Enemy instance.
 * @returns {{x:number,y:number,width:number,height:number}} Bar geometry.
 */
World.prototype.getEnemyHealthBarRect = function (enemy) {
    const width = Math.max(34, Math.min(96, enemy.width * 0.55));
    return {
        x: enemy.x + (enemy.width - width) / 2,
        y: enemy.y - 10,
        width,
        height: 6,
    };
};

/**
 * Draws one enemy health bar background and fill.
 * @param {{x:number,y:number,width:number,height:number}} barRect Bar geometry.
 * @param {number} percentage Normalized health percentage.
 */
World.prototype.drawEnemyHealthBarFrame = function (barRect, percentage) {
    this.ctx.save();
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    this.ctx.fillRect(barRect.x - 1, barRect.y - 1, barRect.width + 2, barRect.height + 2);

    this.ctx.fillStyle = "#7a1111";
    this.ctx.fillRect(barRect.x, barRect.y, barRect.width, barRect.height);

    this.ctx.fillStyle = "#41d65c";
    this.ctx.fillRect(barRect.x, barRect.y, barRect.width * percentage, barRect.height);
    this.ctx.restore();
};

/**
 * Draws endboss name label above the overhead health bar.
 * @param {Endboss} enemy Endboss instance.
 * @param {number} barY Health bar y position.
 */
World.prototype.drawEndbossNameLabel = function (enemy, barY) {
    const labelX = enemy.x + enemy.width / 2;
    const labelY = barY - 3;
    this.ctx.save();
    this.ctx.fillStyle = "#fff7dd";
    this.ctx.strokeStyle = "rgba(20, 10, 0, 0.8)";
    this.ctx.lineWidth = 3;
    this.ctx.font = "bold 13px Arial";
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "bottom";
    this.ctx.strokeText("Toto der Troll", labelX, labelY);
    this.ctx.fillText("Toto der Troll", labelX, labelY);
    this.ctx.restore();
};

/**
 * Resolves health values for supported enemy types.
 * @param {MovableObjects} enemy Enemy instance.
 * @returns {{current:number, max:number}|null} Current and max health values or null.
 */
World.prototype.resolveEnemyHealthData = function (enemy) {
    const bossData = this.resolveBossHealthData(enemy);
    if (bossData) return bossData;
    return this.resolveRegularEnemyHealthData(enemy);
};

/**
 * Resolves health data for the endboss.
 * @param {MovableObjects} enemy Enemy instance.
 * @returns {{current:number,max:number}|null} Boss health data or null.
 */
World.prototype.resolveBossHealthData = function (enemy) {
    if (!(enemy instanceof Endboss)) return null;
    if (!enemy.isActivated && !enemy.isAwakening) return null;
    return { current: enemy.energy, max: enemy.maxEnergy ?? 100 };
};

/**
 * Resolves health data for regular enemies.
 * @param {MovableObjects} enemy Enemy instance.
 * @returns {{current:number,max:number}|null} Regular enemy health data or null.
 */
World.prototype.resolveRegularEnemyHealthData = function (enemy) {
    const hasHealth = typeof enemy.remainingHealth === "number";
    const hasMaxHealth = typeof enemy.maxRemainingHealth === "number";
    if (!hasHealth || !hasMaxHealth) return null;
    return { current: enemy.remainingHealth, max: enemy.maxRemainingHealth };
};

/**
 * Calculates a clamped normalized health value.
 * @param {number} current Current health.
 * @param {number} max Maximum health.
 * @returns {number} Health percentage from 0 to 1.
 */
World.prototype.getHealthPercentage = function (current, max) {
    if (!Number.isFinite(current) || !Number.isFinite(max) || max <= 0) return 0;
    return Math.max(0, Math.min(1, current / max));
};

/**
 * Draws all objects from a list.
 * @param {DrawableObject[]} objects The objects to draw.
 */
World.prototype.addObjectstoMap = function (objects) {
    objects.forEach((obj) => this.addToMap(obj));
};

/**
 * Draws one object including its optional debug box.
 * @param {DrawableObject} mo The object to draw.
 */
World.prototype.addToMap = function (mo) {
    mo.draw(this.ctx);
    mo.drawDebugRect(this.ctx);
};

/**
 * Applies the active screen shake offset to the canvas.
 */
World.prototype.applyScreenShake = function () {
    this.isShakingFrame = false;
    if (Date.now() >= this.screenShakeUntil) return;
    const shakeX = (Math.random() - 0.5) * 12;
    const shakeY = (Math.random() - 0.5) * 10;
    this.ctx.save();
    this.ctx.translate(shakeX, shakeY);
    this.isShakingFrame = true;
};

/**
 * Restores the canvas after a shake frame.
 */
World.prototype.resetScreenShake = function () {
    if (!this.isShakingFrame) return;
    this.ctx.restore();
    this.isShakingFrame = false;
};
