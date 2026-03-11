class Level 
{
    enemies;
    clouds;
    backgroundObjects;
    coins;
    level_end_x;

    constructor(enemies = [], clouds = [], backgroundObjects = [], coins = [], level_end_x = 2200) {
        this.enemies = enemies;
        this.clouds = clouds;
        this.backgroundObjects = backgroundObjects;
        this.coins = coins;
        this.level_end_x = level_end_x;
    }
}
