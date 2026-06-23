// Handover Notes Management
let allHandovers = [];
let allTasks = [];
let allUsers = [];

document.addEventListener('DOMContentLoaded', async function() {
  await Promise.all([loadUsers(), loadTasks(), loadHandovers()]);

  // Filter handlers
  document.getElementById('statusFilter').addEventListener('change', filterHandovers);
  document.getElementById('directionFilter').addEventListener('change', filterHandovers);

  // Create handover button
  document.getElementById('createHandoverBtn').addEventListener('click', () => {
    openHandoverModal();
  });

  // Modal handlers
  document.querySelector('.close-modal').addEventListener('click', closeHandoverModal);
  document.getElementById('cancelBtn').addEventListener('click', closeHandoverModal);
  document.getElementById('handoverForm').addEventListener('submit', handleHandoverSubmit);

  // Dynamic form handlers
  document.getElementById('addContactBtn').addEventListener('click', addContactField);
  document.getElementById('addFileBtn').addEventListener('click', addFileField);
  document.getElementById('addCredentialBtn').addEventListener('click', addCredentialField);

  // Close modal on outside click
  window.addEventListener('click', function(e) {
    const modal = document.getElementById('handoverModal');
    if (e.target === modal) {
      closeHandoverModal();
    }
  });
});

async function loadUsers() {
  try {
    allUsers = await window.api.dashboard.getUsers();
    const toUserSelect = document.getElementById('handoverToUser');
    toUserSelect.innerHTML = '<option value="">Select user</option>';
    const currentUser = window.api.getCurrentUser();
    allUsers.forEach(user => {
      if (user._id !== currentUser.id && user.id !== currentUser.id) {
        const option = document.createElement('option');
        option.value = user._id || user.id;
        option.textContent = `${user.name} (${user.email})`;
        toUserSelect.appendChild(option);
      }
    });
  } catch (error) {
    console.error('Error loading users:', error);
  }
}

async function loadTasks() {
  try {
    allTasks = await window.api.tasks.getAll();
    const taskSelect = document.getElementById('handoverTask');
    taskSelect.innerHTML = '<option value="">Select a task</option>';
    allTasks.forEach(task => {
      const option = document.createElement('option');
      option.value = task._id || task.id;
      option.textContent = task.title;
      taskSelect.appendChild(option);
    });
  } catch (error) {
    console.error('Error loading tasks:', error);
  }
}

async function loadHandovers() {
  try {
    const container = document.getElementById('handoversContainer');
    container.innerHTML = '<div class="loading-spinner">Loading handover notes...</div>';

    allHandovers = await window.api.handovers.getAll();
    renderHandovers(allHandovers);
  } catch (error) {
    document.getElementById('handoversContainer').innerHTML = 
      `<div class="error-message">Error loading handover notes: ${error.message}</div>`;
  }
}

function filterHandovers() {
  const status = document.getElementById('statusFilter').value;
  const direction = document.getElementById('directionFilter').value;
  const currentUser = window.api.getCurrentUser();

  let filtered = [...allHandovers];

  if (status) {
    filtered = filtered.filter(h => h.status === status);
  }

  if (direction === 'sent') {
    filtered = filtered.filter(h => (h.fromUser._id || h.fromUser.id) === currentUser.id);
  } else if (direction === 'received') {
    filtered = filtered.filter(h => (h.toUser._id || h.toUser.id) === currentUser.id);
  }

  renderHandovers(filtered);
}

