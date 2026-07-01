let resultTimer;
let clearTextTimer;

const SUPABASE_URL = "https://idewhnsdndbfgggvhfuq.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_mBChC2kALj9BVq1ht0T3-w_xPIoye22";

let supabaseClient = null;

if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark");
}

if (window.supabase) {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

/* PATHS */

function getLoginPath() {
    const path = window.location.pathname;

    if (
        path.includes("/courses/") ||
        path.includes("/tools/") ||
        path.includes("/auth/")
    ) {
        return "../auth/login.html";
    }

    return "auth/login.html";
}

/* REQUIRE LOGIN */

async function requireLogin() {
    if (!supabaseClient) return;

    const { data: { session } } = await supabaseClient.auth.getSession();

    if (!session) {
        window.location.href = getLoginPath();
    }
}

/* USER DROPDOWN */

const userBtn = document.getElementById("userBtn");
const userDropdown = document.getElementById("userDropdown");
const dropdownUserName = document.getElementById("dropdownUserName");
const menuBlur = document.getElementById("menuBlur");

async function updateUserButton() {
    if (!supabaseClient || !userBtn) return;

    const { data: { session } } = await supabaseClient.auth.getSession();

    if (session) {
        const fullName = session.user.user_metadata?.full_name || session.user.email;

        userBtn.href = "#";
        userBtn.title = fullName;

        if (dropdownUserName) {
            dropdownUserName.textContent = fullName;
        }
    } else {
        userBtn.href = getLoginPath();
        userBtn.title = "Login";

        if (userDropdown) userDropdown.classList.remove("show");
        if (menuBlur) menuBlur.classList.remove("show");
    }
}

if (userBtn) {
    userBtn.addEventListener("click", async (e) => {
        if (!supabaseClient) return;

        const { data: { session } } = await supabaseClient.auth.getSession();

        if (!session) return;

        e.preventDefault();

        if (userDropdown) userDropdown.classList.toggle("show");
        if (menuBlur) menuBlur.classList.toggle("show");
    });
}

if (menuBlur) {
    menuBlur.addEventListener("click", () => {
        if (userDropdown) userDropdown.classList.remove("show");
        menuBlur.classList.remove("show");
    });
}

window.logoutUser = async function () {
    if (supabaseClient) {
        await supabaseClient.auth.signOut();
    }

    window.location.href = getLoginPath();
};

updateUserButton();

/* REGISTER */

const registerForm = document.getElementById("registerForm");
const registerBtn = document.getElementById("registerBtn");

if (registerForm && registerBtn && supabaseClient) {
    registerForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const name = document.getElementById("registerName").value.trim();
        const email = document.getElementById("registerEmail").value.trim();
        const password = document.getElementById("registerPassword").value;
        const confirm = document.getElementById("registerConfirm").value;
        const message = document.getElementById("authMessage");

        registerBtn.disabled = true;
        registerBtn.textContent = "⏳ Duke krijuar...";

        if (password !== confirm) {
            message.textContent = "Fjalëkalimet nuk përputhen.";
            message.style.color = "red";

            registerBtn.disabled = false;
            registerBtn.textContent = "Regjistrohu";
            return;
        }

        const { error } = await supabaseClient.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: name
                }
            }
        });

        if (error) {
            message.textContent = error.message;
            message.style.color = "red";

            registerBtn.disabled = false;
            registerBtn.textContent = "Regjistrohu";
            return;
        }

        message.textContent = "✅ Regjistrimi u krye! Po të dërgojmë te hyrja...";
        message.style.color = "green";

        setTimeout(() => {
            window.location.href = "login.html";
        }, 1800);
    });
}

/* LOGIN */

const loginForm = document.getElementById("loginForm");
const loginBtn = document.getElementById("loginBtn");

if (loginForm && supabaseClient) {
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = document.getElementById("loginEmail").value.trim();
        const password = document.getElementById("loginPassword").value;
        const message = document.getElementById("authMessage");

        if (loginBtn) {
            loginBtn.disabled = true;
            loginBtn.textContent = "⏳ Duke hyrë...";
        }

        const { error } = await supabaseClient.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            message.textContent = "Email ose fjalëkalim i pasaktë.";
            message.style.color = "red";

            if (loginBtn) {
                loginBtn.disabled = false;
                loginBtn.textContent = "Hyr";
            }

            return;
        }

        message.textContent = "✅ Hyrja u krye me sukses!";
        message.style.color = "green";

        setTimeout(() => {
            window.location.href = "../index.html";
        }, 1000);
    });
}

