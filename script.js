// Todo App Class - Main Application Logic
class TodoApp {
    constructor() {
        this.tasks = [];
        this.currentFilter = "all";
        this.currentSort = "date";
        this.isDarkMode = false;
        this.recognition = null;
        this.isRecording = false;

        this.initializeElements();
        this.initializeEventListeners();
        this.loadFromLocalStorage();
        this.loadThemePreference();
        this.renderTasks();
        this.updateProgress();
        this.initializeNotifications();
        this.initializeConfirmationDialog();
        this.initializeEditDialog();
    }

    // Initialize DOM elements
    initializeElements() {
        this.elements = {
            todoInput: document.getElementById("todo-input"),
            addBtn: document.getElementById("add-btn"),
            voiceBtn: document.getElementById("voice-btn"),
            todoList: document.getElementById("todo-list"),
            resetBtn: document.getElementById("reset-btn"),
            clearCompletedBtn: document.getElementById("clear-completed-btn"),
            themeBtn: document.getElementById("theme-btn"),
            filterBtns: document.querySelectorAll(".filter-btn"),
            sortSelect: document.getElementById("sort-select"),
            progressPercentage: document.getElementById("progress-percentage"),
            progressFill: document.getElementById("progress-fill"),
            totalTasks: document.getElementById("total-tasks"),
            completedTasks: document.getElementById("completed-tasks"),
            taskTemplate: document.getElementById("task-template"),
            priorityBtn: document.getElementById("priority-btn"),
            priorityLabel: document.querySelector(".priority-label"),
            priorityOptions: document.querySelectorAll(".priority-option"),
            dueDateInput: document.getElementById("due-date"),
        };
    }

