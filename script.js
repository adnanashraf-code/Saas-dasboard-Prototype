const State = {
  tasks: JSON.parse(localStorage.getItem("vel_tasks")) || [],
  projects: JSON.parse(localStorage.getItem("vel_projects")) || [],
  finance: JSON.parse(localStorage.getItem("vel_finance")) || [],
  layout: JSON.parse(localStorage.getItem("vel_layout")) || [
    "tasks-widget",
    "finance-widget",
    "prod-widget",
  ],
  profile: JSON.parse(localStorage.getItem("vel_profile")) || {
    name: "Adnan",
    email: "adnan@velora.io",
    bio: "Product Designer & Developer"
  },
  preferences: JSON.parse(localStorage.getItem("vel_prefs")) || {
    theme: window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light",
    accent: "#f59b01",
    compactMode: false,
    sidebarCollapsed: false,
    emailAlerts: true,
    fontSize: "medium",
    defaultView: "dashboard"
  },
  timeline: JSON.parse(localStorage.getItem("vel_timeline")) || [],
};

function saveState() {
  localStorage.setItem("vel_tasks", JSON.stringify(State.tasks));
  localStorage.setItem("vel_projects", JSON.stringify(State.projects));
  localStorage.setItem("vel_finance", JSON.stringify(State.finance));
  localStorage.setItem("vel_layout", JSON.stringify(State.layout));
  localStorage.setItem("vel_profile", JSON.stringify(State.profile));
  localStorage.setItem("vel_prefs", JSON.stringify(State.preferences));
  localStorage.setItem("vel_timeline", JSON.stringify(State.timeline));
}

// Global Timeline Action Logger
function logActivity(actionMsg) {
  State.timeline.unshift({
    id: Date.now(),
    msg: actionMsg,
    time: new Date().toISOString(),
  });
  if (State.timeline.length > 20) State.timeline.pop();
  saveState();
  renderTimeline();
}

