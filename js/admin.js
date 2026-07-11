const SUPABASE_URL =
    "https://idewhnsdndbfgggvhfuq.supabase.co";

const SUPABASE_ANON_KEY =
    "sb_publishable_mBChC2kALj9BVq1ht0T3-w_xPIoye22";

if (!window.supabase) {
    throw new Error("Supabase failed to load.");
}

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);

let currentAdmin = null;
let allCourses = [];

/* ===========================
   ELEMENTS
=========================== */

const pendingContainer =
    document.getElementById("pendingSubmissions");

const approvedContainer =
    document.getElementById("approvedSubmissions");

const rejectedContainer =
    document.getElementById("rejectedSubmissions");

const pendingEmpty =
    document.getElementById("pendingEmpty");

const pendingCount =
    document.getElementById("pendingCount");

const approvedCount =
    document.getElementById("approvedCount");

const rejectedCount =
    document.getElementById("rejectedCount");

const totalCount =
    document.getElementById("totalCount");

const refreshButton =
    document.getElementById("refreshSubmissionsBtn");

const logoutButton =
    document.getElementById("adminLogoutBtn");

const clearLogsButton =
    document.getElementById("clearLogsBtn");

const systemLog =
    document.getElementById("systemLog");

const lastUpdated =
    document.getElementById("lastUpdated");

/* ===========================
   HELPERS
=========================== */

function refreshLucideIcons() {
    if (window.lucide) {
        window.lucide.createIcons();
    }
}

function escapeHTML(value) {
    const element = document.createElement("div");
    element.textContent = value ?? "";
    return element.innerHTML;
}

