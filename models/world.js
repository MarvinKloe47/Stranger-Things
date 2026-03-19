class World {
    coinStorageKey = "stranger-things-coins";
    specialStorageKey = "stranger-things-special-unlocked";

    constructor(canvas, keyboard, options = {}) {
        this.ctx = canvas.getContext("2d");
        this.keyboard = keyboard;
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
        this.specialEffectImage = new Image();
        this.specialEffectImage.src = "assets/img/9_shop/freigeschaltet/3.png";

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

        this.configureScene();
        this.run();
        this.draw();
    }

    configureScene() {
        this.character.world = this;
        this.character.alignToGround(this.groundY);
        this.enemies.forEach((enemy) => enemy.alignToGround(this.groundY));
        this.character.coins = this.loadStoredCoins();
        this.character.specialUnlocked = this.loadSpecialUnlocked();
        this.coinCounter.setValue(this.character.coins);
        this.bossStatusBar.setPercentage(this.endboss?.energy ?? 100);
        this.onShopUiChange?.();
    }

    loadStoredCoins() {
        try {
            const storedCoins = localStorage.getItem(this.coinStorageKey);
            const parsedCoins = Number(storedCoins);
            return Number.isFinite(parsedCoins) && parsedCoins >= 0 ? parsedCoins : 0;
        } catch (error) {
            return 0;
        }
    }

    saveStoredCoins() {
        try {
            localStorage.setItem(this.coinStorageKey, String(this.character.coins));
        } catch (error) {
            return;
        }
    }

    loadSpecialUnlocked() {
        try {
            return localStorage.getItem(this.specialStorageKey) === "true";
        } catch (error) {
            return false;
        }
    }

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
            this.checkGameResult();
        }, 1000 / 60);
    }

    draw() {
        if (this.isDisposed) return;
        this.ctx.clearRect(0, 0, this.worldWidth, this.worldHeight);
        this.applyScreenShake();
        this.ctx.translate(this.camera_x, 0);
        this.addObjectstoMap(this.backgroundObjects);
        this.clouds.forEach((cloud) => this.addToMap(cloud));
        this.addObjectstoMap(this.coins);
        this.addObjectstoMap(this.enemies);
        this.drawSpecialEffects();
        this.addToMap(this.character);
        this.ctx.translate(-this.camera_x, 0);
        this.resetScreenShake();
        this.addToMap(this.statusBar);
        this.addToMap(this.coinCounter);
        drawBossStatus(this);
        drawAttackCooldown(this);
        drawSpecialCooldown(this);
        gameRequestAnimationFrame(() => this.draw());
    }

    dispose() {
        this.gameFinished = true;
        this.isDisposed = true;
    }

    /**
     * Checks whether the player currently takes damage from enemies.
     */
    checkCollisions() {
        this.enemies.forEach((enemy) => {
            const isActiveEndboss = enemy instanceof Endboss && enemy.isActivated;
            const isEndbossAttack = isActiveEndboss && enemy.isAttacking;
            const isRegularEnemyTouch = !isActiveEndboss && this.isColliding(this.character, enemy);
            const hitsCharacter = isRegularEnemyTouch
                || (isEndbossAttack && this.isColliding(this.character, enemy.getAttackBox()));

            if (!hitsCharacter || !this.canTakeDamage()) return;
            this.character.lastHit = Date.now();
            this.character.isHurt = true;
            this.audioManager?.playHurtSound();
            this.character.energy -= 20;
            this.statusBar.setPercentage(this.character.energy);

            if (this.character.energy <= 0) {
                this.character.isDead = true;
                this.character.energy = 0;
                this.statusBar.setPercentage(this.character.energy);
            }
        });
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
        if (!this.character.isAttacking) return;
        const attackBox = this.character.getAttackBox();

        this.enemies = this.enemies.filter((enemy) => {
            if (enemy instanceof Endboss) {
                if (this.isColliding(attackBox, enemy)) {
                    enemy.takeHit(25, this.character.lastAttackTime);
                    this.bossStatusBar.setPercentage(enemy.energy);
                }
                return true;
            }

            return !this.isColliding(attackBox, enemy);
        });
    }

    /**
     * Triggers the player's special attack effect.
     * @returns {boolean} True if the attack could be activated.
     */
    triggerSpecialAttack() {
        if (this.gameFinished || !this.character.activateSpecial()) return false;
        this.audioManager?.playLaserSound();

        this.activeSpecialEffects.push({
            x: this.character.otherDirection ? this.character.x + 18 : this.character.x + this.character.width - 18,
            y: this.character.y + 76,
            width: 360,
            height: 72,
            direction: this.character.otherDirection ? -1 : 1,
            damage: 55,
            hitIds: new Set(),
            createdAt: Date.now(),
            durationMs: 520,
            baseWidth: 360,
            baseHeight: 72,
            offset: { top: 8, right: 14, bottom: 8, left: 14 },
        });

        return true;
    }

    /**
     * Updates the active special attack beam collisions and lifetime.
     */
    updateSpecialEffects() {
        if (this.activeSpecialEffects.length === 0) return;

        const now = Date.now();
        this.activeSpecialEffects = this.activeSpecialEffects.filter((effect) => {
            const progress = Math.min(1, (now - effect.createdAt) / effect.durationMs);
            const activeWidth = effect.baseWidth * (progress < 0.18 ? progress / 0.18 : 1);
            const collisionBox = {
                x: effect.direction < 0 ? effect.x - activeWidth : effect.x,
                y: effect.y,
                width: activeWidth,
                height: effect.baseHeight,
                offset: effect.offset,
            };

            this.enemies = this.enemies.filter((enemy) => this.keepEnemyAfterSpecialHit(enemy, effect, collisionBox, now));
            return now - effect.createdAt <= effect.durationMs;
        });
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
        this.activeSpecialEffects.forEach((effect) => {
            if (!this.specialEffectImage.complete || this.specialEffectImage.naturalWidth === 0) return;
            const elapsed = Date.now() - effect.createdAt;
            const progress = Math.min(1, elapsed / effect.durationMs);
            const beamGrowth = progress < 0.2 ? 0.18 + (progress / 0.2) * 0.82 : 1 + ((progress - 0.2) / 0.8) * 0.35;
            const alpha = progress < 0.75 ? 0.98 : 0.98 - ((progress - 0.75) / 0.25) * 0.45;
            const drawWidth = effect.baseWidth * beamGrowth;
            const drawHeight = effect.baseHeight * (0.82 + Math.sin(progress * Math.PI * 5) * 0.04);
            const drawY = effect.y + (effect.baseHeight - drawHeight) / 2;
            this.ctx.save();
            this.ctx.globalAlpha = alpha;

            if (effect.direction < 0) {
                this.ctx.translate(effect.x, drawY);
                this.ctx.scale(-1, 1);
                this.ctx.drawImage(this.specialEffectImage, 0, 0, drawWidth, drawHeight);
            } else {
                this.ctx.drawImage(this.specialEffectImage, effect.x, drawY, drawWidth, drawHeight);
            }

            this.ctx.restore();
        });
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
