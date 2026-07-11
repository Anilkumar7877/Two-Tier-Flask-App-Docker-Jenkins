// FocusFlow Frontend Logic

const API_BASE = '/api';
let tasks = [];
let currentFilter = 'all';

// DOM Elements
const taskForm = document.getElementById('task-form');
const taskTitleInput = document.getElementById('task-title');
const taskDescInput = document.getElementById('task-desc');
const taskListContainer = document.getElementById('task-list');
const loadingState = document.getElementById('loading-state');
const emptyState = document.getElementById('empty-state');
const connectionStatus = document.getElementById('connection-status');
const statusText = connectionStatus.querySelector('.status-text');
const countTotal = document.getElementById('count-total');
const countPending = document.getElementById('count-pending');
const countCompleted = document.getElementById('count-completed');
const toastContainer = document.getElementById('toast-container');
const filterButtons = document.querySelectorAll('.filter-btn');

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    fetchTasks();
    setupEventListeners();
});

// Setup Events
function setupEventListeners() {
    // Form submission
    taskForm.addEventListener('submit', handleTaskSubmit);

    // Filters
    filterButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderTasks();
        });
    });
}

// Fetch tasks from API
async function fetchTasks() {
    showLoading(true);
    try {
        const response = await fetch(`${API_BASE}/tasks`);
        if (!response.ok) throw new Error('Failed to fetch tasks');
        tasks = await response.json();

        updateConnectionStatus('connected', 'Connected to Database');
        renderTasks();
    } catch (error) {
        console.error('API Error:', error);
        updateConnectionStatus('error', 'Database Connection Error');
        showToast('Could not load tasks from server', 'danger');
        showEmpty(true);
    } finally {
        showLoading(false);
    }
}

// Create new task
async function handleTaskSubmit(e) {
    e.preventDefault();

    const title = taskTitleInput.value.trim();
    const description = taskDescInput.value.trim();

    if (!title) return;

    const submitBtn = document.getElementById('submit-btn');
    submitBtn.disabled = true;

    try {
        const response = await fetch(`${API_BASE}/tasks`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ title, description })
        });

        if (!response.ok) throw new Error('Failed to create task');

        const newTask = await response.json();
        tasks.unshift(newTask); // Add to beginning of array

        renderTasks();
        taskForm.reset();
        showToast('Task created successfully', 'success');
    } catch (error) {
        console.error('API Error:', error);
        showToast('Could not save task', 'danger');
    } finally {
        submitBtn.disabled = false;
    }
}

// Toggle Task Completion
async function toggleTaskStatus(taskId) {
    try {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;

        const updatedStatus = !task.completed;

        const response = await fetch(`${API_BASE}/tasks/${taskId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ completed: updatedStatus })
        });

        if (!response.ok) throw new Error('Failed to update task');

        const updatedTask = await response.json();

        // Update local tasks state
        tasks = tasks.map(t => t.id === taskId ? updatedTask : t);

        // Render updated state
        renderTasks();
        showToast(updatedStatus ? 'Task completed!' : 'Task active', 'info');
    } catch (error) {
        console.error('API Error:', error);
        showToast('Could not update task status', 'danger');

        // Reset checkbox check visually in case of failure
        fetchTasks();
    }
}

// Delete Task
async function deleteTask(taskId, cardElement) {
    cardElement.classList.add('fade-out');

    // Wait for fade-out animation to complete
    setTimeout(async () => {
        try {
            const response = await fetch(`${API_BASE}/tasks/${taskId}`, {
                method: 'DELETE'
            });

            if (!response.ok) throw new Error('Failed to delete task');

            // Remove from local tasks array
            tasks = tasks.filter(t => t.id !== taskId);

            renderTasks();
            showToast('Task removed', 'danger');
        } catch (error) {
            console.error('API Error:', error);
            showToast('Could not delete task', 'danger');
            fetchTasks(); // Reload to restore UI state
        }
    }, 350); // Matches CSS transition duration
}

// Render Tasks based on Filters
function renderTasks() {
    taskListContainer.innerHTML = '';

    const filteredTasks = tasks.filter(task => {
        if (currentFilter === 'pending') return !task.completed;
        if (currentFilter === 'completed') return task.completed;
        return true;
    });

    updateStats();

    if (filteredTasks.length === 0) {
        showEmpty(true);
        return;
    }

    showEmpty(false);

    filteredTasks.forEach(task => {
        const card = createTaskCard(task);
        taskListContainer.appendChild(card);
    });
}

// Helper: Create Task Card DOM element
function createTaskCard(task) {
    const card = document.createElement('div');
    card.className = `task-card ${task.completed ? 'completed' : ''}`;
    card.dataset.id = task.id;

    card.innerHTML = `
        <div class="task-checkbox-container">
            <input type="checkbox" ${task.completed ? 'checked' : ''}>
            <span class="checkmark">
                <svg viewBox="0 0 24 24" stroke="currentColor">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
            </span>
        </div>
        <div class="task-details">
            <h4 class="task-card-title">${escapeHTML(task.title)}</h4>
            ${task.description ? `<p class="task-card-desc">${escapeHTML(task.description)}</p>` : ''}
        </div>
        <button class="delete-btn" title="Delete Task">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
        </button>
    `;

    // Hook events
    const checkbox = card.querySelector('input');
    checkbox.addEventListener('change', () => toggleTaskStatus(task.id));

    const deleteBtn = card.querySelector('.delete-btn');
    deleteBtn.addEventListener('click', () => deleteTask(task.id, card));

    return card;
}

// Update Stats Cards
function updateStats() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const pending = total - completed;

    animateCounter(countTotal, total);
    animateCounter(countPending, pending);
    animateCounter(countCompleted, completed);
}

// Animate values of counters
function animateCounter(element, targetVal) {
    const currentVal = parseInt(element.textContent) || 0;
    if (currentVal === targetVal) return;

    element.textContent = targetVal;
}

// UI State Toggles
function showLoading(show) {
    if (show) {
        loadingState.classList.remove('hidden');
        taskListContainer.classList.add('hidden');
        emptyState.classList.add('hidden');
    } else {
        loadingState.classList.add('hidden');
        taskListContainer.classList.remove('hidden');
    }
}

function showEmpty(show) {
    if (show) {
        emptyState.classList.remove('hidden');
        taskListContainer.classList.add('hidden');
    } else {
        emptyState.classList.add('hidden');
        taskListContainer.classList.remove('hidden');
    }
}

function updateConnectionStatus(status, text) {
    connectionStatus.className = `connection-status ${status}`;
    statusText.textContent = text;
}

// Toast notification trigger
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    let icon = '';
    if (type === 'success') {
        icon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color: var(--accent-success)"><polyline points="20 6 9 17 4 12"/></svg>`;
    } else if (type === 'danger') {
        icon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color: var(--accent-danger)"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`;
    } else {
        icon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color: var(--primary-color)"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;
    }

    toast.innerHTML = `${icon} <span>${message}</span>`;
    toastContainer.appendChild(toast);

    // Auto-remove toast
    setTimeout(() => {
        toast.style.animation = 'toast-slide 0.3s cubic-bezier(0.16, 1, 0.3, 1) reverse forwards';
        toast.addEventListener('animationend', () => toast.remove());
    }, 3000);
}

// Helper: Escape HTML to prevent XSS
function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g,
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}