function formatAdminDate(value) {
    if (!value) return "UNKNOWN";

    const date = new Date(value);

    return date.toLocaleString("sq-AL", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}

function getCourseStatus(course) {
    if (
        course.status === "pending" ||
        course.status === "approved" ||
        course.status === "rejected"
    ) {
        return course.status;
    }

    return course.approved
        ? "approved"
        : "pending";
}

function setAdminLoading(isLoading) {
    document.body.classList.toggle(
        "admin-loading",
        isLoading
    );

    if (refreshButton) {
        refreshButton.disabled = isLoading;
    }
}

function setButtonLoading(button, isLoading) {
    if (!button) return;

    button.disabled = isLoading;

    if (isLoading) {
        button.dataset.originalHtml = button.innerHTML;
        button.textContent = "PROCESSING...";
    } else if (button.dataset.originalHtml) {
        button.innerHTML = button.dataset.originalHtml;
        delete button.dataset.originalHtml;
        refreshLucideIcons();
    }
}

/* ===========================
   LOGS
=========================== */

function addLog(message) {
    if (!systemLog) return;

    const entry = document.createElement("div");
    entry.className = "log-entry";

    entry.innerHTML = `
        <time>
            ${new Date().toLocaleTimeString("sq-AL")}
        </time>

        <span>
            ${escapeHTML(message)}
        </span>
    `;

    systemLog.prepend(entry);
}

/* ===========================
   TOASTS
=========================== */

function showAdminToast(message, type = "success") {
    const container =
        document.getElementById("adminToastContainer");

    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `admin-toast ${type}`;

    const icon =
        type === "error"
            ? "triangle-alert"
            : type === "info"
                ? "info"
                : "check";

    toast.innerHTML = `
        <div class="admin-toast-icon">
            <i data-lucide="${icon}"></i>
        </div>

        <div class="admin-toast-message">
            ${escapeHTML(message)}
        </div>
    `;

    container.appendChild(toast);
    refreshLucideIcons();

    requestAnimationFrame(() => {
        toast.classList.add("show");
    });

    setTimeout(() => {
        toast.classList.remove("show");

        setTimeout(() => {
            toast.remove();
        }, 220);
    }, 2800);
}

/* ===========================
   VERIFY ADMIN
=========================== */

async function verifyAdmin() {
    const {
        data: { user },
        error: userError
    } = await supabaseClient.auth.getUser();

 if (userError || !user) {
    window.location.replace("/admin/login.html");
    return false;
}

    const {
        data: adminRecord,
        error: adminError
    } = await supabaseClient
        .from("admins")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();

    if (adminError) {
        console.error(
            "Admin verification failed:",
            adminError
        );
    }

    if (!adminRecord) {
        await supabaseClient.auth.signOut();

        document.body.innerHTML = `
            <main style="
                min-height:100vh;
                display:grid;
                place-items:center;
                background:#070907;
                color:#00ff88;
                font-family:'JetBrains Mono', monospace;
                text-align:center;
                padding:30px;
            ">
                <div>
                    <h1>ACCESS DENIED</h1>
                    <p>ADMIN PRIVILEGES REQUIRED</p>

                    <a
                        href="./login.html"
                        style="
                            display:inline-block;
                            margin-top:24px;
                            padding:14px 18px;
                            color:#00ff88;
                            border:1px solid #00ff88;
                            text-decoration:none;
                        "
                    >
                        RETURN TO LOGIN
                    </a>
                </div>
            </main>
        `;

        return false;
    }

    currentAdmin = user;
    return true;
}

/* ===========================
   LOAD COURSES
=========================== */

async function loadAllCourses() {
    setAdminLoading(true);

    const { data, error } = await supabaseClient
        .from("courses")
        .select("*")
        .order("created_at", {
            ascending: false
        });

    setAdminLoading(false);

    if (error) {
        console.error("Course loading failed:", error);

        showAdminToast(
            "COURSES COULD NOT BE LOADED",
            "error"
        );

        addLog("ERROR: COURSE FETCH FAILED");
        return;
    }

    allCourses = data || [];

    renderAdminDashboard();
    updateAdminStats();

    if (lastUpdated) {
        lastUpdated.textContent =
            `LAST UPDATE: ${new Date().toLocaleTimeString("sq-AL")}`;
    }

    addLog(
        `COURSE DATA LOADED: ${allCourses.length} RECORDS`
    );
}

/* ===========================
   RENDER DASHBOARD
=========================== */

function renderAdminDashboard() {
    const pendingCourses = allCourses.filter(
        (course) =>
            getCourseStatus(course) === "pending"
    );

    const approvedCourses = allCourses.filter(
        (course) =>
            getCourseStatus(course) === "approved"
    );

    const rejectedCourses = allCourses.filter(
        (course) =>
            getCourseStatus(course) === "rejected"
    );

    renderCourseList(
        pendingCourses,
        pendingContainer,
        "pending"
    );

    renderCourseList(
        approvedCourses,
        approvedContainer,
        "approved"
    );

    renderCourseList(
        rejectedCourses,
        rejectedContainer,
        "rejected"
    );

    if (pendingEmpty) {
        pendingEmpty.hidden =
            pendingCourses.length !== 0;
    }

    refreshLucideIcons();
}

function renderCourseList(
    courses,
    container,
    sectionType
) {
    if (!container) return;

    container.innerHTML = "";

    if (courses.length === 0) {
        if (sectionType !== "pending") {
            container.innerHTML = `
                <div class="admin-empty-state">
                    <i data-lucide="database"></i>
                    <p>NO ${sectionType.toUpperCase()} COURSES</p>
                    <span>NO RECORDS AVAILABLE</span>
                </div>
            `;
        }

        return;
    }

    courses.forEach((course) => {
        const card =
            document.createElement("article");

        card.className = "submission-card";

        const title =
            escapeHTML(course.title || "UNTITLED COURSE");

        const description =
            escapeHTML(
                course.description ||
                "NO DESCRIPTION PROVIDED"
            );

        const icon =
            escapeHTML(course.icon || "—");

        const courseLink =
            course.course_link ||
            course.drive_link ||
            "";

        card.innerHTML = `
            <div class="submission-main">

                <div class="submission-header">
                    <h3 class="submission-title">
                        ${icon} ${title}
                    </h3>

                    <span
                        class="submission-status ${sectionType}"
                    >
                        ${sectionType.toUpperCase()}
                    </span>
                </div>

                <p class="submission-description">
                    ${description}
                </p>

                <div class="submission-meta">

                    <div class="submission-meta-item">
                        <span>SUBMISSION ID</span>
                        <strong>
                            ${escapeHTML(course.id)}
                        </strong>
                    </div>

                    <div class="submission-meta-item">
                        <span>USER ID</span>
                        <strong>
                            ${escapeHTML(
                                course.user_id || "UNKNOWN"
                            )}
                        </strong>
                    </div>

                    <div class="submission-meta-item">
                        <span>SUBMITTED</span>
                        <strong>
                            ${formatAdminDate(
                                course.created_at
                            )}
                        </strong>
                    </div>

                    <div class="submission-meta-item">
                        <span>RESOURCE</span>

                        ${
                            courseLink
                                ? `
                                    <a
                                        class="submission-link"
                                        href="${escapeHTML(courseLink)}"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        OPEN RESOURCE
                                    </a>
                                `
                                : `
                                    <strong>NO LINK</strong>
                                `
                        }
                    </div>

                </div>

            </div>

            <div class="submission-actions">
                ${getActionButtons(sectionType)}
            </div>
        `;

        attachCourseActions(card, course);
        container.appendChild(card);
    });
}

/* ===========================
   ACTION BUTTONS
=========================== */

function getActionButtons(sectionType) {
    if (sectionType === "pending") {
        return `
            <button
                class="admin-button approve"
                data-action="approve"
                type="button"
            >
                <i data-lucide="check"></i>
                APPROVE
            </button>

            <button
                class="admin-button reject"
                data-action="reject"
                type="button"
            >
                <i data-lucide="x"></i>
                REJECT
            </button>
        `;
    }

    if (sectionType === "approved") {
        return `
            <button
                class="admin-button reject"
                data-action="reject"
                type="button"
            >
                <i data-lucide="ban"></i>
                REJECT
            </button>
        `;
    }

    return `
        <button
            class="admin-button approve"
            data-action="approve"
            type="button"
        >
            <i data-lucide="rotate-ccw"></i>
            RESTORE
        </button>

        <button
            class="admin-button danger"
            data-action="delete"
            type="button"
        >
            <i data-lucide="trash-2"></i>
            DELETE
        </button>
    `;
}

function attachCourseActions(card, course) {
    const approveButton =
        card.querySelector(
            '[data-action="approve"]'
        );

    const rejectButton =
        card.querySelector(
            '[data-action="reject"]'
        );

    const deleteButton =
        card.querySelector(
            '[data-action="delete"]'
        );

    approveButton?.addEventListener(
        "click",
        async () => {
            await updateCourseStatus(
                course,
                "approved",
                approveButton
            );
        }
    );

    rejectButton?.addEventListener(
        "click",
        async () => {
            await updateCourseStatus(
                course,
                "rejected",
                rejectButton
            );
        }
    );

    deleteButton?.addEventListener(
        "click",
        async () => {
            const confirmed = window.confirm(
                `Permanently delete "${course.title}"?`
            );

            if (!confirmed) return;

            await deleteCourse(
                course,
                deleteButton
            );
        }
    );
}

/* ===========================
   APPROVE / REJECT
=========================== */

async function updateCourseStatus(
    course,
    newStatus,
    button
) {
    setButtonLoading(button, true);

    const { error } = await supabaseClient
        .from("courses")
        .update({
            status: newStatus,
            approved: newStatus === "approved"
        })
        .eq("id", course.id);

    setButtonLoading(button, false);

    if (error) {
        console.error(
            "Course status update failed:",
            error
        );

        showAdminToast(
            "COURSE STATUS UPDATE FAILED",
            "error"
        );

        addLog(
            `ERROR: UPDATE FAILED FOR ${course.id}`
        );

        return;
    }

    course.status = newStatus;
    course.approved =
        newStatus === "approved";

    renderAdminDashboard();
    updateAdminStats();

    showAdminToast(
        newStatus === "approved"
            ? "COURSE APPROVED"
            : "COURSE REJECTED",
        "success"
    );

    addLog(
        `${course.title} → ${newStatus.toUpperCase()}`
    );
}

/* ===========================
   DELETE COURSE
=========================== */

async function deleteCourse(course, button) {
    setButtonLoading(button, true);

    const { error } = await supabaseClient
        .from("courses")
        .delete()
        .eq("id", course.id);

    setButtonLoading(button, false);

    if (error) {
        console.error(
            "Course deletion failed:",
            error
        );

        showAdminToast(
            "COURSE COULD NOT BE DELETED",
            "error"
        );

        addLog(
            `ERROR: DELETE FAILED FOR ${course.id}`
        );

        return;
    }

    allCourses = allCourses.filter(
        (savedCourse) =>
            savedCourse.id !== course.id
    );

    renderAdminDashboard();
    updateAdminStats();

    showAdminToast(
        "COURSE PERMANENTLY DELETED",
        "success"
    );

    addLog(`${course.title} → DELETED`);
}

/* ===========================
   COUNTERS
=========================== */

function updateAdminStats() {
    const pending = allCourses.filter(
        (course) =>
            getCourseStatus(course) === "pending"
    ).length;

    const approved = allCourses.filter(
        (course) =>
            getCourseStatus(course) === "approved"
    ).length;

    const rejected = allCourses.filter(
        (course) =>
            getCourseStatus(course) === "rejected"
    ).length;

    if (pendingCount) {
        pendingCount.textContent = pending;
    }

    if (approvedCount) {
        approvedCount.textContent = approved;
    }

    if (rejectedCount) {
        rejectedCount.textContent = rejected;
    }

    if (totalCount) {
        totalCount.textContent =
            allCourses.length;
    }
}

/* ===========================
   EVENTS
=========================== */

refreshButton?.addEventListener(
    "click",
    async () => {
        await loadAllCourses();

        showAdminToast(
            "COURSE DATA REFRESHED",
            "info"
        );
    }
);

clearLogsButton?.addEventListener(
    "click",
    () => {
        if (systemLog) {
            systemLog.innerHTML = "";
        }

        addLog("SYSTEM LOG CLEARED");
    }
);

logoutButton?.addEventListener("click", async () => {
    const { error } = await supabaseClient.auth.signOut();

    if (error) {
        console.error("Logout failed:", error);
        showAdminToast("LOGOUT FAILED", "error");
        return;
    }

    window.location.replace("/admin/login.html");
});

/* ===========================
   INITIALIZE
=========================== */

async function initializeAdminPage() {
    const isAdmin = await verifyAdmin();

    if (!isAdmin) return;

    addLog("ADMIN SESSION VERIFIED");

    await loadAllCourses();

    refreshLucideIcons();
}

initializeAdminPage();