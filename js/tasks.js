// Tasks Management
let allTasks = [];
let allUsers = [];

document.addEventListener('DOMContentLoaded', async function() {
  await loadUsers();
  await loadTasks();

  // Filter handlers
  document.getElementById('statusFilter').addEventListener('change', filterTasks);
  document.getElementById('priorityFilter').addEventListener('change', filterTasks);
  document.getElementById('riskFilter').addEventListener('change', filterTasks);

  // Create task button
  document.getElementById('createTaskBtn').addEventListener('click', () => {
    openTaskModal();
  });

  // Modal handlers
  document.querySelector('.close-modal').addEventListener('click', closeTaskModal);
  document.getElementById('cancelBtn').addEventListener('click', closeTaskModal);
  document.getElementById('taskForm').addEventListener('submit', handleTaskSubmit);

  // Close modal on outside click
  window.addEventListener('click', function(e) {
    const modal = document.getElementById('taskModal');
    if (e.target === modal) {
      closeTaskModal();
    }
  });
});

async function loadUsers() {
  try {
    allUsers = await window.api.dashboard.getUsers();
    const backupSelect = document.getElementById('taskBackupOwner');
    backupSelect.innerHTML = '<option value="">Select backup owner</option>';
    allUsers.forEach(user => {
      const option = document.createElement('option');
      option.value = user._id || user.id;
      option.textContent = `${user.name} (${user.email})`;
      backupSelect.appendChild(option);
    });
  } catch (error) {
    console.error('Error loading users:', error);
  }
}

async function loadTasks() {
  try {
    const container = document.getElementById('tasksContainer');
    container.innerHTML = '<div class="loading-spinner">Loading tasks...</div>';

    allTasks = await window.api.tasks.getAll();
    renderTasks(allTasks);
  } catch (error) {
    document.getElementById('tasksContainer').innerHTML = 
      `<div class="error-message">Error loading tasks: ${error.message}</div>`;
  }
}

function filterTasks() {
  const status = document.getElementById('statusFilter').value;
  const priority = document.getElementById('priorityFilter').value;
  const riskOnly = document.getElementById('riskFilter').value === 'true';

  let filtered = [...allTasks];

  if (status) {
    filtered = filtered.filter(t => t.status === status);
  }

  if (priority) {
    filtered = filtered.filter(t => t.priority === priority);
  }

  if (riskOnly) {
    filtered = filtered.filter(t => t.isRisk === true);
  }

  renderTasks(filtered);
}

function renderTasks(tasks) {
  const container = document.getElementById('tasksContainer');

  if (tasks.length === 0) {
    container.innerHTML = '<div class="empty-state">No tasks found. Create your first task!</div>';
    return;
  }

  container.innerHTML = tasks.map(task => `
    <div class="task-card ${task.isRisk ? 'risk' : ''}">
      <div class="task-header">
        <h3>${escapeHtml(task.title)}</h3>
        <div class="task-actions">
          <button class="icon-btn" onclick="editTask('${task._id || task.id}')" title="Edit">✏️</button>
          <button class="icon-btn" onclick="deleteTask('${task._id || task.id}')" title="Delete">🗑️</button>
        </div>
      </div>
      ${task.description ? `<p class="task-description">${escapeHtml(task.description)}</p>` : ''}
      <div class="task-meta">
        <span class="badge priority-${task.priority}">${task.priority}</span>
        <span class="badge status-${task.status}">${task.status}</span>
        ${task.isRisk ? '<span class="badge risk-badge">⚠️ Risk</span>' : ''}
      </div>
      ${task.backupOwner ? `
        <div class="task-backup">
          <strong>Backup:</strong> ${task.backupOwner.name}
        </div>
      ` : `
        <div class="task-backup warning">
          <strong>⚠️ No backup owner assigned</strong>
        </div>
      `}
      ${task.dueDate ? `
        <div class="task-due">
          <strong>Due:</strong> ${new Date(task.dueDate).toLocaleDateString()}
        </div>
      ` : ''}
      ${task.category ? `
        <div class="task-category">
          <strong>Category:</strong> ${escapeHtml(task.category)}
        </div>
      ` : ''}
      ${task.tags && task.tags.length > 0 ? `
        <div class="task-tags">
          ${task.tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}
        </div>
      ` : ''}
    </div>
  `).join('');
}

function openTaskModal(taskId = null) {
  const modal = document.getElementById('taskModal');
  const form = document.getElementById('taskForm');
  
  if (taskId) {
    const task = allTasks.find(t => (t._id || t.id) === taskId);
    if (task) {
      document.getElementById('modalTitle').textContent = 'Edit Task';
      document.getElementById('taskId').value = taskId;
      document.getElementById('taskTitle').value = task.title || '';
      document.getElementById('taskDescription').value = task.description || '';
      document.getElementById('taskPriority').value = task.priority || 'medium';
      document.getElementById('taskStatus').value = task.status || 'pending';
      document.getElementById('taskDueDate').value = task.dueDate ? task.dueDate.split('T')[0] : '';
      document.getElementById('taskCategory').value = task.category || '';
      document.getElementById('taskBackupOwner').value = task.backupOwner?._id || task.backupOwner?.id || '';
      document.getElementById('taskTags').value = task.tags ? task.tags.join(', ') : '';
    }
  } else {
    form.reset();
    document.getElementById('modalTitle').textContent = 'Create New Task';
    document.getElementById('taskId').value = '';
  }
  
  modal.style.display = 'block';
}

function closeTaskModal() {
  document.getElementById('taskModal').style.display = 'none';
  document.getElementById('taskForm').reset();
}

async function handleTaskSubmit(e) {
  e.preventDefault();

  const taskId = document.getElementById('taskId').value;
  const taskData = {
    title: document.getElementById('taskTitle').value,
    description: document.getElementById('taskDescription').value,
    priority: document.getElementById('taskPriority').value,
    status: document.getElementById('taskStatus').value,
    dueDate: document.getElementById('taskDueDate').value || null,
    category: document.getElementById('taskCategory').value || null,
    backupOwner: document.getElementById('taskBackupOwner').value || null,
    tags: document.getElementById('taskTags').value.split(',').map(t => t.trim()).filter(t => t)
  };

  try {
    if (taskId) {
      await window.api.tasks.update(taskId, taskData);
      showNotification('Task updated successfully', 'success');
    } else {
      await window.api.tasks.create(taskData);
      showNotification('Task created successfully', 'success');
    }
    
    closeTaskModal();
    await loadTasks();
  } catch (error) {
    showNotification(error.message, 'error');
  }
}

async function editTask(taskId) {
  openTaskModal(taskId);
}

async function deleteTask(taskId) {
  if (!confirm('Are you sure you want to delete this task?')) {
    return;
  }

  try {
    await window.api.tasks.delete(taskId);
    showNotification('Task deleted successfully', 'success');
    await loadTasks();
  } catch (error) {
    showNotification(error.message, 'error');
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `${type}-notification`;
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => notification.classList.add('show'), 10);
  
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}
