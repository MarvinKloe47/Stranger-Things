const LEVEL_END_X = 3200;
const PLAYER_SAFE_ZONE_X = 520;

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

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

function createRandomEnemies() {
    const midOrcPositions = generateEnemySpawns(4, PLAYER_SAFE_ZONE_X, 1800, 220);
    const endOrcPositions = generateEnemySpawns(3, 2100, 2800, 180);
    const midDemogorgonPositions = generateEnemySpawns(3, 820, 2100, 320);
    const endDemogorgonPositions = generateEnemySpawns(2, 2200, 2850, 260);

    const orcs = [...midOrcPositions, ...endOrcPositions].map((x) => new Orc(x));
    const demogorgons = [...midDemogorgonPositions, ...endDemogorgonPositions].map((x) => new demogorgon(x));
    const endboss = new Endboss(LEVEL_END_X - 120);

    return [...orcs, ...demogorgons, endboss].sort((a, b) => a.x - b.x);
}

function createLevel1() {
    return new Level(
        createRandomEnemies(),
        [
            new Cloud(),
        ],
        [],
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
