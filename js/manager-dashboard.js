// Manager Dashboard
document.addEventListener('DOMContentLoaded', async function() {
  const user = window.api.getCurrentUser();
  
  if (!user || (user.role !== 'manager' && user.role !== 'admin')) {
    window.location.href = 'login.html';
    return;
  }

  await loadManagerDashboard();
});

async function loadManagerDashboard() {
  try {
    const data = await window.api.dashboard.getManagerDashboard();
    
    // Update stats
    document.getElementById('totalTeamTasks').textContent = data.stats.totalTeamTasks || 0;
    document.getElementById('highRiskTasks').textContent = data.stats.highRiskTasks || 0;
    document.getElementById('pendingHandovers').textContent = data.stats.pendingHandovers || 0;
    document.getElementById('unavailableMembers').textContent = data.stats.unavailableMembers || 0;
    document.getElementById('teamSize').textContent = data.stats.teamSize || 0;
    
    // Display high risk tasks
    if (data.highRiskTasks && data.highRiskTasks.length > 0) {
      const container = document.getElementById('highRiskTasksList');
      container.innerHTML = data.highRiskTasks.map(task => `
        <div class="risk-item">
          <strong>${escapeHtml(task.title)}</strong>
          <span class="owner">Owner: ${task.owner.name}</span>
          ${task.backupOwner ? `<span class="backup">Backup: ${task.backupOwner.name}</span>` : '<span class="no-backup">⚠️ No Backup</span>'}
        </div>
      `).join('');
    }
    
    // Display pending handovers
    if (data.pendingHandovers && data.pendingHandovers.length > 0) {
      const container = document.getElementById('pendingHandoversList');
      container.innerHTML = data.pendingHandovers.map(handover => `
        <div class="handover-item">
          <strong>${escapeHtml(handover.task.title)}</strong>
          <span>From: ${handover.fromUser.name} → To: ${handover.toUser.name}</span>
          <small>Created: ${new Date(handover.createdAt).toLocaleDateString()}</small>
        </div>
      `).join('');
    }
    
    // Display unavailable members
    if (data.unavailableMembers && data.unavailableMembers.length > 0) {
      const container = document.getElementById('unavailableMembersList');
      container.innerHTML = data.unavailableMembers.map(avail => `
        <div class="unavailable-item">
          <strong>${avail.user.name}</strong>
          <span class="status-badge status-${avail.status}">${avail.status}</span>
          ${avail.endDate ? `<small>Until: ${new Date(avail.endDate).toLocaleDateString()}</small>` : ''}
        </div>
      `).join('');
    }
    
  } catch (error) {
    console.error('Error loading manager dashboard:', error);
  }
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
