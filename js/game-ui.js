/**
 * Updates the visible music button state.
 */
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
        ? "img/7_ProjectIMG/win_2.png"
        : "img/7_ProjectIMG/oh no you lost!.png";
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

    if (endScreen) {
        endScreen.classList.add("hidden");
        endScreen.setAttribute("aria-hidden", "true");
    }

    if (startScreen) {
        startScreen.classList.toggle("hidden", !options.returnToMenu);
    }

    if (playButton) {
        playButton.classList.remove("menu-button--active");
    }

    updateShopUi();
    updateOrientationOverlay();
}