/* DARK MODE */

const themeButton = document.getElementById("theme-toggle");

if (themeButton) {
    themeButton.textContent = document.body.classList.contains("dark")
        ? "☀️"
        : "🌙";

    themeButton.addEventListener("click", () => {
        document.body.classList.toggle("dark");

        localStorage.setItem(
            "theme",
            document.body.classList.contains("dark") ? "dark" : "light"
        );

        themeButton.textContent = document.body.classList.contains("dark")
            ? "☀️"
            : "🌙";
    });
}

/* POPUP */

const popup = document.getElementById("overlay");
const dismissBtn = document.getElementById("dismiss-btn");

if (popup && dismissBtn) {
    if (localStorage.getItem("noticeAccepted")) {
        popup.style.display = "none";
    }

    dismissBtn.addEventListener("click", () => {
        localStorage.setItem("noticeAccepted", "true");
        popup.style.display = "none";
    });
}

/* CALCULATOR */

function showResult(message, color) {
    const result = document.getElementById("result");

    if (!result) return;

    clearTimeout(resultTimer);
    clearTimeout(clearTextTimer);

    result.textContent = message;
    result.style.color = color;

    result.classList.remove("show");

    setTimeout(() => {
        result.classList.add("show");
    }, 10);

    resultTimer = setTimeout(() => {
        result.classList.remove("show");

        clearTextTimer = setTimeout(() => {
            result.textContent = "";
        }, 500);
    }, 5000);
}

function calculateAverage() {
    const g1 = Number(document.getElementById("grade1").value);
    const g2 = Number(document.getElementById("grade2").value);
    const g3 = Number(document.getElementById("grade3").value);
    const g4 = Number(document.getElementById("grade4").value);
    const g5 = Number(document.getElementById("grade5").value);

    if (
        g1 < 4 || g1 > 10 ||
        g2 < 4 || g2 > 10 ||
        g3 < 4 || g3 > 10 ||
        g4 < 4 || g4 > 10 ||
        g5 < 4 || g5 > 10
    ) {
        showResult(
            "Jo vlerë e saktë! Notat duhet të jenë nga 4 deri në 10.",
            "red"
        );
        return;
    }

    const average = (g1 + g2 + g3 + g4 + g5) / 5;

    showResult(
        "Mesatarja juaj është: " + average.toFixed(2),
        "green"
    );
}

/* SEARCH */

const searchInput = document.getElementById("searchInput");
const noResults = document.getElementById("noResults");

if (searchInput) {
    searchInput.addEventListener("input", () => {
        const query = searchInput.value.toLowerCase().trim();
        const cards = document.querySelectorAll(".card");

        let found = false;

        cards.forEach(card => {
            const text = card.textContent.toLowerCase();

            if (query === "" || text.includes(query)) {
                card.style.display = "block";

                if (query !== "") {
                    found = true;
                }
            } else {
                card.style.display = "none";
            }
        });

        if (noResults) {
            noResults.style.display = query !== "" && !found ? "block" : "none";
        }
    });
}

/* PASSWORD VISIBILITY */

document.querySelectorAll(".password-toggle").forEach(button => {
    button.addEventListener("click", () => {
        const input = document.getElementById(button.dataset.target);

        if (!input) return;

        if (input.type === "password") {
            input.type = "text";
            button.innerHTML = '<i data-lucide="eye-off"></i>';
        } else {
            input.type = "password";
            button.innerHTML = '<i data-lucide="eye"></i>';
        }

        if (window.lucide) {
            lucide.createIcons();
        }
    });
});

/* LUCIDE */

if (window.lucide) {
    lucide.createIcons();
}


const protectedPages = [
    "index.html",
    "calculus1.html",
    "calculus2.html",
    "java.html",
    "dsa.html",
    "average.html"
];

const currentPage = window.location.pathname.split("/").pop();

if (protectedPages.includes(currentPage)) {
    requireLogin();
}