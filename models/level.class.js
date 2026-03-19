/**
 * Aggregates all world entities and bounds for one playable level.
 */
class Level 
{
    enemies;
    clouds;
    backgroundObjects;
    coins;
    level_end_x;

    /**
     * @param {MovableObjects[]} [enemies=[]] Enemy instances.
     * @param {Cloud[]} [clouds=[]] Cloud instances.
     * @param {BackgroundObject[]} [backgroundObjects=[]] Background layers.
     * @param {Coin[]} [coins=[]] Coin instances.
     * @param {number} [level_end_x=2200] Right boundary of the level.
     */
    constructor(enemies = [], clouds = [], backgroundObjects = [], coins = [], level_end_x = 2200) {
        this.enemies = enemies;
        this.clouds = clouds;
        this.backgroundObjects = backgroundObjects;
        this.coins = coins;
        this.level_end_x = level_end_x;
    }
}
