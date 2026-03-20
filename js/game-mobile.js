/**
 * Mobile control handling for the game UI.
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
