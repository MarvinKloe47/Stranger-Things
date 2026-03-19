/**
 * Main game world orchestrating entities, collisions, rendering, and game state.
 */
class World {
    coinStorageKey = "stranger-things-coins";
    specialStorageKey = "stranger-things-special-unlocked";

    /**
     * @param {HTMLCanvasElement} canvas Target canvas.
     * @param {Keyboard} keyboard Shared keyboard state.
     * @param {{audioManager?: AudioManager|null, onShopUiChange?: Function|null, onGameEnd?: Function|null}} [options={}] Optional world integrations.
     */
    constructor(canvas, keyboard, options = {}) {
        this.ctx = canvas.getContext("2d");
        this.keyboard = keyboard;
        this.initializeWorldState(options);
        this.initializeSceneObjects();

        this.configureScene();
        this.run();
        this.draw();
    }

    /**
     * Initializes world-level state and external integrations.
     * @param {{audioManager?: AudioManager|null, onShopUiChange?: Function|null, onGameEnd?: Function|null}} options Options object.
     */
    initializeWorldState(options) {
        this.audioManager = options.audioManager ?? null;
        this.onShopUiChange = options.onShopUiChange ?? null;
        this.onGameEnd = options.onGameEnd ?? null;
        this.worldWidth = this.ctx.canvas.width;
        this.worldHeight = this.ctx.canvas.height;
        this.groundY = this.worldHeight - 20;
        this.screenShakeUntil = 0;
        this.isShakingFrame = false;
        this.gameFinished = false;
        this.isDisposed = false;
        this.activeSpecialEffects = [];
        this.specialEffectImage = this.createSpecialEffectImage();
    }

    /**
     * Creates the image used for special effect rendering.
     * @returns {HTMLImageElement} Prepared image element.
     */
    createSpecialEffectImage() {
        const image = new Image();
        image.src = "assets/img/9_shop/freigeschaltet/3.png";
        return image;
    }

    /**
     * Initializes runtime scene objects and level entities.
     */
    initializeSceneObjects() {
        this.character = new Character();
        this.statusBar = new StatusBar();
        this.bossStatusBar = new BossStatusBar();
        this.coinCounter = new CoinCounter();
        this.level = createLevel1(this.worldWidth, this.worldHeight);
        this.enemies = this.level.enemies;
        this.clouds = this.level.clouds;
        this.coins = this.level.coins;
        this.backgroundObjects = this.level.backgroundObjects;
        this.endboss = this.enemies.find((enemy) => enemy instanceof Endboss);
        this.camera_x = 0;
    }

    /**
     * Wires initial world references and loads persisted player progress.
     */
    configureScene() {
        this.character.world = this;
        this.character.alignToGround(this.groundY);
        this.enemies.forEach((enemy) => this.configureEnemy(enemy));
        this.character.coins = this.loadStoredCoins();
        this.character.specialUnlocked = this.loadSpecialUnlocked();
        this.coinCounter.setValue(this.character.coins);
        this.bossStatusBar.setPercentage(this.endboss?.energy ?? 100);
        this.onShopUiChange?.();
    }

    /**
     * Applies initial world references and positioning for one enemy.
     * @param {MovableObjects} enemy Enemy instance.
     */
    configureEnemy(enemy) {
        enemy.world = this;
        enemy.alignToGround(this.groundY);
    }

    /**
     * Loads stored coin count from local storage.
     * @returns {number} Valid non-negative coin count.
     */
    loadStoredCoins() {
        try {
            const storedCoins = localStorage.getItem(this.coinStorageKey);
            const parsedCoins = Number(storedCoins);
            return Number.isFinite(parsedCoins) && parsedCoins >= 0 ? parsedCoins : 0;
        } catch (error) {
            return 0;
        }
    }

    /**
     * Persists current coin count to local storage.
     */
    saveStoredCoins() {
        try {
            localStorage.setItem(this.coinStorageKey, String(this.character.coins));
        } catch (error) {
            return;
        }
    }

    /**
     * Loads the persisted special ability unlock flag.
     * @returns {boolean} True when special ability is unlocked.
     */
    loadSpecialUnlocked() {
        try {
            return localStorage.getItem(this.specialStorageKey) === "true";
        } catch (error) {
            return false;
        }
    }