// Global UX Helper
function showToast(message) {
  const container = document.getElementById("toastContainer");
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerText = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// Initializer
document.addEventListener("DOMContentLoaded", () => {
  // 1. Initial State Load Settings
  applyTheme(State.preferences.theme);
  applyAccent(State.preferences.accent);
  applyPreferences();

  document.getElementById("profName").value = State.profile.name;
  document.getElementById("profEmail").value = State.profile.email;
  document.getElementById("profBio").value = State.profile.bio || "Build things.";
  updateTopNavProfile();
  setGreetingMsg();

  // 2. Remove Loader & Load Default View
  setTimeout(() => {
    document.getElementById("globalLoader").classList.remove("active");
    if(State.preferences.defaultView && State.preferences.defaultView !== "dashboard") {
       switchView("view-" + State.preferences.defaultView);
    }
    renderAll();
    showToast("Velora successfully loaded.");
  }, 600);

  // 3. Real-Time Logic (Clock + Greeting refresh)
  const clockEl = document.getElementById("realTimeClock");
  setInterval(() => {
    const now = new Date();
    clockEl.innerText = now.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    // Check if greeting needs an update based on new hour
    if (now.getMinutes() === 0 && now.getSeconds() === 0) {
      setGreetingMsg();
    }
  }, 1000);

  // 4. Setup Navigation SPA
  const navItems = document.querySelectorAll(
    ".sidebar-nav .nav-item, #sidebarSettingsLink",
  );
  const views = document.querySelectorAll(".view-section");

  function switchView(target) {
    navItems.forEach((n) => n.classList.remove("active"));

    // Attempt to set active on nav if exists
    const matchingNav = document.querySelector(`[data-target="${target}"]`);
    if (matchingNav) matchingNav.classList.add("active");

    views.forEach((v) => {
      if (v.id === target) v.classList.add("active");
      else v.classList.remove("active");
    });
    renderAll(); // refresh
  }

  navItems.forEach((item) => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      switchView(item.getAttribute("data-target"));
      // Auto close mobile sidebar if open
      if (window.innerWidth <= 768) {
        document.getElementById("sidebar").classList.remove("open");
      }
    });
  });

  document.getElementById("settingsMenuLink").addEventListener("click", (e) => {
    e.preventDefault();
    switchView("view-settings");
  });

  // Mobile Menu toggler
  document.getElementById("mobileMenuBtn").addEventListener("click", () => {
    document.getElementById("sidebar").classList.toggle("open");
  });
  document
    .getElementById("sidebarCollapseBtn")
    .addEventListener("click", () => {
      document.getElementById("sidebar").classList.remove("open");
    });

  // 5. Command Palette & Shortcuts
  const cmdModal = document.getElementById("cmdModal");
  const cmdInput = document.getElementById("cmdInput");
  const openCmdBtn = document.getElementById("openCommandPaletteBtn");

  function openCommandPalette() {
    cmdModal.classList.add("active");
    setTimeout(() => cmdInput.focus(), 100);
  }

  openCmdBtn.addEventListener("click", openCommandPalette);

  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      openCommandPalette();
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "n") {
      e.preventDefault();
      toggleModal("taskModal", "open");
    }
  });

  document.querySelectorAll(".cmd-item").forEach((item) => {
    item.addEventListener("click", () => {
      const action = item.getAttribute("data-action");
      cmdModal.classList.remove("active");
      if (action === "go-projects") switchView("view-projects");
      if (action === "new-task") toggleModal("taskModal", "open");
      if (action === "go-finance") switchView("view-finance");
      if (action === "go-settings") switchView("view-settings");
    });
  });

  // 6. Modals & Dropdowns Interactions
  document.querySelectorAll(".close-modal").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.target.closest(".modal-overlay").classList.remove("active");
    });
  });

  // Export Data JSON Logic
  document.getElementById("exportDataBtn").addEventListener("click", () => {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(State, null, 2));
    const dlAnchorElem = document.createElement("a");
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", "velora_export.json");
    dlAnchorElem.click();
    logActivity("Exported data as JSON");
    showToast("Data exported successfully!");
  });

  // Dashboard New Task
  document
    .getElementById("openTaskModalBtn")
    .addEventListener("click", () => openTaskModal());
  document
    .getElementById("fabAdd")
    .addEventListener("click", () => openTaskModal());
  document
    .getElementById("widgetAddTaskBtn")
    .addEventListener("click", () => openTaskModal());
  document
    .querySelectorAll(".goToAddTaskBtn")
    .forEach((b) => b.addEventListener("click", () => openTaskModal()));

  // Dashboard / Projects - New Project
  document
    .getElementById("openProjectModalBtn")
    .addEventListener("click", () => toggleModal("projectModal", "open"));

  // Finance Buttons
  document
    .getElementById("openAddTxBtn")
    .addEventListener("click", () => toggleModal("txModal", "open"));
  document
    .getElementById("openAddTxBtn2")
    .addEventListener("click", () => toggleModal("txModal", "open"));

  // Teams Invite
  document.getElementById("openInviteBtn").addEventListener("click", () => {
    showToast("Invite link copied to clipboard.");
    logActivity("Generated team invite link.");
  });

  // Top Nav Dropdowns Setup
  const setupDropdown = (btnId, dropId) => {
    const btn = document.getElementById(btnId);
    const drop = document.getElementById(dropId);
    if (btn && drop) {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        document.querySelectorAll(".dropdown-menu").forEach((m) => {
          if (m.id !== dropId) m.classList.remove("active");
        });
        drop.classList.toggle("active");
        if (btnId === "notifyBtn")
          document.getElementById("notifBadge").style.display = "none";
      });
    }
  };
  setupDropdown("notifyBtn", "notifyDropdown");
  setupDropdown("profileBtn", "profileDropdown");
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".dropdown-wrapper")) {
      document
        .querySelectorAll(".dropdown-menu")
        .forEach((m) => m.classList.remove("active"));
    }
  });

  document.getElementById("markReadBtn").addEventListener("click", () => {
    document.querySelectorAll(".notif-item").forEach((i) => {
      i.classList.remove("unread");
      i.querySelector(".notif-dot").style.opacity = "0";
    });
    showToast("Notifications marked as read.");
  });

  // 7. FORM SUBMISSIONS

  // TASK SUBMIT
  document.getElementById("taskForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const editId = document.getElementById("editTaskId").value;
    const taskTitle = document.getElementById("taskTitle").value;
    const taskPriority = document.getElementById("taskPriority").value;
    const taskDate = document.getElementById("taskDate").value;

    if (editId) {
      // Edit Mode
      const idx = State.tasks.findIndex((t) => t.id === editId);
      if (idx > -1) {
        State.tasks[idx].title = taskTitle;
        State.tasks[idx].priority = taskPriority;
        State.tasks[idx].date = taskDate;
        logActivity(`Updated task: ${taskTitle}`);
      }
    } else {
      // Create Mode
      const taskObj = {
        id: Date.now().toString(),
        title: taskTitle,
        priority: taskPriority,
        date: taskDate,
        completed: false,
      };
      State.tasks.push(taskObj);
      logActivity(`Created task: ${taskTitle}`);
    }

    saveState();
    toggleModal("taskModal", "close");
    renderAll();
    showToast("Task saved successfully!");
    e.target.reset();
  });

  // PROJECT SUBMIT
  document.getElementById("projectForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const projTitle = document.getElementById("projTitle").value;
    const projPriority = document.getElementById("projPriority").value;
    const projStatus = document.getElementById("projStatus").value;
    const projDate = document.getElementById("projDate").value;

    State.projects.push({
      id: "P" + Date.now().toString(),
      title: projTitle,
      status: projStatus,
      priority: projPriority,
      date: projDate,
      progress: 0,
    });

    logActivity(`Launched new project: ${projTitle}`);
    saveState();
    toggleModal("projectModal", "close");
    renderAll();
    showToast("Project launched!");
    e.target.reset(); // Also updates the calendar thanks to renderAll
  });

  // TRANSACTION SUBMIT
  document.getElementById("txForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const title = document.getElementById("txTitle").value;
    const txObj = {
      id: "T" + Date.now().toString(),
      title: title,
      category: document.getElementById("txCategory").value,
      type: document.getElementById("txType").value,
      amount: parseFloat(document.getElementById("txAmount").value),
      isRecurring: document.getElementById("txRecurring").checked,
      date: new Date().toISOString(),
    };
    State.finance.push(txObj);
    logActivity(`Recorded transaction: ${title}`);
    saveState();
    toggleModal("txModal", "close");
    renderAll();
    showToast("Transaction recorded!");
    e.target.reset();
  });

  // PROFILE SUBMIT
  document.getElementById("profileForm").addEventListener("submit", (e) => {
    e.preventDefault();
    State.profile.name = document.getElementById("profName").value;
    State.profile.email = document.getElementById("profEmail").value;
    State.profile.bio = document.getElementById("profBio").value;
    updateTopNavProfile();
    setGreetingMsg();
    saveState();
    logActivity("Updated profile details.");
    showToast("Profile settings saved!");
  });

  // Avatar upload simulation
  const avatarUpload = document.getElementById("avatarUpload");
  if (avatarUpload) {
    avatarUpload.addEventListener("change", (e) => {
      if (e.target.files && e.target.files[0]) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const b64 = event.target.result;
          State.profile.customAvatar = b64;
          saveState();
          updateTopNavProfile();
          showToast("Avatar updated seamlessly!");
          logActivity("Updated profile avatar.");
        };
        reader.readAsDataURL(e.target.files[0]);
      }
    });
  }

  // Quick Theme Toggle
  const quickThemeBtn = document.getElementById("quickThemeToggle");
  const themeIconSun = document.getElementById("themeIconSun");
  const themeIconMoon = document.getElementById("themeIconMoon");

  function updateThemeIcons(mode) {
    if (themeIconSun && themeIconMoon) {
      themeIconSun.style.display = mode === "dark" ? "none" : "block";
      themeIconMoon.style.display = mode === "dark" ? "block" : "none";
    }
  }

  if (quickThemeBtn) {
    quickThemeBtn.addEventListener("click", () => {
      const currentMode = State.preferences.theme;
      const newMode = currentMode === "dark" ? "light" : "dark";
      applyTheme(newMode);
      State.preferences.theme = newMode;
      saveState();
      updateThemeIcons(newMode);
      logActivity(`Toggled to ${newMode} mode via quick action.`);
      showToast(
        `${newMode.charAt(0).toUpperCase() + newMode.slice(1)} Mode activated`,
      );
    });
    updateThemeIcons(State.preferences.theme);
  }

  // APPEARANCE / SETTINGS SUBMIT
  document.querySelectorAll(".color-swatch").forEach((sw) => {
    sw.addEventListener("click", (e) => {
      document
        .querySelectorAll(".color-swatch")
        .forEach((s) => s.classList.remove("active"));
      sw.classList.add("active");
    });
  });

  document.getElementById("saveThemeBtn").addEventListener("click", () => {
    const isDark = document.getElementById("themeRadioDark").checked;
    const mode = isDark ? "dark" : "light";

    const activeSwatch = document.querySelector(".color-swatch.active");
    const accentVal = activeSwatch
      ? activeSwatch.getAttribute("data-color")
      : "#f59b01";

    const fontSize = document.getElementById("fontSizeSelect").value;
    State.preferences.fontSize = fontSize;

    applyTheme(mode);
    applyAccent(accentVal);
    applyPreferences();

    State.preferences.theme = mode;
    State.preferences.accent = accentVal;
    saveState();
    logActivity(`Switched app theme to ${mode} mode with new accent.`);
    showToast("Appearance settings updated.");
  });

  // PREFERENCE TOGGLES
  document
    .getElementById("compactModeToggle")
    .addEventListener("change", (e) => {
      State.preferences.compactMode = e.target.checked;
      applyPreferences();
      saveState();
    });

  document
    .getElementById("sidebarCollapseToggle")
    .addEventListener("change", (e) => {
      State.preferences.sidebarCollapsed = e.target.checked;
      applyPreferences();
      saveState();
    });

  const defaultViewNode = document.getElementById("defaultViewSelect");
  if (defaultViewNode) {
     defaultViewNode.value = State.preferences.defaultView || "dashboard";
     defaultViewNode.addEventListener("change", (e) => {
        State.preferences.defaultView = e.target.value;
        saveState();
        logActivity(`Set default landing page to ${e.target.value}`);
        showToast("Default view updated");
     });
  }

  const exportBtn = document.getElementById("exportPrefsBtn");
  if (exportBtn) {
     exportBtn.addEventListener("click", () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(State.preferences, null, 2));
        const dlAnchorElem = document.createElement("a");
        dlAnchorElem.setAttribute("href", dataStr);
        dlAnchorElem.setAttribute("download", "velora_preferences.json");
        dlAnchorElem.click();
        logActivity("Exported preferences JSON");
        showToast("Settings exported successfully!");
     });
  }

  const resetBtn = document.getElementById("resetPrefsBtn");
  if (resetBtn) {
     resetBtn.addEventListener("click", () => {
        if(confirm("Are you sure you want to reset all preferences to default?")) {
           localStorage.removeItem("vel_prefs");
           showToast("Resetting in 2 seconds...");
           setTimeout(() => window.location.reload(), 2000);
        }
     });
  }

  // 8. Settings Navigation Tab Switching
  document.querySelectorAll(".settings-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document
        .querySelectorAll(".settings-tab")
        .forEach((t) => t.classList.remove("active"));
      document
        .querySelectorAll(".settings-panel")
        .forEach((p) => p.classList.remove("active"));

      tab.classList.add("active");
      document
        .getElementById(tab.getAttribute("data-tab"))
        .classList.add("active");
    });
  });

  // Filters Events Setup
  document
    .getElementById("projectFilter")
    .addEventListener("change", renderProjects);
  document.getElementById("taskFilter").addEventListener("change", renderTasks);

  // 9. Calendar Setup
  const yrSelect = document.getElementById("calYearSelect");
  for (let y = 2000; y <= 2100; y++) {
    const opt = document.createElement("option");
    opt.value = y;
    opt.innerText = y;
    if (y === new Date().getFullYear()) opt.selected = true;
    yrSelect.appendChild(opt);
  }
  const moSelect = document.getElementById("calMonthSelect");
  moSelect.value = new Date().getMonth();

  moSelect.addEventListener("change", renderCalendar);
  yrSelect.addEventListener("change", renderCalendar);
  renderCalendar();

  // 10. DRAG AND DROP - DASHBOARD LAYOUT
  const layoutArea = document.getElementById("dashboardWidgetsArea");
  State.layout.forEach((id) => {
    const el = document.getElementById(id);
    if (el) layoutArea.appendChild(el);
  });

  let draggedItem = null;
  document.querySelectorAll(".draggable").forEach((item) => {
    item.addEventListener("dragstart", function (e) {
      draggedItem = this;
      setTimeout(() => (this.style.opacity = "0.5"), 0);
    });
    item.addEventListener("dragend", function () {
      setTimeout(() => {
        draggedItem.style.opacity = "1";
        draggedItem = null;
        this.classList.remove("drag-over");
        State.layout = Array.from(layoutArea.children)
          .filter((n) => n.nodeType === 1)
          .map((child) => child.id);
        saveState();
        showToast("Layout order updated");
      }, 0);
    });
    item.addEventListener("dragover", function (e) {
      e.preventDefault();
      this.classList.add("drag-over");
    });
    item.addEventListener("dragleave", function () {
      this.classList.remove("drag-over");
    });
    item.addEventListener("drop", function (e) {
      this.classList.remove("drag-over");
      if (this !== draggedItem) {
        let allItems = Array.from(layoutArea.children);
        let draggedIndex = allItems.indexOf(draggedItem);
        let droppedIndex = allItems.indexOf(this);
        if (draggedIndex < droppedIndex)
          this.parentNode.insertBefore(draggedItem, this.nextSibling);
        else this.parentNode.insertBefore(draggedItem, this);
      }
    });
  });
});

