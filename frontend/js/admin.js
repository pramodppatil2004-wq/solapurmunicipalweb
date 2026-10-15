// Solapur Municipal Corporation - Single Admin Grievance Management Panel
const adminHandler = {
  complaints: [],
  filteredComplaints: [],
  currentAdmin: null,
  currentWorkDonePhoto: '',

  checkSession() {
    const token = localStorage.getItem('smc_officer_token');
    if (!token) {
      this.showLoginView();
      return;
    }

    api.verifySession()
      .then(res => {
        if (res && res.valid) {
          this.currentAdmin = res.officer || { username: 'admin', fullName: 'Municipal Administrator', designation: 'Chief Grievance Officer' };
          this.showDashboardView(this.currentAdmin);
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

  showDashboardView(admin) {
    const loginSec = document.getElementById('adminLoginSection');
    const dashSec = document.getElementById('adminDashboardSection');
    if (loginSec) loginSec.style.display = 'none';
    if (dashSec) dashSec.style.display = 'block';

    const nameEl = document.getElementById('officerNameDisplay');
    const deptEl = document.getElementById('officerDeptDisplay');
    if (nameEl) {
      nameEl.innerHTML = `🛡️ ${admin.fullName || 'Municipal Administrator'} <span style="font-size: 0.8rem; background: rgba(255,255,255,0.2); padding: 2px 8px; border-radius: 4px; margin-left: 6px;">Admin Authorized</span>`;
    }
    if (deptEl) {
      deptEl.textContent = `Solapur Municipal Corporation • Central Grievance Redressal Cell (ID: ${admin.employeeId || 'SMC-ADMIN-01'})`;
    }
  },

  fillDemoCreds() {
    const userIn = document.getElementById('adminUsername');
    const passIn = document.getElementById('adminPassword');
    if (userIn) userIn.value = 'admin';
    if (passIn) passIn.value = 'solapur@123';
    app.showToast('Single Admin credentials filled (admin / solapur@123)', 'info');
  },

  async handleLogin(event) {
    event.preventDefault();

    const username = document.getElementById('adminUsername').value.trim();
    const password = document.getElementById('adminPassword').value;

    const btn = document.getElementById('btnAdminLogin');
    const originalText = btn ? btn.innerHTML : 'Log In as Municipal Admin';

    try {
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = 'Verifying Admin Authority...';
      }

      const res = await api.login(username, password);
      if (res && res.success && res.token) {
        localStorage.setItem('smc_officer_token', res.token);
        app.showToast('Admin authorized successfully. Welcome to SMC Management Console.', 'success');
        this.showDashboardView(res.officer);
        this.loadComplaints();
      }
    } catch (error) {
      app.showToast(error.message || 'Authentication failed. Please check admin credentials.', 'error');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = originalText;
      }
    }
  },

  handleLogout() {
    localStorage.removeItem('smc_officer_token');
    this.currentAdmin = null;
    this.showLoginView();
    app.showToast('Admin logged out successfully.', 'info');
  },

  async loadComplaints() {
    const tbody = document.getElementById('adminTableBody');
    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 24px;">Loading all Solapur municipal complaints...</td></tr>';
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
      const hasWorkDonePhoto = Boolean(g.resolutionPhotoUrl);

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
            ${g.latitude && g.longitude ? `<br><a href="https://www.google.com/maps?q=${g.latitude},${g.longitude}" target="_blank" style="color: #059669; font-weight: 600; display: inline-flex; align-items: center; gap: 2px; margin-top: 2px;">📍 (${g.latitude}, ${g.longitude}) 🗺️</a>` : ''}
          </td>
          <td>
            <span class="badge ${isUrgent ? 'badge-urgent' : 'badge-submitted'}">
              ${g.priority}
            </span>
          </td>
          <td>
            ${statusBadge}
            ${hasWorkDonePhoto ? `<div style="font-size: 0.75rem; color: #059669; font-weight: 700; margin-top: 4px;">📸 Work Done Photo Attached</div>` : ''}
          </td>
          <td style="font-size: 0.82rem; white-space: nowrap;">${dateFormatted}</td>
          <td>
            <button class="btn btn-outline btn-sm" onclick="adminHandler.openStatusModal('${g.id}', '${g.trackingToken}', '${g.status}', '${(g.assignedOfficer || '').replace(/'/g, "\\'")}', '${(g.officerRemarks || '').replace(/'/g, "\\'")}', '${(g.resolutionPhotoUrl || '').replace(/'/g, "\\'")}')">
              ✏️ Action & Update
            </button>
          </td>
        </tr>
      `;
    }).join('');
  },

  // ---------------- Status & Work Done Photo Modal ----------------
  openStatusModal(id, token, currentStatus, currentOfficer, currentRemarks, currentWorkDonePhoto) {
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

    // Handle Work Done Photo Preview
    this.currentWorkDonePhoto = currentWorkDonePhoto || '';
    const previewContainer = document.getElementById('workDonePhotoPreviewContainer');
    const previewImg = document.getElementById('workDonePhotoPreviewImg');
    const fileInput = document.getElementById('workDonePhotoInput');
    if (fileInput) fileInput.value = '';

    if (this.currentWorkDonePhoto && previewContainer && previewImg) {
      previewImg.src = this.currentWorkDonePhoto;
      previewContainer.style.display = 'inline-block';
    } else if (previewContainer) {
      previewContainer.style.display = 'none';
    }

    app.openModal('statusModal');
  },

  handleWorkDonePhotoUpload(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      app.showToast('Please upload an image file (JPG, PNG).', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      app.showToast('Image exceeds 5MB limit. Please upload a smaller photo.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      this.currentWorkDonePhoto = e.target.result;
      const previewCont = document.getElementById('workDonePhotoPreviewContainer');
      const previewImg = document.getElementById('workDonePhotoPreviewImg');
      if (previewCont && previewImg) {
        previewImg.src = this.currentWorkDonePhoto;
        previewCont.style.display = 'inline-block';
      }
      app.showToast('Work done proof photo uploaded successfully.', 'success');
    };
    reader.readAsDataURL(file);
  },

  removeWorkDonePhoto() {
    this.currentWorkDonePhoto = '';
    const fileInput = document.getElementById('workDonePhotoInput');
    if (fileInput) fileInput.value = '';
    const previewCont = document.getElementById('workDonePhotoPreviewContainer');
    if (previewCont) previewCont.style.display = 'none';
    app.showToast('Work done photo removed.', 'info');
  },

  async submitStatusUpdate(event) {
    event.preventDefault();

    const id = document.getElementById('modalGrievanceId').value;
    const status = document.getElementById('modalStatusSelect').value;
    const assignedOfficer = document.getElementById('modalAssignOfficer').value.trim();
    const officerRemarks = document.getElementById('modalRemarks').value.trim();

    const btn = event.submitter || document.querySelector('#statusModal button[type="submit"]');
    const origText = btn ? btn.innerHTML : 'Update Status';

    try {
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = 'Saving Changes...';
      }

      const res = await api.updateStatus(id, {
        status,
        assignedOfficer,
        officerRemarks,
        resolutionPhotoUrl: this.currentWorkDonePhoto
      });

      if (res && res.success) {
        app.showToast(`Status updated to "${status}" successfully with work proof!`, 'success');
        app.closeModal('statusModal');
        this.loadComplaints();
        app.loadStats();
      }
    } catch (e) {
      app.showToast(e.message || 'Error updating status', 'error');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = origText;
      }
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
      'Latitude',
      'Longitude',
      'Priority',
      'Status',
      'Assigned Officer',
      'Officer Remarks',
      'Has Work Done Photo',
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
      `"${g.latitude || ''}"`,
      `"${g.longitude || ''}"`,
      `"${g.priority || ''}"`,
      `"${g.status || ''}"`,
      `"${(g.assignedOfficer || '').replace(/"/g, '""')}"`,
      `"${(g.officerRemarks || '').replace(/"/g, '""')}"`,
      `"${Boolean(g.resolutionPhotoUrl) ? 'YES' : 'NO'}"`,
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
