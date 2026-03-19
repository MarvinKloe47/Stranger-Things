const LEVEL_END_X = 3200;
const PLAYER_SAFE_ZONE_X = 520;
const LEVEL_VIEWPORT_WIDTH = 720;
const LEVEL_VIEWPORT_HEIGHT = 480;

/**
 * Returns a random integer inside the given range.
 * @param {number} min The inclusive minimum value.
 * @param {number} max The inclusive maximum value.
 * @returns {number} A random integer between min and max.
 */
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generates spawn positions with a minimum distance between each enemy.
 * @param {number} count The number of positions to create.
 * @param {number} minX The minimum x position.
 * @param {number} maxX The maximum x position.
 * @param {number} minDistance The minimum distance between positions.
 * @returns {number[]} Sorted enemy spawn positions.
 */
function generateEnemySpawns(count, minX, maxX, minDistance) {
    const positions = [];
    let attempts = 0;

    while (positions.length < count && attempts < 500) {
        const x = randomInt(minX, maxX);
        const isFarEnough = positions.every((position) => Math.abs(position - x) >= minDistance);

        if (isFarEnough) {
            positions.push(x);
        }

        attempts++;
    }

    return positions.sort((a, b) => a - b);
}

/**
 * Creates all regular enemies and the boss for level one.
 * @returns {(Orc|Troll|Endboss)[]} The generated enemy list.
 */
function createRandomEnemies() {
    const midOrcPositions = generateEnemySpawns(4, PLAYER_SAFE_ZONE_X, 1800, 220);
    const endOrcPositions = generateEnemySpawns(3, 2100, 2800, 180);
    const midTrollPositions = generateEnemySpawns(3, 820, 2100, 320);
    const endTrollPositions = generateEnemySpawns(2, 2200, 2850, 260);

    const orcs = [...midOrcPositions, ...endOrcPositions].map((x) => new Orc(x));
    const trolls = [...midTrollPositions, ...endTrollPositions].map((x) => new Troll(x));
    const endboss = new Endboss(LEVEL_END_X - 120);

    return [...orcs, ...trolls, endboss].sort((a, b) => a.x - b.x);
}

/**
 * Builds the repeating background object list for level one.
 * @param {number} [worldWidth=LEVEL_VIEWPORT_WIDTH] The viewport width.
 * @param {number} [worldHeight=LEVEL_VIEWPORT_HEIGHT] The viewport height.
 * @returns {BackgroundObject[]} The background object list.
 */
function createBackgroundObjects(worldWidth = LEVEL_VIEWPORT_WIDTH, worldHeight = LEVEL_VIEWPORT_HEIGHT) {
    const brightLayers = [
        { path: "assets/img/5_background/bright/Sky.png", y: 0 },
        { path: "assets/img/5_background/bright/City2.png", y: 0 },
        { path: "assets/img/5_background/bright/back.png", y: 0 },
        { path: "assets/img/5_background/bright/houses1.png", y: 0 },
        { path: "assets/img/5_background/bright/houses3.png", y: 0 },
        { path: "assets/img/5_background/bright/minishop&callbox.png", y: 0 },
        { path: "assets/img/5_background/bright/road&lamps.png", y: 0 },
    ];
    const backgroundRepeats = Math.ceil(LEVEL_END_X / worldWidth) + 1;
    const backgroundObjects = [];

    for (let i = -1; i <= backgroundRepeats; i++) {
        const x = i * worldWidth;
        brightLayers.forEach((layer) => {
            backgroundObjects.push(
                new BackgroundObject(layer.path, x, layer.y, worldWidth, worldHeight)
            );
        });
    }

    return backgroundObjects;
}

/**
 * Creates decorative cloud objects distributed across the full level.
 * @returns {Cloud[]} The cloud list for level one.
 */
function createClouds() {
    return [
        new Cloud(-120, 30),
        new Cloud(380, 70),
        new Cloud(980, 40),
        new Cloud(1560, 95),
        new Cloud(2140, 35),
        new Cloud(2720, 80),
    ];
}

/**
 * Creates the first playable level with enemies, collectibles and backgrounds.
 * @param {number} [worldWidth=LEVEL_VIEWPORT_WIDTH] The viewport width.
 * @param {number} [worldHeight=LEVEL_VIEWPORT_HEIGHT] The viewport height.
 * @returns {Level} The configured level instance.
 */
function createLevel1(worldWidth = LEVEL_VIEWPORT_WIDTH, worldHeight = LEVEL_VIEWPORT_HEIGHT) {
    return new Level(
        createRandomEnemies(),
        createClouds(),
        createBackgroundObjects(worldWidth, worldHeight),
        [
            new Coin(260, 320),
            new Coin(430, 180),
            new Coin(620, 320),
            new Coin(860, 170),
            new Coin(1100, 320),
            new Coin(1380, 190),
            new Coin(1650, 320),
            new Coin(1900, 170),
            new Coin(2180, 320),
            new Coin(2460, 185),
            new Coin(2740, 320),
            new Coin(3010, 165),
        ],
        LEVEL_END_X
    );
}

