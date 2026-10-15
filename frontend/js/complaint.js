// Citizen Grievance Filing Logic
const complaintHandler = {
  currentPhotoBase64: '',

  selectDepartment(deptName) {
    const hiddenInput = document.getElementById('selectedDepartment');
    if (hiddenInput) hiddenInput.value = deptName;

    const cards = document.querySelectorAll('#formCategoryGrid .category-card-option');
    cards.forEach(card => {
      if (card.dataset.dept === deptName) {
        card.classList.add('selected');
      } else {
        card.classList.remove('selected');
      }
    });
  },

  setPriority(level) {
    const hidden = document.getElementById('selectedPriority');
    if (hidden) hidden.value = level;

    const chips = document.querySelectorAll('.priority-chip');
    chips.forEach(c => {
      if (c.dataset.priority === level) {
        c.classList.add('selected');
      } else {
        c.classList.remove('selected');
      }
    });
  },

  updateCharCount(textarea) {
    const countEl = document.getElementById('charCount');
    if (countEl) {
      countEl.textContent = textarea.value.length;
    }
  },

  handlePhotoUpload(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      app.showToast('Please upload an image file (JPG, PNG).', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      app.showToast('Image size exceeds 5MB limit. Please choose a smaller photo.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      this.currentPhotoBase64 = e.target.result;
      const previewCont = document.getElementById('photoPreviewContainer');
      const previewImg = document.getElementById('photoPreviewImg');
      if (previewCont && previewImg) {
        previewImg.src = this.currentPhotoBase64;
        previewCont.style.display = 'inline-block';
      }
      app.showToast('Photo evidence attached successfully.', 'success');
    };
    reader.readAsDataURL(file);
  },

  removePhoto() {
    this.currentPhotoBase64 = '';
    const fileInput = document.getElementById('complaintPhoto');
    if (fileInput) fileInput.value = '';
    const previewCont = document.getElementById('photoPreviewContainer');
    if (previewCont) previewCont.style.display = 'none';
  },

  resetForm() {
    this.removePhoto();
    this.selectDepartment('');
    this.setPriority('Normal');
    const form = document.getElementById('grievanceForm');
    if (form) form.reset();
    const countEl = document.getElementById('charCount');
    if (countEl) countEl.textContent = '0';
  },

  async handleSubmit(event) {
    event.preventDefault();

    const citizenName = document.getElementById('citizenName').value.trim();
    const mobileNumber = document.getElementById('mobileNumber').value.trim();
    const email = document.getElementById('email').value.trim();
    const department = document.getElementById('selectedDepartment').value;
    const ward = document.getElementById('wardSelect').value;
    const address = document.getElementById('address').value.trim();
    const priority = document.getElementById('selectedPriority').value || 'Normal';
    const title = document.getElementById('complaintTitle').value.trim();
    const description = document.getElementById('complaintDescription').value.trim();

    // Client-side validation checks
    if (!citizenName) {
      app.showToast('Please enter your full name.', 'error');
      return;
    }

    const mobileRegex = /^[6-9]\d{9}$/;
    if (!mobileRegex.test(mobileNumber)) {
      app.showToast('Please enter a valid 10-digit Indian mobile number.', 'error');
      return;
    }

    if (!department) {
      app.showToast('Please select a grievance department from the category cards.', 'error');
      return;
    }

    if (!ward) {
      app.showToast('Please select your Solapur municipal ward / prabhag.', 'error');
      return;
    }

    if (!address) {
      app.showToast('Please enter your street address or landmark in Solapur.', 'error');
      return;
    }

    if (title.length < 5) {
      app.showToast('Complaint subject must be at least 5 characters.', 'error');
      return;
    }

    if (description.length < 15) {
      app.showToast('Please describe the issue in detail (at least 15 characters).', 'error');
      return;
    }

    const submitBtn = document.getElementById('btnSubmitGrievance');
    const originalText = submitBtn ? submitBtn.innerHTML : 'Submit Grievance';

    try {
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '⏳ Submitting Grievance...';
      }

      const payload = {
        citizenName,
        mobileNumber,
        email,
        department,
        ward,
        address,
        priority,
        title,
        description,
        photoUrl: this.currentPhotoBase64
      };

      const res = await api.createGrievance(payload);

      if (res && res.success && res.data) {
        const item = res.data;
        app.lastSubmittedToken = item.trackingToken;

        // Populate receipt modal
        const tokenVal = document.getElementById('receiptTokenVal');
        const rName = document.getElementById('receiptCitizenName');
        const rDept = document.getElementById('receiptDept');
        const rWard = document.getElementById('receiptWard');
        const rDate = document.getElementById('receiptDate');

        if (tokenVal) tokenVal.textContent = item.trackingToken;
        if (rName) rName.textContent = item.citizenName;
        if (rDept) rDept.textContent = item.department;
        if (rWard) rWard.textContent = item.ward;
        if (rDate) {
          const d = new Date(item.createdAt);
          rDate.textContent = d.toLocaleString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
          });
        }

        // Reset form and show modal
        this.resetForm();
        app.openModal('receiptModal');
        app.showToast('Grievance lodged successfully with Solapur Municipal Corporation!', 'success');
        app.loadStats();
      }
    } catch (error) {
      app.showToast(error.message || 'Error lodging grievance. Please try again.', 'error');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }
    }
  }
};
