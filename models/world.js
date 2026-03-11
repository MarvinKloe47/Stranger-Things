class World {
    coinStorageKey = "stranger-things-coins";
    specialStorageKey = "stranger-things-special-unlocked";

    constructor(canvas, keyboard) {
        this.ctx = canvas.getContext("2d");
        this.keyboard = keyboard;
        this.worldWidth = this.ctx.canvas.width;
        this.worldHeight = this.ctx.canvas.height;
        this.groundY = this.worldHeight - 20;

        
        this.character = new Character();
        this.statusBar = new StatusBar();
        this.bossStatusBar = new BossStatusBar();
        this.coinCounter = new CoinCounter();
        this.level = createLevel1();
        this.enemies = this.level.enemies;
        this.clouds = this.level.clouds;
        this.coins = this.level.coins;
        this.endboss = this.enemies.find((enemy) => enemy instanceof Endboss);
        this.screenShakeUntil = 0;
        this.isShakingFrame = false;
        this.gameFinished = false;
        this.activeSpecialEffects = [];
        this.specialEffectImage = new Image();
        this.specialEffectImage.src = "img/9_shop/freigeschaltet/3.png";

        const brightLayers = [
            { path: "img/5_background/bright/Sky.png", y: 0 },
            { path: "img/5_background/bright/City2.png", y: 0 },
            { path: "img/5_background/bright/back.png", y: 0 },
            { path: "img/5_background/bright/houses1.png", y: 0 },
            { path: "img/5_background/bright/houses3.png", y: 0 },
            { path: "img/5_background/bright/minishop&callbox.png", y: 0 },
            { path: "img/5_background/bright/road&lamps.png", y: 0 },
        ];
        this.backgroundObjects = [];
        const backgroundRepeats = Math.ceil(this.level.level_end_x / this.worldWidth) + 1;
        for (let i = -1; i <= backgroundRepeats; i++) {
            const x = i * this.worldWidth;
            brightLayers.forEach((layer) => {
                this.backgroundObjects.push(
                    new BackgroundObject(layer.path, x, layer.y, this.worldWidth, this.worldHeight)
                );
            });
        }

        this.camera_x = 0;
        this.character.alignToGround(this.groundY);
        this.enemies.forEach((enemy) => enemy.alignToGround(this.groundY));
        this.character.coins = this.loadStoredCoins();
        this.character.specialUnlocked = this.loadSpecialUnlocked();
        this.coinCounter.setValue(this.character.coins);
        this.bossStatusBar.setPercentage(this.endboss?.energy ?? 100);
        if (typeof updateShopUi === "function") {
            updateShopUi();
        }

        this.setWorld();
        this.run();
        this.draw();
    }

    setWorld() {
        this.character.world = this;
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

    draw() {

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
        this.drawBossStatus();
        this.drawAttackCooldown();
        this.drawSpecialCooldown();

        requestAnimationFrame(() => this.draw());
    }

    run() {
        setInterval(() => {
            if (this.gameFinished) return;

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

    checkCollisions() {
        this.enemies.forEach((enemy) => {
            const isActiveEndboss =
                (typeof Endboss !== "undefined" && enemy instanceof Endboss && enemy.isActivated);
            const isEndbossAttack =
                isActiveEndboss && enemy.isAttacking && this.isColliding(this.character, enemy.getAttackBox());
            const isDamageEnemy =
                (typeof Demogorgon !== "undefined" && enemy instanceof Demogorgon) ||
                (typeof demogorgon !== "undefined" && enemy instanceof demogorgon) ||
                (typeof Orc !== "undefined" && enemy instanceof Orc) ||
                isActiveEndboss;

            const isRegularEnemyTouch = !isActiveEndboss && this.isColliding(this.character, enemy);
            const canHitCharacter = isRegularEnemyTouch || isEndbossAttack;

            if (canHitCharacter && this.canTakeDamage()) {
                console.log("Character kollidiert mit Gegner");
                this.character.lastHit = Date.now();
                this.character.isHurt = true;
                if (typeof audioManager !== "undefined") {
                    audioManager.playHurtSound();
                }
                this.character.energy -= 20;
                this.statusBar.setPercentage(this.character.energy);
                console.log("-20 Energie, verbleibende Energie: " + this.character.energy);
                if (this.character.energy <= 0) {
                    this.character.isDead = true;
                    this.character.energy = 0;
                    this.statusBar.setPercentage(this.character.energy);
                    console.log("Character ist tot");
                }
            }
        });
    }

    canTakeDamage() {
        const hurtCooldownMs = 500;
        return !this.character.isDead && Date.now() - this.character.lastHit >= hurtCooldownMs;
    }

    checkCoinCollisions() {
        this.coins = this.coins.filter((coin) => {
            if (!this.isColliding(this.character, coin)) {
                return true;
            }

            this.character.coins += 1;
            this.coinCounter.setValue(this.character.coins);
            this.saveStoredCoins();
            if (typeof updateShopUi === "function") {
                updateShopUi();
            }
            if (typeof audioManager !== "undefined") {
                audioManager.playCollectSound();
            }
            console.log("Coins gesammelt: " + this.character.coins);
            return false;
        });
    }

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

    triggerSpecialAttack() {
        if (this.gameFinished || !this.character.activateSpecial()) return false;

        if (typeof audioManager !== "undefined") {
            audioManager.playLaserSound();
        }

        const maxWidth = 360;
        const x = this.character.otherDirection
            ? this.character.x + 18
            : this.character.x + this.character.width - 18;
        const y = this.character.y + 76;
        const direction = this.character.otherDirection ? -1 : 1;

        this.activeSpecialEffects.push({
            x,
            y,
            width: maxWidth,
            height: 72,
            direction,
            damage: 55,
            hitIds: new Set(),
            createdAt: Date.now(),
            durationMs: 520,
            baseWidth: maxWidth,
            baseHeight: 72,
            offset: {
                top: 8,
                right: 14,
                bottom: 8,
                left: 14,
            },
        });

        return true;
    }

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

            this.enemies = this.enemies.filter((enemy) => {
                if (effect.hitIds.has(enemy)) return true;
                if (!this.isColliding(collisionBox, enemy)) return true;

                effect.hitIds.add(enemy);
                if (enemy instanceof Endboss) {
                    enemy.takeHit(effect.damage, `${now}-${collisionBox.x}`);
                    this.bossStatusBar.setPercentage(enemy.energy);
                    return true;
                }

                return false;
            });

            const isExpired = now - effect.createdAt > effect.durationMs;
            return !isExpired;
        });
    }

    drawSpecialEffects() {
        this.activeSpecialEffects.forEach((effect) => {
            if (!this.specialEffectImage.complete || this.specialEffectImage.naturalWidth === 0) return;

            const elapsed = Date.now() - effect.createdAt;
            const progress = Math.min(1, elapsed / effect.durationMs);
            const beamGrowth = progress < 0.2
                ? 0.18 + (progress / 0.2) * 0.82
                : 1 + ((progress - 0.2) / 0.8) * 0.35;
            const alpha = progress < 0.75
                ? 0.98
                : 0.98 - ((progress - 0.75) / 0.25) * 0.45;
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

    updateCharacterStates() {
        const hurtDurationMs = 500;
        const timeSinceLastHit = Date.now() - this.character.lastHit;

        if (!this.character.isDead && timeSinceLastHit >= hurtDurationMs) {
            this.character.isHurt = false;
        }
    }

    isColliding(a, b) {
        return (
            a.x + a.offset.left < b.x + b.width - b.offset.right &&
            a.x + a.width - a.offset.right > b.x + b.offset.left &&
            a.y + a.offset.top < b.y + b.height - b.offset.bottom &&
            a.y + a.height - a.offset.bottom > b.y + b.offset.top
        );
    }

    addObjectstoMap(objects) {
        objects.forEach((obj) => this.addToMap(obj));
    }

    addToMap(mo) {
        mo.draw(this.ctx);
        mo.drawDebugRect(this.ctx);
    }

    checkEndbossTrigger() {
        if (!this.endboss || this.endboss.isActivated || this.endboss.isAwakening) return;

        const triggerDistance = 420;
        if (this.character.x >= this.endboss.x - triggerDistance) {
            this.endboss.activate();
            if (typeof audioManager !== "undefined") {
                audioManager.playEvilLaughSound();
            }
            this.startScreenShake(1200);
        }
    }

    updateEndboss() {
        if (!this.endboss) return;
        this.endboss.updateBehavior(this.character);
    }

    checkGameResult() {
        if (this.character.isDead) {
            this.gameFinished = true;
            if (typeof showEndScreen === "function") {
                showEndScreen("lose");
            }
            return;
        }

        if (this.endboss?.isDead && this.endboss.deadAnimationFinished) {
            this.gameFinished = true;
            if (typeof showEndScreen === "function") {
                showEndScreen("win");
            }
        }
    }

    startScreenShake(durationMs) {
        this.screenShakeUntil = Date.now() + durationMs;
    }

    applyScreenShake() {
        this.isShakingFrame = false;
        if (Date.now() >= this.screenShakeUntil) return;

        const shakeX = (Math.random() - 0.5) * 12;
        const shakeY = (Math.random() - 0.5) * 10;
        this.ctx.save();
        this.ctx.translate(shakeX, shakeY);
        this.isShakingFrame = true;
    }

    resetScreenShake() {
        if (!this.isShakingFrame) return;
        this.ctx.restore();
        this.isShakingFrame = false;
    }

    drawAttackCooldown() {
        const progress = this.character.getAttackCooldownProgress();
        const x = this.worldWidth - 180;
        const y = 24;
        const width = 140;
        const height = 18;

        this.ctx.save();
        this.ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
        this.ctx.fillRect(x, y, width, height);

        this.ctx.fillStyle = progress >= 1 ? "#80ff72" : "#ff9f43";
        this.ctx.fillRect(x, y, width * progress, height);

        this.ctx.lineWidth = 2;
        this.ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
        this.ctx.strokeRect(x, y, width, height);

        this.ctx.fillStyle = "white";
        this.ctx.font = "12px Arial";
        this.ctx.fillText("Attack D", x, y - 6);
        this.ctx.restore();
    }

    drawBossStatus() {
        if (!this.endboss?.isActivated) return;

        this.addToMap(this.bossStatusBar);

        this.ctx.save();
        this.ctx.fillStyle = "#fff7dd";
        this.ctx.strokeStyle = "rgba(20, 10, 0, 0.8)";
        this.ctx.lineWidth = 4;
        this.ctx.font = "bold 20px Arial";
        this.ctx.textAlign = "center";
        this.ctx.textBaseline = "top";
        const textX = this.bossStatusBar.x + this.bossStatusBar.width / 2;
        const textY = this.bossStatusBar.y - 6;
        this.ctx.strokeText("Boss: Toto der Troll", textX, textY);
        this.ctx.fillText("Boss: Toto der Troll", textX, textY);
        this.ctx.restore();
    }

    drawSpecialCooldown() {
        if (!this.character.specialUnlocked) return;

        const progress = this.character.getSpecialCooldownProgress();
        const x = this.worldWidth - 180;
        const y = 62;
        const width = 140;
        const height = 18;

        this.ctx.save();
        this.ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
        this.ctx.fillRect(x, y, width, height);

        this.ctx.fillStyle = progress >= 1 ? "#7be8ff" : "#42b7ff";
        this.ctx.fillRect(x, y, width * progress, height);

        this.ctx.lineWidth = 2;
        this.ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
        this.ctx.strokeRect(x, y, width, height);

        this.ctx.fillStyle = "white";
        this.ctx.font = "12px Arial";
        this.ctx.fillText("Special S", x, y - 6);
        this.ctx.restore();
    }
}
