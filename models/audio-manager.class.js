/**
 * Handles background music, sound effects, and persisted mute state.
 */
class AudioManager {
    storageKey = "stranger-things-music-muted";

    /**
     * @param {string} loopPath Path to the looping background track.
     */
    constructor(loopPath) {
        this.backgroundLoop = new Audio(loopPath);
        this.jumpSound = new Audio("assets/audio/jump.mp3");
        this.hurtSound = new Audio("assets/audio/hurt.mp3");
        this.collectSound = new Audio("assets/audio/Collect_sound.wav");
        this.attackSound = new Audio("assets/audio/Karateka_attack.wav");
        this.laserSound = new Audio("assets/audio/laser_sound.wav");
        this.evilLaughSound = new Audio("assets/audio/evil-laugh.mp3");
        this.backgroundLoop.loop = true;
        this.backgroundLoop.volume = 0.35;
        this.jumpSound.volume = 0.45;
        this.hurtSound.volume = 0.5;
        this.collectSound.volume = 0.45;
        this.attackSound.volume = 0.45;
        this.laserSound.volume = 0.5;
        this.evilLaughSound.volume = 0.6;
        this.isMuted = this.loadMutedPreference();
        this.applyMuteState();
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