function renderHandovers(handovers) {
  const container = document.getElementById('handoversContainer');
  const currentUser = window.api.getCurrentUser();

  if (handovers.length === 0) {
    container.innerHTML = '<div class="empty-state">No handover notes found. Create your first handover note!</div>';
    return;
  }

  container.innerHTML = handovers.map(handover => {
    const isSent = (handover.fromUser._id || handover.fromUser.id) === currentUser.id;
    const isReceived = (handover.toUser._id || handover.toUser.id) === currentUser.id;
    
    return `
      <div class="handover-card ${handover.status}">
        <div class="handover-header">
          <div>
            <h3>${escapeHtml(handover.task.title)}</h3>
            <p class="handover-direction">
              ${isSent ? '📤 Sent to' : '📥 Received from'} 
              <strong>${isSent ? handover.toUser.name : handover.fromUser.name}</strong>
            </p>
          </div>
          <div class="handover-status-badge status-${handover.status}">
            ${handover.status}
          </div>
        </div>
        
        <div class="handover-content">
          <p><strong>Knowledge Transfer:</strong></p>
          <p>${escapeHtml(handover.knowledgeTransfer)}</p>
        </div>

        ${handover.keyContacts && handover.keyContacts.length > 0 ? `
          <div class="handover-section">
            <strong>Key Contacts:</strong>
            <ul>
              ${handover.keyContacts.map(contact => `
                <li>${escapeHtml(contact.name)} - ${escapeHtml(contact.email)} (${escapeHtml(contact.role || 'N/A')})</li>
              `).join('')}
            </ul>
          </div>
        ` : ''}

        ${handover.importantFiles && handover.importantFiles.length > 0 ? `
          <div class="handover-section">
            <strong>Important Files:</strong>
            <ul>
              ${handover.importantFiles.map(file => `
                <li><strong>${escapeHtml(file.name)}</strong> - ${escapeHtml(file.location)}<br>
                <small>${escapeHtml(file.description || '')}</small></li>
              `).join('')}
            </ul>
          </div>
        ` : ''}

        ${handover.accessCredentials && handover.accessCredentials.length > 0 ? `
          <div class="handover-section">
            <strong>Access Credentials:</strong>
            <ul>
              ${handover.accessCredentials.map(cred => `
                <li><strong>${escapeHtml(cred.platform)}</strong> - ${escapeHtml(cred.username)}<br>
                <small>${escapeHtml(cred.notes || '')}</small></li>
              `).join('')}
            </ul>
          </div>
        ` : ''}

        <div class="handover-footer">
          <small>Created: ${new Date(handover.createdAt).toLocaleString()}</small>
          ${isReceived && handover.status === 'pending' ? `
            <button class="btn primary mini-btn" onclick="acknowledgeHandover('${handover._id || handover.id}')">
              Acknowledge
            </button>
          ` : ''}
          ${handover.status === 'acknowledged' ? `
            <button class="btn secondary mini-btn" onclick="completeHandover('${handover._id || handover.id}')">
              Mark Complete
            </button>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');
}

function openHandoverModal(handoverId = null) {
  const modal = document.getElementById('handoverModal');
  const form = document.getElementById('handoverForm');
  
  if (handoverId) {
    const handover = allHandovers.find(h => (h._id || h.id) === handoverId);
    if (handover) {
      document.getElementById('modalTitle').textContent = 'Edit Handover Note';
      document.getElementById('handoverId').value = handoverId;
      document.getElementById('handoverTask').value = handover.task._id || handover.task.id;
      document.getElementById('handoverToUser').value = handover.toUser._id || handover.toUser.id;
      document.getElementById('handoverKnowledge').value = handover.knowledgeTransfer || '';
      
      // Populate contacts
      populateContacts(handover.keyContacts || []);
      populateFiles(handover.importantFiles || []);
      populateCredentials(handover.accessCredentials || []);
    }
  } else {
    form.reset();
    document.getElementById('modalTitle').textContent = 'Create Handover Note';
    document.getElementById('handoverId').value = '';
    clearDynamicFields();
  }
  
  modal.style.display = 'block';
}

function closeHandoverModal() {
  document.getElementById('handoverModal').style.display = 'none';
  document.getElementById('handoverForm').reset();
  clearDynamicFields();
}

function clearDynamicFields() {
  document.getElementById('keyContactsContainer').innerHTML = '<div class="contact-item"><input type="text" placeholder="Name" class="contact-name"><input type="email" placeholder="Email" class="contact-email"><input type="text" placeholder="Role" class="contact-role"><button type="button" class="remove-contact">Remove</button></div>';
  document.getElementById('filesContainer').innerHTML = '<div class="file-item"><input type="text" placeholder="File Name" class="file-name"><input type="text" placeholder="Location/URL" class="file-location"><input type="text" placeholder="Description" class="file-description"><button type="button" class="remove-file">Remove</button></div>';
  document.getElementById('credentialsContainer').innerHTML = '<div class="credential-item"><input type="text" placeholder="Platform" class="credential-platform"><input type="text" placeholder="Username" class="credential-username"><input type="text" placeholder="Notes" class="credential-notes"><button type="button" class="remove-credential">Remove</button></div>';
}

function addContactField() {
  const container = document.getElementById('keyContactsContainer');
  const div = document.createElement('div');
  div.className = 'contact-item';
  div.innerHTML = `
    <input type="text" placeholder="Name" class="contact-name">
    <input type="email" placeholder="Email" class="contact-email">
    <input type="text" placeholder="Role" class="contact-role">
    <button type="button" class="remove-contact">Remove</button>
  `;
  container.appendChild(div);
  div.querySelector('.remove-contact').addEventListener('click', () => div.remove());
}

function addFileField() {
  const container = document.getElementById('filesContainer');
  const div = document.createElement('div');
  div.className = 'file-item';
  div.innerHTML = `
    <input type="text" placeholder="File Name" class="file-name">
    <input type="text" placeholder="Location/URL" class="file-location">
    <input type="text" placeholder="Description" class="file-description">
    <button type="button" class="remove-file">Remove</button>
  `;
  container.appendChild(div);
  div.querySelector('.remove-file').addEventListener('click', () => div.remove());
}

function addCredentialField() {
  const container = document.getElementById('credentialsContainer');
  const div = document.createElement('div');
  div.className = 'credential-item';
  div.innerHTML = `
    <input type="text" placeholder="Platform" class="credential-platform">
    <input type="text" placeholder="Username" class="credential-username">
    <input type="text" placeholder="Notes" class="credential-notes">
    <button type="button" class="remove-credential">Remove</button>
  `;
  container.appendChild(div);
  div.querySelector('.remove-credential').addEventListener('click', () => div.remove());
}

function populateContacts(contacts) {
  const container = document.getElementById('keyContactsContainer');
  container.innerHTML = '';
  if (contacts.length === 0) {
    addContactField();
  } else {
    contacts.forEach(contact => {
      const div = document.createElement('div');
      div.className = 'contact-item';
      div.innerHTML = `
        <input type="text" placeholder="Name" class="contact-name" value="${escapeHtml(contact.name || '')}">
        <input type="email" placeholder="Email" class="contact-email" value="${escapeHtml(contact.email || '')}">
        <input type="text" placeholder="Role" class="contact-role" value="${escapeHtml(contact.role || '')}">
        <button type="button" class="remove-contact">Remove</button>
      `;
      container.appendChild(div);
      div.querySelector('.remove-contact').addEventListener('click', () => div.remove());
    });
  }
}

function populateFiles(files) {
  const container = document.getElementById('filesContainer');
  container.innerHTML = '';
  if (files.length === 0) {
    addFileField();
  } else {
    files.forEach(file => {
      const div = document.createElement('div');
      div.className = 'file-item';
      div.innerHTML = `
        <input type="text" placeholder="File Name" class="file-name" value="${escapeHtml(file.name || '')}">
        <input type="text" placeholder="Location/URL" class="file-location" value="${escapeHtml(file.location || '')}">
        <input type="text" placeholder="Description" class="file-description" value="${escapeHtml(file.description || '')}">
        <button type="button" class="remove-file">Remove</button>
      `;
      container.appendChild(div);
      div.querySelector('.remove-file').addEventListener('click', () => div.remove());
    });
  }
}

function populateCredentials(credentials) {
  const container = document.getElementById('credentialsContainer');
  container.innerHTML = '';
  if (credentials.length === 0) {
    addCredentialField();
  } else {
    credentials.forEach(cred => {
      const div = document.createElement('div');
      div.className = 'credential-item';
      div.innerHTML = `
        <input type="text" placeholder="Platform" class="credential-platform" value="${escapeHtml(cred.platform || '')}">
        <input type="text" placeholder="Username" class="credential-username" value="${escapeHtml(cred.username || '')}">
        <input type="text" placeholder="Notes" class="credential-notes" value="${escapeHtml(cred.notes || '')}">
        <button type="button" class="remove-credential">Remove</button>
      `;
      container.appendChild(div);
      div.querySelector('.remove-credential').addEventListener('click', () => div.remove());
    });
  }
}

async function handleHandoverSubmit(e) {
  e.preventDefault();

  const handoverId = document.getElementById('handoverId').value;
  
  // Collect contacts
  const contacts = Array.from(document.querySelectorAll('.contact-item')).map(item => ({
    name: item.querySelector('.contact-name').value,
    email: item.querySelector('.contact-email').value,
    role: item.querySelector('.contact-role').value
  })).filter(c => c.name || c.email);

  // Collect files
  const files = Array.from(document.querySelectorAll('.file-item')).map(item => ({
    name: item.querySelector('.file-name').value,
    location: item.querySelector('.file-location').value,
    description: item.querySelector('.file-description').value
  })).filter(f => f.name || f.location);

  // Collect credentials
  const credentials = Array.from(document.querySelectorAll('.credential-item')).map(item => ({
    platform: item.querySelector('.credential-platform').value,
    username: item.querySelector('.credential-username').value,
    notes: item.querySelector('.credential-notes').value
  })).filter(c => c.platform || c.username);

  const handoverData = {
    taskId: document.getElementById('handoverTask').value,
    toUser: document.getElementById('handoverToUser').value,
    knowledgeTransfer: document.getElementById('handoverKnowledge').value,
    keyContacts: contacts,
    importantFiles: files,
    accessCredentials: credentials
  };

  try {
    if (handoverId) {
      await window.api.handovers.update(handoverId, handoverData);
      showNotification('Handover note updated successfully', 'success');
    } else {
      await window.api.handovers.create(handoverData);
      showNotification('Handover note created successfully', 'success');
    }
    
    closeHandoverModal();
    await loadHandovers();
  } catch (error) {
    showNotification(error.message, 'error');
  }
}

async function acknowledgeHandover(id) {
  try {
    await window.api.handovers.acknowledge(id);
    showNotification('Handover acknowledged', 'success');
    await loadHandovers();
  } catch (error) {
    showNotification(error.message, 'error');
  }
}

async function completeHandover(id) {
  try {
    await window.api.handovers.complete(id);
    showNotification('Handover marked as complete', 'success');
    await loadHandovers();
  } catch (error) {
    showNotification(error.message, 'error');
  }
}

function escapeHtml(text) {
  if (!text) return '';
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
