/**
 * Updates the visible music button state.
 */
function updateMusicButton() {
    const isMuted = audioManager?.isMuted ?? false;

    if (musicButtonIcon) {
        musicButtonIcon.src = isMuted
            ? "assets/img/7_ProjectIMG/music_off.png"
            : "assets/img/7_ProjectIMG/misic.png";
    }

    if (musicButton) {
        musicButton.setAttribute("aria-label", isMuted ? "Music off" : "Music on");
    }
}

/**
 * Reads the stored coin amount from local storage.
 * @returns {number} The stored coin amount.
 */
function getStoredCoins() {
    try {
        const value = Number(localStorage.getItem(coinStorageKey));
        return Number.isFinite(value) && value >= 0 ? value : 0;
    } catch (error) {
        return 0;
    }
}

/**
 * Reads the stored special unlock state.
 * @returns {boolean} True if the special attack is unlocked.
 */
function isSpecialUnlocked() {
    try {
        return localStorage.getItem(specialStorageKey) === "true";
    } catch (error) {
        return false;
    }
}

/**
 * Persists the special unlock state.
 * @param {boolean} unlocked The new unlock state.
 */
function setSpecialUnlocked(unlocked) {
    try {
        localStorage.setItem(specialStorageKey, String(unlocked));
    } catch (error) {
        return;
    }
}

/**
 * Persists the current coin amount.
 * @param {number} value The coin amount to store.
 */
function setStoredCoins(value) {
    try {
        localStorage.setItem(coinStorageKey, String(value));
    } catch (error) {
        return;
    }
}

/**
 * Sets the current feedback message inside the shop modal.
 * @param {string} message The text shown to the player.
 * @param {string} [type=""] Optional message type for styling.
 */
function setShopMessage(message, type = "") {
    if (!shopSpecialMessage) return;

    shopSpecialMessage.textContent = message;
    shopSpecialMessage.classList.remove("shop-modal__message--error", "shop-modal__message--success");
    if (type) {
        shopSpecialMessage.classList.add(`shop-modal__message--${type}`);
    }
}

/**
 * Synchronizes the shop UI with the current world and storage state.
 */
function updateShopUi() {
    const coins = world?.character?.coins ?? getStoredCoins();
    const unlocked = world?.character?.specialUnlocked ?? isSpecialUnlocked();
    updateShopCoinText(coins);
    updateSpecialButtonState(unlocked);
    updateShopStatusMessage(coins, unlocked);
}

/**
 * Updates the coin text in the shop UI.
 * @param {number} coins Current coin amount.
 */
function updateShopCoinText(coins) {
    if (!shopCoinsValue) return;
    shopCoinsValue.textContent = String(coins);
}

/**
 * Updates the buy button based on unlock state.
 * @param {boolean} unlocked Whether special attack is unlocked.
 */
function updateSpecialButtonState(unlocked) {
    if (!buySpecialButton) return;
    buySpecialButton.disabled = unlocked;
    buySpecialButton.textContent = unlocked ? "Unlocked" : "Buy Upgrade";
}

/**
 * Updates the informational shop message.
 * @param {number} coins Current coin amount.
 * @param {boolean} unlocked Whether special attack is unlocked.
 */
function updateShopStatusMessage(coins, unlocked) {
    if (unlocked) return setShopMessage("Special attack unlocked. Use S in-game.", "success");
    if (coins < specialPrice) return setShopMessage(`You need ${specialPrice - coins} more coins.`, "error");
    setShopMessage("Enough coins available. Unlock it now.", "");
}

/**
 * Opens the shop modal after refreshing the displayed values.
 */
function openShop() {
    updateShopUi();
    openModal(shopModal);
}

/**
 * Unlocks the special attack when enough coins are available.
 */
function buySpecialAttack() {
    if (isSpecialUnlocked()) return updateShopUi();
    const currentCoins = world?.character?.coins ?? getStoredCoins();
    if (currentCoins < specialPrice) return updateShopUi();
    const newCoinValue = currentCoins - specialPrice;
    persistSpecialPurchase(newCoinValue);
    applySpecialPurchaseToWorld(newCoinValue);
    updateShopUi();
}

/**
 * Persists changes after a successful special purchase.
 * @param {number} coinValue Remaining coins.
 */
function persistSpecialPurchase(coinValue) {
    setStoredCoins(coinValue);
    setSpecialUnlocked(true);
}

/**
 * Applies special purchase state to active world instance.
 * @param {number} coinValue Remaining coins.
 */
function applySpecialPurchaseToWorld(coinValue) {
    if (!world) return;
    world.character.coins = coinValue;
    world.character.specialUnlocked = true;
    world.coinCounter.setValue(coinValue);
}

/**
 * Returns true while the landing screen is visible.
 * @returns {boolean} The current start screen visibility.
 */
function isStartScreenVisible() {
    return !!startScreen && !startScreen.classList.contains("hidden");
}

/**
 * Opens a modal dialog if mobile portrait mode is not active.
 * @param {HTMLElement | null} modal The modal element to open.
 */
function openModal(modal) {
    if (!modal || isPortraitMobile()) return;
    modal.classList.remove("hidden");
    modal.setAttribute("aria-hidden", "false");
}

/**
 * Closes every currently open modal dialog.
 */
function closeModals() {
    [infoModal, controlsModal, shopModal, imprintModal].forEach((modal) => {
        if (!modal) return;
        modal.classList.add("hidden");
        modal.setAttribute("aria-hidden", "true");
    });
}

/**
 * Displays the matching end screen for the game result.
 * @param {"win" | "lose"} type The result type.
 */
function showEndScreen(type) {
    if (!endScreen || !endScreenImage) return;

    endScreenImage.src = type === "win"
        ? "assets/img/7_ProjectIMG/win_2.png"
        : "assets/img/7_ProjectIMG/oh no you lost!.png";
    endScreenImage.alt = type === "win" ? "You win" : "You lost";
    endScreen.classList.remove("hidden");
    endScreen.setAttribute("aria-hidden", "false");
}

/**
 * Resets the current session and starts a fresh game without reloading the page.
 */
function restartGame() {
    resetGameSession({ returnToMenu: false });
    startGame();
}

/**
 * Resets the current session and shows the landing page again.
 */
function returnToMainMenu() {
    resetGameSession({ returnToMenu: true });
}

/**
 * Clears the current game session and restores the UI to a stable state.
 * @param {{returnToMenu: boolean}} options Controls whether the menu should stay visible.
 */
function resetGameSession(options) {
    world?.dispose?.();
    GameRuntime.clearAll();
    audioManager?.stopBackgroundLoop();
    closeModals();
    releaseMobileControls();
    world = null;
    keyboard = new Keyboard();
    hideEndScreen();
    updateStartScreenVisibility(options.returnToMenu);
    resetPlayButtonState();
    updateShopUi();
    updateOrientationOverlay();
}

/**
 * Hides the end screen overlay.
 */
function hideEndScreen() {
    if (!endScreen) return;
    endScreen.classList.add("hidden");
    endScreen.setAttribute("aria-hidden", "true");
}

/**
 * Updates start screen visibility state.
 * @param {boolean} returnToMenu Whether menu should be visible.
 */
function updateStartScreenVisibility(returnToMenu) {
    if (!startScreen) return;
    startScreen.classList.toggle("hidden", !returnToMenu);
}

/**
 * Resets the visual active state of the play button.
 */
function resetPlayButtonState() {
    if (!playButton) return;
    playButton.classList.remove("menu-button--active");
}
