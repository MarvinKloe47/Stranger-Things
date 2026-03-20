let canvas;
let world;
let keyboard = new Keyboard();
let startScreen;
let playButton;
let shopButton;
let musicButton;
let musicButtonIcon;
let ingameMusicButton;
let ingameMusicButtonIcon;
let infoModal;
let controlsModal;
let shopModal;
let imprintModal;
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
const coinStorageKey = "stranger-things-coins";
const specialStorageKey = "stranger-things-special-unlocked";
const specialPrice = 300;

/**
 * Initializes DOM references, UI listeners and the audio manager.
 */
function init() {
    cacheDomElements();
    audioManager = new AudioManager("assets/audio/game-loop.mp3");
    DrawableObject.debugMode = debugMode;
    registerUiEvents();
    bindMobileControls();
    updateMusicButton();
    updateShopUi();
    updateOrientationOverlay();
}

/**
 * Caches all DOM elements that are used throughout the game.
 */
function cacheDomElements() {
    canvas = document.querySelector("canvas");
    cachePrimaryMenuDom();
    cacheOverlayDom();
    cacheMobileDom();
    cacheEndScreenDom();
    cacheShopDom();
    cacheExtendedDomElements();
}

/**
 * Caches primary main-menu buttons.
 */
function cachePrimaryMenuDom() {
    startScreen = document.getElementById("start-screen");
    playButton = document.getElementById("play-button");
    shopButton = document.getElementById("shop-button");
    musicButton = document.getElementById("music-button");
    musicButtonIcon = document.getElementById("music-button-icon");
}

/**
 * Caches overlay and modal elements.
 */
function cacheOverlayDom() {
    infoModal = document.getElementById("info-modal");
    controlsModal = document.getElementById("controls-modal");
    shopModal = document.getElementById("shop-modal");
    imprintModal = document.getElementById("imprint-modal");
    rotateOverlay = document.getElementById("rotate-overlay");
}

/**
 * Caches mobile control elements.
 */
function cacheMobileDom() {
    mobileControls = document.getElementById("mobile-controls");
    mobileJoystick = document.getElementById("mobile-joystick");
    mobileJoystickNub = document.getElementById("mobile-joystick-nub");
}

/**
 * Caches end-screen action elements.
 */
function cacheEndScreenDom() {
    endScreen = document.getElementById("end-screen");
    endScreenImage = document.getElementById("end-screen-image");
    restartButton = document.getElementById("restart-button");
    menuButton = document.getElementById("menu-button");
}

/**
 * Caches shop-specific UI references.
 */
function cacheShopDom() {
    buySpecialButton = document.getElementById("buy-special-button");
    shopCoinsValue = document.getElementById("shop-coins-value");
    shopSpecialMessage = document.getElementById("shop-special-message");
}

/**
 * Caches remaining less-frequently used DOM references.
 */
function cacheExtendedDomElements() {
    shopUnlockedBanner = document.getElementById("shop-unlocked-banner");
    ingameMusicButton = document.getElementById("ingame-music-button");
    ingameMusicButtonIcon = document.getElementById("ingame-music-button-icon");
}

/**
 * Registers all UI-specific event listeners.
 */
function registerUiEvents() {
    playButton?.addEventListener("click", startGame);
    shopButton?.addEventListener("click", openShop);
    musicButton?.addEventListener("click", toggleMusic);
    ingameMusicButton?.addEventListener("click", toggleMusic);
    restartButton?.addEventListener("click", restartGame);
    menuButton?.addEventListener("click", returnToMainMenu);
    buySpecialButton?.addEventListener("click", buySpecialAttack);
    document.getElementById("info-button")?.addEventListener("click", () => openModal(imprintModal));
    document.getElementById("control-button")?.addEventListener("click", () => openModal(controlsModal));
    document.getElementById("imprint-link")?.addEventListener("click", handleImprintLinkClick);
    document.querySelectorAll("[data-close-modal='true']").forEach((element) => element.addEventListener("click", closeModals));
    window.addEventListener("contextmenu", preventMobileContextMenu);
}

/**
 * Starts a fresh game if the device orientation is allowed.
 */
