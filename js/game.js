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
 * Activates or deactivates a control flag on the keyboard state.
 * @param {string} control The control identifier.
 * @param {boolean} isActive The new active state.
 */
function setControlState(control, isActive) {
    const key = getControlKey(control);
    if (!key) return;
    keyboard[key] = isActive;
    if (control === "special" && isActive) world?.triggerSpecialAttack?.();
}

/**
 * Resolves one mobile control identifier to keyboard state key.
 * @param {string} control Mobile control id.
 * @returns {string|undefined} Keyboard state key.
 */
function getControlKey(control) {
    const controlMap = { left: "LEFT", right: "RIGHT", jump: "SPACE", attack: "D", special: "S" };
    return controlMap[control];
}

/**
 * Resets the mobile joystick and active movement flags.
 */
function resetJoystick() {
    if (mobileJoystickNub) {
        mobileJoystickNub.style.transform = "translate(-50%, -50%)";
    }
    keyboard.LEFT = false;
    keyboard.RIGHT = false;
    keyboard.SPACE = false;
    joystickJumpTriggered = false;
}

/**
 * Updates the joystick visual position and mapped movement controls.
 * @param {number} clientX The pointer x position.
 * @param {number} clientY The pointer y position.
 */
function updateJoystickPosition(clientX, clientY) {
    if (!mobileJoystick || !mobileJoystickNub) return;
    const rect = mobileJoystick.getBoundingClientRect();
    const vector = getJoystickVector(rect, clientX, clientY);
    applyJoystickVector(vector.knobX, vector.knobY);
}

/**
 * Computes a clamped joystick vector for the current pointer position.
 * @param {DOMRect} rect Joystick bounds.
 * @param {number} clientX Pointer x.
 * @param {number} clientY Pointer y.
 * @returns {{knobX:number,knobY:number}} Clamped joystick vector.
 */
function getJoystickVector(rect, clientX, clientY) {
    const deltaX = clientX - (rect.left + rect.width / 2);
    const deltaY = clientY - (rect.top + rect.height / 2);
    const maxDistance = rect.width * 0.28;
    const clamped = Math.min(Math.hypot(deltaX, deltaY), maxDistance);
    const angle = Math.atan2(deltaY, deltaX);
    return { knobX: Math.cos(angle) * clamped, knobY: Math.sin(angle) * clamped };
}

/**
 * Applies joystick movement vector to visuals and keyboard state.
 * @param {number} knobX Horizontal vector.
 * @param {number} knobY Vertical vector.
 */
function applyJoystickVector(knobX, knobY) {
    mobileJoystickNub.style.transform = `translate(calc(-50% + ${knobX}px), calc(-50% + ${knobY}px))`;
    keyboard.LEFT = knobX < -14;
    keyboard.RIGHT = knobX > 14;
    updateJumpState(knobY);
}

/**
 * Handles joystick jump activation based on the vertical offset.
 * @param {number} knobY The vertical joystick offset.
 */
function updateJumpState(knobY) {
    if (knobY < -20 && !joystickJumpTriggered) {
        keyboard.SPACE = true;
        joystickJumpTriggered = true;
        return;
    }

    if (knobY > -8) {
        keyboard.SPACE = false;
        joystickJumpTriggered = false;
    }
}

/**
 * Releases all active mobile controls.
 */
function releaseMobileControls() {
    ["attack", "special"].forEach((control) => setControlState(control, false));
    resetJoystick();
}

/**
 * Binds the mobile joystick and touch buttons.
 */
function bindMobileControls() {
    if (!mobileControls) return;
    bindJoystickEvents();
    bindActionButtonEvents();
}

/**
 * Binds pointer events for the mobile joystick.
 */
function bindJoystickEvents() {
    if (!mobileJoystick) return;
    mobileJoystick.addEventListener("pointerdown", handleJoystickPointerDown);
    mobileJoystick.addEventListener("pointermove", handleJoystickPointerMove);
    bindJoystickReleaseEvents();
}

/**
 * Handles joystick pointer-down input.
 * @param {PointerEvent} event Pointer event.
 */
function handleJoystickPointerDown(event) {
    event.preventDefault();
    if (isPortraitMobile()) return;
    activeJoystickPointerId = event.pointerId;
    mobileJoystick.setPointerCapture?.(event.pointerId);
    updateJoystickPosition(event.clientX, event.clientY);
}

/**
 * Handles joystick pointer-move input.
 * @param {PointerEvent} event Pointer event.
 */
function handleJoystickPointerMove(event) {
    if (event.pointerId !== activeJoystickPointerId) return;
    event.preventDefault();
    updateJoystickPosition(event.clientX, event.clientY);
}

/**
 * Binds pointer release/cancel events for joystick control.
 */
function bindJoystickReleaseEvents() {
    ["pointerup", "pointercancel", "lostpointercapture"].forEach((eventName) => {
        mobileJoystick.addEventListener(eventName, handleJoystickPointerRelease);
    });
}

/**
 * Handles joystick pointer release and resets movement.
 * @param {PointerEvent} event Pointer event.
 */
function handleJoystickPointerRelease(event) {
    if (event.pointerId !== activeJoystickPointerId) return;
    event.preventDefault();
    activeJoystickPointerId = null;
    resetJoystick();
}

/**
 * Binds pointer events for the mobile action buttons.
 */
function bindActionButtonEvents() {
    mobileControls.querySelectorAll("[data-mobile-control]").forEach((button) => {
        const control = button.getAttribute("data-mobile-control");
        if (!control) return;
        bindActionButtonPress(button, control);
        bindActionButtonRelease(button, control);
    });
}

/**
 * Binds pointer-down behavior for one action button.
 * @param {HTMLElement} button Action button element.
 * @param {string} control Control id.
 */
function bindActionButtonPress(button, control) {
    button.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        if (!isPortraitMobile()) setControlState(control, true);
    });
}

/**
 * Binds pointer release behavior for one action button.
 * @param {HTMLElement} button Action button element.
 * @param {string} control Control id.
 */
function bindActionButtonRelease(button, control) {
    ["pointerup", "pointercancel", "pointerleave"].forEach((eventName) => {
        button.addEventListener(eventName, (event) => {
            event.preventDefault();
            setControlState(control, false);
        });
    });
}

/**
 * Prevents the mobile context menu during touch gameplay.
 * @param {MouseEvent} event The contextmenu event.
 */
function preventMobileContextMenu(event) {
    if (isMobileViewport()) {
        event.preventDefault();
    }
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