// Global Helpers
function toggleModal(id, action) {
  const modal = document.getElementById(id);
  if (modal) {
    if (action === "open") {
      modal.classList.add("active");
      // If task modal open, reset ID
      if (id === "taskModal") {
        document.getElementById("taskForm").reset();
        document.getElementById("editTaskId").value = "";
        document.getElementById("taskModalTitle").innerText = "Create Task";
      }
    } else modal.classList.remove("active");
  }
}

function openTaskModal(taskToEdit = null) {
  toggleModal("taskModal", "open");
  if (taskToEdit) {
    document.getElementById("taskModalTitle").innerText = "Edit Task";
    document.getElementById("editTaskId").value = taskToEdit.id;
    document.getElementById("taskTitle").value = taskToEdit.title;
    document.getElementById("taskPriority").value = taskToEdit.priority;
    document.getElementById("taskDate").value = taskToEdit.date;
  }
}

function applyTheme(mode) {
  if (mode === "dark") {
    document.documentElement.setAttribute("data-theme", "dark");
    document.getElementById("themeRadioDark").checked = true;
  } else {
    document.documentElement.removeAttribute("data-theme");
    document.getElementById("themeRadioLight").checked = true;
  }
}

function applyAccent(color) {
  document.documentElement.style.setProperty("--c-amber", color);
  // Lighten utility approximation
  document.documentElement.style.setProperty("--c-amber-light", `${color}25`);

  document
    .querySelectorAll(".color-swatch")
    .forEach((s) => s.classList.remove("active"));
  const el = document.querySelector(`.color-swatch[data-color="${color}"]`);
  if (el) el.classList.add("active");
}