function startGame() {
    if (isPortraitMobile()) {
        updateOrientationOverlay();
        return;
    }

    resetGameSession({ returnToMenu: false });
    playButton?.classList.add("menu-button--active");
    gameSetTimeout(createWorldSession, 140);
}

/**
 * Creates the world instance for the active game session.
 */
function createWorldSession() {
    if (world) return;
    world = new World(canvas, keyboard, {
        audioManager,
        onShopUiChange: updateShopUi,
        onGameEnd: showEndScreen,
    });
    audioManager?.playBackgroundLoop();
    startScreen?.classList.add("hidden");
    updateIngameMusicButtonVisibility();
}

/**
 * Toggles the mute state and refreshes the button appearance.
 */
function toggleMusic() {
    audioManager?.toggleMute();
    updateMusicButton();

    if (world && !audioManager?.isMuted) {
        audioManager.playBackgroundLoop();
    }
}

/**
 * Returns true if the current viewport is touch/mobile sized.
 * @returns {boolean} The mobile viewport state.
 */
function isMobileViewport() {
    return window.matchMedia("(hover: none) and (pointer: coarse)").matches || window.innerWidth <= 900;
}

/**
 * Returns true if the current viewport is portrait on mobile.
 * @returns {boolean} The portrait mobile state.
 */
function isPortraitMobile() {
    return isMobileViewport() && window.innerHeight > window.innerWidth;
}

/**
 * Updates the rotate overlay and mobile controls visibility.
 */
function updateOrientationOverlay() {
    if (!rotateOverlay) return;
    const shouldShow = isPortraitMobile();
    rotateOverlay.classList.toggle("hidden", !shouldShow);
    rotateOverlay.classList.toggle("rotate-overlay--active", shouldShow);
    rotateOverlay.setAttribute("aria-hidden", shouldShow ? "false" : "true");
    mobileControls?.classList.toggle("hidden", shouldShow);
    updateIngameMusicButtonVisibility();
}


/**
 * Opens the imprint modal from the footer link.
 * @param {MouseEvent} event The click event.
 */
function handleImprintLinkClick(event) {
    event.preventDefault();
    openModal(imprintModal);
}

window.addEventListener("resize", updateOrientationOverlay);
window.addEventListener("orientationchange", updateOrientationOverlay);
window.addEventListener("blur", releaseMobileControls);

window.addEventListener("keydown", (event) => {
    if (isPortraitMobile()) return;
    if (event.code === "Escape") closeModals();
    if (event.key === "Control" && !event.repeat && isStartScreenVisible()) openModal(controlsModal);
    if (event.code === "KeyB" && !event.repeat && isStartScreenVisible()) openShop();
    if (event.code === "F2") toggleDebugMode(event);
    if (!world) return;
    applyKeyboardInput(event.code, true);
});

window.addEventListener("keyup", (event) => {
    if (!isPortraitMobile() && world) {
        applyKeyboardInput(event.code, false);
    }
});

/**
 * Toggles debug rendering for collision boxes.
 * @param {KeyboardEvent} event The triggering key event.
 */
function toggleDebugMode(event) {
    event.preventDefault();
    debugMode = !debugMode;
    DrawableObject.debugMode = debugMode;
}

/**
 * Maps keyboard codes to the game keyboard state.
 * @param {string} code The pressed keyboard code.
 * @param {boolean} isActive The new key state.
 */
function applyKeyboardInput(code, isActive) {
    const key = getKeyboardStateKey(code);
    if (!key) return;
    keyboard[key] = isActive;
    if (code === "KeyS" && isActive) world?.triggerSpecialAttack?.();
}

/**
 * Maps browser keyboard codes to game keyboard-state keys.
 * @param {string} code Browser keyboard code.
 * @returns {string|undefined} Matching keyboard-state key.
 */
function getKeyboardStateKey(code) {
    const keyMap = { ArrowRight: "RIGHT", ArrowLeft: "LEFT", ArrowDown: "DOWN", Space: "SPACE", KeyD: "D", KeyS: "S" };
    return keyMap[code];
}
