/**
 * Admin Dashboard Application
 * Professional-grade student management system with AI-powered attendance
 */

class AdminDashboard {
  constructor() {
    this.currentSection = 'dashboard';
    this.students = [];
    this.attendance = [];
    this.assignments = [];
    this.classwork = [];
    this.activities = [];
    this.faceApiLoaded = false;
    this.videoStream = null;
    this.captureStream = null;
    this.currentStudentPhoto = null;
    this.currentStudentDescriptor = null;
    
    this.init();
  }

  async init() {
    this.loadData();
    this.setupEventListeners();
    this.updateDashboard();
    this.setTodayDate();
    
    // Load face-api models
    await this.loadFaceApiModels();
  }

  async loadFaceApiModels() {
    console.log('🤖 Loading AI face detection models...');
    try {
      const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';
      
      console.log('Loading TinyFaceDetector...');
      await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
      
      console.log('Loading FaceLandmark68Net...');
      await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
      
      console.log('Loading FaceRecognitionNet...');
      await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
      
      this.faceApiLoaded = true;
      console.log('✅ All AI models loaded successfully');
      this.showToast('AI Face Recognition Ready', 'success');
    } catch (error) {
      console.error('❌ Error loading face-api models:', error);
      this.showToast('Face recognition unavailable - using manual mode', 'error');
      this.faceApiLoaded = false;
    }
  }

  setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const section = item.dataset.section;
        this.switchSection(section);
      });
    });

    // Mobile menu
    document.getElementById('mobileMenuToggle')?.addEventListener('click', () => {
      document.getElementById('sidebar').classList.toggle('active');
    });

    // Quick actions
    document.querySelectorAll('.action-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        this.handleQuickAction(action);
      });
    });

    // Modal controls
    document.querySelectorAll('[data-modal]').forEach(btn => {
      btn.addEventListener('click', () => {
        const modalId = btn.dataset.modal;
        this.closeModal(modalId);
      });
    });

    // Attendance
    document.getElementById('startAttendanceBtn')?.addEventListener('click', () => {
      this.startAttendanceCamera();
    });

    document.getElementById('stopCameraBtn')?.addEventListener('click', () => {
      this.stopCamera();
    });

    document.getElementById('attendanceDate')?.addEventListener('change', (e) => {
      this.loadAttendanceRecords(e.target.value);
    });

    // Students
    document.getElementById('addStudentBtn')?.addEventListener('click', () => {
      this.openModal('addStudentModal');
    });

    document.getElementById('searchStudents')?.addEventListener('input', (e) => {
      this.searchStudents(e.target.value);
    });

    document.getElementById('filterClass')?.addEventListener('change', (e) => {
      this.filterStudentsByClass(e.target.value);
    });

    // Student photo capture
    document.getElementById('capturePhotoBtn')?.addEventListener('click', () => {
      this.startPhotoCapture();
    });

    document.getElementById('uploadPhotoBtn')?.addEventListener('click', () => {
      document.getElementById('uploadPhoto').click();
    });

    document.getElementById('uploadPhoto')?.addEventListener('change', (e) => {
      this.handlePhotoUpload(e);
    });

    // Forms
    document.getElementById('addStudentForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.addStudent();
    });

    document.getElementById('createAssignmentBtn')?.addEventListener('click', () => {
      this.openModal('createAssignmentModal');
    });

    document.getElementById('createAssignmentForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.createAssignment();
    });

    document.getElementById('createClassworkBtn')?.addEventListener('click', () => {
      this.openModal('createClassworkModal');
    });

    document.getElementById('createClassworkForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.createClasswork();
    });

    // Assignment tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.filterAssignments(btn.dataset.tab);
      });
    });
  }

  switchSection(section) {
    // Update navigation
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.remove('active');
    });
    document.querySelector(`[data-section="${section}"]`)?.classList.add('active');

    // Update content
    document.querySelectorAll('.content-section').forEach(sec => {
      sec.classList.remove('active');
    });
    document.getElementById(`${section}Section`)?.classList.add('active');

    // Update page title
    const titles = {
      dashboard: 'Dashboard',
      attendance: 'AI Attendance',
      students: 'Students',
      assignments: 'Assignments',
      classwork: 'Classwork'
    };
    document.getElementById('pageTitle').textContent = titles[section] || 'Dashboard';

    this.currentSection = section;
    this.loadSectionData(section);
  }

  loadSectionData(section) {
    switch(section) {
      case 'attendance':
        this.loadAttendanceRecords();
        break;
      case 'students':
        this.renderStudents();
        break;
      case 'assignments':
        this.renderAssignments();
        break;
      case 'classwork':
        this.renderClasswork();
        break;
    }
  }

  handleQuickAction(action) {
    switch(action) {
      case 'take-attendance':
        this.switchSection('attendance');
        setTimeout(() => this.startAttendanceCamera(), 300);
        break;
      case 'add-student':
        this.switchSection('students');
        setTimeout(() => this.openModal('addStudentModal'), 300);
        break;
      case 'create-assignment':
        this.switchSection('assignments');
        setTimeout(() => this.openModal('createAssignmentModal'), 300);
        break;
      case 'create-classwork':
        this.switchSection('classwork');
        setTimeout(() => this.openModal('createClassworkModal'), 300);
        break;
    }
  }

  // Attendance Functions
  async startAttendanceCamera() {
    console.log('🎥 Starting camera access...');
    
    // Check browser compatibility
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      this.showCameraError(
        'Camera Not Supported',
        'Your browser does not support camera access. Please use a modern browser like Chrome, Firefox, or Edge.',
        'browser-not-supported'
      );
      return;
    }

    // Check if HTTPS or localhost
    const isSecure = window.location.protocol === 'https:' || 
                     window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1';
    
    if (!isSecure) {
      console.warn('⚠️ Not on HTTPS - camera may not work');
    }

    // Show loading state
    this.showCameraStatus('Requesting camera permission...', 'info');

    try {
      const video = document.getElementById('video');
      
      // Request camera with detailed constraints
      const constraints = {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: false
      };
      
      console.log('📷 Requesting camera with constraints:', constraints);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      console.log('✅ Camera access granted');
      video.srcObject = stream;
      this.videoStream = stream;
      
      // Wait for video to be ready
      await new Promise((resolve) => {
        video.onloadedmetadata = () => {
          video.play();
          resolve();
        };
      });
      
      document.getElementById('cameraSection').style.display = 'block';
      this.showCameraStatus('Camera active - Detecting faces...', 'success');
      
      // Start face detection if models are loaded
      if (this.faceApiLoaded) {
        this.detectFaces(video);
        this.showToast('AI Face Detection Active', 'success');
      } else {
        this.showToast('Camera active - Face detection loading...', 'info');
        // Wait for models and start detection
        this.waitForModelsAndDetect(video);
      }
      
      console.log('🎉 Camera started successfully');
    } catch (error) {
      console.error('❌ Camera error:', error);
      this.handleCameraError(error);
    }
  }

  waitForModelsAndDetect(video) {
    const checkInterval = setInterval(() => {
      if (this.faceApiLoaded) {
        clearInterval(checkInterval);
        this.detectFaces(video);
        this.showToast('Face detection now active', 'success');
      }
    }, 500);
    
    // Stop checking after 30 seconds
    setTimeout(() => clearInterval(checkInterval), 30000);
  }

  handleCameraError(error) {
    let title = 'Camera Access Failed';
    let message = '';
    let errorType = 'unknown';

    switch(error.name) {
      case 'NotAllowedError':
      case 'PermissionDeniedError':
        errorType = 'permission-denied';
        title = 'Camera Permission Denied';
        message = 'Please allow camera access to use AI attendance. Click the camera icon in your browser\'s address bar and allow camera access.';
        break;
      
      case 'NotFoundError':
      case 'DevicesNotFoundError':
        errorType = 'no-camera';
        title = 'No Camera Found';
        message = 'No camera detected on your device. Please connect a camera or use manual attendance entry.';
        break;
      
      case 'NotReadableError':
      case 'TrackStartError':
        errorType = 'camera-in-use';
        title = 'Camera In Use';
        message = 'Camera is already in use by another application. Please close other apps using the camera and try again.';
        break;
      
      case 'OverconstrainedError':
      case 'ConstraintNotSatisfiedError':
        errorType = 'constraints-error';
        title = 'Camera Configuration Error';
        message = 'Your camera doesn\'t support the required settings. Trying with basic settings...';
        this.startAttendanceWithBasicCamera();
        return;
      
      case 'TypeError':
        errorType = 'type-error';
        title = 'Browser Not Supported';
        message = 'Your browser doesn\'t support camera access. Please use Chrome, Firefox, Edge, or Safari.';
        break;
      
      default:
        message = `Camera error: ${error.message || 'Unknown error'}. Please try manual attendance entry.`;
    }

    this.showCameraError(title, message, errorType);
  }

  async startAttendanceWithBasicCamera() {
    try {
      console.log('🔄 Retrying with basic camera settings...');
      const video = document.getElementById('video');
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      
      video.srcObject = stream;
      this.videoStream = stream;
      
      await new Promise((resolve) => {
        video.onloadedmetadata = () => {
          video.play();
          resolve();
        };
      });
      
      document.getElementById('cameraSection').style.display = 'block';
      this.showCameraStatus('Camera active (basic mode)', 'success');
      
      if (this.faceApiLoaded) {
        this.detectFaces(video);
      }
      
      this.showToast('Camera started with basic settings', 'success');
    } catch (error) {
      console.error('❌ Basic camera also failed:', error);
      this.handleCameraError(error);
    }
  }

  showCameraError(title, message, errorType) {
    const cameraSection = document.getElementById('cameraSection');
    cameraSection.style.display = 'block';
    cameraSection.innerHTML = `
      <div class="camera-error-state">
        <div class="error-icon">
          <i class="fas fa-exclamation-triangle"></i>
        </div>
        <h3>${title}</h3>
        <p>${message}</p>
        <div class="error-actions">
          <button class="btn btn--primary" onclick="dashboard.retryCamera()">
            <i class="fas fa-redo"></i> Retry Camera
          </button>
          <button class="btn btn--secondary" onclick="dashboard.showManualAttendance()">
            <i class="fas fa-keyboard"></i> Manual Entry
          </button>
        </div>
        <div class="error-help">
          <details>
            <summary>Troubleshooting Tips</summary>
            <ul>
              <li>Make sure you're on HTTPS or localhost</li>
              <li>Check if camera is connected and working</li>
              <li>Close other apps using the camera</li>
              <li>Click the camera icon in address bar to manage permissions</li>
              <li>Try refreshing the page</li>
              <li>Check browser console for detailed errors</li>
            </ul>
          </details>
        </div>
      </div>
    `;
    
    this.showToast(title, 'error');
    console.log(`❌ Camera Error [${errorType}]:`, message);
  }

  showCameraStatus(message, type) {
    const statusEl = document.getElementById('detectionStatus');
    if (statusEl) {
      const icons = {
        info: 'hourglass-half',
        success: 'check-circle',
        error: 'exclamation-circle'
      };
      statusEl.innerHTML = `<i class="fas fa-${icons[type]}"></i> ${message}`;
      statusEl.style.background = type === 'success' ? 'rgba(33, 128, 141, 0.9)' : 'rgba(0, 0, 0, 0.7)';
    }
  }

  retryCamera() {
    console.log('🔄 Retrying camera access...');
    const cameraSection = document.getElementById('cameraSection');
    cameraSection.innerHTML = `
      <div class="camera-box">
        <video id="video" autoplay muted playsinline></video>
        <canvas id="canvas" style="display: none;"></canvas>
        <div class="camera-overlay">
          <div class="face-indicator" id="faceIndicator"></div>
          <div class="detection-status" id="detectionStatus">
            <i class="fas fa-search"></i> Searching for faces...
          </div>
        </div>
      </div>
      <div class="camera-controls">
        <button class="btn btn--secondary" id="stopCameraBtn">
          <i class="fas fa-times"></i> Stop Camera
        </button>
      </div>
    `;
    
    // Reattach event listener
    document.getElementById('stopCameraBtn').addEventListener('click', () => {
      this.stopCamera();
    });
    
    this.startAttendanceCamera();
  }

  showManualAttendance() {
    const cameraSection = document.getElementById('cameraSection');
    cameraSection.style.display = 'block';
    cameraSection.innerHTML = `
      <div class="manual-attendance-form">
        <h3><i class="fas fa-keyboard"></i> Manual Attendance Entry</h3>
        <form id="manualAttendanceForm">
          <div class="form-group">
            <label class="form-label">Select Student *</label>
            <select class="form-control" id="manualStudentSelect" required>
              <option value="">Choose a student...</option>
              ${this.students.map(s => `<option value="${s.id}">${s.name} (${s.rollNumber})</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Status *</label>
            <select class="form-control" id="manualStatus" required>
              <option value="present">Present</option>
              <option value="absent">Absent</option>
            </select>
          </div>
          <div class="modal-footer" style="padding: 0; margin-top: 20px;">
            <button type="button" class="btn btn--secondary" onclick="dashboard.stopCamera()">
              Cancel
            </button>
            <button type="submit" class="btn btn--primary">
              <i class="fas fa-check"></i> Mark Attendance
            </button>
          </div>
        </form>
      </div>
    `;
    
    document.getElementById('manualAttendanceForm').addEventListener('submit', (e) => {
      e.preventDefault();
      this.submitManualAttendance();
    });
  }

  submitManualAttendance() {
    const studentId = document.getElementById('manualStudentSelect').value;
    const status = document.getElementById('manualStatus').value;
    
    const student = this.students.find(s => s.id === studentId);
    if (!student) {
      this.showToast('Please select a student', 'error');
      return;
    }
    
    if (status === 'present') {
      this.markAttendance(student);
    } else {
      // Mark as absent
      const now = new Date();
      const attendance = {
        id: Date.now().toString(),
        studentId: student.id,
        studentName: student.name,
        rollNumber: student.rollNumber,
        date: now.toISOString().split('T')[0],
        time: now.toTimeString().split(' ')[0],
        status: 'absent',
        method: 'manual'
      };
      this.attendance.push(attendance);
      this.saveData();
      this.loadAttendanceRecords();
      this.updateDashboard();
      this.showToast(`${student.name} marked absent`, 'info');
    }
    
    // Reset form
    document.getElementById('manualAttendanceForm').reset();
  }

  async detectFaces(video) {
    if (!this.videoStream) return;

    const statusEl = document.getElementById('detectionStatus');
    const indicator = document.getElementById('faceIndicator');

    const detectInterval = setInterval(async () => {
      if (!this.videoStream) {
        clearInterval(detectInterval);
        return;
      }

      try {
        const detections = await faceapi
          .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceDescriptors();

        if (detections.length > 0) {
          const detection = detections[0];
          const box = detection.detection.box;
          
          // Update face indicator position
          indicator.style.left = `${box.x}px`;
          indicator.style.top = `${box.y}px`;
          indicator.style.width = `${box.width}px`;
          indicator.style.height = `${box.height}px`;
          indicator.style.display = 'block';

          statusEl.innerHTML = '<i class="fas fa-check-circle"></i> Face Detected';
          statusEl.style.background = 'rgba(33, 128, 141, 0.9)';

          // Try to match with existing students
          await this.matchFace(detection.descriptor);
        } else {
          indicator.style.display = 'none';
          statusEl.innerHTML = '<i class="fas fa-search"></i> Searching for faces...';
          statusEl.style.background = 'rgba(0, 0, 0, 0.7)';
        }
      } catch (error) {
        console.error('Face detection error:', error);
      }
    }, 500);
  }

  async matchFace(descriptor) {
    const threshold = 0.5; // Lower is more strict
    let bestMatch = null;
    let bestDistance = 1;

    for (const student of this.students) {
      if (student.faceDescriptor) {
        const distance = faceapi.euclideanDistance(descriptor, student.faceDescriptor);
        if (distance < threshold && distance < bestDistance) {
          bestDistance = distance;
          bestMatch = student;
        }
      }
    }

    if (bestMatch) {
      // Check if already marked present today
      const today = new Date().toISOString().split('T')[0];
      const alreadyMarked = this.attendance.some(a => 
        a.studentId === bestMatch.id && a.date === today
      );

      if (!alreadyMarked) {
        this.markAttendance(bestMatch);
      }
    }
  }

  markAttendance(student, method = 'ai') {
    const now = new Date();
    const attendance = {
      id: Date.now().toString(),
      studentId: student.id,
      studentName: student.name,
      rollNumber: student.rollNumber,
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().split(' ')[0],
      status: 'present',
      method: method
    };

    this.attendance.push(attendance);
    this.saveData();
    this.loadAttendanceRecords();
    this.updateDashboard();
    
    const methodLabel = method === 'ai' ? '(AI Detected)' : '(Manual)';
    this.addActivity(`${student.name} marked present ${methodLabel}`, 'check-circle');
    this.showToast(`Attendance marked for ${student.name}`, 'success');
  }

  stopCamera() {
    if (this.videoStream) {
      this.videoStream.getTracks().forEach(track => track.stop());
      this.videoStream = null;
      document.getElementById('cameraSection').style.display = 'none';
      document.getElementById('faceIndicator').style.display = 'none';
    }
  }

  loadAttendanceRecords(date = null) {
    const targetDate = date || new Date().toISOString().split('T')[0];
    const records = this.attendance.filter(a => a.date === targetDate);
    
    const tbody = document.getElementById('attendanceTableBody');
    
    if (records.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" class="empty-state">No attendance records for this date</td></tr>';
      return;
    }

    tbody.innerHTML = records.map(record => `
      <tr>
        <td>${record.studentName}</td>
        <td>${record.rollNumber}</td>
        <td>${record.time}</td>
        <td><span class="status-badge status-present">Present</span></td>
      </tr>
    `).join('');
  }

  // Student Functions
  async startPhotoCapture() {
    try {
      const video = document.getElementById('captureVideo');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' } 
      });
      
      video.srcObject = stream;
      this.captureStream = stream;
      video.style.display = 'block';
      video.style.width = '100%';
      video.style.maxWidth = '400px';
      video.style.borderRadius = '8px';
      video.style.marginTop = '12px';
      
      // Add capture button
      const captureBtn = document.createElement('button');
      captureBtn.type = 'button';
      captureBtn.className = 'btn btn--primary';
      captureBtn.innerHTML = '<i class="fas fa-camera"></i> Capture';
      captureBtn.style.marginTop = '12px';
      captureBtn.onclick = () => this.capturePhoto();
      video.parentElement.appendChild(captureBtn);
      
    } catch (error) {
      this.showToast('Failed to access camera', 'error');
    }
  }

  async capturePhoto() {
    const video = document.getElementById('captureVideo');
    const canvas = document.getElementById('captureCanvas');
    const context = canvas.getContext('2d');
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);
    
    const photoData = canvas.toDataURL('image/jpeg');
    this.currentStudentPhoto = photoData;
    
    // Extract face descriptor if face-api is loaded
    if (this.faceApiLoaded) {
      try {
        const detections = await faceapi
          .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceDescriptor();
        
        if (detections) {
          this.currentStudentDescriptor = Array.from(detections.descriptor);
          this.showToast('Face captured successfully', 'success');
        } else {
          this.showToast('No face detected - photo saved anyway', 'info');
        }
      } catch (error) {
        console.error('Face extraction error:', error);
      }
    }
    
    // Display preview
    const preview = document.getElementById('studentPhotoPreview');
    preview.innerHTML = `<img src="${photoData}" alt="Student Photo">`;
    
    // Stop camera
    if (this.captureStream) {
      this.captureStream.getTracks().forEach(track => track.stop());
      video.style.display = 'none';
      document.querySelector('.btn.btn--primary[onclick]')?.remove();
    }
  }

  handlePhotoUpload(e) {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        this.currentStudentPhoto = event.target.result;
        const preview = document.getElementById('studentPhotoPreview');
        preview.innerHTML = `<img src="${event.target.result}" alt="Student Photo">`;
        this.showToast('Photo uploaded successfully', 'success');
      };
      reader.readAsDataURL(file);
    }
  }

  addStudent() {
    const student = {
      id: Date.now().toString(),
      name: document.getElementById('studentName').value,
      rollNumber: document.getElementById('studentRoll').value,
      email: document.getElementById('studentEmail').value,
      phone: document.getElementById('studentPhone').value,
      class: document.getElementById('studentClass').value,
      photo: this.currentStudentPhoto,
      faceDescriptor: this.currentStudentDescriptor,
      createdAt: new Date().toISOString()
    };

    this.students.push(student);
    this.saveData();
    this.renderStudents();
    this.updateDashboard();
    this.closeModal('addStudentModal');
    this.resetStudentForm();
    
    this.addActivity(`New student added: ${student.name}`, 'user-plus');
    this.showToast('Student added successfully', 'success');
  }

  resetStudentForm() {
    document.getElementById('addStudentForm').reset();
    document.getElementById('studentPhotoPreview').innerHTML = '<i class="fas fa-user"></i>';
    this.currentStudentPhoto = null;
    this.currentStudentDescriptor = null;
  }

  renderStudents(filteredStudents = null) {
    const students = filteredStudents || this.students;
    const tbody = document.getElementById('studentsTableBody');
    
    if (students.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No students found</td></tr>';
      return;
    }

    tbody.innerHTML = students.map(student => `
      <tr>
        <td>
          ${student.photo ? 
            `<img src="${student.photo}" alt="${student.name}" class="student-photo">` :
            '<div class="student-photo" style="background: var(--color-secondary); display: flex; align-items: center; justify-content: center;"><i class="fas fa-user"></i></div>'
          }
        </td>
        <td>${student.name}</td>
        <td>${student.rollNumber}</td>
        <td>${student.email}</td>
        <td>${student.class}</td>
        <td class="table-actions">
          <button class="icon-btn" onclick="dashboard.viewStudent('${student.id}')" title="View">
            <i class="fas fa-eye"></i>
          </button>
          <button class="icon-btn" onclick="dashboard.deleteStudent('${student.id}')" title="Delete">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      </tr>
    `).join('');
  }

  searchStudents(query) {
    const filtered = this.students.filter(s => 
      s.name.toLowerCase().includes(query.toLowerCase()) ||
      s.rollNumber.toLowerCase().includes(query.toLowerCase()) ||
      s.email.toLowerCase().includes(query.toLowerCase())
    );
    this.renderStudents(filtered);
  }

  filterStudentsByClass(className) {
    if (!className) {
      this.renderStudents();
      return;
    }
    const filtered = this.students.filter(s => s.class === className);
    this.renderStudents(filtered);
  }

  deleteStudent(id) {
    if (confirm('Are you sure you want to delete this student?')) {
      this.students = this.students.filter(s => s.id !== id);
      this.saveData();
      this.renderStudents();
      this.updateDashboard();
      this.showToast('Student deleted', 'success');
    }
  }

  viewStudent(id) {
    const student = this.students.find(s => s.id === id);
    if (student) {
      alert(`Student Details:\n\nName: ${student.name}\nRoll: ${student.rollNumber}\nEmail: ${student.email}\nClass: ${student.class}\nPhone: ${student.phone || 'N/A'}`);
    }
  }

  // Assignment Functions
  createAssignment() {
    const assignment = {
      id: Date.now().toString(),
      title: document.getElementById('assignmentTitle').value,
      description: document.getElementById('assignmentDescription').value,
      deadline: document.getElementById('assignmentDeadline').value,
      marks: parseInt(document.getElementById('assignmentMarks').value),
      priority: document.getElementById('assignmentPriority').value,
      class: document.getElementById('assignmentClass').value,
      submissions: [],
      createdAt: new Date().toISOString()
    };

    this.assignments.push(assignment);
    this.saveData();
    this.renderAssignments();
    this.updateDashboard();
    this.closeModal('createAssignmentModal');
    document.getElementById('createAssignmentForm').reset();
    
    this.addActivity(`New assignment created: ${assignment.title}`, 'plus-circle');
    this.showToast('Assignment created successfully', 'success');
  }

  renderAssignments(filter = 'all') {
    let assignments = [...this.assignments];
    
    if (filter === 'pending') {
      assignments = assignments.filter(a => a.submissions.length < this.students.filter(s => 
        a.class === 'all' || s.class === a.class
      ).length);
    } else if (filter === 'graded') {
      assignments = assignments.filter(a => a.submissions.some(sub => sub.graded));
    }

    const container = document.getElementById('assignmentsContent');
    
    if (assignments.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-clipboard-list"></i>
          <p>No assignments found</p>
        </div>
      `;
      return;
    }

    container.innerHTML = assignments.map(assignment => {
      const deadline = new Date(assignment.deadline);
      const students = this.students.filter(s => 
        assignment.class === 'all' || s.class === assignment.class
      );
      const submissionCount = assignment.submissions.length;
      
      return `
        <div class="assignment-card">
          <div class="assignment-header">
            <div>
              <div class="assignment-title">${assignment.title}</div>
              <div class="assignment-meta">
                <span><i class="fas fa-calendar"></i> ${deadline.toLocaleDateString()}</span>
                <span><i class="fas fa-users"></i> ${students.length} students</span>
                <span><i class="fas fa-check-circle"></i> ${submissionCount} submissions</span>
              </div>
            </div>
            <span class="priority-badge priority-${assignment.priority}">${assignment.priority}</span>
          </div>
          <p style="color: var(--color-text-secondary); margin: 12px 0;">${assignment.description}</p>
          <div style="display: flex; gap: 8px;">
            <button class="btn btn--secondary" onclick="dashboard.viewAssignment('${assignment.id}')">
              <i class="fas fa-eye"></i> View Details
            </button>
            <button class="btn btn--secondary" onclick="dashboard.deleteAssignment('${assignment.id}')">
              <i class="fas fa-trash"></i> Delete
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  filterAssignments(tab) {
    this.renderAssignments(tab);
  }

  viewAssignment(id) {
    const assignment = this.assignments.find(a => a.id === id);
    if (assignment) {
      const deadline = new Date(assignment.deadline);
      alert(`Assignment Details:\n\nTitle: ${assignment.title}\nDescription: ${assignment.description}\nDeadline: ${deadline.toLocaleString()}\nTotal Marks: ${assignment.marks}\nPriority: ${assignment.priority}\nClass: ${assignment.class}\nSubmissions: ${assignment.submissions.length}`);
    }
  }

  deleteAssignment(id) {
    if (confirm('Are you sure you want to delete this assignment?')) {
      this.assignments = this.assignments.filter(a => a.id !== id);
      this.saveData();
      this.renderAssignments();
      this.updateDashboard();
      this.showToast('Assignment deleted', 'success');
    }
  }

  // Classwork Functions
  createClasswork() {
    const classwork = {
      id: Date.now().toString(),
      title: document.getElementById('classworkTitle').value,
      content: document.getElementById('classworkContent').value,
      class: document.getElementById('classworkClass').value,
      deadline: document.getElementById('classworkDeadline').value,
      mandatory: document.getElementById('classworkMandatory').checked,
      completions: [],
      createdAt: new Date().toISOString()
    };

    this.classwork.push(classwork);
    this.saveData();
    this.renderClasswork();
    this.updateDashboard();
    this.closeModal('createClassworkModal');
    document.getElementById('createClassworkForm').reset();
    
    this.addActivity(`New classwork created: ${classwork.title}`, 'book');
    this.showToast('Classwork created successfully', 'success');
  }

  renderClasswork() {
    const container = document.getElementById('classworkContent');
    
    if (this.classwork.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-book"></i>
          <p>No classwork created yet</p>
        </div>
      `;
      return;
    }

    container.innerHTML = this.classwork.map(work => {
      const students = this.students.filter(s => 
        work.class === 'all' || s.class === work.class
      );
      const completionCount = work.completions.length;
      
      return `
        <div class="assignment-card">
          <div class="assignment-header">
            <div>
              <div class="assignment-title">${work.title}</div>
              <div class="assignment-meta">
                ${work.deadline ? `<span><i class="fas fa-calendar"></i> ${new Date(work.deadline).toLocaleDateString()}</span>` : ''}
                <span><i class="fas fa-users"></i> ${students.length} students</span>
                <span><i class="fas fa-check-circle"></i> ${completionCount} completed</span>
              </div>
            </div>
            ${work.mandatory ? '<span class="priority-badge priority-high">Mandatory</span>' : ''}
          </div>
          <p style="color: var(--color-text-secondary); margin: 12px 0;">${work.content}</p>
          <div style="display: flex; gap: 8px;">
            <button class="btn btn--secondary" onclick="dashboard.deleteClasswork('${work.id}')">
              <i class="fas fa-trash"></i> Delete
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  deleteClasswork(id) {
    if (confirm('Are you sure you want to delete this classwork?')) {
      this.classwork = this.classwork.filter(c => c.id !== id);
      this.saveData();
      this.renderClasswork();
      this.updateDashboard();
      this.showToast('Classwork deleted', 'success');
    }
  }

  // Dashboard Functions
  updateDashboard() {
    // Update stats
    document.getElementById('totalStudents').textContent = this.students.length;
    
    const today = new Date().toISOString().split('T')[0];
    const todayAttendance = this.attendance.filter(a => a.date === today);
    const attendancePercent = this.students.length > 0 
      ? Math.round((todayAttendance.length / this.students.length) * 100)
      : 0;
    document.getElementById('todayAttendance').textContent = `${attendancePercent}%`;
    
    const pendingReviews = this.assignments.reduce((sum, a) => sum + a.submissions.length, 0);
    document.getElementById('pendingAssignments').textContent = pendingReviews;
    
    document.getElementById('activeClasswork').textContent = this.classwork.length;
    
    // Update notifications
    document.getElementById('notificationCount').textContent = pendingReviews;
    
    // Update activity list
    this.renderActivities();
  }

  addActivity(message, icon) {
    const activity = {
      id: Date.now().toString(),
      message,
      icon,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    this.activities.unshift(activity);
    if (this.activities.length > 10) {
      this.activities = this.activities.slice(0, 10);
    }
    
    this.renderActivities();
  }

  renderActivities() {
    const container = document.getElementById('activityList');
    
    if (this.activities.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-inbox"></i>
          <p>No recent activity</p>
        </div>
      `;
      return;
    }

    container.innerHTML = this.activities.map(activity => `
      <div class="activity-item">
        <div class="activity-icon">
          <i class="fas fa-${activity.icon}"></i>
        </div>
        <div class="activity-details">
          <div class="activity-title">${activity.message}</div>
          <div class="activity-time">${activity.time}</div>
        </div>
      </div>
    `).join('');
  }

  // Utility Functions
  openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
  }

  closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
  }

  showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    const icon = toast.querySelector('.toast-icon');
    const messageEl = toast.querySelector('.toast-message');
    
    const icons = {
      success: 'fa-check-circle',
      error: 'fa-exclamation-circle',
      info: 'fa-info-circle'
    };
    
    toast.className = `toast ${type}`;
    icon.className = `toast-icon fas ${icons[type]}`;
    messageEl.textContent = message;
    
    toast.classList.add('show');
    
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  }

  setTodayDate() {
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('attendanceDate');
    if (dateInput) {
      dateInput.value = today;
    }
  }

  // Data Persistence (using in-memory storage due to sandbox restrictions)
  saveData() {
    // In a real application, this would save to localStorage or a backend
    // Due to sandbox restrictions, we keep data in memory
    this.dataStore = {
      students: this.students,
      attendance: this.attendance,
      assignments: this.assignments,
      classwork: this.classwork,
      activities: this.activities
    };
  }

  loadData() {
    // In a real application, this would load from localStorage or a backend
    // Using in-memory data instead
    if (this.dataStore) {
      this.students = this.dataStore.students || [];
      this.attendance = this.dataStore.attendance || [];
      this.assignments = this.dataStore.assignments || [];
      this.classwork = this.dataStore.classwork || [];
      this.activities = this.dataStore.activities || [];
    }
  }
}

// Initialize dashboard when DOM is ready
let dashboard;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    dashboard = new AdminDashboard();
  });
} else {
  dashboard = new AdminDashboard();
}