function applyPreferences() {
  const html = document.documentElement;
  
  if (State.preferences.fontSize) {
    document.getElementById("fontSizeSelect").value = State.preferences.fontSize;
    if(State.preferences.fontSize === 'small') document.body.style.fontSize = "13px";
    else if(State.preferences.fontSize === 'large') document.body.style.fontSize = "16px";
    else document.body.style.fontSize = "";
  }

  if (State.preferences.compactMode) {
    html.setAttribute("data-compact", "true");
    document.getElementById("compactModeToggle").checked = true;
  } else {
    html.removeAttribute("data-compact");
    document.getElementById("compactModeToggle").checked = false;
  }

  if (State.preferences.sidebarCollapsed) {
    html.setAttribute("data-sidebar", "collapsed");
    document.getElementById("sidebarCollapseToggle").checked = true;
  } else {
    html.removeAttribute("data-sidebar");
    document.getElementById("sidebarCollapseToggle").checked = false;
  }
}

function updateTopNavProfile() {
  document.getElementById("topNavProfileName").innerText = State.profile.name;
  document.getElementById("topNavProfileEmail").innerText = State.profile.email;

  const avatarUrl =
    State.profile.customAvatar ||
    `https://ui-avatars.com/api/?name=${State.profile.name}&background=f59b01&color=fff`;
  document.getElementById("topNavAvatar").innerHTML =
    `<img src="${avatarUrl}" style="width:100%; height:100%; object-fit:cover;">`;
  document.getElementById("settingsAvatarPreview").src = avatarUrl;
}

