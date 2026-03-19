/**
 * Tracks and controls all timers and animation frames created during a game session.
 */
class GameRuntime {
    static intervalIds = [];
    static timeoutIds = [];
    static animationFrameIds = [];

    /**
     * Registers an interval for the current game session.
     * @param {Function} callback The function that should run on each tick.
     * @param {number} delay The interval delay in milliseconds.
     * @returns {number} The interval id.
     */
    static setInterval(callback, delay) {
        const id = window.setInterval(callback, delay);
        this.intervalIds.push(id);
        return id;
    }

    /**
     * Registers a timeout for the current game session.
     * @param {Function} callback The function that should run once.
     * @param {number} delay The timeout delay in milliseconds.
     * @returns {number} The timeout id.
     */
    static setTimeout(callback, delay) {
        const id = window.setTimeout(callback, delay);
        this.timeoutIds.push(id);
        return id;
    }

    /**
     * Registers an animation frame for the current game session.
     * @param {FrameRequestCallback} callback The animation callback.
     * @returns {number} The request id.
     */
    static requestAnimationFrame(callback) {
        const id = window.requestAnimationFrame(callback);
        this.animationFrameIds.push(id);
        return id;
    }

    /**
     * Stops every active timer and animation frame of the current session.
     */
    static clearAll() {
        this.intervalIds.forEach((id) => window.clearInterval(id));
        this.timeoutIds.forEach((id) => window.clearTimeout(id));
        this.animationFrameIds.forEach((id) => window.cancelAnimationFrame(id));
        this.intervalIds = [];
        this.timeoutIds = [];
        this.animationFrameIds = [];
    }
}

/**
 * Creates a tracked interval for the active game runtime.
 * @param {Function} callback Function executed each interval tick.
 * @param {number} delay Interval delay in milliseconds.
 * @returns {number} Browser interval id.
 */
function gameSetInterval(callback, delay) {
    return GameRuntime.setInterval(callback, delay);
}

/**
 * Creates a tracked timeout for the active game runtime.
 * @param {Function} callback Function executed once after the delay.
 * @param {number} delay Timeout delay in milliseconds.
 * @returns {number} Browser timeout id.
 */
function gameSetTimeout(callback, delay) {
    return GameRuntime.setTimeout(callback, delay);
}

/**
 * Creates a tracked animation frame request for the active game runtime.
 * @param {FrameRequestCallback} callback Animation frame callback.
 * @returns {number} Browser animation frame request id.
 */
function gameRequestAnimationFrame(callback) {
    return GameRuntime.requestAnimationFrame(callback);
}