    /**
     * Starts the gameplay update loop.
     */
    run() {
        gameSetInterval(() => {
            if (this.gameFinished || this.isDisposed) return;
            this.checkEndbossTrigger();
            this.updateEndboss();
            this.updateCharacterStates();
            this.checkCollisions();
            this.checkAttackCollisions();
            this.updateSpecialEffects();
            this.checkCoinCollisions();
            this.cleanupDefeatedEnemies();
            this.checkGameResult();
        }, 1000 / 60);
    }

    /**
     * Removes regular enemies whose death animation has finished.
     */
    cleanupDefeatedEnemies() {
        this.enemies = this.enemies.filter((enemy) => this.keepEnemyAfterCleanup(enemy));
        this.endboss = this.enemies.find((enemy) => enemy instanceof Endboss) ?? this.endboss;
    }

    /**
     * Determines whether an enemy stays after cleanup checks.
     * @param {MovableObjects} enemy Enemy instance.
     * @returns {boolean} True if the enemy should remain in the world.
     */
    keepEnemyAfterCleanup(enemy) {
        if (enemy instanceof Endboss) return true;
        if (typeof enemy.shouldBeRemoved !== "function") return true;
        return !enemy.shouldBeRemoved();
    }

    /**
     * Draw loop for world and HUD rendering.
     */
    draw() {
        if (this.isDisposed) return;
        this.ctx.clearRect(0, 0, this.worldWidth, this.worldHeight);
        this.drawWorldLayer();
        this.drawHudLayer();
        gameRequestAnimationFrame(() => this.draw());
    }

    /**
     * Draws world-space objects affected by camera and shake transforms.
     */
    drawWorldLayer() {
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
    }

    /**
     * Draws HUD-space elements.
     */
    drawHudLayer() {
        this.addToMap(this.statusBar);
        this.addToMap(this.coinCounter);
        drawAttackCooldown(this);
        drawSpecialCooldown(this);
    }

    /**
     * Draws overhead health bars for active enemies.
     */
    drawEnemyHealthBars() {
        this.enemies.forEach((enemy) => this.drawEnemyHealthBar(enemy));
    }

    /**
     * Draws one overhead health bar for the given enemy when health data is available.
     * @param {MovableObjects} enemy The enemy to draw a health bar for.
     */
    drawEnemyHealthBar(enemy) {
        const healthData = this.resolveEnemyHealthData(enemy);
        if (!healthData) return;

        const percentage = this.getHealthPercentage(healthData.current, healthData.max);
        if (percentage <= 0) return;

        const barRect = this.getEnemyHealthBarRect(enemy);
        this.drawEnemyHealthBarFrame(barRect, percentage);
        if (enemy instanceof Endboss) this.drawEndbossNameLabel(enemy, barRect.y);
    }

    /**
     * Returns render geometry for an enemy health bar.
     * @param {MovableObjects} enemy Enemy instance.
     * @returns {{x:number,y:number,width:number,height:number}} Bar geometry.
     */
    getEnemyHealthBarRect(enemy) {
        const width = Math.max(34, Math.min(96, enemy.width * 0.55));
        return {
            x: enemy.x + (enemy.width - width) / 2,
            y: enemy.y - 10,
            width,
            height: 6,
        };
    }

    /**
     * Draws one enemy health bar background and fill.
     * @param {{x:number,y:number,width:number,height:number}} barRect Bar geometry.
     * @param {number} percentage Normalized health percentage.
     */
    drawEnemyHealthBarFrame(barRect, percentage) {
        this.ctx.save();
        this.ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        this.ctx.fillRect(barRect.x - 1, barRect.y - 1, barRect.width + 2, barRect.height + 2);

        this.ctx.fillStyle = "#7a1111";
        this.ctx.fillRect(barRect.x, barRect.y, barRect.width, barRect.height);

        this.ctx.fillStyle = "#41d65c";
        this.ctx.fillRect(barRect.x, barRect.y, barRect.width * percentage, barRect.height);
        this.ctx.restore();
    }

    /**
     * Draws endboss name label above the overhead health bar.
     * @param {Endboss} enemy Endboss instance.
     * @param {number} barY Health bar y position.
     */
    drawEndbossNameLabel(enemy, barY) {
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
    }

    /**
     * Resolves health values for supported enemy types.
     * @param {MovableObjects} enemy Enemy instance.
     * @returns {{current:number, max:number}|null} Current and max health values or null.
     */
    resolveEnemyHealthData(enemy) {
        const bossData = this.resolveBossHealthData(enemy);
        if (bossData) return bossData;
        return this.resolveRegularEnemyHealthData(enemy);
    }

