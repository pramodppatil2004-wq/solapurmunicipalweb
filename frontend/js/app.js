// Solapur Municipal Corporation - Main Application Core
const app = {
  currentView: 'home',
  lastSubmittedToken: '',
  departments: [
    { id: 'water', name: 'Water Supply', icon: '💧', sub: 'Low pressure, leakages, tanker booking' },
    { id: 'drainage', name: 'Drainage & Sewerage', icon: '🚰', sub: 'Manhole overflow, chamber blockage' },
    { id: 'garbage', name: 'Solid Waste & Garbage', icon: '🗑️', sub: 'Bin overflow, street sweeping' },
    { id: 'roads', name: 'Roads & Potholes', icon: '🛣️', sub: 'Pothole patch, trench repair' },
    { id: 'lights', name: 'Street Lighting', icon: '💡', sub: 'Dark fixtures, pole damage' },
    { id: 'health', name: 'Public Health & Sanitation', icon: '🏥', sub: 'Mosquito fogging, stray animals' },
    { id: 'gardens', name: 'Garden & Tree Trimming', icon: '🌳', sub: 'Fallen branches, park cleanup' },
    { id: 'tax', name: 'Property Tax & Assessment', icon: '🏠', sub: 'Name transfer, tax bill queries' },
    { id: 'encroach', name: 'Encroachment & Illegal Works', icon: '🚧', sub: 'Footpath blockage, unauthorized shed' }
  ],

  init() {
    this.setupDateDisplay();
    this.renderHomeDepartments();
    this.renderFormCategories();
    this.setupMobileMenu();
    this.setupRouting();
    this.loadStats();

    // Check URL hash on load
    const hash = window.location.hash.replace('#', '') || 'home';
    this.showView(hash, false);
  },

  setupDateDisplay() {
    const el = document.getElementById('currentDateDisplay');
    if (el) {
      const now = new Date();
      const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
      el.textContent = `📅 ${now.toLocaleDateString('en-IN', options)}`;
    }
  },

  setupMobileMenu() {
    const btn = document.getElementById('mobileMenuBtn');
    const menu = document.getElementById('navMenu');
    if (btn && menu) {
      btn.addEventListener('click', () => {
        menu.classList.toggle('show');
      });
    }
  },

  setupRouting() {
    window.addEventListener('hashchange', () => {
      const hash = window.location.hash.replace('#', '') || 'home';
      this.showView(hash, false);
    });
  },

  showView(viewName, updateHash = true) {
    const views = ['home', 'file', 'track', 'feed', 'directory', 'admin'];
    if (!views.includes(viewName)) viewName = 'home';

    this.currentView = viewName;
    if (updateHash) {
      window.location.hash = viewName;
    }

    // Toggle view sections
    views.forEach(v => {
      const sec = document.getElementById(`view-${v}`);
      if (sec) {
        if (v === viewName) {
          sec.classList.add('active');
        } else {
          sec.classList.remove('active');
        }
      }
    });

    // Update nav links active class
    const links = document.querySelectorAll('.nav-link');
    links.forEach(l => {
      if (l.dataset.view === viewName) {
        l.classList.add('active');
      } else {
        l.classList.remove('active');
      }
    });

    // Close mobile menu if open
    const menu = document.getElementById('navMenu');
    if (menu) menu.classList.remove('show');

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // View specific hooks
    if (viewName === 'home') {
      this.loadStats();
    } else if (viewName === 'feed') {
      this.loadTransparencyFeed();
    } else if (viewName === 'admin') {
      adminHandler.checkSession();
    }
  },

  selectCategoryAndGo(deptName) {
    this.showView('file');
    complaintHandler.selectDepartment(deptName);
  },

  renderHomeDepartments() {
    const container = document.getElementById('homeDepartmentCards');
    if (!container) return;

    container.innerHTML = this.departments.map(d => `
      <div class="category-card-option" onclick="app.selectCategoryAndGo('${d.name}')">
        <div class="category-icon-box">${d.icon}</div>
        <div class="category-title">${d.name}</div>
        <div class="category-sub">${d.sub}</div>
      </div>
    `).join('');
  },

  renderFormCategories() {
    const container = document.getElementById('formCategoryGrid');
    if (!container) return;

    container.innerHTML = this.departments.map(d => `
      <div class="category-card-option" data-dept="${d.name}" onclick="complaintHandler.selectDepartment('${d.name}')">
        <div class="category-icon-box">${d.icon}</div>
        <div class="category-title">${d.name}</div>
        <div class="category-sub">${d.sub}</div>
      </div>
    `).join('');
  },

  async loadStats() {
    try {
      const res = await api.getStats();
      if (res && res.data) {
        const d = res.data;
        const totalEl = document.getElementById('statTotalComplaints');
        const resEl = document.getElementById('statResolvedComplaints');
        const progEl = document.getElementById('statInProgressComplaints');
        const ratingEl = document.getElementById('statCitizenRating');

        if (totalEl) totalEl.textContent = d.total || '0';
        if (resEl) resEl.textContent = d.resolved || '0';
        if (progEl) progEl.textContent = d.inProgress || '0';
        if (ratingEl) ratingEl.textContent = `${d.avgRating} / 5 ⭐`;
      }
    } catch (e) {
      console.warn('Could not load live stats from API:', e.message);
    }
  },

  async loadTransparencyFeed() {
    const tbody = document.getElementById('transparencyTableBody');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 20px;">Loading public transparency records...</td></tr>';

    try {
      const res = await api.getStats();
      const list = (res && res.data && res.data.publicFeed) || [];

      if (list.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 20px;">No public complaints recorded yet.</td></tr>';
        return;
      }

      tbody.innerHTML = list.map(item => {
        const date = new Date(item.createdAt).toLocaleDateString('en-IN', {
          day: 'numeric', month: 'short', year: 'numeric'
        });

        const statusBadge = this.getStatusBadge(item.status);
        const ratingDisplay = item.feedback && item.feedback.rating 
          ? `⭐ ${item.feedback.rating}/5` 
          : '<span style="color:#94A3B8;">Pending</span>';

        return `
          <tr>
            <td>
              <a href="#track" onclick="trackingHandler.quickSearch('${item.trackingToken}')" style="font-weight:700;">
                ${item.trackingToken}
              </a>
            </td>
            <td><strong>${item.department}</strong></td>
            <td>${item.ward}</td>
            <td style="max-width: 280px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${item.title}">
              ${item.title}
            </td>
            <td>${statusBadge}</td>
            <td>${date}</td>
            <td>${ratingDisplay}</td>
          </tr>
        `;
      }).join('');
    } catch (error) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color: red; padding: 20px;">Error loading transparency records: ${error.message}</td></tr>`;
    }
  },

  getStatusBadge(status) {
    const s = (status || 'Submitted').toLowerCase();
    if (s === 'resolved') {
      return '<span class="badge badge-resolved">✅ Resolved</span>';
    } else if (s === 'in progress') {
      return '<span class="badge badge-in-progress">⏳ In Progress</span>';
    } else if (s === 'assigned') {
      return '<span class="badge badge-assigned">👷 Assigned</span>';
    } else if (s === 'under review') {
      return '<span class="badge badge-under-review">🔍 Under Review</span>';
    } else if (s === 'rejected') {
      return '<span class="badge badge-rejected">❌ Closed</span>';
    }
    return '<span class="badge badge-submitted">📝 Submitted</span>';
  },

  openModal(modalId) {
    const m = document.getElementById(modalId);
    if (m) m.classList.add('active');
  },

  closeModal(modalId) {
    const m = document.getElementById(modalId);
    if (m) m.classList.remove('active');
  },

  copyToken() {
    if (!this.lastSubmittedToken) return;
    navigator.clipboard.writeText(this.lastSubmittedToken).then(() => {
      this.showToast(`Tracking token ${this.lastSubmittedToken} copied to clipboard!`, 'success');
    }).catch(() => {
      this.showToast(`Token: ${this.lastSubmittedToken}`, 'info');
    });
  },

  trackDirectlyFromReceipt() {
    this.closeModal('receiptModal');
    this.showView('track');
    if (this.lastSubmittedToken) {
      trackingHandler.quickSearch(this.lastSubmittedToken);
    }
  },

  showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '⚠️';

    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4500);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  app.init();
});
