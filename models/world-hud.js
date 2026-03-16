/**
 * Draws the player attack cooldown UI.
 * @param {World} world The active world instance.
 */
function drawAttackCooldown(world) {
    const progress = world.character.getAttackCooldownProgress();
    const x = world.worldWidth - 180;
    const y = 24;
    const width = 140;
    const height = 18;

    world.ctx.save();
    world.ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
    world.ctx.fillRect(x, y, width, height);
    world.ctx.fillStyle = progress >= 1 ? "#80ff72" : "#ff9f43";
    world.ctx.fillRect(x, y, width * progress, height);
    world.ctx.lineWidth = 2;
    world.ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
    world.ctx.strokeRect(x, y, width, height);
    world.ctx.fillStyle = "white";
    world.ctx.font = "12px Arial";
    world.ctx.fillText("Attack D", x, y - 6);
    world.ctx.restore();
}

/**
 * Draws the boss status bar and label.
 * @param {World} world The active world instance.
 */
function drawBossStatus(world) {
    if (!world.endboss?.isActivated) return;

    world.addToMap(world.bossStatusBar);
    world.ctx.save();
    world.ctx.fillStyle = "#fff7dd";
    world.ctx.strokeStyle = "rgba(20, 10, 0, 0.8)";
    world.ctx.lineWidth = 4;
    world.ctx.font = "bold 20px Arial";
    world.ctx.textAlign = "center";
    world.ctx.textBaseline = "top";
    const textX = world.bossStatusBar.x + world.bossStatusBar.width / 2;
    const textY = world.bossStatusBar.y - 6;
    world.ctx.strokeText("Boss: Toto der Troll", textX, textY);
    world.ctx.fillText("Boss: Toto der Troll", textX, textY);
    world.ctx.restore();
}

/**
 * Draws the special attack cooldown UI.
 * @param {World} world The active world instance.
 */
function drawSpecialCooldown(world) {
    if (!world.character.specialUnlocked) return;

    const progress = world.character.getSpecialCooldownProgress();
    const x = world.worldWidth - 180;
    const y = 62;
    const width = 140;
    const height = 18;

    world.ctx.save();
    world.ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
    world.ctx.fillRect(x, y, width, height);
    world.ctx.fillStyle = progress >= 1 ? "#7be8ff" : "#42b7ff";
    world.ctx.fillRect(x, y, width * progress, height);
    world.ctx.lineWidth = 2;
    world.ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
    world.ctx.strokeRect(x, y, width, height);
    world.ctx.fillStyle = "white";
    world.ctx.font = "12px Arial";
    world.ctx.fillText("Special S", x, y - 6);
    world.ctx.restore();
}
