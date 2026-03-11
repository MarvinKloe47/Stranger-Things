let canvas;
let world;
let keyboard = new Keyboard();
let startScreen;
let playButton;
let shopButton;
let musicButton;
let musicButtonIcon;
let infoModal;
let controlsModal;
let shopModal;
let audioManager;
let debugMode = false;
let endScreen;
let endScreenImage;
let restartButton;
let menuButton;
let buySpecialButton;
let shopCoinsValue;
let shopSpecialMessage;
let shopUnlockedBanner;
const restartOnLoadKey = "stranger-things-restart-on-load";
const coinStorageKey = "stranger-things-coins";
const specialStorageKey = "stranger-things-special-unlocked";
const specialPrice = 300;


function init()
{
    canvas = document.querySelector("canvas");
    startScreen = document.getElementById("start-screen");
    playButton = document.getElementById("play-button");
    shopButton = document.getElementById("shop-button");
    musicButton = document.getElementById("music-button");
    musicButtonIcon = document.getElementById("music-button-icon");
    infoModal = document.getElementById("info-modal");
    controlsModal = document.getElementById("controls-modal");
    shopModal = document.getElementById("shop-modal");
    endScreen = document.getElementById("end-screen");
    endScreenImage = document.getElementById("end-screen-image");
    restartButton = document.getElementById("restart-button");
    menuButton = document.getElementById("menu-button");
    buySpecialButton = document.getElementById("buy-special-button");
    shopCoinsValue = document.getElementById("shop-coins-value");
    shopSpecialMessage = document.getElementById("shop-special-message");
    shopUnlockedBanner = document.getElementById("shop-unlocked-banner");
    audioManager = new AudioManager("audio/game-loop.mp3");

    playButton?.addEventListener("click", startGame);
    shopButton?.addEventListener("click", openShop);
    musicButton?.addEventListener("click", toggleMusic);
    restartButton?.addEventListener("click", restartGame);
    menuButton?.addEventListener("click", returnToMainMenu);
    buySpecialButton?.addEventListener("click", buySpecialAttack);
    document.getElementById("info-button")?.addEventListener("click", () => openModal(infoModal));
    document.getElementById("control-button")?.addEventListener("click", () => openModal(controlsModal));

    document.querySelectorAll("[data-close-modal='true']").forEach((element) => {
        element.addEventListener("click", closeModals);
    });

    updateMusicButton();
    updateShopUi();

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

function getStoredCoins() {
    try {
        const value = Number(localStorage.getItem(coinStorageKey));
        return Number.isFinite(value) && value >= 0 ? value : 0;
    } catch (error) {
        return 0;
    }
}

function isSpecialUnlocked() {
    try {
        return localStorage.getItem(specialStorageKey) === "true";
    } catch (error) {
        return false;
    }
}

function setSpecialUnlocked(unlocked) {
    try {
        localStorage.setItem(specialStorageKey, String(unlocked));
    } catch (error) {
        return;
    }
}

function setStoredCoins(value) {
    try {
        localStorage.setItem(coinStorageKey, String(value));
    } catch (error) {
        return;
    }
}

function setShopMessage(message, type = "") {
    if (!shopSpecialMessage) return;

    shopSpecialMessage.textContent = message;
    shopSpecialMessage.classList.remove("shop-modal__message--error", "shop-modal__message--success");
    if (type) {
        shopSpecialMessage.classList.add(`shop-modal__message--${type}`);
    }
}

function updateShopUi() {
    const coins = world?.character?.coins ?? getStoredCoins();
    const unlocked = world?.character?.specialUnlocked ?? isSpecialUnlocked();

    if (shopCoinsValue) {
        shopCoinsValue.textContent = String(coins);
    }

    if (buySpecialButton) {
        buySpecialButton.disabled = unlocked;
        buySpecialButton.textContent = unlocked ? "Unlocked" : "Buy Upgrade";
    }

    if (shopUnlockedBanner) {
        shopUnlockedBanner.classList.toggle("hidden", !unlocked);
        shopUnlockedBanner.setAttribute("aria-hidden", unlocked ? "false" : "true");
    }

    if (unlocked) {
        setShopMessage("Special attack unlocked. Use S in-game.", "success");
    } else if (coins < specialPrice) {
        setShopMessage(`You need ${specialPrice - coins} more coins.`, "error");
    } else {
        setShopMessage("Enough coins available. Unlock it now.", "");
    }
}

function openShop() {
    updateShopUi();
    openModal(shopModal);
}

function buySpecialAttack() {
    if (isSpecialUnlocked()) {
        updateShopUi();
        return;
    }

    const currentCoins = world?.character?.coins ?? getStoredCoins();
    if (currentCoins < specialPrice) {
        updateShopUi();
        return;
    }

    const newCoinValue = currentCoins - specialPrice;
    setStoredCoins(newCoinValue);
    setSpecialUnlocked(true);

    if (world) {
        world.character.coins = newCoinValue;
        world.character.specialUnlocked = true;
        world.coinCounter.setValue(newCoinValue);
    }

    updateShopUi();
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
    [infoModal, controlsModal, shopModal].forEach((modal) => {
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

    if (e.code === "KeyB" && !e.repeat && isStartScreenVisible()) {
        openShop();
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

    if (e.code === "KeyS")
        {
            keyboard.S = true;
            world?.triggerSpecialAttack?.();
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
    if (e.code === "KeyS") {
        keyboard.S = false;
    }
});
