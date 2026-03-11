let canvas;
let world;
let keyboard = new Keyboard();
let startScreen;
let playButton;
let musicButton;
let musicButtonIcon;
let infoModal;
let controlsModal;
let audioManager;
let debugMode = false;
let endScreen;
let endScreenImage;
let restartButton;
let menuButton;
const restartOnLoadKey = "stranger-things-restart-on-load";


function init()
{
    canvas = document.querySelector("canvas");
    startScreen = document.getElementById("start-screen");
    playButton = document.getElementById("play-button");
    musicButton = document.getElementById("music-button");
    musicButtonIcon = document.getElementById("music-button-icon");
    infoModal = document.getElementById("info-modal");
    controlsModal = document.getElementById("controls-modal");
    endScreen = document.getElementById("end-screen");
    endScreenImage = document.getElementById("end-screen-image");
    restartButton = document.getElementById("restart-button");
    menuButton = document.getElementById("menu-button");
    audioManager = new AudioManager("audio/game-loop.mp3");

    playButton?.addEventListener("click", startGame);
    musicButton?.addEventListener("click", toggleMusic);
    restartButton?.addEventListener("click", restartGame);
    menuButton?.addEventListener("click", returnToMainMenu);
    document.getElementById("info-button")?.addEventListener("click", () => openModal(infoModal));
    document.getElementById("control-button")?.addEventListener("click", () => openModal(controlsModal));

    document.querySelectorAll("[data-close-modal='true']").forEach((element) => {
        element.addEventListener("click", closeModals);
    });

    updateMusicButton();

    if (sessionStorage.getItem(restartOnLoadKey) === "true") {
        sessionStorage.removeItem(restartOnLoadKey);
        startGame();
    }
}

function startGame() {
    playButton?.classList.add("menu-button--active");

    setTimeout(() => {
        if (!world) {
            world = new World(canvas, keyboard);
        }

        audioManager?.playBackgroundLoop();
        startScreen?.classList.add("hidden");
    }, 140);
}

function toggleMusic() {
    audioManager?.toggleMute();
    updateMusicButton();

    if (world && !audioManager?.isMuted) {
        audioManager.playBackgroundLoop();
    }
}

function updateMusicButton() {
    const isMuted = audioManager?.isMuted ?? false;

    if (musicButtonIcon) {
        musicButtonIcon.src = isMuted
            ? "img/7_ProjectIMG/music_off.png"
            : "img/7_ProjectIMG/misic.png";
    }

    if (musicButton) {
        musicButton.setAttribute("aria-label", isMuted ? "Music off" : "Music on");
    }
}

function isStartScreenVisible() {
    return !!startScreen && !startScreen.classList.contains("hidden");
}

function openModal(modal) {
    if (!modal) return;

    modal.classList.remove("hidden");
    modal.setAttribute("aria-hidden", "false");
}

function closeModals() {
    [infoModal, controlsModal].forEach((modal) => {
        if (!modal) return;

        modal.classList.add("hidden");
        modal.setAttribute("aria-hidden", "true");
    });
}

function showEndScreen(type) {
    if (!endScreen || !endScreenImage) return;

    endScreenImage.src = type === "win"
        ? "img/7_ProjectIMG/win_2.png"
        : "img/7_ProjectIMG/oh no you lost!.png";
    endScreenImage.alt = type === "win" ? "You win" : "You lost";
    endScreen.classList.remove("hidden");
    endScreen.setAttribute("aria-hidden", "false");
}

function restartGame() {
    sessionStorage.setItem(restartOnLoadKey, "true");
    window.location.reload();
}

function returnToMainMenu() {
    sessionStorage.removeItem(restartOnLoadKey);
    window.location.reload();
}

window.addEventListener("keydown", (e) => {
    if (e.code === "Escape") {
        closeModals();
    }

    if (e.key === "Control" && !e.repeat && isStartScreenVisible()) {
        openModal(controlsModal);
    }

    if (e.code === "F2") {
        e.preventDefault();
        debugMode = !debugMode;
        console.log("Debug mode:", debugMode ? "an" : "aus");
    }

    if (!world) return;

    if (e.code === "ArrowRight") 
        {
           keyboard.RIGHT = true; 
        }
    if (e.code === "ArrowLeft")
        {
            keyboard.LEFT = true;
        }
    if (e.code === "ArrowDown")
        {
            keyboard.DOWN = true;
        }

    if (e.code === "Space")
        {
            keyboard.SPACE = true;
        }

    if (e.code === "KeyD")
        {
            keyboard.D = true;
        }
});

window.addEventListener("keyup", (e) => {
    if (!world) return;

    if (e.code === "ArrowRight") {
        keyboard.RIGHT = false;
    }
    if (e.code === "ArrowLeft") {
        keyboard.LEFT = false;
    }
    if (e.code === "ArrowDown") {
        keyboard.DOWN = false;
    }
    if (e.code === "Space") {
        keyboard.SPACE = false;
    }
    if (e.code === "KeyD") {
        keyboard.D = false;
    }
});
