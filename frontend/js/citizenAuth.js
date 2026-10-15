// Solapur Municipal Corporation - Citizen Authorization & Profile Management
const citizenAuth = {
  currentCitizen: null,
  activeTab: 'login',

  init() {
    this.checkSession();
  },

  async checkSession() {
    const token = localStorage.getItem('smc_citizen_token');
    if (!token) {
      this.updateUI(null);
      return;
    }

    try {
      const res = await api.citizenVerify();
      if (res && res.valid && res.user) {
        this.currentCitizen = res.user;
        this.updateUI(res.user);
        this.autoFillComplaintForm(res.user);
      } else {
        this.logout(false);
      }
    } catch (e) {
      this.logout(false);
    }
  },

  updateUI(user) {
    const headerContainer = document.getElementById('citizenHeaderContainer');
    const authRequiredBanner = document.getElementById('authRequiredBanner');
    const citizenFormFields = document.getElementById('citizenFormFields');

    if (user) {
      if (headerContainer) {
        headerContainer.innerHTML = `
          <div style="display: flex; align-items: center; gap: 8px;">
            <div style="background: #EBF3FB; color: #0A3981; font-weight: 700; font-size: 0.85rem; padding: 6px 12px; border-radius: 6px; border: 1px solid #BFDBFE;">
              👤 ${user.fullName} (${user.ward ? user.ward.split(' - ')[0] : 'Citizen'})
            </div>
            <button class="btn btn-outline btn-sm" onclick="citizenAuth.openMyComplaints()" title="View complaints filed by you">
              📋 My Complaints
            </button>
            <button class="btn btn-outline btn-sm" style="color: #DC2626; border-color: #FECACA;" onclick="citizenAuth.logout()" title="Log out">
              🚪 Logout
            </button>
          </div>
        `;
      }

      if (authRequiredBanner) authRequiredBanner.style.display = 'none';
      if (citizenFormFields) citizenFormFields.style.opacity = '1';

      this.autoFillComplaintForm(user);
    } else {
      if (headerContainer) {
        headerContainer.innerHTML = `
          <button class="btn btn-primary btn-sm" onclick="citizenAuth.openAuthModal('login')">
            <span>👤</span> Citizen Login / Register
          </button>
        `;
      }

      if (authRequiredBanner) authRequiredBanner.style.display = 'block';
      if (citizenFormFields) citizenFormFields.style.opacity = '0.5';
    }
  },

  autoFillComplaintForm(user) {
    if (!user) return;
    const nameIn = document.getElementById('citizenName');
    const mobileIn = document.getElementById('mobileNumber');
    const emailIn = document.getElementById('email');
    const wardSelect = document.getElementById('wardSelect');
    const addressIn = document.getElementById('address');

    if (nameIn && !nameIn.value) nameIn.value = user.fullName || '';
    if (mobileIn && !mobileIn.value) mobileIn.value = user.mobileNumber || '';
    if (emailIn && !emailIn.value) emailIn.value = user.email || '';
    if (wardSelect && user.ward && !wardSelect.value) wardSelect.value = user.ward;
    if (addressIn && user.address && !addressIn.value) addressIn.value = user.address;
  },

  openAuthModal(tab = 'login') {
    this.switchTab(tab);
    app.openModal('citizenAuthModal');
  },

  switchTab(tab) {
    this.activeTab = tab;
    const loginForm = document.getElementById('citizenLoginForm');
    const regForm = document.getElementById('citizenRegisterForm');
    const tabLogin = document.getElementById('tabCitizenLogin');
    const tabReg = document.getElementById('tabCitizenRegister');

    if (tab === 'login') {
      if (loginForm) loginForm.style.display = 'block';
      if (regForm) regForm.style.display = 'none';
      if (tabLogin) tabLogin.classList.add('active');
      if (tabReg) tabReg.classList.remove('active');
    } else {
      if (loginForm) loginForm.style.display = 'none';
      if (regForm) regForm.style.display = 'block';
      if (tabLogin) tabLogin.classList.remove('active');
      if (tabReg) tabReg.classList.add('active');
    }
  },

  fillDemoCitizen() {
    const ident = document.getElementById('citLoginIdentifier');
    const pass = document.getElementById('citLoginPassword');
    if (ident) ident.value = '9822012345';
    if (pass) pass.value = 'citizen@123';
    app.showToast('Demo Citizen credentials entered (9822012345 / citizen@123)', 'info');
  },

  async handleLogin(event) {
    event.preventDefault();
    const identifier = document.getElementById('citLoginIdentifier').value.trim();
    const password = document.getElementById('citLoginPassword').value;

    const btn = document.getElementById('btnCitizenLogin');
    const orig = btn ? btn.innerHTML : 'Log In';

    try {
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = 'Verifying...';
      }

      const res = await api.citizenLogin(identifier, password);
      if (res && res.success && res.token) {
        localStorage.setItem('smc_citizen_token', res.token);
        this.currentCitizen = res.user;
        this.updateUI(res.user);
        app.closeModal('citizenAuthModal');
        app.showToast(`Logged in successfully. Welcome ${res.user.fullName}!`, 'success');

        // If on file view, prefill and scroll to form
        if (app.currentView === 'file') {
          this.autoFillComplaintForm(res.user);
        }
      }
    } catch (e) {
      app.showToast(e.message || 'Login failed. Please check your credentials.', 'error');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = orig;
      }
    }
  },

  async handleRegister(event) {
    event.preventDefault();
    const fullName = document.getElementById('citRegName').value.trim();
    const mobileNumber = document.getElementById('citRegMobile').value.trim();
    const email = document.getElementById('citRegEmail').value.trim();
    const ward = document.getElementById('citRegWard').value;
    const address = document.getElementById('citRegAddress').value.trim();
    const password = document.getElementById('citRegPassword').value;
    const confirmPassword = document.getElementById('citRegConfirmPassword').value;

    if (password !== confirmPassword) {
      app.showToast('Passwords do not match.', 'error');
      return;
    }

    const btn = document.getElementById('btnCitizenRegister');
    const orig = btn ? btn.innerHTML : 'Register Account';

    try {
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = 'Creating Account...';
      }

      const res = await api.citizenRegister({
        fullName,
        mobileNumber,
        email,
        ward,
        address,
        password
      });

      if (res && res.success && res.token) {
        localStorage.setItem('smc_citizen_token', res.token);
        this.currentCitizen = res.user;
        this.updateUI(res.user);
        app.closeModal('citizenAuthModal');
        app.showToast('Registration successful! You can now lodge verified grievances.', 'success');

        if (app.currentView === 'file') {
          this.autoFillComplaintForm(res.user);
        }
      }
    } catch (e) {
      app.showToast(e.message || 'Registration failed.', 'error');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = orig;
      }
    }
  },

  logout(showToastMsg = true) {
    localStorage.removeItem('smc_citizen_token');
    this.currentCitizen = null;
    this.updateUI(null);
    if (showToastMsg) {
      app.showToast('Citizen logged out successfully.', 'info');
    }
  },

  async openMyComplaints() {
    if (!this.currentCitizen) {
      this.openAuthModal('login');
      return;
    }

    app.openModal('myComplaintsModal');
    const container = document.getElementById('myComplaintsList');
    if (!container) return;

    container.innerHTML = '<div style="text-align: center; padding: 24px;">Loading your filed complaints...</div>';

    try {
      const res = await api.getMyGrievances();
      const list = (res && res.data) || [];

      if (list.length === 0) {
        container.innerHTML = `
          <div style="text-align: center; padding: 32px; color: #64748B;">
            <div style="font-size: 2.2rem; margin-bottom: 8px;">📂</div>
            <p style="font-weight: 600;">You haven't lodged any grievances yet.</p>
            <button class="btn btn-primary btn-sm" style="margin-top: 12px;" onclick="app.closeModal('myComplaintsModal'); app.showView('file');">
              Lodge a Grievance Now
            </button>
          </div>
        `;
        return;
      }

      container.innerHTML = list.map(g => {
        const date = new Date(g.createdAt).toLocaleDateString('en-IN', {
          day: 'numeric', month: 'short', year: 'numeric'
        });
        const statusBadge = app.getStatusBadge(g.status);

        return `
          <div style="background: #F8FAFC; border: 1px solid #CBD5E1; border-radius: 8px; padding: 16px; margin-bottom: 12px;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px;">
              <div>
                <span style="font-size: 0.75rem; color: #1D63B8; font-weight: 700;">TOKEN:</span>
                <strong style="color: #0A3981; font-size: 1.05rem;">${g.trackingToken}</strong>
              </div>
              <div>${statusBadge}</div>
            </div>
            <div style="font-size: 0.95rem; font-weight: 700; color: #0F172A; margin-bottom: 4px;">${g.title}</div>
            <div style="font-size: 0.85rem; color: #64748B; margin-bottom: 8px;">
              📁 <strong>${g.department}</strong> • 📍 ${g.ward} • 📅 ${date}
              ${g.latitude ? ` • <span style="color:#059669; font-weight:600;">📍 Geo-tagged</span>` : ''}
            </div>
            <div style="display: flex; justify-content: flex-end; gap: 8px;">
              <button class="btn btn-outline btn-sm" onclick="app.closeModal('myComplaintsModal'); trackingHandler.quickSearch('${g.trackingToken}');">
                🔍 Track Progress
              </button>
            </div>
          </div>
        `;
      }).join('');
    } catch (e) {
      container.innerHTML = `<div style="color: red; padding: 20px;">Error loading your complaints: ${e.message}</div>`;
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  citizenAuth.init();
});