    /**
     * Resolves health data for the endboss.
     * @param {MovableObjects} enemy Enemy instance.
     * @returns {{current:number,max:number}|null} Boss health data or null.
     */
    resolveBossHealthData(enemy) {
        if (!(enemy instanceof Endboss)) return null;
        if (!enemy.isActivated && !enemy.isAwakening) return null;
        return { current: enemy.energy, max: enemy.maxEnergy ?? 100 };
    }

    /**
     * Resolves health data for regular enemies.
     * @param {MovableObjects} enemy Enemy instance.
     * @returns {{current:number,max:number}|null} Regular enemy health data or null.
     */
    resolveRegularEnemyHealthData(enemy) {
        const hasHealth = typeof enemy.remainingHealth === "number";
        const hasMaxHealth = typeof enemy.maxRemainingHealth === "number";
        if (!hasHealth || !hasMaxHealth) return null;
        return { current: enemy.remainingHealth, max: enemy.maxRemainingHealth };
    }

    /**
     * Calculates a clamped normalized health value.
     * @param {number} current Current health.
     * @param {number} max Maximum health.
     * @returns {number} Health percentage from 0 to 1.
     */
    getHealthPercentage(current, max) {
        if (!Number.isFinite(current) || !Number.isFinite(max) || max <= 0) return 0;
        return Math.max(0, Math.min(1, current / max));
    }

    /**
     * Marks the world as disposed and stops future gameplay progression.
     */
    dispose() {
        this.gameFinished = true;
        this.isDisposed = true;
    }

    /**
     * Checks whether the player currently takes damage from enemies.
     */
    checkCollisions() {
        this.enemies.forEach((enemy) => {
            if (!this.enemyHitsCharacter(enemy) || !this.canTakeDamage()) return;
            this.applyCharacterDamage(20);
        });
    }

    /**
     * Checks whether one enemy currently hits the character.
     * @param {MovableObjects} enemy Enemy to evaluate.
     * @returns {boolean} True if the enemy hits the character now.
     */
    enemyHitsCharacter(enemy) {
        const isActiveEndboss = enemy instanceof Endboss && enemy.isActivated;
        const allowsContactDamage = this.enemyAllowsContactDamage(enemy, isActiveEndboss);
        const isRegularEnemyTouch = allowsContactDamage && this.isColliding(this.character, enemy);
        const isAttackHit = this.isEnemyAttackHit(enemy, isActiveEndboss);
        return isRegularEnemyTouch || isAttackHit;
    }

    /**
     * Checks whether enemy may deal passive touch damage.
     * @param {MovableObjects} enemy Enemy instance.
     * @param {boolean} isActiveEndboss Whether this enemy is the active endboss.
     * @returns {boolean} True when contact damage is allowed.
     */
    enemyAllowsContactDamage(enemy, isActiveEndboss) {
        if (isActiveEndboss) return false;
        const hasAttackHitbox = typeof enemy.getAttackBox === "function";
        const hasAttackState = typeof enemy.isAttacking === "boolean";
        return !(hasAttackHitbox && hasAttackState);
    }

    /**
     * Checks whether an enemy attack box currently hits the character.
     * @param {MovableObjects} enemy Enemy instance.
     * @param {boolean} isActiveEndboss Whether this enemy is the active endboss.
     * @returns {boolean} True when attack hit conditions are fulfilled.
     */
    isEnemyAttackHit(enemy, isActiveEndboss) {
        if (isActiveEndboss) return this.isBossAttackHit(enemy, true);
        if (!enemy.isAttacking || typeof enemy.getAttackBox !== "function") return false;
        if (!this.isColliding(this.character, enemy.getAttackBox())) return false;
        if (typeof enemy.tryConsumeAttackDamage !== "function") return true;
        return enemy.tryConsumeAttackDamage();
    }

    /**
     * Checks whether an active endboss attack hits the character.
     * @param {MovableObjects} enemy Enemy instance.
     * @param {boolean} isActiveEndboss Whether this enemy is the active endboss.
     * @returns {boolean} True if a boss attack hit is confirmed.
     */
    isBossAttackHit(enemy, isActiveEndboss) {
        const isEndbossAttack = isActiveEndboss && enemy.isAttacking;
        if (!isEndbossAttack) return false;
        if (typeof enemy.isInAttackHitWindow === "function" && !enemy.isInAttackHitWindow()) return false;
        if (typeof enemy.isTargetInAttackArc === "function" && !enemy.isTargetInAttackArc(this.character)) return false;
        if (!this.isColliding(this.character, enemy.getAttackBox())) return false;
        return enemy.tryConsumeAttackDamage();
    }

