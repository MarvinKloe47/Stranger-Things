class AudioManager {
    storageKey = "stranger-things-music-muted";

    constructor(loopPath) {
        this.backgroundLoop = new Audio(loopPath);
        this.jumpSound = new Audio("audio/jump.mp3");
        this.hurtSound = new Audio("audio/hurt.mp3");
        this.collectSound = new Audio("audio/Collect_sound.wav");
        this.attackSound = new Audio("audio/Karateka_attack.wav");
        this.evilLaughSound = new Audio("audio/evil-laugh.mp3");
        this.backgroundLoop.loop = true;
        this.backgroundLoop.volume = 0.35;
        this.jumpSound.volume = 0.45;
        this.hurtSound.volume = 0.5;
        this.collectSound.volume = 0.45;
        this.attackSound.volume = 0.45;
        this.evilLaughSound.volume = 0.6;
        this.isMuted = this.loadMutedPreference();
        this.applyMuteState();
    }

    loadMutedPreference() {
        try {
            return localStorage.getItem(this.storageKey) === "true";
        } catch (error) {
            return false;
        }
    }

    saveMutedPreference() {
        try {
            localStorage.setItem(this.storageKey, String(this.isMuted));
        } catch (error) {
            return;
        }
    }

    applyMuteState() {
        this.backgroundLoop.muted = this.isMuted;
        this.jumpSound.muted = this.isMuted;
        this.hurtSound.muted = this.isMuted;
        this.collectSound.muted = this.isMuted;
        this.attackSound.muted = this.isMuted;
        this.evilLaughSound.muted = this.isMuted;
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        this.applyMuteState();
        this.saveMutedPreference();
        return this.isMuted;
    }

    playBackgroundLoop() {
        this.applyMuteState();
        this.backgroundLoop.play().catch(() => {
            return;
        });
    }

    stopBackgroundLoop() {
        this.backgroundLoop.pause();
    }

    playJumpSound() {
        this.playEffect(this.jumpSound);
    }

    playHurtSound() {
        this.playEffect(this.hurtSound);
    }

    playCollectSound() {
        this.playEffect(this.collectSound);
    }

    playAttackSound() {
        this.playEffect(this.attackSound);
    }

    playEvilLaughSound() {
        this.playEffect(this.evilLaughSound);
    }

    playEffect(audio) {
        audio.currentTime = 0;
        audio.muted = this.isMuted;
        audio.play().catch(() => {
            return;
        });
    }
}
