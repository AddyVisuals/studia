const SUPABASE_URL = "https://idewhnsdndbfgggvhfuq.supabase.co";
const SUPABASE_ANON_KEY =
    "sb_publishable_mBChC2kALj9BVq1ht0T3-w_xPIoye22";



if (!window.supabase) {
    console.error("Supabase failed to load.");
    throw new Error("Supabase library is unavailable.");
}

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);

let todos = [];
let currentUser = null;

const todoInput = document.getElementById("todoInput");
const todoCourse = document.getElementById("todoCourse");
const addTodoBtn = document.getElementById("addTodoBtn");
const todoList = document.getElementById("todoList");
const todoProgress = document.getElementById("todoProgress");
const todoEmpty = document.getElementById("todoEmpty");

/* ===========================
   HELPERS
=========================== */

function getCourseClass(course = "Personal") {
    return course
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, "-");
}

function escapeHTML(value) {
    const element = document.createElement("div");
    element.textContent = value ?? "";
    return element.innerHTML;
}

function refreshLucideIcons() {
    if (window.lucide) {
        lucide.createIcons();
    }
}

/* ===========================
   TOAST NOTIFICATIONS
=========================== */

function showToast(message, type = "info") {
    const container = document.getElementById("toastContainer");

    if (!container) {
        console.warn("Toast container was not found:", message);
        return;
    }

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

        <span>${escapeHTML(message)}</span>
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

/* ===========================
   RENDER TODOS
=========================== */

function renderTodos() {
    todoList.innerHTML = "";

    todos.forEach((todo) => {
        const item = document.createElement("div");
        item.className = `todo-item ${todo.done ? "done" : ""}`;

        const course = todo.course || "Personal";
        const courseClass = getCourseClass(course);

        item.innerHTML = `
            <div class="todo-left">
                <button
                    class="todo-check"
                    type="button"
                    aria-label="${
                        todo.done
                            ? "Shëno si të papërfunduar"
                            : "Shëno si të përfunduar"
                    }"
                >
                    ${todo.done ? "✓" : ""}
                </button>

                <div class="todo-text-wrap">
                    <span class="todo-text">
                        ${escapeHTML(todo.text)}
                    </span>

                    <span class="todo-course-badge ${courseClass}">
                        ${escapeHTML(course)}
                    </span>
                </div>
            </div>

            <button
                class="todo-delete"
                type="button"
                aria-label="Fshi detyrën"
            >
                <i data-lucide="trash-2"></i>
            </button>
        `;

        item
            .querySelector(".todo-check")
            .addEventListener("click", async () => {
                await toggleTodo(todo);
            });

        item
            .querySelector(".todo-delete")
            .addEventListener("click", async () => {
                await deleteTodo(todo, item);
            });

        todoList.appendChild(item);
    });

    const doneCount = todos.filter((todo) => todo.done).length;

    todoProgress.textContent = `${doneCount} / ${todos.length}`;
    todoEmpty.style.display = todos.length === 0 ? "block" : "none";

    refreshLucideIcons();
}

/* ===========================
   LOAD TODOS
=========================== */

async function loadTodos() {
    const { data, error } = await supabaseClient
        .from("todos")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Could not load todos:", error);

        showToast(
            "Detyrat nuk mund të ngarkoheshin.",
            "error"
        );

        return;
    }

    todos = data || [];
    renderTodos();
}

/* ===========================
   ADD TODO
=========================== */

async function addTodo() {
    const text = todoInput.value.trim();
    const course = todoCourse.value;

    if (!text) {
        showToast(
            "Shkruaj një detyrë fillimisht.",
            "info"
        );

        todoInput.focus();
        return;
    }

    if (!currentUser) {
        showToast(
            "Duhet të kyçesh në llogari për të shtuar detyra.",
            "error"
        );

        return;
    }

    setAddButtonLoading(true);

    const { data, error } = await supabaseClient
        .from("todos")
        .insert({
            user_id: currentUser.id,
            text,
            course,
            done: false
        })
        .select()
        .single();

    setAddButtonLoading(false);

    if (error) {
        console.error("Could not add todo:", error);

        showToast(
            "Detyra nuk mund të shtohej.",
            "error"
        );

        return;
    }

    todos.unshift(data);

    todoInput.value = "";
    todoInput.focus();

    renderTodos();

    showToast(
        "Detyra u shtua me sukses.",
        "success"
    );
}