    /**
     * Applies damage to the character and updates related state.
     * @param {number} damage Incoming damage amount.
     */
    applyCharacterDamage(damage) {
        this.character.lastHit = Date.now();
        this.character.isHurt = true;
        this.audioManager?.playHurtSound();
        this.character.energy -= damage;
        if (this.character.energy <= 0) return this.setCharacterDead();
        this.statusBar.setPercentage(this.character.energy);
    }

    /**
     * Sets character death state and clamps health to zero.
     */
    setCharacterDead() {
        this.character.isDead = true;
        this.character.energy = 0;
        this.statusBar.setPercentage(this.character.energy);
    }

    /**
     * Determines whether the player can take damage again.
     * @returns {boolean} True if the hurt cooldown has passed.
     */
    canTakeDamage() {
        return !this.character.isDead && Date.now() - this.character.lastHit >= 500;
    }

    /**
     * Collects coins that overlap with the player.
     */
    checkCoinCollisions() {
        this.coins = this.coins.filter((coin) => {
            if (!this.isColliding(this.character, coin)) return true;
            this.character.coins += 1;
            this.coinCounter.setValue(this.character.coins);
            this.saveStoredCoins();
            this.onShopUiChange?.();
            this.audioManager?.playCollectSound();
            return false;
        });
    }

    /**
     * Applies melee damage to enemies hit by the player.
     */
    checkAttackCollisions() {
        if (!this.character.isInAttackHitWindow()) return;

        const attackBox = this.character.getAttackBox();
        this.enemies = this.enemies.filter((enemy) => this.keepEnemyAfterAttackCheck(enemy, attackBox));
    }

    /**
     * Routes player attack checks to boss or regular enemy handling.
     * @param {MovableObjects} enemy The enemy to evaluate.
     * @param {Object} attackBox The current player attack box.
     * @returns {boolean} True if the enemy remains in the world.
     */
    keepEnemyAfterAttackCheck(enemy, attackBox) {
        if (enemy instanceof Endboss) {
            return this.checkBossHitDuringAttack(enemy, attackBox);
        }

        return this.checkEnemyHitDuringAttack(enemy, attackBox);
    }

    /**
     * Resolves one regular enemy hit during the current player attack.
     * @param {MovableObjects} enemy The enemy to check.
     * @param {Object} attackBox The current player attack box.
     * @returns {boolean} True if the enemy remains alive.
     */
    checkEnemyHitDuringAttack(enemy, attackBox) {
        if (!this.shouldApplyPlayerAttackHit(enemy, attackBox)) return true;
        this.character.markTargetHitInCurrentAttack(enemy);
        return this.keepEnemyAfterPlayerAttack(enemy);
    }

    /**
     * Applies player melee damage resolution to regular enemies.
     * @param {MovableObjects} enemy The enemy to apply damage logic to.
     * @returns {boolean} True if the enemy survives this hit.
     */
    keepEnemyAfterPlayerAttack(enemy) {
        if (typeof enemy.takeHit === "function") {
            return enemy.takeHit(1);
        }

        return false;
    }

    /**
     * Resolves one boss hit during the current player attack.
     * @param {Endboss} boss The boss to check.
     * @param {Object} attackBox The current player attack box.
     * @returns {boolean} True because the boss remains in the enemy list.
     */
    checkBossHitDuringAttack(boss, attackBox) {
        if (!this.shouldApplyPlayerAttackHit(boss, attackBox)) return true;
        this.character.markTargetHitInCurrentAttack(boss);
        boss.takeHit(25, this.character.lastAttackTime);
        this.bossStatusBar.setPercentage(boss.energy);
        return true;
    }

    /**
     * Checks whether the target may receive damage in the current attack.
     * @param {MovableObjects} target The collision target.
     * @param {Object} attackBox The current player attack box.
     * @returns {boolean} True if this target can be hit now.
     */
    shouldApplyPlayerAttackHit(target, attackBox) {
        return this.isColliding(attackBox, target)
            && !this.character.hasHitTargetInCurrentAttack(target);
    }