function setGreetingMsg() {
  const hour = new Date().getHours();
  let msg = "Good Evening";
  if (hour < 12) msg = "Good Morning";
  else if (hour < 18) msg = "Good Afternoon";
  document.getElementById("greetingMsg").innerText =
    `${msg}, ${State.profile.name.split(" ")[0]}`;
}

// RENDER FUNCTIONS
function renderAll() {
  renderTasks();
  renderFinance();
  renderCalendar();
  renderProjects();
  renderTimeline();
}

function formatDateDisplay(dStr) {
  if (!dStr) return "";
  const dt = new Date(dStr);
  return dt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// 1. Render Tasks
function renderTasks() {
  const dashList = document.getElementById("dashTaskList");
  const dashEmpty = document.getElementById("dashTaskEmpty");
  const fullList = document.getElementById("fullTasksList");
  const fullEmpty = document.getElementById("fullTasksEmpty");

  dashList.innerHTML = "";
  fullList.innerHTML = "";

  const filterVal = document.getElementById("taskFilter").value;

  let viewableTasks = State.tasks;
  if (filterVal === "completed")
    viewableTasks = State.tasks.filter((t) => t.completed);
  if (filterVal === "pending")
    viewableTasks = State.tasks.filter((t) => !t.completed);

  if (viewableTasks.length === 0) fullEmpty.style.display = "block";
  else fullEmpty.style.display = "none";

  if (State.tasks.length === 0) dashEmpty.style.display = "block";
  else dashEmpty.style.display = "none";

  let completedCount = 0;
  const totalRaw = State.tasks.length;

  State.tasks.forEach((t) => {
    if (t.completed) completedCount++;
  });

  viewableTasks.forEach((t) => {
    const tHTML = document.createElement("div");
    tHTML.className = "task-item draggable";
    tHTML.draggable = true;
    tHTML.innerHTML = `
      <label class="checkbox-container">
        <input type="checkbox" data-id="${t.id}" class="task-check" ${t.completed ? "checked" : ""}>
        <span class="checkmark"></span>
      </label>
      <div class="task-details">
        <span class="task-title ${t.completed ? "completed" : ""}">${t.title}</span>
        <div class="task-meta">
          <span class="tag tag-${t.priority}">${t.priority}</span>
          <span class="deadline">${formatDateDisplay(t.date)}</span>
        </div>
      </div>
      <button class="edit-task-btn" data-id="${t.id}" title="Edit"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg></button>
      <button class="delete-task-btn" data-id="${t.id}" title="Delete">&times;</button>
    `;

    // Wire Checkbox
    tHTML.querySelector(".task-check").addEventListener("change", (e) => {
      const isChecked = e.target.checked;
      const idx = State.tasks.findIndex((x) => x.id === t.id);
      State.tasks[idx].completed = isChecked;
      saveState();
      renderAll();
    });

    // Wire Edit
    tHTML.querySelector(".edit-task-btn").addEventListener("click", () => {
      const task = State.tasks.find((x) => x.id === t.id);
      openTaskModal(task);
    });

    // Wire Delete
    tHTML.querySelector(".delete-task-btn").addEventListener("click", () => {
      State.tasks = State.tasks.filter((x) => x.id !== t.id);
      saveState();
      renderAll();
      showToast("Task deleted");
    });

    fullList.appendChild(tHTML);
  });

  // Task list DnD implementation
  let taskDragEl = null;
  fullList.querySelectorAll(".draggable").forEach((tItem) => {
    tItem.addEventListener("dragstart", function (e) {
      taskDragEl = this;
      setTimeout(() => (this.style.opacity = "0.5"), 0);
    });
    tItem.addEventListener("dragend", function () {
      setTimeout(() => {
        this.style.opacity = "1";
        taskDragEl = null;
      }, 0);
    });
    tItem.addEventListener("dragover", function (e) {
      e.preventDefault();
    });
    tItem.addEventListener("drop", function (e) {
      e.preventDefault();
      if (this !== taskDragEl) {
        let allTasks = Array.from(fullList.children);
        let draggedIndex = allTasks.indexOf(taskDragEl);
        let droppedIndex = allTasks.indexOf(this);
        if (draggedIndex < droppedIndex)
          this.parentNode.insertBefore(taskDragEl, this.nextSibling);
        else this.parentNode.insertBefore(taskDragEl, this);
        logActivity("Reordered tasks view.");
      }
    });
  });

  // Small Dashboard clone representation
  const pendingArr = State.tasks.filter((x) => !x.completed);
  for (let i = 0; i < Math.min(pendingArr.length, 4); i++) {
    const t = pendingArr[i];
    const node = document.createElement("div");
    node.className = "task-item";
    node.innerHTML = `
        <label class="checkbox-container">
          <input type="checkbox" data-id="${t.id}" class="task-check">
          <span class="checkmark"></span>
        </label>
        <div class="task-details">
           <span class="task-title">${t.title}</span>
           <span style="font-size:11px;color:var(--text-muted)">Due: ${formatDateDisplay(t.date)}</span>
        </div>
     `;
    node.querySelector(".task-check").addEventListener("change", (e) => {
      const idx = State.tasks.findIndex((x) => x.id === t.id);
      State.tasks[idx].completed = true;
      saveState();
      renderAll();
      logActivity(`Completed task: ${t.title}`);
    });
    dashList.appendChild(node);
  }

  // Progress Bar update
  let pct = totalRaw > 0 ? Math.round((completedCount / totalRaw) * 100) : 0;

  document.getElementById("dashTaskProgText").innerText = pct + "%";
  document.getElementById("dashTaskProgBar").style.width = pct + "%";
  document.getElementById("dashTaskComp").innerText = pct + "%";
  document.getElementById("prodPercentageText").innerText = pct;
  document.getElementById("prodSvgCircle").style.strokeDasharray =
    `${pct}, 100`;
}

// 2. Render Projects
function renderProjects() {
  const filterVal = document.getElementById("projectFilter").value;
  let viewableProjs = State.projects;

  if (filterVal === "active")
    viewableProjs = State.projects.filter((p) => p.status === "active");
  if (filterVal === "completed")
    viewableProjs = State.projects.filter((p) => p.status === "completed");

  document.getElementById("dashProjCount").innerText = State.projects.filter(
    (p) => p.status === "active",
  ).length;

  const projEmpty = document.getElementById("projectsEmptyState");
  const projList = document.getElementById("projectsList");

  projList.innerHTML = "";
  if (viewableProjs.length === 0) {
    projEmpty.style.display = "block";
  } else {
    projEmpty.style.display = "none";
    viewableProjs.forEach((p) => {
      // Auto mock progress based on active status
      p.progress =
        p.status === "completed" ? 100 : Math.floor(Math.random() * 80) + 10;

      const pNode = document.createElement("div");
      pNode.className = "widget";
      pNode.style.position = "relative";
      pNode.innerHTML = `
           <button class="delete-task-btn" data-id="${p.id}" style="opacity:1;top:16px;right:16px;">&times;</button>
           <h3 style="font-size:16px;margin-bottom:8px;padding-right:20px;">${p.title}</h3>
           <p style="font-size:13px;color:var(--text-muted);margin-bottom:16px;">Deadline: ${formatDateDisplay(p.date)}</p>
           
           <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
             <span class="tag tag-${p.priority}">Priority: ${p.priority}</span>
             <span class="badge" style="background:${p.status === "active" ? "rgba(59, 130, 246, 0.1)" : "rgba(16, 185, 129, 0.1)"}; color:${p.status === "active" ? "#3b82f6" : "#10b981"}; text-transform:capitalize;">${p.status}</span>
           </div>

           <div class="project-progress-bar">
             <div class="project-progress-bar-inner" style="width:${p.progress}%"></div>
           </div>
           
           <div style="display:flex;gap:8px;margin-top:16px;">
             <button class="outline-btn toggle-project-btn" data-id="${p.id}" style="border:1px solid var(--border-subtle);padding:6px;border-radius:4px;width:100%;background:var(--bg-app);cursor:pointer;font-size:12px;">Mark as ${p.status === "active" ? "Completed" : "Active"}</button>
           </div>
         `;

      pNode.querySelector(".delete-task-btn").addEventListener("click", (e) => {
        State.projects = State.projects.filter((x) => x.id !== p.id);
        logActivity(`Deleted project: ${p.title}`);
        saveState();
        renderAll();
        showToast("Project removed");
      });

      pNode
        .querySelector(".toggle-project-btn")
        .addEventListener("click", () => {
          const idx = State.projects.findIndex((x) => x.id === p.id);
          State.projects[idx].status =
            p.status === "active" ? "completed" : "active";
          logActivity(
            `Project ${p.title} moved to ${State.projects[idx].status}`,
          );
          saveState();
          renderAll();
          showToast("Project status updated");
        });

      projList.appendChild(pNode);
    });
  }
}

// 3. Render Finance
function renderFinance() {
  let inc = 0;
  let exp = 0;
  const dList = document.getElementById("dashTxList");
  const fList = document.getElementById("fullTxList");

  dList.innerHTML = "";
  fList.innerHTML = "";

  const arr = [...State.finance].sort(
    (a, b) => new Date(b.date) - new Date(a.date),
  );

  // Compute bar chart heights (mock simulation dynamically adjusted based on recent ratio for true visual representation)
  const chartBars = document.querySelectorAll(".chart-bar");
  if (arr.length > 0 && chartBars.length === 6) {
    chartBars[0].style.height = `${Math.random() * 40 + 20}%`;
    chartBars[1].style.height = `${Math.random() * 50 + 30}%`;
    chartBars[2].style.height = `${Math.random() * 60 + 20}%`;
    chartBars[3].style.height = `${Math.random() * 40 + 40}%`;
    chartBars[4].style.height = `${Math.random() * 30 + 10}%`; // Dip
    chartBars[5].style.height = `${Math.random() * 80 + 20}%`; // Current projection
  }

  if (arr.length === 0) {
    dList.innerHTML =
      '<div class="empty-state" style="padding:16px;">No recent transactions.</div>';
    document.getElementById("fullTxEmpty").style.display = "block";
  } else {
    document.getElementById("fullTxEmpty").style.display = "none";
    arr.forEach((tx, i) => {
      if (tx.type === "income") inc += tx.amount;
      else exp += tx.amount;

      const txHTML = `
        <div class="transaction-item">
          <div class="transaction-icon ${tx.type === "income" ? "inc" : ""}">$</div>
          <div class="transaction-info">
            <span class="tx-name" style="display:flex;align-items:center;gap:6px;">
               ${tx.title}
               ${tx.isRecurring ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--text-muted)"><polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path></svg>' : ""}
            </span>
            <span class="tx-date">${tx.category} • ${formatDateDisplay(tx.date)}</span>
          </div>
          <div class="tx-amount ${tx.type === "income" ? "positive" : "negative"}">
            ${tx.type === "income" ? "+" : "-"}$${tx.amount.toFixed(2)}
          </div>
        </div>
      `;
      fList.innerHTML += txHTML;
      if (i < 4) dList.innerHTML += txHTML; // Dashboard limit
    });
  }

  // Update DOM numbers
  const formatFin = (v) =>
    "$" +
    v.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  document.getElementById("dashIncome").innerText = "+" + formatFin(inc);
  document.getElementById("dashExpense").innerText = "-" + formatFin(exp);
  document.getElementById("finVoltInc").innerText = "+" + formatFin(inc);
  document.getElementById("finVoltExp").innerText = "-" + formatFin(exp);

  const net = inc - exp;
  document.getElementById("finVoltNet").innerText = formatFin(net);
  document.getElementById("dashRevValue").innerText = formatFin(inc);

  // Budget Alarm Simulation (If expenses > $2000 show warning)
  const warnNode = document.getElementById("budgetWarning");
  if (exp > 2000) warnNode.style.display = "block";
  else warnNode.style.display = "none";
}

// 4. Render Calendar
function renderCalendar() {
  const y = parseInt(document.getElementById("calYearSelect").value);
  const m = parseInt(document.getElementById("calMonthSelect").value);
  const grid = document.getElementById("calendarGrid");

  grid.innerHTML = `
    <div class="cal-header">Sun</div><div class="cal-header">Mon</div><div class="cal-header">Tue</div>
    <div class="cal-header">Wed</div><div class="cal-header">Thu</div><div class="cal-header">Fri</div><div class="cal-header">Sat</div>
  `;

  const firstDay = new Date(y, m, 1).getDay();
  const daysInMonth = new Date(y, m + 1, 0).getDate();

  for (let i = 0; i < firstDay; i++)
    grid.innerHTML += `<div class="cal-day empty"></div>`;

  for (let d = 1; d <= daysInMonth; d++) {
    const isToday =
      new Date().getFullYear() === y &&
      new Date().getMonth() === m &&
      new Date().getDate() === d;
    const str = `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

    // Aggregate Tasks & Projects for date
    const dayTasks = State.tasks.filter((t) => t.date === str);
    const dayProjs = State.projects.filter((p) => p.date === str);

    let eventsHTML = "";
    dayProjs.forEach(
      (p) => (eventsHTML += `<div class="cal-event Project">${p.title}</div>`),
    );
    dayTasks.forEach(
      (t) => (eventsHTML += `<div class="cal-event">${t.title}</div>`),
    );

    grid.innerHTML += `
      <div class="cal-day ${isToday ? "today" : ""}" data-date="${str}">
        <span>${d}</span>
        ${eventsHTML}
      </div>
    `;
  }

  grid.querySelectorAll(".cal-day:not(.empty)").forEach((cell) => {
    cell.addEventListener("click", (e) => {
      document.getElementById("taskDate").value =
        e.currentTarget.getAttribute("data-date");
      toggleModal("taskModal", "open");
    });
  });
}

// 5. Render Timeline
function renderTimeline() {
  const ctn = document.getElementById("dashTimeline");
  ctn.innerHTML = "";
  if (State.timeline.length === 0) {
    ctn.innerHTML = '<div style="padding:12px;">No recent activity.</div>';
    return;
  }
  State.timeline.forEach((item) => {
    const dt = new Date(item.time);
    const timeStr = dt.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    ctn.innerHTML += `
         <div class="timeline-item">
            <span style="display:block;margin-bottom:2px;">${item.msg}</span>
            <span style="font-size:11px;color:rgba(0,0,0,0.4);.dark &{color:rgba(255,255,255,0.4)}">${timeStr}</span>
         </div>
      `;
  });
}
