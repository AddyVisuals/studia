const MODES = {
    focus: {
        label: "FOKUS",
        minutes: 25
    },
    short: {
        label: "PUSHIM I SHKURTËR",
        minutes: 5
    },
    long: {
        label: "PUSHIM I GJATË",
        minutes: 15
    }
};

let activeMode = "focus";
let totalSeconds = MODES.focus.minutes * 60;
let remainingSeconds = totalSeconds;

let timerInterval = null;
let isRunning = false;
let completedSessions = 0;

const timeElement = document.getElementById("pomodoroTime");
const modeLabelElement = document.getElementById("pomodoroModeLabel");
const statusElement = document.getElementById("pomodoroStatus");
const sessionElement = document.getElementById("pomodoroSessions");
const startButton = document.getElementById("pomodoroStartBtn");
const resetButton = document.getElementById("pomodoroResetBtn");
const progressCircle = document.getElementById("pomodoroProgressCircle");
const modeButtons = document.querySelectorAll(".pomodoro-mode");

const radius = 104;
const circumference = 2 * Math.PI * radius;

progressCircle.style.strokeDasharray = circumference;
progressCircle.style.strokeDashoffset = 0;

function refreshLucideIcons() {
    if (window.lucide) {
        window.lucide.createIcons();
    }
}

function updateDisplay() {
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;

    timeElement.textContent =
        `${String(minutes).padStart(2, "0")}:` +
        `${String(seconds).padStart(2, "0")}`;

    const progress = remainingSeconds / totalSeconds;

    progressCircle.style.strokeDashoffset =
        circumference * (1 - progress);

    document.title =
        `${timeElement.textContent} · Pomodoro · Studia`;
}

function updateStartButton() {
    startButton.innerHTML = isRunning
        ? `
            <i data-lucide="pause"></i>
            <span>Ndalo</span>
        `
        : `
            <i data-lucide="play"></i>
            <span>Fillo</span>
        `;

    refreshLucideIcons();
}

function setMode(mode) {
    stopTimer();

    activeMode = mode;
    totalSeconds = MODES[mode].minutes * 60;
    remainingSeconds = totalSeconds;

    modeLabelElement.textContent = MODES[mode].label;
    statusElement.textContent = "Gati për të filluar";

    modeButtons.forEach((button) => {
        button.classList.toggle(
            "active",
            button.dataset.mode === mode
        );
    });

    updateDisplay();
    updateStartButton();
}

function startTimer() {
    if (isRunning) {
        stopTimer();
        statusElement.textContent = "Në pauzë";
        return;
    }

    isRunning = true;

    statusElement.textContent =
        activeMode === "focus"
            ? "Duke u fokusuar"
            : "Koha për pushim";

    updateStartButton();

    timerInterval = setInterval(() => {
        remainingSeconds -= 1;

        updateDisplay();

        if (remainingSeconds <= 0) {
            completeTimer();
        }
    }, 1000);
}

function stopTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
    isRunning = false;

    updateStartButton();
}

function resetTimer() {
    stopTimer();

    remainingSeconds = totalSeconds;
    statusElement.textContent = "Gati për të filluar";

    updateDisplay();

    showToast("Kohëmatësi u rivendos.", "info");
}

function completeTimer() {
    stopTimer();

    remainingSeconds = 0;
    updateDisplay();

    if (activeMode === "focus") {
        completedSessions += 1;

        sessionElement.textContent =
            `${completedSessions} ${
                completedSessions === 1
                    ? "sesion"
                    : "sesione"
            }`;

        playCompletionSound();

        showToast(
            "Sesioni i fokusit përfundoi. Koha për pushim!",
            "success"
        );

        setMode(
            completedSessions % 4 === 0
                ? "long"
                : "short"
        );
    } else {
        playCompletionSound();

        showToast(
            "Pushimi përfundoi. Gati për fokus?",
            "info"
        );

        setMode("focus");
    }
}

function playCompletionSound() {
    try {
        const audioContext =
            new (
                window.AudioContext ||
                window.webkitAudioContext
            )();

        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();

        oscillator.connect(gain);
        gain.connect(audioContext.destination);

        oscillator.frequency.value = 880;
        oscillator.type = "sine";

        gain.gain.setValueAtTime(
            0.12,
            audioContext.currentTime
        );

        gain.gain.exponentialRampToValueAtTime(
            0.001,
            audioContext.currentTime + 0.45
        );

        oscillator.start();
        oscillator.stop(
            audioContext.currentTime + 0.45
        );
    } catch (error) {
        console.warn("Audio could not play:", error);
    }
}

function showToast(message, type = "info") {
    const container =
        document.getElementById("toastContainer");

    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;

    const iconName =
        type === "success"
            ? "check"
            : type === "error"
                ? "circle-alert"
                : "info";

    toast.innerHTML = `
        <div class="toast-icon">
            <i data-lucide="${iconName}"></i>
        </div>

        <span>${message}</span>
    `;

    container.appendChild(toast);
    refreshLucideIcons();

    requestAnimationFrame(() => {
        toast.classList.add("show");
    });

    setTimeout(() => {
        toast.classList.remove("show");
        toast.classList.add("hide");

        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}

modeButtons.forEach((button) => {
    button.addEventListener("click", () => {
        setMode(button.dataset.mode);
    });
});

startButton.addEventListener("click", startTimer);
resetButton.addEventListener("click", resetTimer);

updateDisplay();
updateStartButton();
refreshLucideIcons();