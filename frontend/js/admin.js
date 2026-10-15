// Solapur Municipal Corporation - Officer Portal & Administrative Panel
const adminHandler = {
  complaints: [],
  filteredComplaints: [],

  checkSession() {
    const token = localStorage.getItem('smc_officer_token');
    if (!token) {
      this.showLoginView();
      return;
    }

    api.verifySession()
      .then(res => {
        if (res && res.valid) {
          this.showDashboardView(res.officer);
          this.loadComplaints();
        } else {
          this.showLoginView();
        }
      })
      .catch(() => {
        this.showLoginView();
      });
  },

  showLoginView() {
    const loginSec = document.getElementById('adminLoginSection');
    const dashSec = document.getElementById('adminDashboardSection');
    if (loginSec) loginSec.style.display = 'block';
    if (dashSec) dashSec.style.display = 'none';
  },

  showDashboardView(officer) {
    const loginSec = document.getElementById('adminLoginSection');
    const dashSec = document.getElementById('adminDashboardSection');
    if (loginSec) loginSec.style.display = 'none';
    if (dashSec) dashSec.style.display = 'block';

    if (officer) {
      const nameEl = document.getElementById('officerNameDisplay');
      const deptEl = document.getElementById('officerDeptDisplay');
      if (nameEl && officer.name) nameEl.textContent = `${officer.name} (${officer.designation || 'Officer'})`;
      if (deptEl && officer.department) deptEl.textContent = officer.department;
    }
  },

  fillDemoCreds() {
    const userIn = document.getElementById('adminUsername');
    const passIn = document.getElementById('adminPassword');
    if (userIn) userIn.value = 'admin';
    if (passIn) passIn.value = 'solapur@123';
    app.showToast('Credentials filled. Click "Log In to Dashboard".', 'info');
  },

  async handleLogin(event) {
    event.preventDefault();

    const username = document.getElementById('adminUsername').value.trim();
    const password = document.getElementById('adminPassword').value;

    const btn = document.getElementById('btnAdminLogin');
    const originalText = btn ? btn.innerHTML : 'Log In';

    try {
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = 'Verifying Credentials...';
      }

      const res = await api.login(username, password);
      if (res && res.success && res.token) {
        localStorage.setItem('smc_officer_token', res.token);
        app.showToast('Login successful. Welcome to Solapur Municipal Officer Portal.', 'success');
        this.showDashboardView(res.officer);
        this.loadComplaints();
      }
    } catch (error) {
      app.showToast(error.message || 'Authentication failed. Please verify credentials.', 'error');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = originalText;
      }
    }
  },

  handleLogout() {
    localStorage.removeItem('smc_officer_token');
    this.showLoginView();
    app.showToast('Logged out of Officer Portal successfully.', 'info');
  },

  async loadComplaints() {
    const tbody = document.getElementById('adminTableBody');
    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 24px;">Loading grievances data...</td></tr>';
    }

    try {
      const res = await api.getGrievances();
      if (res && res.data) {
        this.complaints = res.data;
        this.applyFilters();
        this.updateKPIs(res.data);
      }
    } catch (e) {
      if (tbody) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: red; padding: 24px;">Error: ${e.message}</td></tr>`;
      }
    }
  },

  updateKPIs(list) {
    const totalEl = document.getElementById('adminStatTotal');
    const pendingEl = document.getElementById('adminStatPending');
    const resolvedEl = document.getElementById('adminStatResolved');
    const urgentEl = document.getElementById('adminStatUrgent');

    let total = list.length;
    let pending = 0;
    let resolved = 0;
    let urgent = 0;

    list.forEach(g => {
      const s = (g.status || '').toLowerCase();
      if (s === 'resolved') resolved++;
      else if (s !== 'rejected') pending++;

      const p = (g.priority || '').toLowerCase();
      if (p === 'urgent' || p === 'high') urgent++;
    });

    if (totalEl) totalEl.textContent = total;
    if (pendingEl) pendingEl.textContent = pending;
    if (resolvedEl) resolvedEl.textContent = resolved;
    if (urgentEl) urgentEl.textContent = urgent;
  },

  applyFilters() {
    const searchVal = (document.getElementById('adminSearchInput')?.value || '').toLowerCase().trim();
    const statusVal = document.getElementById('adminStatusFilter')?.value || 'all';
    const deptVal = document.getElementById('adminDeptFilter')?.value || 'all';

    let filtered = [...this.complaints];

    if (statusVal !== 'all') {
      filtered = filtered.filter(g => (g.status || '').toLowerCase() === statusVal.toLowerCase());
    }

    if (deptVal !== 'all') {
      filtered = filtered.filter(g => (g.department || '').toLowerCase() === deptVal.toLowerCase());
    }

    if (searchVal) {
      filtered = filtered.filter(g =>
        (g.trackingToken && g.trackingToken.toLowerCase().includes(searchVal)) ||
        (g.citizenName && g.citizenName.toLowerCase().includes(searchVal)) ||
        (g.title && g.title.toLowerCase().includes(searchVal)) ||
        (g.ward && g.ward.toLowerCase().includes(searchVal)) ||
        (g.mobileNumber && g.mobileNumber.includes(searchVal))
      );
    }

    this.filteredComplaints = filtered;
    this.renderTable(filtered);
  },

  renderTable(list) {
    const tbody = document.getElementById('adminTableBody');
    if (!tbody) return;

    if (list.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 24px; color: #64748B;">No grievance records match the current filters.</td></tr>';
      return;
    }

    tbody.innerHTML = list.map(g => {
      const dateFormatted = new Date(g.createdAt).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric'
      });

      const statusBadge = app.getStatusBadge(g.status);
      const isUrgent = (g.priority || '').toLowerCase() === 'urgent';

      return `
        <tr>
          <td>
            <a href="#track" onclick="trackingHandler.quickSearch('${g.trackingToken}')" style="font-weight: 700;">
              ${g.trackingToken}
            </a>
          </td>
          <td>
            <strong>${g.citizenName}</strong><br>
            <span style="font-size: 0.78rem; color: #64748B;">📱 ${g.mobileNumber}</span>
          </td>
          <td>
            <span style="font-weight: 600; color: #0A3981;">${g.department}</span>
          </td>
          <td style="max-width: 220px; font-size: 0.82rem;">
            <strong>${g.ward}</strong><br>
            <span style="color: #64748B;">${g.address}</span>
          </td>
          <td>
            <span class="badge ${isUrgent ? 'badge-urgent' : 'badge-submitted'}">
              ${g.priority}
            </span>
          </td>
          <td>${statusBadge}</td>
          <td style="font-size: 0.82rem; white-space: nowrap;">${dateFormatted}</td>
          <td>
            <button class="btn btn-outline btn-sm" onclick="adminHandler.openStatusModal('${g.id}', '${g.trackingToken}', '${g.status}', '${(g.assignedOfficer || '').replace(/'/g, "\\'")}', '${(g.officerRemarks || '').replace(/'/g, "\\'")}')">
              ✏️ Update
            </button>
          </td>
        </tr>
      `;
    }).join('');
  },

  openStatusModal(id, token, currentStatus, currentOfficer, currentRemarks) {
    const idInput = document.getElementById('modalGrievanceId');
    const tokenDisplay = document.getElementById('modalStatusToken');
    const statusSelect = document.getElementById('modalStatusSelect');
    const officerInput = document.getElementById('modalAssignOfficer');
    const remarksInput = document.getElementById('modalRemarks');

    if (idInput) idInput.value = id;
    if (tokenDisplay) tokenDisplay.textContent = token;
    if (statusSelect) statusSelect.value = currentStatus || 'Submitted';
    if (officerInput) officerInput.value = currentOfficer || '';
    if (remarksInput) remarksInput.value = currentRemarks || '';

    app.openModal('statusModal');
  },

  async submitStatusUpdate(event) {
    event.preventDefault();

    const id = document.getElementById('modalGrievanceId').value;
    const status = document.getElementById('modalStatusSelect').value;
    const assignedOfficer = document.getElementById('modalAssignOfficer').value.trim();
    const officerRemarks = document.getElementById('modalRemarks').value.trim();

    try {
      const res = await api.updateStatus(id, {
        status,
        assignedOfficer,
        officerRemarks
      });

      if (res && res.success) {
        app.showToast(`Status updated to "${status}" successfully.`, 'success');
        app.closeModal('statusModal');
        this.loadComplaints();
        app.loadStats();
      }
    } catch (e) {
      app.showToast(e.message || 'Error updating status', 'error');
    }
  },

  exportCSV() {
    const data = this.filteredComplaints.length > 0 ? this.filteredComplaints : this.complaints;
    if (data.length === 0) {
      app.showToast('No records available to export.', 'info');
      return;
    }

    const headers = [
      'Tracking Token',
      'Citizen Name',
      'Mobile Number',
      'Email',
      'Department',
      'Ward',
      'Address',
      'Priority',
      'Status',
      'Assigned Officer',
      'Officer Remarks',
      'Registration Date'
    ];

    const rows = data.map(g => [
      `"${g.trackingToken || ''}"`,
      `"${(g.citizenName || '').replace(/"/g, '""')}"`,
      `"${g.mobileNumber || ''}"`,
      `"${g.email || ''}"`,
      `"${g.department || ''}"`,
      `"${(g.ward || '').replace(/"/g, '""')}"`,
      `"${(g.address || '').replace(/"/g, '""')}"`,
      `"${g.priority || ''}"`,
      `"${g.status || ''}"`,
      `"${(g.assignedOfficer || '').replace(/"/g, '""')}"`,
      `"${(g.officerRemarks || '').replace(/"/g, '""')}"`,
      `"${new Date(g.createdAt).toISOString()}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const dateStr = new Date().toISOString().slice(0, 10);
    link.setAttribute('download', `SMC_Grievance_Report_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    app.showToast('Grievance CSV Report downloaded successfully.', 'success');
  }
};
