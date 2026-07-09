


let resultTimer;
let clearTextTimer;

const SUPABASE_URL = "https://idewhnsdndbfgggvhfuq.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_mBChC2kALj9BVq1ht0T3-w_xPIoye22";

let supabaseClient = null;



if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark");
}

lucide.createIcons();

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
    if (localStorage.getItem("noticeAccepted") === "true") {
        popup.classList.add("hidden");
    }

    dismissBtn.addEventListener("click", () => {
        localStorage.setItem("noticeAccepted", "true");
        popup.classList.add("hidden");
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



/*DROPDOWN*/

document.querySelectorAll(".course-toggle").forEach(button => {
    button.addEventListener("click", () => {
        const box = button.closest(".course-box");
        box.classList.toggle("open");

        const icon = button.querySelector("span");
        icon.textContent = box.classList.contains("open") ? "−" : "+";
    });
});



/*ADD BUTTON*/

const addBtn = document.getElementById("addBtn");
const addCourseModal = document.getElementById("addCourseModal");
const closeCourseModal = document.getElementById("closeCourseModal");
const submitCourseBtn = document.getElementById("submitCourseBtn");

function closeCourseModalWithAnimation() {
    addCourseModal.classList.remove("show");
    addCourseModal.classList.add("closing");

    setTimeout(() => {
        addCourseModal.classList.remove("closing");
    }, 300);
}



if (addBtn && addCourseModal) {
    addBtn.addEventListener("click", () => {
        addCourseModal.classList.add("show");
    });
}

if (closeCourseModal && addCourseModal) {
  closeCourseModal.addEventListener("click", closeCourseModalWithAnimation);
}


if (submitCourseBtn && supabaseClient) {
    submitCourseBtn.addEventListener("click", async () => {
        const title = document.getElementById("materialTitle").value.trim();
        const course = document.getElementById("materialCourse").value;
        const driveLink = document.getElementById("materialLink").value.trim();
        const description = document.getElementById("materialDescription").value.trim();
        const message = document.getElementById("materialMessage");

        if (!title || !course || !driveLink) {
            message.textContent = "Plotëso titullin, kursin dhe linkun.";
            message.style.color = "red";
            return;
        }

        const {
            data: { user }
        } = await supabaseClient.auth.getUser();

        if (!user) {
            message.textContent = "Duhet të jesh i kyçur për të shtuar material.";
            message.style.color = "red";
            return;
        }

       const { error } = await supabaseClient
    .from("courses")
    .insert({
        title,
        description,
        icon,
        course_link: courseLink,
        user_id: user.id,
        approved: false
    });

        if (error) {
            message.textContent = error.message;
            message.style.color = "red";
            return;
        }

        message.textContent = "Materiali u dërgua! Do të shfaqet pasi të aprovohet.";
        message.style.color = "green";

        setTimeout(() => {
            closeCourseModalWithAnimation();
        }, 1800);
    });



if (submitCourseBtn && supabaseClient) {
    submitCourseBtn.addEventListener("click", async () => {
        const title = document.getElementById("courseTitle").value.trim();
        const icon = document.getElementById("courseIcon").value.trim();
        const description = document.getElementById("courseDescription").value.trim();
        const courseLink = document.getElementById("courseLink").value.trim();
        const message = document.getElementById("courseMessage");

        if (!title || !description) {
            message.textContent = "Plotëso emrin dhe përshkrimin e kursit.";
            message.style.color = "red";
            return;
        }

        const { data: { user } } = await supabaseClient.auth.getUser();

        if (!user) {
            message.textContent = "Duhet të jesh i kyçur për të shtuar kurs.";
            message.style.color = "red";
            return;
        }

        const { error } = await supabaseClient
            .from("courses")
            .insert({
                title,
                icon: icon || "📘",
                description,
                course_link: courseLink || null,
                user_id: user.id,
                approved: false
            });

        if (error) {
            message.textContent = error.message;
            message.style.color = "red";
            return;
        }

        message.textContent = "Kursi u dërgua! Do të shfaqet pasi të aprovohet.";
        message.style.color = "green";

        setTimeout(() => {
            closeCourseModalWithAnimation();
        }, 1500);
    });
}



}




document.querySelectorAll(".collapsible-section").forEach(section => {

    const header = section.querySelector(".section-header");

    header.addEventListener("click", () => {

        section.classList.toggle("collapsed");

    });

});


async function loadUserCourses() {



    
    const section = document.getElementById("userCoursesSection");
    const container = document.getElementById("userCoursesContainer");

    if (!section || !container || !supabaseClient) return;

    const { data, error } = await supabaseClient
    .from("courses")
    .select("*")
    .eq("approved", true)
    .order("created_at", { ascending: false });
console.log("Approved courses:", data);
console.log("Error:", error);


    if (error) {
        console.error(error);
        return;
    }

    if (!data || data.length === 0) {
        section.style.display = "none";
        return;
    }

    section.style.display = "block";

    container.innerHTML = data.map(course => `
        <a href="${course.course_link || "#"}" class="card" target="_blank">
            <h3>${course.icon || "📘"} ${course.title}</h3>
            <p>${course.description || ""}</p>
        </a>
    `).join("");
}



loadUserCourses();