    /**
     * Triggers the player's special attack effect.
     * @returns {boolean} True if the attack could be activated.
     */
    triggerSpecialAttack() {
        if (this.gameFinished || !this.character.activateSpecial()) return false;
        this.audioManager?.playLaserSound();
        this.activeSpecialEffects.push(this.createSpecialEffect());
        return true;
    }

    /**
     * Builds a new special beam effect payload.
     * @returns {{x:number,y:number,width:number,height:number,direction:number,damage:number,hitIds:Set,createdAt:number,durationMs:number,baseWidth:number,baseHeight:number,offset:{top:number,right:number,bottom:number,left:number}}} Effect payload.
     */
    createSpecialEffect() {
        const direction = this.character.otherDirection ? -1 : 1;
        const x = direction < 0 ? this.character.x + 18 : this.character.x + this.character.width - 18;
        return {
            x, direction, damage: 55, hitIds: new Set(), createdAt: Date.now(), durationMs: 520,
            y: this.character.y + 76, width: 360, height: 72, baseWidth: 360, baseHeight: 72,
            offset: { top: 8, right: 14, bottom: 8, left: 14 },
        };
    }

    /**
     * Updates the active special attack beam collisions and lifetime.
     */
    updateSpecialEffects() {
        if (this.activeSpecialEffects.length === 0) return;

        const now = Date.now();
        this.activeSpecialEffects = this.activeSpecialEffects
            .filter((effect) => this.updateSpecialEffect(effect, now));
    }

    /**
     * Updates one special effect instance and resolves its collisions.
     * @param {Object} effect Active special effect.
     * @param {number} now Current timestamp.
     * @returns {boolean} True while the effect remains active.
     */
    updateSpecialEffect(effect, now) {
        const progress = Math.min(1, (now - effect.createdAt) / effect.durationMs);
        const collisionBox = this.buildSpecialCollisionBox(effect, progress);
        this.enemies = this.enemies
            .filter((enemy) => this.keepEnemyAfterSpecialHit(enemy, effect, collisionBox, now));
        return now - effect.createdAt <= effect.durationMs;
    }

    /**
     * Builds the active collision area of a special beam by progress.
     * @param {Object} effect Active special effect.
     * @param {number} progress Normalized effect progress.
     * @returns {{x:number,y:number,width:number,height:number,offset:Object}} Active collision box.
     */
    buildSpecialCollisionBox(effect, progress) {
        const activeWidth = effect.baseWidth * (progress < 0.18 ? progress / 0.18 : 1);
        return {
            x: effect.direction < 0 ? effect.x - activeWidth : effect.x,
            y: effect.y, width: activeWidth, height: effect.baseHeight, offset: effect.offset,
        };
    }

    /**
     * Resolves whether an enemy remains after a special attack collision.
     * @param {MovableObjects} enemy The enemy being checked.
     * @param {Object} effect The current special attack effect.
     * @param {Object} collisionBox The active collision area.
     * @param {number} now The current timestamp.
     * @returns {boolean} True if the enemy stays alive.
     */
    keepEnemyAfterSpecialHit(enemy, effect, collisionBox, now) {
        if (effect.hitIds.has(enemy) || !this.isColliding(collisionBox, enemy)) return true;
        effect.hitIds.add(enemy);

        if (enemy instanceof Endboss) {
            enemy.takeHit(effect.damage, `${now}-${collisionBox.x}`);
            this.bossStatusBar.setPercentage(enemy.energy);
            return true;
        }

        return false;
    }

    /**
     * Draws all active special attack effects.
     */
    drawSpecialEffects() {
        this.activeSpecialEffects.forEach((effect) => this.drawSpecialEffect(effect));
    }

    /**
     * Draws one special beam effect.
     * @param {Object} effect Active special effect.
     */
    drawSpecialEffect(effect) {
        if (!this.specialEffectImage.complete || this.specialEffectImage.naturalWidth === 0) return;
        const metrics = this.getSpecialDrawMetrics(effect);
        this.ctx.save();
        this.ctx.globalAlpha = metrics.alpha;
        if (effect.direction < 0) return this.drawMirroredSpecialEffect(effect, metrics);
        this.ctx.drawImage(this.specialEffectImage, effect.x, metrics.drawY, metrics.drawWidth, metrics.drawHeight);
        this.ctx.restore();
    }

