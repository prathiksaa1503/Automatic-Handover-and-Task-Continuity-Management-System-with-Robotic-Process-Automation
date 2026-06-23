document.addEventListener('DOMContentLoaded', () => {

  /* =========================
     PROTECTED PAGES
  ========================== */
  const protectedPages = [
    'dashboard.html',
    'my-tasks.html',
    'handover-notes.html',
    'availability.html',
    'manager-dashboard.html',
    'admin-dashboard.html'
  ];

  const currentPage = window.location.pathname.split('/').pop();
  const token = window.api.getToken();
  const user = window.api.getCurrentUser();

  if (protectedPages.includes(currentPage) && (!token || !user)) {
    window.location.href = 'login.html';
    return;
  }

  /* =========================
     LOGIN
  ========================== */
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      const role = document.getElementById('role').value;

      if (!email || !password || !role) {
        showNotification('All fields are required', 'error');
        return;
      }

      try {
        const res = await window.api.auth.login(email, password, role);

        window.api.setAuth(res.token, res.user);

        if (role === 'employee') {
          window.location.href = 'dashboard.html';
        } else if (role === 'manager') {
          window.location.href = 'manager-dashboard.html';
        } else {
          window.location.href = 'admin-dashboard.html';
        }

      } catch (err) {
        showNotification(err.message, 'error');
      }
    });
  }

  /* =========================
     REGISTER
  ========================== */
  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = document.getElementById('name').value.trim();
      const email = document.getElementById('email').value.trim();
      const role = document.getElementById('role').value;
      const password = document.getElementById('password').value;
      const confirmPassword = document.getElementById('confirmPassword').value;

      if (!name || !email || !role || !password) {
        showNotification('All fields are required', 'error');
        return;
      }

      if (password !== confirmPassword) {
        showNotification('Passwords do not match', 'error');
        return;
      }

      try {
        await window.api.auth.register({ name, email, password, role });
        showNotification('Registration successful! Redirecting...', 'success');

        setTimeout(() => {
          window.location.href = 'login.html';
        }, 1200);

      } catch (err) {
        showNotification(err.message, 'error');
      }
    });
  }

  /* =========================
     LOGOUT
  ========================== */
  document.querySelectorAll('.logout-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      window.api.clearAuth();
      window.location.href = 'index.html';
    });
  });
});

/* =========================
   NOTIFICATION
========================= */
function showNotification(message, type) {
  const div = document.createElement('div');
  div.className = `${type}-notification`;
  div.textContent = message;
  document.body.appendChild(div);

  setTimeout(() => div.classList.add('show'), 10);
  setTimeout(() => {
    div.classList.remove('show');
    setTimeout(() => div.remove(), 300);
  }, 3000);
}
