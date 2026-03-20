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
     * Marks the world as disposed and stops future gameplay progression.
     */
    dispose() {
        this.gameFinished = true;
        this.isDisposed = true;
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
}
