// Dashboard Data Loading
document.addEventListener('DOMContentLoaded', async function() {
  const user = window.api.getCurrentUser();
  
  if (!user) {
    window.location.href = 'login.html';
    return;
  }

  // Update welcome message
  const welcomeTitle = document.getElementById('welcomeTitle');
  if (welcomeTitle) {
    welcomeTitle.textContent = `Welcome back, ${user.name} 👋`;
  }

  // Load dashboard based on role
  if (user.role === 'employee') {
    await loadEmployeeDashboard();
  } else if (user.role === 'manager') {
    window.location.href = 'manager-dashboard.html';
  } else if (user.role === 'admin') {
    window.location.href = 'admin-dashboard.html';
  }
});

async function loadEmployeeDashboard() {
  try {
    const data = await window.api.dashboard.getEmployeeDashboard();
    
    // Update stats
    document.getElementById('activeTasksCount').textContent = data.stats.activeTasks || 0;
    document.getElementById('pendingHandoversCount').textContent = data.stats.pendingHandovers || 0;
    document.getElementById('riskTasksCount').textContent = data.stats.riskTasks || 0;
    
    // Update availability
    const availabilityStatus = data.stats.availabilityStatus || 'available';
    const availabilityText = document.getElementById('availabilityText');
    const availabilityDot = document.querySelector('#availabilityStatus .dot');
    
    const statusConfig = {
      'available': { text: 'Available', class: 'green' },
      'unavailable': { text: 'Unavailable', class: 'red' },
      'on-leave': { text: 'On Leave', class: 'yellow' },
      'sick-leave': { text: 'Sick Leave', class: 'yellow' },
      'vacation': { text: 'Vacation', class: 'yellow' }
    };
    
    const config = statusConfig[availabilityStatus] || statusConfig['available'];
    availabilityText.textContent = config.text;
    availabilityDot.className = `dot ${config.class}`;
    
    // Update alerts
    const alertsList = document.getElementById('alertsList');
    let alertsHtml = '';
    
    if (data.riskTasks && data.riskTasks.length > 0) {
      alertsHtml += `<p>• ${data.riskTasks.length} task(s) have no backup owner</p>`;
    }
    
    if (data.pendingHandovers && data.pendingHandovers.length > 0) {
      const oldHandovers = data.pendingHandovers.filter(h => {
        const createdAt = new Date(h.createdAt);
        const hoursAgo = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
        return hoursAgo > 24;
      });
      
      if (oldHandovers.length > 0) {
        alertsHtml += `<p>• ${oldHandovers.length} handover(s) pending for more than 24 hours</p>`;
      }
    }
    
    if (!alertsHtml) {
      alertsHtml = '<p>✅ No alerts at this time</p>';
    }
    
    alertsList.innerHTML = alertsHtml;
    
    // Display risk tasks
    if (data.riskTasks && data.riskTasks.length > 0) {
      const riskSection = document.getElementById('riskTasksSection');
      const riskList = document.getElementById('riskTasksList');
      
      riskSection.style.display = 'block';
      riskList.innerHTML = data.riskTasks.map(task => `
        <div class="risk-task-item">
          <strong>${escapeHtml(task.title)}</strong>
          ${task.backupOwner ? '' : '<span class="badge risk-badge">No Backup</span>'}
          <a href="my-tasks.html" class="link-btn">View Task →</a>
        </div>
      `).join('');
    }
    
    // Trigger UiPath automation check
    checkUiPathAutomation(data);
    
  } catch (error) {
    console.error('Error loading dashboard:', error);
    document.getElementById('alertsList').innerHTML = 
      `<p class="error-text">Error loading dashboard data: ${error.message}</p>`;
  }
}

function checkUiPathAutomation(data) {
  // UiPath Automation Concept
  // In a real implementation, this would call a UiPath API endpoint
  
  const automationTriggers = [];
  
  // Check for tasks without backup owners
  if (data.riskTasks && data.riskTasks.length > 0) {
    automationTriggers.push({
      type: 'missing_backup_owner',
      count: data.riskTasks.length,
      message: 'Tasks without backup owners detected'
    });
  }
  
  // Check for pending handovers older than 24 hours
  if (data.pendingHandovers && data.pendingHandovers.length > 0) {
    const oldHandovers = data.pendingHandovers.filter(h => {
      const createdAt = new Date(h.createdAt);
      const hoursAgo = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
      return hoursAgo > 24;
    });
    
    if (oldHandovers.length > 0) {
      automationTriggers.push({
        type: 'stale_handover',
        count: oldHandovers.length,
        message: 'Handovers pending for more than 24 hours'
      });
    }
  }
  
  if (automationTriggers.length > 0) {
    console.log('UiPath Automation Triggers:', automationTriggers);
    console.log('Would send automated reminders to:', {
      backupOwners: 'Backup owners of risk tasks',
      managers: 'Team managers',
      recipients: 'Handover recipients'
    });
    
    // In production, this would be:
    // await fetch('/api/uipath/trigger', { method: 'POST', body: JSON.stringify(automationTriggers) });
  }
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