/* ===========================
   TOGGLE TODO
=========================== */

async function toggleTodo(todo) {
    const newDoneValue = !todo.done;

    const { error } = await supabaseClient
        .from("todos")
        .update({
            done: newDoneValue
        })
        .eq("id", todo.id);

    if (error) {
        console.error("Could not update todo:", error);

        showToast(
            "Detyra nuk mund të përditësohej.",
            "error"
        );

        return;
    }

    todo.done = newDoneValue;

    renderTodos();

    showToast(
        newDoneValue
            ? "Detyra u përfundua."
            : "Detyra u rikthye si aktive.",
        "success"
    );
}

/* ===========================
   DELETE TODO
=========================== */

async function deleteTodo(todo, item) {
    item.style.opacity = "0";
    item.style.transform =
        "translateX(18px) scale(.96)";

    const { error } = await supabaseClient
        .from("todos")
        .delete()
        .eq("id", todo.id);

    if (error) {
        console.error("Could not delete todo:", error);

        item.style.opacity = "1";
        item.style.transform = "";

        showToast(
            "Detyra nuk mund të fshihej.",
            "error"
        );

        return;
    }

    setTimeout(() => {
        todos = todos.filter(
            (savedTodo) => savedTodo.id !== todo.id
        );

        renderTodos();

        showToast(
            "Detyra u fshi.",
            "success"
        );
    }, 220);
}

/* ===========================
   ADD BUTTON LOADING STATE
=========================== */

function setAddButtonLoading(isLoading) {
    addTodoBtn.disabled = isLoading;

    addTodoBtn.innerHTML = isLoading
        ? `
            <span>Duke shtuar...</span>
        `
        : `
            <i data-lucide="plus"></i>
            <span>Shto</span>
        `;

    refreshLucideIcons();
}

/* ===========================
   INITIALIZE PAGE
=========================== */

async function initializeTodoPage() {
    const {
        data: { user },
        error
    } = await supabaseClient.auth.getUser();

    if (error) {
        console.error("Could not check user:", error);

        showToast(
            "Nuk mund të kontrollohej llogaria.",
            "error"
        );
    }

    if (!user) {
        todoInput.disabled = true;
        todoCourse.disabled = true;
        addTodoBtn.disabled = true;

        todoEmpty.style.display = "block";
        todoEmpty.textContent =
            "Duhet të kyçesh në llogari për të përdorur listën e detyrave.";

        showToast(
            "Kyçu për të përdorur listën e detyrave.",
            "info"
        );

        return;
    }

    currentUser = user;

    await loadTodos();
}

/* ===========================
   EVENTS
=========================== */

addTodoBtn.addEventListener("click", addTodo);

todoInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        addTodo();
    }
});

initializeTodoPage();



async function updateHomepageStats() {
    const {
        data: { user }
    } = await supabaseClient.auth.getUser();

    if (!user) return;

    // Remaining (unfinished) todos
    const { count: todoCount } = await supabaseClient
        .from("todos")
        .select("*", {
            count: "exact",
            head: true
        })
        .eq("user_id", user.id)
        .eq("done", false);

    // Pending courses awaiting approval
    const { count: pendingCount } = await supabaseClient
        .from("courses")
        .select("*", {
            count: "exact",
            head: true
        })
        .eq("user_id", user.id)
        .eq("approved", false);

    document.getElementById("remainingTasks").textContent = todoCount ?? 0;
    document.getElementById("pendingCourses").textContent = pendingCount ?? 0;
}