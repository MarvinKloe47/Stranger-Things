/**
 * Draws the player attack cooldown UI.
 * @param {World} world The active world instance.
 */
function drawAttackCooldown(world) {
    const progress = world.character.getAttackCooldownProgress();
    drawCooldownBar(world, {
        x: world.worldWidth - 180,
        y: 24,
        width: 140,
        height: 18,
        progress,
        activeColor: "#80ff72",
        idleColor: "#ff9f43",
        label: "Attack D",
    });
}

/**
 * Draws the boss status bar and label.
 * @param {World} world The active world instance.
 */
function drawBossStatus(world) {
    if (!world.endboss?.isActivated) return;

    world.addToMap(world.bossStatusBar);
    drawBossStatusLabel(world);
}

/**
 * Draws the special attack cooldown UI.
 * @param {World} world The active world instance.
 */
function drawSpecialCooldown(world) {
    if (!world.character.specialUnlocked) return;
    drawCooldownBar(world, createSpecialCooldownConfig(world));
}

/**
 * Builds cooldown config for the special attack UI.
 * @param {World} world Active world instance.
 * @returns {{x:number,y:number,width:number,height:number,progress:number,activeColor:string,idleColor:string,label:string}} Bar config.
 */
function createSpecialCooldownConfig(world) {
    return {
        x: world.worldWidth - 180,
        y: 62,
        width: 140,
        height: 18,
        progress: world.character.getSpecialCooldownProgress(),
        activeColor: "#7be8ff",
        idleColor: "#42b7ff",
        label: "Special S",
    };
}

/**
 * Draws a generic cooldown bar and label.
 * @param {World} world Active world instance.
 * @param {{x:number,y:number,width:number,height:number,progress:number,activeColor:string,idleColor:string,label:string}} config Bar config.
 */
function drawCooldownBar(world, config) {
    const color = config.progress >= 1 ? config.activeColor : config.idleColor;
    world.ctx.save();
    drawCooldownBarBase(world, config, color);
    drawCooldownBarLabel(world, config.label, config.x, config.y);
    world.ctx.restore();
}

/**
 * Draws cooldown bar background and fill layers.
 * @param {World} world Active world instance.
 * @param {{x:number,y:number,width:number,height:number,progress:number}} config Bar config.
 * @param {string} color Fill color.
 */
function drawCooldownBarBase(world, config, color) {
    world.ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
    world.ctx.fillRect(config.x, config.y, config.width, config.height);
    world.ctx.fillStyle = color;
    world.ctx.fillRect(config.x, config.y, config.width * config.progress, config.height);
    world.ctx.lineWidth = 2;
    world.ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
    world.ctx.strokeRect(config.x, config.y, config.width, config.height);
}

/**
 * Draws one cooldown bar text label.
 * @param {World} world Active world instance.
 * @param {string} label Label text.
 * @param {number} x Label x anchor.
 * @param {number} y Label y anchor.
 */
function drawCooldownBarLabel(world, label, x, y) {
    world.ctx.fillStyle = "white";
    world.ctx.font = "12px Arial";
    world.ctx.fillText(label, x, y - 6);
}

/**
 * Draws the big boss status title text above the boss health bar.
 * @param {World} world Active world instance.
 */
function drawBossStatusLabel(world) {
    const textX = world.bossStatusBar.x + world.bossStatusBar.width / 2;
    const textY = world.bossStatusBar.y - 6;
    world.ctx.save();
    world.ctx.fillStyle = "#fff7dd";
    world.ctx.strokeStyle = "rgba(20, 10, 0, 0.8)";
    world.ctx.lineWidth = 4;
    world.ctx.font = "bold 20px Arial";
    world.ctx.textAlign = "center";
    world.ctx.textBaseline = "top";
    world.ctx.strokeText("Boss: Toto der Troll", textX, textY);
    world.ctx.fillText("Boss: Toto der Troll", textX, textY);
    world.ctx.restore();
}
