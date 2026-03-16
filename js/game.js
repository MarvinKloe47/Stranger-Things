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
let rotateOverlay;
let mobileControls;
let mobileJoystick;
let mobileJoystickNub;
let activeJoystickPointerId = null;
let joystickJumpTriggered = false;
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
    rotateOverlay = document.getElementById("rotate-overlay");
    mobileControls = document.getElementById("mobile-controls");
    mobileJoystick = document.getElementById("mobile-joystick");
    mobileJoystickNub = document.getElementById("mobile-joystick-nub");
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

    bindMobileControls();
    updateMusicButton();
    updateShopUi();
    updateOrientationOverlay();

    if (sessionStorage.getItem(restartOnLoadKey) === "true") {
        sessionStorage.removeItem(restartOnLoadKey);
        startGame();
    }
}

function startGame() {
    if (isPortraitMobile()) {
        updateOrientationOverlay();
        return;
    }

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

function isMobileViewport() {
    return window.matchMedia("(hover: none) and (pointer: coarse)").matches || window.innerWidth <= 900;
}

function isPortraitMobile() {
    return isMobileViewport() && window.innerHeight > window.innerWidth;
}

function updateOrientationOverlay() {
    if (!rotateOverlay) return;

    const shouldShow = isPortraitMobile();
    rotateOverlay.classList.toggle("hidden", !shouldShow);
    rotateOverlay.classList.toggle("rotate-overlay--active", shouldShow);
    rotateOverlay.setAttribute("aria-hidden", shouldShow ? "false" : "true");

    if (mobileControls) {
        mobileControls.classList.toggle("hidden", shouldShow);
    }
}

function setControlState(control, isActive) {
    switch (control) {
        case "left":
            keyboard.LEFT = isActive;
            break;
        case "right":
            keyboard.RIGHT = isActive;
            break;
        case "jump":
            keyboard.SPACE = isActive;
            break;
        case "attack":
            keyboard.D = isActive;
            break;
        case "special":
            keyboard.S = isActive;
            if (isActive) {
                world?.triggerSpecialAttack?.();
            }
            break;
    }
}

function resetJoystick() {
    if (mobileJoystickNub) {
        mobileJoystickNub.style.transform = "translate(-50%, -50%)";
    }

    keyboard.LEFT = false;
    keyboard.RIGHT = false;
    keyboard.SPACE = false;
    joystickJumpTriggered = false;
}

function updateJoystickPosition(clientX, clientY) {
    if (!mobileJoystick || !mobileJoystickNub) return;

    const rect = mobileJoystick.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const deltaX = clientX - centerX;
    const deltaY = clientY - centerY;
    const maxDistance = rect.width * 0.28;
    const distance = Math.hypot(deltaX, deltaY);
    const clampedDistance = Math.min(distance, maxDistance);
    const angle = Math.atan2(deltaY, deltaX);
    const knobX = Math.cos(angle) * clampedDistance;
    const knobY = Math.sin(angle) * clampedDistance;

    mobileJoystickNub.style.transform = `translate(calc(-50% + ${knobX}px), calc(-50% + ${knobY}px))`;

    keyboard.LEFT = knobX < -14;
    keyboard.RIGHT = knobX > 14;

    if (knobY < -20 && !joystickJumpTriggered) {
        keyboard.SPACE = true;
        joystickJumpTriggered = true;
    } else if (knobY > -8) {
        keyboard.SPACE = false;
        joystickJumpTriggered = false;
    }
}

function releaseMobileControls() {
    ["attack", "special"].forEach((control) => setControlState(control, false));
    resetJoystick();
}

function bindMobileControls() {
    if (!mobileControls) return;

    if (mobileJoystick) {
        const startJoystick = (event) => {
            event.preventDefault();
            if (isPortraitMobile()) return;

            activeJoystickPointerId = event.pointerId;
            mobileJoystick.setPointerCapture?.(event.pointerId);
            updateJoystickPosition(event.clientX, event.clientY);
        };

        const moveJoystick = (event) => {
            if (event.pointerId !== activeJoystickPointerId) return;
            event.preventDefault();
            updateJoystickPosition(event.clientX, event.clientY);
        };

        const endJoystick = (event) => {
            if (event.pointerId !== activeJoystickPointerId) return;
            event.preventDefault();
            activeJoystickPointerId = null;
            resetJoystick();
        };

        mobileJoystick.addEventListener("pointerdown", startJoystick);
        mobileJoystick.addEventListener("pointermove", moveJoystick);
        mobileJoystick.addEventListener("pointerup", endJoystick);
        mobileJoystick.addEventListener("pointercancel", endJoystick);
        mobileJoystick.addEventListener("lostpointercapture", endJoystick);
    }

    mobileControls.querySelectorAll("[data-mobile-control]").forEach((button) => {
        const control = button.getAttribute("data-mobile-control");
        if (!control) return;

        const activate = (event) => {
            event.preventDefault();
            if (isPortraitMobile()) return;
            setControlState(control, true);
        };

        const deactivate = (event) => {
            event.preventDefault();
            setControlState(control, false);
        };

        button.addEventListener("pointerdown", activate);
        button.addEventListener("pointerup", deactivate);
        button.addEventListener("pointercancel", deactivate);
        button.addEventListener("pointerleave", deactivate);
    });
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

    if (isPortraitMobile()) return;

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

window.addEventListener("resize", updateOrientationOverlay);
window.addEventListener("orientationchange", updateOrientationOverlay);
window.addEventListener("blur", releaseMobileControls);

window.addEventListener("keydown", (e) => {
    if (isPortraitMobile()) return;

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
    if (isPortraitMobile()) return;
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
