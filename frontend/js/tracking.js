// Solapur Municipal Corporation - Real-Time Grievance Tracker
const trackingHandler = {
  currentGrievances: [],

  quickSearch(token) {
    app.showView('track');
    const input = document.getElementById('trackInput');
    if (input) input.value = token;
    this.searchQuery(token);
  },

  async search(event) {
    if (event) event.preventDefault();
    const input = document.getElementById('trackInput');
    if (!input) return;
    const query = input.value.trim();
    if (!query) {
      app.showToast('Please enter your tracking token (e.g. SMC-2026-1042) or mobile number.', 'error');
      return;
    }
    this.searchQuery(query);
  },

  async searchQuery(query) {
    const container = document.getElementById('trackResultContainer');
    const btn = document.getElementById('btnTrack');
    const originalText = btn ? btn.innerHTML : 'Track Now';

    if (container) {
      container.innerHTML = `
        <div style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 12px; padding: 36px; text-align: center;">
          <div style="font-size: 2rem; margin-bottom: 8px;">⏳</div>
          <h4 style="color: #0A3981;">Searching Solapur Municipal Grievance Records...</h4>
          <p style="color: #64748B; font-size: 0.9rem;">Fetching real-time updates for "${query}"</p>
        </div>
      `;
    }

    try {
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = 'Searching...';
      }

      const res = await api.trackGrievance(query);
      if (res && res.success && res.data && res.data.length > 0) {
        this.currentGrievances = res.data;
        this.renderResults(res.data);
      } else {
        this.renderNotFound(query);
      }
    } catch (error) {
      this.renderNotFound(query, error.message);
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = originalText;
      }
    }
  },

  renderNotFound(query, customMsg) {
    const container = document.getElementById('trackResultContainer');
    if (!container) return;

    container.innerHTML = `
      <div style="background: #FFFFFF; border: 1px solid #FECACA; border-radius: 12px; padding: 36px; text-align: center;">
        <div style="font-size: 2.5rem; margin-bottom: 8px;">🔍</div>
        <h4 style="color: #B91C1C; font-size: 1.2rem;">No Grievance Record Found</h4>
        <p style="color: #475569; font-size: 0.95rem; max-width: 500px; margin: 8px auto 18px;">
          ${customMsg || `We could not locate any active or archived complaint with token or mobile number "${query}".`}
        </p>
        <p style="font-size: 0.85rem; color: #64748B; margin-bottom: 20px;">
          Please ensure your token matches the format <strong>SMC-2026-XXXX</strong> or verify your registered 10-digit mobile number.
        </p>
        <button class="btn btn-primary" onclick="app.showView('file')">
          <span>📝</span> Lodge a New Complaint
        </button>
      </div>
    `;
  },

  renderResults(list) {
    const container = document.getElementById('trackResultContainer');
    if (!container) return;

    container.innerHTML = list.map((g, index) => this.renderSingleGrievanceCard(g, index)).join('');
  },

  renderSingleGrievanceCard(g, index) {
    const status = g.status || 'Submitted';
    const statusBadge = app.getStatusBadge(status);
    const dateFormatted = new Date(g.createdAt).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    const stepperHtml = this.buildStepper(status);
    const feedbackHtml = this.buildFeedbackSection(g);

    return `
      <div class="tracking-card">
        <!-- Header -->
        <div class="tracking-header">
          <div>
            <div style="font-size: 0.8rem; text-transform: uppercase; color: #1D63B8; font-weight: 700;">Grievance Token</div>
            <div class="tracking-token-display">${g.trackingToken}</div>
            <div style="color: #64748B; font-size: 0.82rem; margin-top: 2px;">Lodged on: ${dateFormatted}</div>
          </div>
          <div class="tracking-meta-badges">
            ${statusBadge}
            <span class="badge ${g.priority === 'Urgent' ? 'badge-urgent' : 'badge-submitted'}">
              Priority: ${g.priority || 'Normal'}
            </span>
          </div>
        </div>

        <!-- 5-Stage Stepper -->
        <div class="stepper-container">
          ${stepperHtml}
        </div>

        <!-- Issue Summary -->
        <div style="margin-bottom: 20px;">
          <h3 style="color: #0A3981; font-size: 1.15rem; font-weight: 700; margin-bottom: 4px;">${g.title}</h3>
          <p style="color: #334155; font-size: 0.95rem; line-height: 1.6;">${g.description}</p>
        </div>

        <!-- Metadata Grid -->
        <div class="grievance-info-grid">
          <div>
            <div class="info-item-label">Department</div>
            <div class="info-item-value">${g.department}</div>
          </div>
          <div>
            <div class="info-item-label">Ward / Prabhag</div>
            <div class="info-item-value">${g.ward}</div>
          </div>
          <div>
            <div class="info-item-label">Location / Address</div>
            <div class="info-item-value">${g.address}</div>
          </div>
          <div>
            <div class="info-item-label">Assigned Field Officer</div>
            <div class="info-item-value" style="color: ${g.assignedOfficer ? '#0A3981' : '#64748B'};">
              ${g.assignedOfficer || '⏳ Allocation in progress by Zonal Office'}
            </div>
          </div>
          ${g.officerRemarks ? `
            <div style="grid-column: 1 / -1;">
              <div class="info-item-label">Official Resolution Notes / Remarks</div>
              <div class="info-item-value" style="color: #065F46; background: #ECFDF5; padding: 10px; border-radius: 6px; border: 1px solid #A7F3D0; margin-top: 4px;">
                💬 ${g.officerRemarks}
              </div>
            </div>
          ` : ''}
        </div>

        <!-- Photo preview if uploaded -->
        ${g.photoUrl ? `
          <div style="margin-bottom: 24px;">
            <div class="info-item-label" style="margin-bottom: 6px;">Citizen Photo Evidence</div>
            <img src="${g.photoUrl}" alt="Complaint Photo" style="max-width: 260px; max-height: 200px; border-radius: 8px; border: 1px solid #CBD5E1; cursor: pointer;" onclick="window.open('${g.photoUrl}')">
          </div>
        ` : ''}

        <!-- Audit Timeline Log -->
        <div>
          <h4 style="color: #0A3981; font-size: 1rem; font-weight: 700; margin-bottom: 12px; display: flex; align-items: center; gap: 6px;">
            <span>📜</span> Official Action History & Audit Log
          </h4>
          <div class="timeline-log">
            ${(g.timeline || []).map(ev => {
              const evDate = new Date(ev.timestamp).toLocaleString('en-IN', {
                day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
              });
              return `
                <div class="timeline-event">
                  <div class="timeline-event-header">
                    <span class="timeline-event-title">${ev.title || ev.status}</span>
                    <span class="timeline-event-time">${evDate}</span>
                  </div>
                  <div class="timeline-event-desc">${ev.description}</div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Citizen Satisfaction Feedback Section -->
        ${feedbackHtml}
      </div>
    `;
  },

  buildStepper(currentStatus) {
    const stages = [
      { key: 'Submitted', label: '1. Registered' },
      { key: 'Under Review', label: '2. Under Review' },
      { key: 'Assigned', label: '3. Assigned' },
      { key: 'In Progress', label: '4. In Progress' },
      { key: 'Resolved', label: '5. Resolved' }
    ];

    const statusOrder = {
      'submitted': 0,
      'under review': 1,
      'assigned': 2,
      'in progress': 3,
      'resolved': 4,
      'rejected': -1
    };

    const s = (currentStatus || 'Submitted').toLowerCase();
    const currentIndex = statusOrder[s] !== undefined ? statusOrder[s] : 0;

    let progressWidth = '0%';
    if (currentIndex >= 4) progressWidth = '100%';
    else if (currentIndex === 3) progressWidth = '75%';
    else if (currentIndex === 2) progressWidth = '50%';
    else if (currentIndex === 1) progressWidth = '25%';

    if (s === 'rejected') {
      return `
        <div style="background: #FEF2F2; border: 1px solid #FECACA; border-radius: 8px; padding: 14px; text-align: center; color: #B91C1C; font-weight: 700;">
          ⚠️ This grievance has been reviewed and closed / marked as not feasible by the Municipal Authority.
        </div>
      `;
    }

    const stepsHtml = stages.map((st, i) => {
      let stateClass = '';
      let icon = i + 1;
      if (i < currentIndex) {
        stateClass = 'completed';
        icon = '✓';
      } else if (i === currentIndex) {
        stateClass = 'active';
      }

      return `
        <div class="step-item ${stateClass}">
          <div class="step-circle">${icon}</div>
          <div class="step-title">${st.label}</div>
        </div>
      `;
    }).join('');

    return `
      <div class="stepper">
        <div class="stepper-progress-bar" style="width: ${progressWidth};"></div>
        ${stepsHtml}
      </div>
    `;
  },

  buildFeedbackSection(g) {
    if (g.feedback) {
      return `
        <div class="feedback-box" style="background: #ECFDF5; border-color: #A7F3D0;">
          <h4 style="color: #065F46; font-size: 1rem; font-weight: 700; margin-bottom: 4px;">
            ⭐ Citizen Feedback Submitted
          </h4>
          <div style="font-size: 1.25rem; color: #F59E0B; margin: 4px 0;">
            ${'★'.repeat(g.feedback.rating)}${'☆'.repeat(5 - g.feedback.rating)} (${g.feedback.rating}/5)
          </div>
          ${g.feedback.comment ? `<p style="color: #334155; font-size: 0.9rem; font-style: italic;">"${g.feedback.comment}"</p>` : ''}
          <span style="font-size: 0.75rem; color: #64748B;">Recorded on ${new Date(g.feedback.submittedAt).toLocaleDateString('en-IN')}</span>
        </div>
      `;
    }

    if (g.status === 'Resolved') {
      return `
        <div class="feedback-box" id="feedbackFormBox_${g.id}">
          <h4 style="color: #0A3981; font-size: 1rem; font-weight: 700; margin-bottom: 4px;">
            ⭐ How satisfied are you with the resolution of this complaint?
          </h4>
          <p style="color: #64748B; font-size: 0.85rem;">Your feedback helps Solapur Municipal Corporation improve public service delivery.</p>
          
          <div class="rating-stars" id="starContainer_${g.id}">
            <span onclick="trackingHandler.selectRating('${g.id}', 1)">★</span>
            <span onclick="trackingHandler.selectRating('${g.id}', 2)">★</span>
            <span onclick="trackingHandler.selectRating('${g.id}', 3)">★</span>
            <span onclick="trackingHandler.selectRating('${g.id}', 4)">★</span>
            <span onclick="trackingHandler.selectRating('${g.id}', 5)" class="active">★</span>
          </div>
          <input type="hidden" id="selectedRating_${g.id}" value="5">

          <div style="margin-bottom: 12px;">
            <input type="text" id="feedbackComment_${g.id}" class="form-input" placeholder="Add optional comments or remarks for the municipal team...">
          </div>

          <button class="btn btn-primary btn-sm" onclick="trackingHandler.submitFeedback('${g.id}')">
            Submit Feedback
          </button>
        </div>
      `;
    }

    return '';
  },

  selectRating(grievanceId, rating) {
    const input = document.getElementById(`selectedRating_${grievanceId}`);
    if (input) input.value = rating;

    const container = document.getElementById(`starContainer_${grievanceId}`);
    if (!container) return;

    const stars = container.querySelectorAll('span');
    stars.forEach((s, idx) => {
      if (idx < rating) {
        s.classList.add('active');
      } else {
        s.classList.remove('active');
      }
    });
  },

  async submitFeedback(grievanceId) {
    const ratingInput = document.getElementById(`selectedRating_${grievanceId}`);
    const commentInput = document.getElementById(`feedbackComment_${grievanceId}`);

    const rating = ratingInput ? ratingInput.value : 5;
    const comment = commentInput ? commentInput.value.trim() : '';

    try {
      const res = await api.submitFeedback(grievanceId, { rating, comment });
      if (res && res.success) {
        app.showToast('Thank you! Your feedback has been recorded by Solapur Municipal Corporation.', 'success');
        const box = document.getElementById(`feedbackFormBox_${grievanceId}`);
        if (box) {
          box.innerHTML = `
            <div style="color: #065F46; font-weight: 700;">
              ✅ Thank you for rating the municipal team! (${rating}/5 Stars)
            </div>
          `;
        }
        app.loadStats();
      }
    } catch (e) {
      app.showToast(e.message || 'Error submitting feedback', 'error');
    }
  }
};
