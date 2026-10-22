const STORAGE_KEY = 'zday-vchasno-tasks';
const addTaskBtn = document.getElementById('addTaskBtn');
const taskModal = document.getElementById('taskModal');
const taskForm = document.getElementById('taskForm');
const taskList = document.getElementById('taskList');
const searchInput = document.getElementById('searchInput');
const sortSelect = document.getElementById('sortSelect');
const subjectFilters = document.getElementById('subjectFilters');
const dateInput = taskForm.elements.namedItem('deadline');
const today = new Date();
const todayString = toLocalDateString(today);
let activeSidebarFilter = 'all';
let activeTaskFilter = 'all';
let activeSubjectFilter = '';
let editingTaskId = null;

function toLocalDateString(date) {
    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return localDate.toISOString().slice(0, 10);
}

function dateOffset(days) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return toLocalDateString(date);
}

function makeStarterTasks() {
    return [
        {
            id: crypto.randomUUID(),
            title: 'Лабораторна №4 — Алгоритми Краскала і Прима',
            subject: 'Дискретна математика',
            type: 'Лабораторна',
            deadline: dateOffset(2),
            time: '23:59',
            priority: 'Високий',
            notes: '',
            completed: false
        },
        {
            id: crypto.randomUUID(),
            title: 'Практична №7 — Нормалізація БД',
            subject: 'Бази даних',
            type: 'Практична',
            deadline: dateOffset(4),
            time: '23:59',
            priority: 'Середній',
            notes: '',
            completed: false
        },
        {
            id: crypto.randomUUID(),
            title: 'Лабораторна №3 — Багатопоточність',
            subject: 'Операційні системи',
            type: 'Лабораторна',
            deadline: dateOffset(-1),
            time: '23:59',
            priority: 'Високий',
            notes: '',
            completed: false
        },
        {
            id: crypto.randomUUID(),
            title: 'Практична №5 — Невизначені інтеграли',
            subject: 'Вища математика',
            type: 'Практична',
            deadline: dateOffset(7),
            time: '23:59',
            priority: 'Низький',
            notes: '',
            completed: false
        },
        {
            id: crypto.randomUUID(),
            title: 'Лабораторна №2 — Робота з Git',
            subject: 'Основи програмування',
            type: 'Лабораторна',
            deadline: dateOffset(-3),
            time: '23:59',
            priority: 'Середній',
            notes: '',
            completed: true
        },
        {
            id: crypto.randomUUID(),
            title: 'Практична №4 — Обхід графів',
            subject: 'Дискретна математика',
            type: 'Практична',
            deadline: dateOffset(-5),
            time: '23:59',
            priority: 'Низький',
            notes: '',
            completed: true
        }
    ];
}

const savedTasks = localStorage.getItem(STORAGE_KEY);
let tasks = savedTasks === null ? makeStarterTasks() : JSON.parse(savedTasks);

function saveTasks() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function getTaskStatus(task) {
    if (task.completed) {
        return { label: 'Виконано', className: 'status-completed' };
    }

    if (task.deadline < todayString) {
        const dayCount = Math.ceil((new Date(`${todayString}T00:00:00`) - new Date(`${task.deadline}T00:00:00`)) / 86400000);
        return {
            label: `Прострочено на ${dayCount} ${getDayWord(dayCount)}`,
            className: 'status-overdue'
        };
    }

    if (task.deadline === todayString) {
        return { label: 'Сьогодні', className: 'status-today' };
    }

    const dayCount = Math.ceil((new Date(`${task.deadline}T00:00:00`) - new Date(`${todayString}T00:00:00`)) / 86400000);
    return {
        label: `Через ${dayCount} ${getDayWord(dayCount)}`,
        className: 'status-upcoming'
    };
}

function getDayWord(dayCount) {
    const lastTwoDigits = dayCount % 100;
    if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
        return 'днів';
    }
    if (dayCount % 10 === 1) {
        return 'день';
    }
    if (dayCount % 10 >= 2 && dayCount % 10 <= 4) {
        return 'дні';
    }
    return 'днів';
}

function formatDeadline(task) {
    const date = new Date(`${task.deadline}T00:00:00`);
    const dateText = new Intl.DateTimeFormat('uk-UA', {
        day: 'numeric',
        month: 'short'
    }).format(date).replace('.', '');
    return `${dateText} · ${task.time}`;
}