    // Initialize event listeners
    initializeEventListeners() {
        // Add task events
        this.elements.addBtn.addEventListener("click", () => this.addTask());
        this.elements.todoInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") this.addTask();
        });

        // Voice input
        this.elements.voiceBtn.addEventListener("click", () =>
            this.toggleVoiceInput()
        );
        this.initializeSpeechRecognition();

        // Theme toggle
        this.elements.themeBtn.addEventListener("click", () =>
            this.toggleTheme()
        );

        // Filter events
        this.elements.filterBtns.forEach((btn) => {
            btn.addEventListener("click", (e) => {
                this.setFilter(e.target.dataset.filter);
            });
        });

        // Sort events
        this.elements.sortSelect.addEventListener("change", (e) => {
            this.setSort(e.target.value);
        });

        // Footer actions
        this.elements.resetBtn.addEventListener("click", () => this.resetAll());
        this.elements.clearCompletedBtn.addEventListener("click", () =>
            this.clearCompleted()
        );

        // Priority selector
        this.elements.priorityBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            const selector = e.currentTarget.closest(".priority-selector");
            selector.classList.toggle("active");
        });

        this.elements.priorityOptions.forEach((option) => {
            option.addEventListener("click", (e) => {
                const priority = e.currentTarget.dataset.priority;
                this.elements.priorityLabel.textContent =
                    priority.charAt(0).toUpperCase() + priority.slice(1);
                this.elements.priorityBtn.querySelector(
                    "i"
                ).className = `fas fa-flag text-${
                    priority === "medium"
                        ? "warning"
                        : priority === "high"
                        ? "danger"
                        : "success"
                }`;
                document
                    .querySelector(".priority-selector")
                    .classList.remove("active");
            });
        });

        // Close priority dropdown when clicking outside
        document.addEventListener("click", (e) => {
            if (!e.target.closest(".priority-selector")) {
                document
                    .querySelector(".priority-selector")
                    .classList.remove("active");
            }
        });
    }

    // Initialize speech recognition
    initializeSpeechRecognition() {
        if (
            "webkitSpeechRecognition" in window ||
            "SpeechRecognition" in window
        ) {
            const SpeechRecognition =
                window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.lang = "en-US";

            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                this.elements.todoInput.value = transcript;
                this.addTask();
            };

            this.recognition.onerror = (event) => {
                console.error("Speech recognition error:", event.error);
                this.stopVoiceRecording();
            };

            this.recognition.onend = () => {
                this.stopVoiceRecording();
            };
        } else {
            this.elements.voiceBtn.style.display = "none";
        }
    }

    // Toggle voice input
    toggleVoiceInput() {
        if (this.isRecording) {
            this.stopVoiceRecording();
        } else {
            this.startVoiceRecording();
        }
    }

    // Start voice recording
    startVoiceRecording() {
        if (this.recognition) {
            this.recognition.start();
            this.isRecording = true;
            this.elements.voiceBtn.classList.add("recording");
            this.elements.voiceBtn.innerHTML = '<i class="fas fa-stop"></i>';
        }
    }

    // Stop voice recording
    stopVoiceRecording() {
        if (this.recognition) {
            this.recognition.stop();
        }
        this.isRecording = false;
        this.elements.voiceBtn.classList.remove("recording");
        this.elements.voiceBtn.innerHTML = '<i class="fas fa-microphone"></i>';
    }

    // Initialize notifications
    initializeNotifications() {
        // Create notification container if it doesn't exist
        if (!document.querySelector(".notification-container")) {
            const container = document.createElement("div");
            container.className = "notification-container";
            document.body.appendChild(container);
        }
    }

    // Show notification
    showNotification(title, message, type = "info", duration = 3000) {
        const notification = document.createElement("div");
        notification.className = `notification ${type}`;

        let icon = "info-circle";
        switch (type) {
            case "success":
                icon = "check-circle";
                break;
            case "error":
                icon = "times-circle";
                break;
            case "warning":
                icon = "exclamation-circle";
                break;
        }

        notification.innerHTML = `
            <i class="fas fa-${icon}"></i>
            <div class="notification-content">
                <div class="notification-title">${title}</div>
                <div class="notification-message">${message}</div>
            </div>
        `;

        document
            .querySelector(".notification-container")
            .appendChild(notification);

        // Trigger animation
        setTimeout(() => notification.classList.add("show"), 10);

        // Remove notification after duration
        setTimeout(() => {
            notification.classList.remove("show");
            setTimeout(() => notification.remove(), 500);
        }, duration);
    }

    // Initialize confirmation dialog
    initializeConfirmationDialog() {
        // Create dialog elements if they don't exist
        if (!document.querySelector(".confirmation-dialog")) {
            const overlay = document.createElement("div");
            overlay.className = "dialog-overlay";

            const dialog = document.createElement("div");
            dialog.className = "confirmation-dialog";
            dialog.innerHTML = `
                <div class="confirmation-title"></div>
                <div class="confirmation-message"></div>
                <div class="confirmation-actions">
                    <button class="cancel-btn">Cancel</button>
                    <button class="confirm-btn">Confirm</button>
                </div>
            `;

            document.body.appendChild(overlay);
            document.body.appendChild(dialog);
        }
    }

    // Show confirmation dialog
    showConfirmationDialog(title, message) {
        return new Promise((resolve) => {
            const overlay = document.querySelector(".dialog-overlay");
            const dialog = document.querySelector(".confirmation-dialog");
            const confirmBtn = dialog.querySelector(".confirm-btn");
            const cancelBtn = dialog.querySelector(".cancel-btn");

            // Set content
            dialog.querySelector(".confirmation-title").textContent = title;
            dialog.querySelector(".confirmation-message").textContent = message;

            // Show dialog
            overlay.classList.add("show");
            dialog.classList.add("show");

            // Handle buttons
            const handleConfirm = () => {
                overlay.classList.remove("show");
                dialog.classList.remove("show");
                cleanup();
                resolve(true);
            };

            const handleCancel = () => {
                overlay.classList.remove("show");
                dialog.classList.remove("show");
                cleanup();
                resolve(false);
            };

            const handleOverlayClick = (e) => {
                if (e.target === overlay) {
                    handleCancel();
                }
            };

            const handleEscape = (e) => {
                if (e.key === "Escape") {
                    handleCancel();
                }
            };

            // Add event listeners
            confirmBtn.addEventListener("click", handleConfirm);
            cancelBtn.addEventListener("click", handleCancel);
            overlay.addEventListener("click", handleOverlayClick);
            document.addEventListener("keydown", handleEscape);

            // Cleanup function
            const cleanup = () => {
                confirmBtn.removeEventListener("click", handleConfirm);
                cancelBtn.removeEventListener("click", handleCancel);
                overlay.removeEventListener("click", handleOverlayClick);
                document.removeEventListener("keydown", handleEscape);
            };
        });
    }

    // Initialize edit task dialog
    initializeEditDialog() {
        if (!document.querySelector(".edit-task-dialog")) {
            const dialog = document.createElement("div");
            dialog.className = "edit-task-dialog";
            dialog.innerHTML = `
                <div class="edit-task-title">Edit Task</div>
                <form class="edit-task-form">
                    <div class="edit-form-group">
                        <label class="edit-form-label">
                            <i class="fas fa-tasks"></i>
                            Task Title
                        </label>
                        <input type="text" class="edit-task-input" placeholder="Enter task title">
                    </div>
                    
                    <div class="edit-form-group">
                        <label class="edit-form-label">
                            <i class="fas fa-flag"></i>
                            Priority Level
                        </label>
                        <div class="priority-options">
                            <div class="priority-option high">
                                <input type="radio" name="priority" value="high" id="priority-high">
                                <label for="priority-high">
                                    <i class="fas fa-arrow-up"></i>
                                    High
                                </label>
                            </div>
                            <div class="priority-option medium">
                                <input type="radio" name="priority" value="medium" id="priority-medium">
                                <label for="priority-medium">
                                    <i class="fas fa-minus"></i>
                                    Medium
                                </label>
                            </div>
                            <div class="priority-option low">
                                <input type="radio" name="priority" value="low" id="priority-low">
                                <label for="priority-low">
                                    <i class="fas fa-arrow-down"></i>
                                    Low
                                </label>
                            </div>
                        </div>
                    </div>
                    
                    <div class="edit-form-group">
                        <label class="edit-form-label">
                            <i class="fas fa-calendar"></i>
                            Due Date
                        </label>
                        <input type="date" class="due-date-input">
                    </div>
                    
                    <div class="edit-task-actions">
                        <button type="button" class="edit-cancel-btn">Cancel</button>
                        <button type="submit" class="edit-save-btn">Save Changes</button>
                    </div>
                </form>
            `;
            document.body.appendChild(dialog);
        }
    }

    // Show edit task dialog
    showEditDialog(taskId) {
        return new Promise((resolve) => {
            const dialog = document.querySelector(".edit-task-dialog");
            const form = dialog.querySelector(".edit-task-form");
            const titleInput = dialog.querySelector(".edit-task-input");
            const priorityInputs = dialog.querySelectorAll(
                'input[name="priority"]'
            );
            const dateInput = dialog.querySelector(".due-date-input");
            const saveBtn = dialog.querySelector(".edit-save-btn");
            const cancelBtn = dialog.querySelector(".edit-cancel-btn");

            const task = this.tasks.find((t) => t.id === taskId);
            if (!task) return;

            // Set current values
            titleInput.value = task.title;

            // Set priority
            const priorityInput = dialog.querySelector(
                `input[value="${task.priority || "medium"}"]`
            );
            if (priorityInput) priorityInput.checked = true;

            // Set date
            if (task.dueDate) {
                dateInput.value = task.dueDate;
            } else {
                dateInput.value = "";
            }

            // Show dialog with animation
            dialog.classList.add("show");
            titleInput.focus();

            // Handle form submission
            const handleSubmit = (e) => {
                e.preventDefault();
                const newTitle = titleInput.value.trim();
                if (newTitle) {
                    const selectedPriority = dialog.querySelector(
                        'input[name="priority"]:checked'
                    ).value;
                    dialog.classList.remove("show");
                    cleanup();
                    resolve({
                        title: newTitle,
                        priority: selectedPriority,
                        dueDate: dateInput.value || null,
                    });
                } else {
                    titleInput.classList.add("shake");
                    setTimeout(() => titleInput.classList.remove("shake"), 500);
                }
            };

            const handleCancel = () => {
                dialog.classList.remove("show");
                cleanup();
                resolve(null);
            };

            const handleKeydown = (e) => {
                if (e.key === "Escape") {
                    handleCancel();
                }
            };

            // Add event listeners
            form.addEventListener("submit", handleSubmit);
            cancelBtn.addEventListener("click", handleCancel);
            document.addEventListener("keydown", handleKeydown);

            // Cleanup function
            const cleanup = () => {
                form.removeEventListener("submit", handleSubmit);
                cancelBtn.removeEventListener("click", handleCancel);
                document.removeEventListener("keydown", handleKeydown);
            };
        });
    }

    // Add new task
    addTask() {
        const title = this.elements.todoInput.value.trim();
        if (!title) {
            this.showNotification(
                "Error",
                "Please enter a task title",
                "error"
            );
            return;
        }

        const task = {
            id: Date.now() + Math.random(),
            title: title,
            completed: false,
            createdAt: new Date().toISOString(),
            priority: this.elements.priorityLabel.textContent.toLowerCase(),
            dueDate: this.elements.dueDateInput.value || null,
        };

        this.tasks.push(task);
        this.saveToLocalStorage();
        this.renderTasks();
        this.updateProgress();

        // Reset input fields
        this.elements.todoInput.value = "";
        this.elements.dueDateInput.value = "";
        this.elements.priorityLabel.textContent = "Medium";
        this.elements.priorityBtn.querySelector("i").className =
            "fas fa-flag text-warning";

        this.showNotification("Success", "Task added successfully", "success");
        this.animateTaskAddition();
    }

    // Create task element
    createTaskElement(task) {
        const template = this.elements.taskTemplate.content.cloneNode(true);
        const taskItem = template.querySelector(".task-item");

        taskItem.dataset.id = task.id;
        if (task.completed) taskItem.classList.add("completed");

        // Get elements
        const checkbox = taskItem.querySelector(".task-checkbox-input");
        const title = taskItem.querySelector(".task-title");
        const date = taskItem.querySelector(".task-date");
        const priority = taskItem.querySelector(".task-priority");
        const editBtn = taskItem.querySelector(".edit-btn");
        const deleteBtn = taskItem.querySelector(".delete-btn");

        // Set unique id and name for checkbox
        const checkboxId = `task-checkbox-${task.id}`;
        checkbox.id = checkboxId;
        checkbox.name = checkboxId;

        // Set label's for attribute
        const label = taskItem.querySelector(".task-label");
        label.setAttribute("for", checkboxId);

        // Set values
        checkbox.checked = task.completed;
        title.textContent = task.title;

        // Set date
        if (task.dueDate) {
            const dueDate = new Date(task.dueDate);
            const today = new Date();
            const diffTime = dueDate - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays < 0) {
                date.textContent = `Overdue by ${Math.abs(diffDays)} days`;
                date.style.color = "var(--danger-color)";
            } else if (diffDays === 0) {
                date.textContent = "Due today";
                date.style.color = "var(--warning-color)";
            } else if (diffDays === 1) {
                date.textContent = "Due tomorrow";
                date.style.color = "var(--warning-color)";
            } else {
                date.textContent = `Due in ${diffDays} days`;
            }
        } else {
            const createdDate = new Date(task.createdAt);
            date.textContent = createdDate.toLocaleDateString();
        }

        // Set priority
        if (task.priority) {
            priority.textContent = task.priority;
            priority.classList.add(task.priority);
        }

        // Event listeners
        checkbox.addEventListener("change", () => this.toggleTask(task.id));
        editBtn.addEventListener("click", () => this.editTask(task.id));
        deleteBtn.addEventListener("click", () => this.deleteTask(task.id));

        return taskItem;
    }

    // Render tasks
    renderTasks() {
        this.elements.todoList.innerHTML = "";

        let filteredTasks = this.getFilteredTasks();
        filteredTasks = this.getSortedTasks(filteredTasks);

        if (filteredTasks.length === 0) {
            this.showEmptyState();
            return;
        }

        filteredTasks.forEach((task) => {
            const taskElement = this.createTaskElement(task);
            this.elements.todoList.appendChild(taskElement);
        });
    }

    // Get filtered tasks
    getFilteredTasks() {
        switch (this.currentFilter) {
            case "active":
                return this.tasks.filter((task) => !task.completed);
            case "completed":
                return this.tasks.filter((task) => task.completed);
            default:
                return this.tasks;
        }
    }

    // Get sorted tasks
    getSortedTasks(tasks) {
        return tasks.sort((a, b) => {
            switch (this.currentSort) {
                case "name":
                    return a.title.localeCompare(b.title);
                case "priority":
                    const priorityOrder = { high: 3, medium: 2, low: 1 };
                    return (
                        priorityOrder[b.priority] - priorityOrder[a.priority]
                    );
                case "date":
                default:
                    return new Date(b.createdAt) - new Date(a.createdAt);
            }
        });
    }

    // Show empty state
    showEmptyState() {
        const emptyState = document.createElement("div");
        emptyState.className = "empty-state";
        emptyState.innerHTML = `
            <i class="fas fa-clipboard-list"></i>
            <h3>No tasks found</h3>
            <p>${
                this.currentFilter === "all"
                    ? "Add your first task to get started!"
                    : `No ${this.currentFilter} tasks found.`
            }</p>
        `;
        this.elements.todoList.appendChild(emptyState);
    }

    // Toggle task completion
    toggleTask(taskId) {
        const task = this.tasks.find((t) => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            this.saveToLocalStorage();
            this.renderTasks();
            this.updateProgress();
            this.animateTaskToggle(taskId);

            this.showNotification(
                task.completed ? "Task Completed" : "Task Reopened",
                task.completed
                    ? "Great job! Keep it up!"
                    : "Task marked as incomplete",
                "info"
            );
        }
    }

    // Edit task
    async editTask(taskId) {
        const task = this.tasks.find((t) => t.id === taskId);
        if (!task) return;

        const result = await this.showEditDialog(taskId);
        if (result) {
            task.title = result.title;
            task.priority = result.priority;
            task.dueDate = result.dueDate;
            this.saveToLocalStorage();
            this.renderTasks();

            this.showNotification(
                "Task Updated",
                "Changes have been saved successfully",
                "success"
            );
        }
    }

    // Delete task
    async deleteTask(taskId) {
        const confirmed = await this.showConfirmationDialog(
            "Delete Task",
            "Are you sure you want to delete this task?"
        );

        if (confirmed) {
            const task = this.tasks.find((t) => t.id === taskId);
            this.tasks = this.tasks.filter((t) => t.id !== taskId);
            this.saveToLocalStorage();
            this.renderTasks();
            this.updateProgress();
            this.animateTaskDeletion(taskId);

            this.showNotification(
                "Task Deleted",
                "Task has been removed",
                "warning"
            );
        }
    }

    // Set filter
    setFilter(filter) {
        this.currentFilter = filter;
        this.elements.filterBtns.forEach((btn) => {
            btn.classList.toggle("active", btn.dataset.filter === filter);
        });
        this.renderTasks();
    }

    // Set sort
    setSort(sort) {
        this.currentSort = sort;
        this.renderTasks();
    }

    // Toggle theme
    toggleTheme() {
        this.isDarkMode = !this.isDarkMode;
        document.documentElement.setAttribute(
            "data-theme",
            this.isDarkMode ? "dark" : "light"
        );
        this.elements.themeBtn.innerHTML = this.isDarkMode
            ? '<i class="fas fa-sun"></i>'
            : '<i class="fas fa-moon"></i>';
        localStorage.setItem("todoTheme", this.isDarkMode ? "dark" : "light");
    }

    // Load theme preference
    loadThemePreference() {
        const savedTheme = localStorage.getItem("todoTheme");
        if (savedTheme) {
            this.isDarkMode = savedTheme === "dark";
            document.documentElement.setAttribute("data-theme", savedTheme);
            this.elements.themeBtn.innerHTML = this.isDarkMode
                ? '<i class="fas fa-sun"></i>'
                : '<i class="fas fa-moon"></i>';
        }
    }

    // Update progress
    updateProgress() {
        const total = this.tasks.length;
        const completed = this.tasks.filter((task) => task.completed).length;
        const percentage =
            total === 0 ? 0 : Math.round((completed / total) * 100);

        this.elements.progressPercentage.textContent = `${percentage}%`;
        this.elements.progressFill.style.width = `${percentage}%`;
        this.elements.totalTasks.textContent = total;
        this.elements.completedTasks.textContent = completed;

        // Update progress bar color based on completion
        if (percentage === 100) {
            this.elements.progressFill.style.background =
                "linear-gradient(90deg, var(--success-color), #059669)";
        } else if (percentage >= 75) {
            this.elements.progressFill.style.background =
                "linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))";
        } else if (percentage >= 50) {
            this.elements.progressFill.style.background =
                "linear-gradient(90deg, var(--warning-color), #d97706)";
        } else {
            this.elements.progressFill.style.background =
                "linear-gradient(90deg, var(--danger-color), #dc2626)";
        }
    }

    // Clear completed tasks
    async clearCompleted() {
        const confirmed = await this.showConfirmationDialog(
            "Clear Completed Tasks",
            "Are you sure you want to clear all completed tasks?"
        );

        if (confirmed) {
            const completedCount = this.tasks.filter(
                (task) => task.completed
            ).length;
            this.tasks = this.tasks.filter((task) => !task.completed);
            this.saveToLocalStorage();
            this.renderTasks();
            this.updateProgress();

            this.showNotification(
                "Tasks Cleared",
                `${completedCount} completed ${
                    completedCount === 1 ? "task" : "tasks"
                } removed`,
                "warning"
            );
        }
    }

    // Reset all tasks
    async resetAll() {
        const confirmed = await this.showConfirmationDialog(
            "Reset All Tasks",
            "Are you sure you want to delete all tasks? This action cannot be undone."
        );

        if (confirmed) {
            const taskCount = this.tasks.length;
            this.tasks = [];
            this.saveToLocalStorage();
            this.renderTasks();
            this.updateProgress();

            this.showNotification(
                "Reset Complete",
                `${taskCount} ${taskCount === 1 ? "task" : "tasks"} deleted`,
                "warning"
            );
        }
    }

    // Save to localStorage
    saveToLocalStorage() {
        localStorage.setItem("todoTasks", JSON.stringify(this.tasks));
    }

    // Load from localStorage
    loadFromLocalStorage() {
        const saved = localStorage.getItem("todoTasks");
        if (saved) {
            this.tasks = JSON.parse(saved);
        }
    }

    // Animations
    animateTaskAddition() {
        const taskItems = this.elements.todoList.querySelectorAll(".task-item");
        const lastTask = taskItems[taskItems.length - 1];
        if (lastTask) {
            lastTask.style.transform = "translateY(-20px)";
            lastTask.style.opacity = "0";
            setTimeout(() => {
                lastTask.style.transition = "all 0.3s ease";
                lastTask.style.transform = "translateY(0)";
                lastTask.style.opacity = "1";
            }, 10);
        }
    }

    animateTaskToggle(taskId) {
        const taskItem = this.elements.todoList.querySelector(
            `[data-id="${taskId}"]`
        );
        if (taskItem) {
            taskItem.style.transform = "scale(0.95)";
            setTimeout(() => {
                taskItem.style.transform = "scale(1)";
            }, 150);
        }
    }

    animateTaskDeletion(taskId) {
        const taskItem = this.elements.todoList.querySelector(
            `[data-id="${taskId}"]`
        );
        if (taskItem) {
            taskItem.style.transition = "all 0.3s ease";
            taskItem.style.transform = "translateX(-100%)";
            taskItem.style.opacity = "0";
            setTimeout(() => {
                taskItem.remove();
            }, 300);
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
    new TodoApp();
});

// Add some helpful keyboard shortcuts
document.addEventListener("keydown", (e) => {
    // Ctrl/Cmd + Enter to add task
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        const addBtn = document.getElementById("add-btn");
        if (addBtn) addBtn.click();
    }

    // Ctrl/Cmd + / to focus input
    if ((e.ctrlKey || e.metaKey) && e.key === "/") {
        e.preventDefault();
        const input = document.getElementById("todo-input");
        if (input) input.focus();
    }

    // Escape to clear input
    if (e.key === "Escape") {
        const input = document.getElementById("todo-input");
        if (input) input.value = "";
    }
});
