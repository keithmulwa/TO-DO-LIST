console.count("index.js executed");
console.trace("index.js execution");



let tasks = [];
let currentFilter = "all";



const SUPABASE_URL = "https://mtyppdqnvtfoznqvudlz.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10eXBwZHFudnRmb3pucXZ1ZGx6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3MzU3MDQsImV4cCI6MjA5ODMxMTcwNH0.ZtPS-sWYkqIS5hZMZ_e54WcZMMd1dgnGPGxCHmOmhrY";

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);



async function loadTasks() {
  const { data, error } = await db
    .from("tasks")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error loading tasks:", error);
    return;
  }
  tasks = data;
}

async function addTask(text) {
  const { error } = await db
    .from("tasks")
    .insert({ text: text, completed: false });

  if (error) {
    console.error("Error adding task:", error);
    return;
  }
  await loadTasks();
  render();
}

async function toggleTask(id) {
  const task = tasks.find((t) => t.id === id);
  if (!task) return;

  const { error } = await db
    .from("tasks")
    .update({ completed: !task.completed })
    .eq("id", id);

  if (error) {
    console.error("Error updating task:", error);
    return;
  }
  await loadTasks();
  render();
}

async function deleteTask(id) {
  const { error } = await db.from("tasks").delete().eq("id", id);

  if (error) {
    console.error("Error deleting task:", error);
    return;
  }
  await loadTasks();
  render();
}

/* ===================================================================
   RENDERING
=================================================================== */

function render() {
  // Stats
  const total = tasks.length;
  const pending = tasks.filter((t) => !t.completed).length;
  const completed = tasks.filter((t) => t.completed).length;

  document.getElementById("statTotal").textContent = total;
  document.getElementById("statPending").textContent = pending;
  document.getElementById("statCompleted").textContent = completed;

  // Filtered list
  let visible = tasks;
  if (currentFilter === "pending") visible = tasks.filter((t) => !t.completed);
  if (currentFilter === "completed") visible = tasks.filter((t) => t.completed);

  const list = document.getElementById("taskList");
  const emptyState = document.getElementById("emptyState");

  list.innerHTML = "";

  if (visible.length === 0) {
    emptyState.classList.remove("hidden");
  } else {
    emptyState.classList.add("hidden");
    visible.forEach((task) => {
      const li = document.createElement("li");
      li.className = "task-item" + (task.completed ? " completed" : "");

      li.innerHTML = `
        <input type="checkbox" ${task.completed ? "checked" : ""} data-id="${task.id}">
        <span class="task-text">${escapeHtml(task.text)}</span>
        <button class="delete-btn" data-id="${task.id}">Delete</button>
      `;

      list.appendChild(li);
    });
  }
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

/* ===================================================================
   EVENTS
=================================================================== */

document.getElementById("addTaskBtn").addEventListener("click", handleAdd);

document.getElementById("taskInput").addEventListener("keydown", (e) => {
  if (e.key === "Enter") handleAdd();
});

async function handleAdd() {
  const input = document.getElementById("taskInput");
  const value = input.value.trim();
  if (value === "") return;
  await addTask(value);
  input.value = "";
}

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    currentFilter = tab.dataset.filter;
    render();
  });
});

// Click handling for checkboxes + delete buttons (event delegation)
document.getElementById("taskList").addEventListener("click", (e) => {
  if (e.target.matches('input[type="checkbox"]')) {
    toggleTask(Number(e.target.dataset.id));
  }
  if (e.target.matches(".delete-btn")) {
    deleteTask(Number(e.target.dataset.id));
  }
});

/* ===================================================================
   INIT
=================================================================== */

(async function init() {
  await loadTasks();
  render();
})();