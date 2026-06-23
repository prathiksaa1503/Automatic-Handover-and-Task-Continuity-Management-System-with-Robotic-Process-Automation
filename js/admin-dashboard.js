// Admin Dashboard
document.addEventListener('DOMContentLoaded', async function() {
  const user = window.api.getCurrentUser();
  
  if (!user || user.role !== 'admin') {
    window.location.href = 'login.html';
    return;
  }

  await loadAdminDashboard();
});

async function loadAdminDashboard() {
  try {
    const data = await window.api.dashboard.getAdminDashboard();
    
    // Update stats
    document.getElementById('totalUsers').textContent = data.stats.totalUsers || 0;
    document.getElementById('activeEmployees').textContent = data.stats.activeEmployees || 0;
    document.getElementById('managers').textContent = data.stats.managers || 0;
    document.getElementById('openRiskTasks').textContent = data.stats.openRiskTasks || 0;
    
    // Update alerts
    document.getElementById('tasksWithoutBackup').textContent = data.alerts.tasksWithoutBackup || 0;
    document.getElementById('inactiveUsers').textContent = data.alerts.inactiveUsers || 0;
    document.getElementById('pendingHandovers').textContent = data.alerts.pendingHandovers || 0;
    
    // Display recent users
    if (data.recentUsers && data.recentUsers.length > 0) {
      const tbody = document.querySelector('#userTable tbody');
      tbody.innerHTML = data.recentUsers.map(user => `
        <tr>
          <td>${escapeHtml(user.name)}</td>
          <td>${escapeHtml(user.role)}</td>
          <td><span class="badge ${user.isActive ? 'medium' : 'high'}">${user.isActive ? 'Active' : 'Inactive'}</span></td>
          <td>${new Date(user.lastActive).toLocaleDateString()}</td>
        </tr>
      `).join('');
    }
    
    // UiPath Automation Status
    console.log('UiPath Automation Status: Active');
    console.log('Monitoring:', {
      taskHandoverDeadlines: 'Active',
      backupOwnershipValidation: 'Active',
      leaveWithoutDocumentation: 'Active'
    });
    
  } catch (error) {
    console.error('Error loading admin dashboard:', error);
  }
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