    /**
     * Draws one mirrored special beam effect.
     * @param {Object} effect Active special effect.
     * @param {{drawY:number,drawWidth:number,drawHeight:number}} metrics Render metrics.
     */
    drawMirroredSpecialEffect(effect, metrics) {
        this.ctx.translate(effect.x, metrics.drawY);
        this.ctx.scale(-1, 1);
        this.ctx.drawImage(this.specialEffectImage, 0, 0, metrics.drawWidth, metrics.drawHeight);
        this.ctx.restore();
    }

    /**
     * Computes draw metrics for one special beam frame.
     * @param {Object} effect Active special effect.
     * @returns {{alpha:number,drawY:number,drawWidth:number,drawHeight:number}} Beam draw metrics.
     */
    getSpecialDrawMetrics(effect) {
        const elapsed = Date.now() - effect.createdAt;
        const progress = Math.min(1, elapsed / effect.durationMs);
        const growth = progress < 0.2 ? 0.18 + (progress / 0.2) * 0.82 : 1 + ((progress - 0.2) / 0.8) * 0.35;
        const alpha = progress < 0.75 ? 0.98 : 0.98 - ((progress - 0.75) / 0.25) * 0.45;
        const drawWidth = effect.baseWidth * growth;
        const drawHeight = effect.baseHeight * (0.82 + Math.sin(progress * Math.PI * 5) * 0.04);
        const drawY = effect.y + (effect.baseHeight - drawHeight) / 2;
        return { alpha, drawY, drawWidth, drawHeight };
    }

    /**
     * Clears the temporary hurt state after the hurt animation time.
     */
    updateCharacterStates() {
        if (!this.character.isDead && Date.now() - this.character.lastHit >= 500) {
            this.character.isHurt = false;
        }
    }

    /**
     * Checks axis-aligned collision boxes with offsets.
     * @param {Object} a The first box.
     * @param {Object} b The second box.
     * @returns {boolean} True if both boxes overlap.
     */
    isColliding(a, b) {
        return (
            a.x + a.offset.left < b.x + b.width - b.offset.right &&
            a.x + a.width - a.offset.right > b.x + b.offset.left &&
            a.y + a.offset.top < b.y + b.height - b.offset.bottom &&
            a.y + a.height - a.offset.bottom > b.y + b.offset.top
        );
    }

    /**
     * Draws all objects from a list.
     * @param {DrawableObject[]} objects The objects to draw.
     */
    addObjectstoMap(objects) {
        objects.forEach((obj) => this.addToMap(obj));
    }

    /**
     * Draws one object including its optional debug box.
     * @param {DrawableObject} mo The object to draw.
     */
    addToMap(mo) {
        mo.draw(this.ctx);
        mo.drawDebugRect(this.ctx);
    }

    /**
     * Activates the boss encounter when the player reaches the trigger area.
     */
    checkEndbossTrigger() {
        if (!this.endboss || this.endboss.isActivated || this.endboss.isAwakening) return;

        if (this.character.x >= this.endboss.x - 420) {
            this.endboss.activate();
            this.audioManager?.playEvilLaughSound();
            this.startScreenShake(1200);
        }
    }

    /**
     * Updates the endboss behavior.
     */
    updateEndboss() {
        if (this.endboss) {
            this.endboss.updateBehavior(this.character);
        }
    }

    /**
     * Ends the game on player death or after the boss death animation.
     */
    checkGameResult() {
        if (this.character.isDead) {
            this.gameFinished = true;
            this.onGameEnd?.("lose");
            return;
        }

        if (this.endboss?.isDead && this.endboss.deadAnimationFinished) {
            this.gameFinished = true;
            this.onGameEnd?.("win");
        }
    }

    /**
     * Starts a short screen shake effect.
     * @param {number} durationMs The shake duration.
     */
    startScreenShake(durationMs) {
        this.screenShakeUntil = Date.now() + durationMs;
    }

    /**
     * Applies the active screen shake offset to the canvas.
     */
    applyScreenShake() {
        this.isShakingFrame = false;
        if (Date.now() >= this.screenShakeUntil) return;
        const shakeX = (Math.random() - 0.5) * 12;
        const shakeY = (Math.random() - 0.5) * 10;
        this.ctx.save();
        this.ctx.translate(shakeX, shakeY);
        this.isShakingFrame = true;
    }

    /**
     * Restores the canvas after a shake frame.
     */
    resetScreenShake() {
        if (!this.isShakingFrame) return;
        this.ctx.restore();
        this.isShakingFrame = false;
    }
}
