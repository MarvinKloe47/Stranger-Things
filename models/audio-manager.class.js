/**
 * Handles background music, sound effects, and persisted mute state.
 */
class AudioManager {
    storageKey = "stranger-things-music-muted";

    /**
     * @param {string} loopPath Path to the looping background track.
     */
    constructor(loopPath) {
        this.createAudio(loopPath);
        this.configureVolumes();
        this.isMuted = this.loadMutedPreference();
        this.applyMuteState();
    }

/**
* Handles createAudio.
 * @param {*} loopPath
 */
    createAudio(loopPath) {
        this.backgroundLoop = new Audio(loopPath);
        this.backgroundLoop.loop = true;
        const effectPaths = { jumpSound: "assets/audio/jump.mp3", hurtSound: "assets/audio/hurt.mp3", collectSound: "assets/audio/Collect_sound.wav", attackSound: "assets/audio/Karateka_attack.wav", laserSound: "assets/audio/laser_sound.wav", evilLaughSound: "assets/audio/evil-laugh.mp3" };
        Object.entries(effectPaths).forEach(([key, path]) => {
            this[key] = new Audio(path);
        });
    }

/**
* Handles configureVolumes.
 */
    configureVolumes() {
        const volumes = { backgroundLoop: 0.35, jumpSound: 0.45, hurtSound: 0.5, collectSound: 0.45, attackSound: 0.45, laserSound: 0.5, evilLaughSound: 0.6 };
        Object.entries(volumes).forEach(([key, value]) => {
            this[key].volume = value;
        });
    }

    /**
     * Reads the saved mute preference from local storage.
     * @returns {boolean} True when audio should start muted.
     */
    loadMutedPreference() {
        try {
            return localStorage.getItem(this.storageKey) === "true";
        } catch (error) {
            return false;
        }
    }

    /**
     * Persists the current mute preference.
     */
    saveMutedPreference() {
        try {
            localStorage.setItem(this.storageKey, String(this.isMuted));
        } catch (error) {
            return;
        }
    }

    /**
     * Applies the current mute state to all managed audio instances.
     */
    applyMuteState() {
        this.backgroundLoop.muted = this.isMuted;
        this.jumpSound.muted = this.isMuted;
        this.hurtSound.muted = this.isMuted;
        this.collectSound.muted = this.isMuted;
        this.attackSound.muted = this.isMuted;
        this.laserSound.muted = this.isMuted;
        this.evilLaughSound.muted = this.isMuted;
    }

    /**
     * Toggles global mute state and persists it.
     * @returns {boolean} The new mute state.
     */
    toggleMute() {
        this.isMuted = !this.isMuted;
        this.applyMuteState();
        this.saveMutedPreference();
        return this.isMuted;
    }

    /**
     * Starts the looping background music.
     */
    playBackgroundLoop() {
        this.applyMuteState();
        this.backgroundLoop.play().catch(() => {
            return;
        });
    }

    /**
     * Stops the looping background music.
     */
    stopBackgroundLoop() {
        this.backgroundLoop.pause();
    }

    /**
     * Plays the jump sound effect.
     */
    playJumpSound() {
        this.playEffect(this.jumpSound);
    }

    /**
     * Plays the hurt sound effect.
     */
    playHurtSound() {
        this.playEffect(this.hurtSound);
    }

    /**
     * Plays the collect sound effect.
     */
    playCollectSound() {
        this.playEffect(this.collectSound);
    }

    /**
     * Plays the attack sound effect.
     */
    playAttackSound() {
        this.playEffect(this.attackSound);
    }

    /**
     * Plays the evil laugh sound effect.
     */
    playEvilLaughSound() {
        this.playEffect(this.evilLaughSound);
    }

    /**
     * Plays the laser sound effect.
     */
    playLaserSound() {
        this.playEffect(this.laserSound);
    }

    /**
     * Plays a one-shot sound from the beginning.
     * @param {HTMLAudioElement} audio Audio element to play.
     */
    playEffect(audio) {
        audio.currentTime = 0;
        audio.muted = this.isMuted;
        audio.play().catch(() => {
            return;
        });
    }
}