function createTaskRow(task) {
    const row = document.createElement('tr');
    row.className = task.completed ? 'is-completed' : '';

    const taskCell = document.createElement('td');
    taskCell.className = 'task-cell';
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'task-checkbox';
    checkbox.checked = task.completed;
    checkbox.setAttribute('aria-label', `${task.completed ? 'Позначити невиконаною' : 'Позначити виконаною'}: ${task.title}`);
    checkbox.addEventListener('change', function() {
        task.completed = checkbox.checked;
        saveTasks();
        render();
    });

    const taskDescription = document.createElement('div');
    const title = document.createElement('div');
    title.className = 'task-title';
    title.textContent = task.title;
    const subtitle = document.createElement('div');
    subtitle.className = 'task-subtitle';
    subtitle.textContent = `${task.subject} · ${task.type}`;
    taskDescription.append(title, subtitle);
    taskCell.append(checkbox, taskDescription);

    const deadlineCell = document.createElement('td');
    deadlineCell.className = 'task-deadline';
    deadlineCell.textContent = formatDeadline(task);

    const statusCell = document.createElement('td');
    const status = getTaskStatus(task);
    const statusBadge = document.createElement('span');
    statusBadge.className = `status-badge ${status.className}`;
    statusBadge.textContent = status.label;
    statusCell.append(statusBadge);

    const priorityCell = document.createElement('td');
    priorityCell.className = `task-priority priority-${task.priority.toLowerCase()}`;
    priorityCell.textContent = task.priority;

    const actionsCell = document.createElement('td');
    const editButton = document.createElement('button');
    editButton.type = 'button';
    editButton.className = 'edit-task-btn';
    editButton.textContent = '✎';
    editButton.setAttribute('aria-label', `Редагувати роботу: ${task.title}`);
    editButton.addEventListener('click', function() {
        openTaskModal(task);
    });
    actionsCell.append(editButton);

    row.append(taskCell, deadlineCell, statusCell, priorityCell, actionsCell);
    return row;
}

function getVisibleTasks() {
    const searchTerm = searchInput.value.trim().toLocaleLowerCase('uk');
    const filteredTasks = tasks.filter(function(task) {
        const matchesSearch = `${task.title} ${task.subject} ${task.type} ${task.notes}`
            .toLocaleLowerCase('uk')
            .includes(searchTerm);
        const matchesSubject = !activeSubjectFilter || task.subject === activeSubjectFilter;
        const matchesTaskFilter = activeTaskFilter === 'all'
            || activeTaskFilter === 'completed' && task.completed
            || activeTaskFilter === 'active' && !task.completed
            || task.type === activeTaskFilter;
        const matchesSidebarFilter = activeSidebarFilter === 'all'
            || activeSidebarFilter === 'completed' && task.completed
            || activeSidebarFilter === 'overdue' && !task.completed && task.deadline < todayString
            || activeSidebarFilter === 'today' && !task.completed && task.deadline === todayString
            || activeSidebarFilter === 'week' && !task.completed && task.deadline >= todayString && task.deadline <= dateOffset(7);

        return matchesSearch && matchesSubject && matchesTaskFilter && matchesSidebarFilter;
    });

    const sortOrder = sortSelect.value;
    return filteredTasks.sort(function(first, second) {
        if (sortOrder === 'deadline-desc') {
            return second.deadline.localeCompare(first.deadline);
        }
        if (sortOrder === 'priority') {
            const priorityRank = { 'Високий': 0, 'Середній': 1, 'Низький': 2 };
            return priorityRank[first.priority] - priorityRank[second.priority];
        }
        if (sortOrder === 'title') {
            return first.title.localeCompare(second.title, 'uk');
        }
        return first.deadline.localeCompare(second.deadline);
    });
}

function updateCounters() {
    const activeTasks = tasks.filter(task => !task.completed);
    document.getElementById('totalCount').textContent = tasks.length;
    document.getElementById('activeCount').textContent = activeTasks.filter(task => task.deadline >= todayString).length;
    document.getElementById('completedCount').textContent = tasks.filter(task => task.completed).length;
    document.getElementById('overdueCount').textContent = activeTasks.filter(task => task.deadline < todayString).length;

    const counts = {
        all: tasks.length,
        today: activeTasks.filter(task => task.deadline === todayString).length,
        week: activeTasks.filter(task => task.deadline >= todayString && task.deadline <= dateOffset(7)).length,
        overdue: activeTasks.filter(task => task.deadline < todayString).length,
        completed: tasks.filter(task => task.completed).length
    };
    document.querySelectorAll('[data-count]').forEach(function(element) {
        element.textContent = counts[element.dataset.count];
    });
}

function updateSubjectFilters() {
    const subjectCounts = new Map();
    tasks.forEach(function(task) {
        subjectCounts.set(task.subject, (subjectCounts.get(task.subject) || 0) + 1);
    });

    subjectFilters.replaceChildren();
    subjectCounts.forEach(function(count, subject) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `subject-btn${activeSubjectFilter === subject ? ' active' : ''}`;
        const name = document.createElement('span');
        name.className = 'subject-name';
        name.textContent = subject;
        const value = document.createElement('span');
        value.className = 'subject-value';
        value.textContent = count;
        button.append(name, value);
        button.setAttribute('aria-pressed', String(activeSubjectFilter === subject));
        button.addEventListener('click', function() {
            activeSubjectFilter = activeSubjectFilter === subject ? '' : subject;
            render();
        });
        subjectFilters.append(button);
    });
}

