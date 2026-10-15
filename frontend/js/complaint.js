// Citizen Grievance Filing Logic with Geotagging and Authorization
const complaintHandler = {
  currentPhotoBase64: '',
  currentLocation: null,

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

  // ---------------- Geotagging Feature ----------------
  captureLocation() {
    const statusEl = document.getElementById('geoStatusText');
    const displayBox = document.getElementById('geoPreviewBox');
    const coordsDisplay = document.getElementById('geoCoordsDisplay');
    const mapLink = document.getElementById('geoMapLink');
    const btn = document.getElementById('btnCaptureLocation');

    if (!navigator.geolocation) {
      app.showToast('Geolocation is not supported by your browser.', 'error');
      this.setDefaultSolapurCoordinates();
      return;
    }

    if (btn) btn.disabled = true;
    if (statusEl) {
      statusEl.style.display = 'block';
      statusEl.innerHTML = '🛰️ Connecting to GPS satellites & acquiring live coordinates...';
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude.toFixed(6);
        const lng = position.coords.longitude.toFixed(6);
        const acc = Math.round(position.coords.accuracy || 15);

        this.currentLocation = {
          latitude: parseFloat(lat),
          longitude: parseFloat(lng),
          accuracy: acc,
          geoAddress: `GPS Fixed (±${acc}m accuracy)`
        };

        if (statusEl) {
          statusEl.innerHTML = '✅ <strong style="color:#059669;">GPS Lock Acquired Successfully!</strong>';
        }
        if (coordsDisplay) {
          coordsDisplay.textContent = `📍 ${lat}° N, ${lng}° E (Accuracy: ±${acc}m)`;
        }
        if (mapLink) {
          mapLink.href = `https://www.google.com/maps?q=${lat},${lng}`;
          mapLink.style.display = 'inline-flex';
        }
        if (displayBox) {
          displayBox.style.display = 'block';
        }
        if (btn) {
          btn.disabled = false;
          btn.innerHTML = '🔄 Re-Capture GPS Location';
        }

        app.showToast(`Geo-tag captured: ${lat}, ${lng}`, 'success');
      },
      (error) => {
        console.warn('Geolocation error:', error);
        if (btn) btn.disabled = false;
        
        let msg = 'Unable to retrieve location.';
        if (error.code === 1) msg = 'Location access was denied. Setting Solapur Municipal Center as reference.';
        else if (error.code === 2) msg = 'Position unavailable. Setting Solapur reference point.';
        else if (error.code === 3) msg = 'GPS timeout. Setting Solapur reference point.';

        app.showToast(msg, 'info');
        this.setDefaultSolapurCoordinates();
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  },

  setDefaultSolapurCoordinates() {
    // Solapur Municipal Corporation HQ coordinates (17.6599° N, 75.9064° E)
    const lat = 17.659918;
    const lng = 75.906388;
    this.currentLocation = {
      latitude: lat,
      longitude: lng,
      accuracy: 50,
      geoAddress: 'Solapur City Reference Coordinates'
    };

    const statusEl = document.getElementById('geoStatusText');
    const displayBox = document.getElementById('geoPreviewBox');
    const coordsDisplay = document.getElementById('geoCoordsDisplay');
    const mapLink = document.getElementById('geoMapLink');

    if (statusEl) {
      statusEl.style.display = 'block';
      statusEl.innerHTML = '📍 <strong>Solapur Municipal Center Coordinates Applied</strong>';
    }
    if (coordsDisplay) {
      coordsDisplay.textContent = `📍 ${lat}° N, ${lng}° E (Solapur Central Reference)`;
    }
    if (mapLink) {
      mapLink.href = `https://www.google.com/maps?q=${lat},${lng}`;
      mapLink.style.display = 'inline-flex';
    }
    if (displayBox) {
      displayBox.style.display = 'block';
    }
  },

  clearLocation() {
    this.currentLocation = null;
    const displayBox = document.getElementById('geoPreviewBox');
    const statusEl = document.getElementById('geoStatusText');
    const btn = document.getElementById('btnCaptureLocation');

    if (displayBox) displayBox.style.display = 'none';
    if (statusEl) statusEl.style.display = 'none';
    if (btn) btn.innerHTML = '📍 Auto-Detect My Live GPS Location (Geo-tag Incident)';
    app.showToast('Geo-tag removed from complaint.', 'info');
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
    this.clearLocation();
    this.selectDepartment('');
    this.setPriority('Normal');
    const form = document.getElementById('grievanceForm');
    if (form) form.reset();
    const countEl = document.getElementById('charCount');
    if (countEl) countEl.textContent = '0';

    if (citizenAuth.currentCitizen) {
      citizenAuth.autoFillComplaintForm(citizenAuth.currentCitizen);
    }
  },

  async handleSubmit(event) {
    event.preventDefault();

    // Check citizen authorization requirement
    if (!citizenAuth.currentCitizen) {
      app.showToast('Citizen Registration Required: Please Log In or Register first.', 'error');
      citizenAuth.openAuthModal('login');
      return;
    }

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
        citizenId: citizenAuth.currentCitizen ? citizenAuth.currentCitizen.id : null,
        citizenName,
        mobileNumber,
        email,
        department,
        ward,
        address,
        priority,
        title,
        description,
        photoUrl: this.currentPhotoBase64,
        latitude: this.currentLocation ? this.currentLocation.latitude : null,
        longitude: this.currentLocation ? this.currentLocation.longitude : null,
        geoAddress: this.currentLocation ? this.currentLocation.geoAddress : ''
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
        const rGeo = document.getElementById('receiptGeoVal');

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
        if (rGeo) {
          if (item.latitude && item.longitude) {
            rGeo.innerHTML = `📍 ${item.latitude}, ${item.longitude} (<a href="https://www.google.com/maps?q=${item.latitude},${item.longitude}" target="_blank" style="color:#2563EB;">View Map</a>)`;
          } else {
            rGeo.textContent = 'Not geo-tagged';
          }
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
