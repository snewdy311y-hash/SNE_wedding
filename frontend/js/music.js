/**
 * =============================================================================
 * MUSIC.JS - Audio Player untuk Undangan
 * =============================================================================
 */

class MusicPlayer {
    constructor() {
        this.audio = null;
        this.isPlaying = false;
        this.isMuted = false;
        this.volume = 0.5;
        this.button = null;
        this.icon = null;
    }

    /**
     * Initialize music player
     * @param {string} musicUrl - URL file musik
     * @param {string} buttonId - ID button toggle
     */
    init(musicUrl, buttonId = 'music-toggle') {
        // Create audio element
        this.audio = new Audio(musicUrl);
        this.audio.loop = true;
        this.audio.volume = this.volume;

        // Get button element
        this.button = document.getElementById(buttonId);
        if (this.button) {
            this.icon = this.button.querySelector('i') || this.button;
            this.button.addEventListener('click', () => this.toggle());
        }

        // Handle audio events
        this.audio.addEventListener('play', () => {
            this.isPlaying = true;
            this.updateIcon();
        });

        this.audio.addEventListener('pause', () => {
            this.isPlaying = false;
            this.updateIcon();
        });

        this.audio.addEventListener('error', (e) => {
            console.error('Music load error:', e);
        });

        // Auto-play after user interaction (required by browsers)
        document.addEventListener('click', () => this.tryAutoPlay(), { once: true });
        document.addEventListener('touchstart', () => this.tryAutoPlay(), { once: true });
    }

    /**
     * Try to auto-play music
     */
    tryAutoPlay() {
        if (!this.isPlaying && this.audio) {
            this.play();
        }
    }

    /**
     * Play music
     */
    play() {
        if (this.audio) {
            const playPromise = this.audio.play();
            if (playPromise !== undefined) {
                playPromise
                    .then(() => {
                        this.isPlaying = true;
                        this.updateIcon();
                    })
                    .catch(error => {
                        console.log('Auto-play prevented:', error);
                    });
            }
        }
    }

    /**
     * Pause music
     */
    pause() {
        if (this.audio) {
            this.audio.pause();
            this.isPlaying = false;
            this.updateIcon();
        }
    }

    /**
     * Toggle play/pause
     */
    toggle() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }

    /**
     * Set volume (0-1)
     * @param {number} value 
     */
    setVolume(value) {
        this.volume = Math.max(0, Math.min(1, value));
        if (this.audio) {
            this.audio.volume = this.volume;
        }
    }

    /**
     * Toggle mute
     */
    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.audio) {
            this.audio.muted = this.isMuted;
        }
        this.updateIcon();
    }

    /**
     * Update button icon
     */
    updateIcon() {
        if (!this.button) return;

        if (this.isPlaying && !this.isMuted) {
            this.button.classList.add('playing');
            this.button.classList.remove('paused');
            this.button.innerHTML = '<i class="fas fa-music"></i>';
            this.button.title = 'Pause Music';
        } else {
            this.button.classList.remove('playing');
            this.button.classList.add('paused');
            this.button.innerHTML = '<i class="fas fa-volume-mute"></i>';
            this.button.title = 'Play Music';
        }
    }
}

// Global instance
const musicPlayer = new MusicPlayer();
