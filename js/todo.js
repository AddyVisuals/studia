let todos = JSON.parse(localStorage.getItem("todos")) || [];

const todoInput = document.getElementById("todoInput");
const addTodoBtn = document.getElementById("addTodoBtn");
const todoList = document.getElementById("todoList");
const todoProgress = document.getElementById("todoProgress");
const todoEmpty = document.getElementById("todoEmpty");

function saveTodos() {
    localStorage.setItem("todos", JSON.stringify(todos));
}

function renderTodos() {
    todoList.innerHTML = "";

    todos.forEach((todo, index) => {
        const item = document.createElement("div");
        item.className = `todo-item ${todo.done ? "done" : ""}`;

const courseClass = (todo.course || "Personal")
    .toLowerCase()
    .replace("ë", "e")
    .replace(/\s+/g, "-");

item.innerHTML = `
    <div class="todo-left">
        <button class="todo-check" type="button">
            ${todo.done ? "✓" : ""}
        </button>

        <div class="todo-text-wrap">
            <span class="todo-text">${todo.text}</span>

            <span class="todo-course-badge ${courseClass}">
                ${todo.course || "Personal"}
            </span>
        </div>
    </div>

    <button class="todo-delete" type="button">
        <i data-lucide="trash-2"></i>
    </button>
`;

        item.querySelector(".todo-check").addEventListener("click", () => {
            todos[index].done = !todos[index].done;
            saveTodos();
            renderTodos();
        });

        item.querySelector(".todo-delete").addEventListener("click", () => {
           item.style.opacity = "0";
item.style.transform = "translateX(18px) scale(.96)";

setTimeout(() => {
    todos.splice(index, 1);
    saveTodos();
    renderTodos();
}, 220);
        });

        todoList.appendChild(item);
    });

    const doneCount = todos.filter(todo => todo.done).length;
    todoProgress.textContent = `${doneCount} / ${todos.length}`;

    todoEmpty.style.display = todos.length === 0 ? "block" : "none";

    if (window.lucide) {
        lucide.createIcons();
    }
}

function addTodo() {
    const text = todoInput.value.trim();

    if (!text) return;

   const course = document.getElementById("todoCourse").value;

todos.push({
    text,
    course,
    done: false
});

    todoInput.value = "";

    saveTodos();
    renderTodos();
}

addTodoBtn.addEventListener("click", addTodo);

todoInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        addTodo();
    }
});

renderTodos();