function updateSubtitle() {
    const closestTask = tasks
        .filter(task => !task.completed && task.deadline >= todayString)
        .sort((first, second) => first.deadline.localeCompare(second.deadline))[0];

    const todayText = new Intl.DateTimeFormat('uk-UA', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
    }).format(today);
    if (!closestTask) {
        document.getElementById('headerSubtitle').textContent = `${todayText} · немає майбутніх дедлайнів`;
        return;
    }

    const daysLeft = Math.ceil((new Date(`${closestTask.deadline}T00:00:00`) - new Date(`${todayString}T00:00:00`)) / 86400000);
    const dueText = daysLeft === 0 ? 'дедлайн сьогодні' : `найближчий дедлайн через ${daysLeft} дн.`;
    document.getElementById('headerSubtitle').textContent = `${todayText} · ${dueText}`;
}

function render() {
    const visibleTasks = getVisibleTasks();
    taskList.replaceChildren();
    if (visibleTasks.length === 0) {
        const emptyRow = document.createElement('tr');
        emptyRow.className = 'empty-task-row';
        const emptyCell = document.createElement('td');
        emptyCell.colSpan = 5;
        emptyCell.textContent = tasks.length === 0
            ? 'Поки немає доданих робіт'
            : 'За цими фільтрами робіт не знайдено';
        emptyRow.append(emptyCell);
        taskList.append(emptyRow);
    } else {
        visibleTasks.forEach(task => taskList.append(createTaskRow(task)));
    }

    document.querySelectorAll('[data-sidebar-filter]').forEach(function(button) {
        const isActive = button.dataset.sidebarFilter === activeSidebarFilter;
        button.classList.toggle('active', isActive);
        button.setAttribute('aria-pressed', String(isActive));
    });
    document.querySelectorAll('[data-task-filter]').forEach(function(button) {
        const isActive = button.dataset.taskFilter === activeTaskFilter;
        button.classList.toggle('active-task', isActive);
        button.setAttribute('aria-pressed', String(isActive));
    });

    updateCounters();
    updateSubjectFilters();
    updateSubtitle();
}

function openTaskModal(task) {
    taskForm.reset();
    editingTaskId = task ? task.id : null;
    taskForm.elements.namedItem('id').value = task ? task.id : '';
    taskForm.elements.namedItem('title').value = task ? task.title : '';
    taskForm.elements.namedItem('subject').value = task ? task.subject : '';
    taskForm.elements.namedItem('reminder').value = task ? task.reminder || 'Не нагадувати' : 'Не нагадувати';
    taskForm.elements.namedItem('deadline').value = task ? task.deadline : todayString;
    dateInput.min = task ? '' : todayString;
    taskForm.elements.namedItem('time').value = task ? task.time : '23:59';
    taskForm.elements.namedItem('notes').value = task ? task.notes : '';
    taskForm.querySelector(`input[name="type"][value="${CSS.escape(task ? task.type : 'Лабораторна')}"]`).checked = true;
    taskForm.querySelector(`input[name="priority"][value="${CSS.escape(task ? task.priority : 'Середній')}"]`).checked = true;
    document.getElementById('modalTitle').textContent = task ? 'Редагувати роботу' : 'Нова робота';
    taskModal.showModal();
    taskForm.elements.namedItem('title').focus();
}

function closeTaskModal() {
    taskModal.close();
    editingTaskId = null;
}

addTaskBtn.addEventListener('click', function() {
    openTaskModal(null);
});

document.getElementById('closeModalBtn').addEventListener('click', closeTaskModal);
document.getElementById('cancelModalBtn').addEventListener('click', closeTaskModal);

taskModal.addEventListener('click', function(event) {
    if (event.target === taskModal) {
        closeTaskModal();
    }
});

taskForm.addEventListener('submit', function(event) {
    event.preventDefault();
    const formData = new FormData(taskForm);
    const task = {
        id: editingTaskId || crypto.randomUUID(),
        title: formData.get('title').trim(),
        subject: formData.get('subject'),
        reminder: formData.get('reminder'),
        type: formData.get('type'),
        deadline: formData.get('deadline'),
        time: formData.get('time'),
        priority: formData.get('priority'),
        notes: formData.get('notes').trim(),
        completed: editingTaskId ? tasks.find(item => item.id === editingTaskId).completed : false
    };

    if (editingTaskId) {
        tasks = tasks.map(existingTask => existingTask.id === editingTaskId ? task : existingTask);
    } else {
        tasks.unshift(task);
    }

    saveTasks();
    closeTaskModal();
    render();
});

document.getElementById('sidebarFilters').addEventListener('click', function(event) {
    const button = event.target.closest('[data-sidebar-filter]');
    if (button) {
        activeSidebarFilter = button.dataset.sidebarFilter;
        render();
    }
});

document.querySelector('.tasks-types').addEventListener('click', function(event) {
    const button = event.target.closest('[data-task-filter]');
    if (button) {
        activeTaskFilter = button.dataset.taskFilter;
        render();
    }
});

searchInput.addEventListener('input', render);
sortSelect.addEventListener('change', render);

if (savedTasks === null) {
    saveTasks();
}
render();
