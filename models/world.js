class World {
    coinStorageKey = "stranger-things-coins";

    constructor(canvas, keyboard) {
        this.ctx = canvas.getContext("2d");
        this.keyboard = keyboard;
        this.worldWidth = this.ctx.canvas.width;
        this.worldHeight = this.ctx.canvas.height;
        this.groundY = this.worldHeight - 20;

        
        this.character = new Character();
        this.statusBar = new StatusBar();
        this.coinCounter = new CoinCounter();
        this.level = createLevel1();
        this.enemies = this.level.enemies;
        this.clouds = this.level.clouds;
        this.coins = this.level.coins;
        this.endboss = this.enemies.find((enemy) => enemy instanceof Endboss);
        this.screenShakeUntil = 0;
        this.isShakingFrame = false;
        this.gameFinished = false;

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
        this.coinCounter.setValue(this.character.coins);

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

    draw() {

        this.ctx.clearRect(0, 0, this.worldWidth, this.worldHeight);

        this.applyScreenShake();
        this.ctx.translate(this.camera_x, 0);

        this.addObjectstoMap(this.backgroundObjects);
        this.clouds.forEach((cloud) => this.addToMap(cloud));
        this.addObjectstoMap(this.coins);
        this.addObjectstoMap(this.enemies);
        this.addToMap(this.character);

        this.ctx.translate(-this.camera_x, 0);
        this.resetScreenShake();
        this.addToMap(this.statusBar);
        this.addToMap(this.coinCounter);
        this.drawAttackCooldown();

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

            const isBossTouch = isActiveEndboss && this.isColliding(this.character, enemy);
            const canHitCharacter = (isDamageEnemy && this.isColliding(this.character, enemy)) || isEndbossAttack || isBossTouch;

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
                }
                return true;
            }

            return !this.isColliding(attackBox, enemy);
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
}
