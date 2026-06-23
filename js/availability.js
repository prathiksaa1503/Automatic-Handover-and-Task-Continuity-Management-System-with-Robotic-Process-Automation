// Availability Management
let currentAvailability = null;

document.addEventListener('DOMContentLoaded', async function() {
  await loadAvailability();

  document.getElementById('availabilityForm').addEventListener('submit', handleAvailabilitySubmit);
});

async function loadAvailability() {
  try {
    currentAvailability = await window.api.availability.getMyAvailability();
    displayAvailability(currentAvailability);
  } catch (error) {
    console.error('Error loading availability:', error);
    showNotification('Error loading availability', 'error');
  }
}

function displayAvailability(availability) {
  // Update form
  document.getElementById('availabilityStatus').value = availability.status || 'available';
  document.getElementById('startDate').value = availability.startDate ? availability.startDate.split('T')[0] : '';
  document.getElementById('endDate').value = availability.endDate ? availability.endDate.split('T')[0] : '';
  document.getElementById('reason').value = availability.reason || '';
  document.getElementById('autoReminder').checked = availability.autoReminderEnabled !== false;

  if (availability.emergencyContact) {
    document.getElementById('emergencyName').value = availability.emergencyContact.name || '';
    document.getElementById('emergencyEmail').value = availability.emergencyContact.email || '';
    document.getElementById('emergencyPhone').value = availability.emergencyContact.phone || '';
  }

  // Update status display
  const statusBadge = document.getElementById('currentStatusBadge');
  const statusDetails = document.getElementById('statusDetails');
  
  const statusConfig = {
    'available': { text: '✅ Available', class: 'success' },
    'unavailable': { text: '❌ Unavailable', class: 'risk' },
    'on-leave': { text: '🏖️ On Leave', class: 'warning' },
    'sick-leave': { text: '🏥 Sick Leave', class: 'warning' },
    'vacation': { text: '✈️ Vacation', class: 'warning' }
  };

  const config = statusConfig[availability.status] || statusConfig['available'];
  statusBadge.textContent = config.text;
  statusBadge.className = `status-badge ${config.class}`;

  let detailsHtml = '';
  if (availability.startDate || availability.endDate) {
    detailsHtml += `<p><strong>Period:</strong> `;
    if (availability.startDate) {
      detailsHtml += `${new Date(availability.startDate).toLocaleDateString()}`;
    }
    if (availability.endDate) {
      detailsHtml += ` - ${new Date(availability.endDate).toLocaleDateString()}`;
    }
    detailsHtml += `</p>`;
  }

  if (availability.reason) {
    detailsHtml += `<p><strong>Reason:</strong> ${escapeHtml(availability.reason)}</p>`;
  }

  if (availability.emergencyContact && (availability.emergencyContact.name || availability.emergencyContact.email)) {
    detailsHtml += `<p><strong>Emergency Contact:</strong> `;
    if (availability.emergencyContact.name) {
      detailsHtml += `${escapeHtml(availability.emergencyContact.name)}`;
    }
    if (availability.emergencyContact.email) {
      detailsHtml += ` (${escapeHtml(availability.emergencyContact.email)})`;
    }
    if (availability.emergencyContact.phone) {
      detailsHtml += ` - ${escapeHtml(availability.emergencyContact.phone)}`;
    }
    detailsHtml += `</p>`;
  }

  detailsHtml += `<p><strong>Auto Reminders:</strong> ${availability.autoReminderEnabled !== false ? 'Enabled' : 'Disabled'}</p>`;
  detailsHtml += `<p><small>Last updated: ${new Date(availability.updatedAt).toLocaleString()}</small></p>`;

  statusDetails.innerHTML = detailsHtml;
}

async function handleAvailabilitySubmit(e) {
  e.preventDefault();

  const availabilityData = {
    status: document.getElementById('availabilityStatus').value,
    startDate: document.getElementById('startDate').value || null,
    endDate: document.getElementById('endDate').value || null,
    reason: document.getElementById('reason').value || null,
    emergencyContact: {
      name: document.getElementById('emergencyName').value || null,
      email: document.getElementById('emergencyEmail').value || null,
      phone: document.getElementById('emergencyPhone').value || null
    },
    autoReminderEnabled: document.getElementById('autoReminder').checked
  };

  try {
    currentAvailability = await window.api.availability.updateMyAvailability(availabilityData);
    displayAvailability(currentAvailability);
    showNotification('Availability updated successfully', 'success');
    
    // Trigger UiPath automation concept
    if (availabilityData.status !== 'available') {
      console.log('UiPath Automation Trigger: Employee marked as unavailable');
      console.log('Sending automated reminders to backup owners and managers...');
      // In a real implementation, this would call a UiPath API endpoint
    }
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
