const POMODORO_STORAGE_KEY = "studiaPomodoroState";

let pomodoroWidgetInterval = null;

function getPomodoroState() {
    try {
        return JSON.parse(
            localStorage.getItem(POMODORO_STORAGE_KEY)
        );
    } catch {
        return null;
    }
}

function savePomodoroState(state) {
    localStorage.setItem(
        POMODORO_STORAGE_KEY,
        JSON.stringify(state)
    );
}

function formatPomodoroTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return (
        String(minutes).padStart(2, "0") +
        ":" +
        String(remainingSeconds).padStart(2, "0")
    );
}

function createPomodoroWidget() {
    if (document.getElementById("globalPomodoroWidget")) {
        return;
    }

    const widget = document.createElement("aside");

    widget.id = "globalPomodoroWidget";
    widget.className = "global-pomodoro-widget";
    widget.hidden = true;

    widget.innerHTML = `
        <div class="global-pomodoro-top">
            <div>
                <span
                    id="globalPomodoroMode"
                    class="global-pomodoro-mode"
                >
                    FOKUS
                </span>

                <strong id="globalPomodoroTime">
                    25:00
                </strong>
            </div>

            <button
                id="globalPomodoroClose"
                class="global-pomodoro-close"
                type="button"
                aria-label="Fshih kohëmatësin"
            >
                <i data-lucide="x"></i>
            </button>
        </div>

        <div class="global-pomodoro-progress">
            <span id="globalPomodoroProgress"></span>
        </div>

        <div class="global-pomodoro-actions">
            <button
                id="globalPomodoroToggle"
                type="button"
            >
                <i data-lucide="pause"></i>
                <span>Ndalo</span>
            </button>

            <a href="/tools/pomodoro.html">
                <i data-lucide="maximize-2"></i>
                <span>Hap</span>
            </a>
        </div>
    `;

    document.body.appendChild(widget);

    document
        .getElementById("globalPomodoroToggle")
        ?.addEventListener("click", toggleGlobalPomodoro);

    document
        .getElementById("globalPomodoroClose")
        ?.addEventListener("click", () => {
            widget.hidden = true;
        });

    refreshPomodoroWidgetIcons();
}

function refreshPomodoroWidgetIcons() {
    if (window.lucide) {
        window.lucide.createIcons();
    }
}

function updateGlobalPomodoroWidget() {
    const widget =
        document.getElementById("globalPomodoroWidget");

    const timeElement =
        document.getElementById("globalPomodoroTime");

    const modeElement =
        document.getElementById("globalPomodoroMode");

    const progressElement =
        document.getElementById("globalPomodoroProgress");

    const toggleButton =
        document.getElementById("globalPomodoroToggle");

    if (
        !widget ||
        !timeElement ||
        !modeElement ||
        !progressElement ||
        !toggleButton
    ) {
        return;
    }

    const state = getPomodoroState();

    if (!state || !state.active) {
        widget.hidden = true;
        return;
    }

    let remainingSeconds = state.remainingSeconds;

    if (state.running && state.endTime) {
        remainingSeconds = Math.max(
            0,
            Math.ceil((state.endTime - Date.now()) / 1000)
        );
    }

    if (remainingSeconds <= 0) {
        state.active = false;
        state.running = false;
        state.remainingSeconds = 0;

        savePomodoroState(state);

        widget.hidden = true;

        window.dispatchEvent(
            new CustomEvent("studiaPomodoroFinished", {
                detail: state
            })
        );

        return;
    }

    widget.hidden = false;

    timeElement.textContent =
        formatPomodoroTime(remainingSeconds);

    modeElement.textContent =
        state.label || "FOKUS";

    const progress =
        state.totalSeconds > 0
            ? remainingSeconds / state.totalSeconds
            : 0;

    progressElement.style.width =
        `${Math.max(0, Math.min(100, progress * 100))}%`;

    toggleButton.innerHTML = state.running
        ? `
            <i data-lucide="pause"></i>
            <span>Ndalo</span>
        `
        : `
            <i data-lucide="play"></i>
            <span>Vazhdo</span>
        `;

    refreshPomodoroWidgetIcons();
}

function toggleGlobalPomodoro() {
    const state = getPomodoroState();

    if (!state || !state.active) return;

    if (state.running) {
        state.remainingSeconds = Math.max(
            0,
            Math.ceil((state.endTime - Date.now()) / 1000)
        );

        state.running = false;
        state.endTime = null;
    } else {
        state.running = true;
        state.endTime =
            Date.now() + state.remainingSeconds * 1000;
    }

    savePomodoroState(state);
    updateGlobalPomodoroWidget();
}

function initializeGlobalPomodoroWidget() {
    createPomodoroWidget();
    updateGlobalPomodoroWidget();

    pomodoroWidgetInterval = setInterval(
        updateGlobalPomodoroWidget,
        1000
    );

    window.addEventListener("storage", (event) => {
        if (event.key === POMODORO_STORAGE_KEY) {
            updateGlobalPomodoroWidget();
        }
    });
}

document.addEventListener(
    "DOMContentLoaded",
    initializeGlobalPomodoroWidget
);