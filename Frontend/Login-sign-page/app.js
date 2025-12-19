// ============================================
// State Management
// ============================================
const AppState = {
  currentPage: 'login',
  users: [],
  currentUser: null
};

// ============================================
// Validation Rules
// ============================================
const ValidationRules = {
  email: {
    pattern: /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/,
    message: 'Please enter a valid email address'
  },
  password: {
    minLength: 8,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/,
    message: 'Password must be at least 8 characters with uppercase, lowercase, and number'
  },
  fullName: {
    minLength: 3,
    pattern: /^[a-zA-Z\s]+$/,
    message: 'Name must contain only letters and spaces (min 3 characters)'
  },
  studentId: {
    minLength: 6,
    maxLength: 10,
    pattern: /^[a-zA-Z0-9]+$/,
    message: 'Student ID must be 6-10 alphanumeric characters'
  },
  adminCode: {
    minLength: 8,
    maxLength: 12,
    pattern: /^[a-zA-Z0-9]+$/,
    message: 'Admin code must be 8-12 alphanumeric characters'
  }
};

// Mock users for demonstration
const mockUsers = [
  {
    email: 'student@example.com',
    password: 'Student123',
    role: 'student',
    studentId: 'STU001',
    name: 'John Doe'
  },
  {
    email: 'admin@example.com',
    password: 'Admin123',
    role: 'admin',
    adminCode: 'ADMIN001',
    name: 'Jane Smith'
  }
];

// ============================================
// Utility Functions
// ============================================

function validateEmail(email) {
  return ValidationRules.email.pattern.test(email);
}

function validatePassword(password) {
  return password.length >= ValidationRules.password.minLength &&
         ValidationRules.password.pattern.test(password);
}

function getPasswordStrength(password) {
  if (!password) return null;
  
  let strength = 0;
  if (password.length >= 8) strength++;
  if (/[a-z]/.test(password)) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/\d/.test(password)) strength++;
  if (/[^a-zA-Z0-9]/.test(password)) strength++;
  
  if (strength <= 2) return 'weak';
  if (strength <= 3) return 'medium';
  return 'strong';
}

function validateFullName(name) {
  return name.length >= ValidationRules.fullName.minLength &&
         ValidationRules.fullName.pattern.test(name);
}

function validateStudentId(id) {
  return id.length >= ValidationRules.studentId.minLength &&
         id.length <= ValidationRules.studentId.maxLength &&
         ValidationRules.studentId.pattern.test(id);
}

function validateAdminCode(code) {
  return code.length >= ValidationRules.adminCode.minLength &&
         code.length <= ValidationRules.adminCode.maxLength &&
         ValidationRules.adminCode.pattern.test(code);
}

function showError(inputId, message) {
  const errorElement = document.getElementById(`${inputId}Error`);
  const inputElement = document.getElementById(inputId);
  
  if (errorElement && inputElement) {
    errorElement.textContent = message;
    errorElement.classList.add('visible');
    inputElement.classList.add('invalid');
    inputElement.classList.remove('valid');
  }
}

function hideError(inputId) {
  const errorElement = document.getElementById(`${inputId}Error`);
  const inputElement = document.getElementById(inputId);
  
  if (errorElement && inputElement) {
    errorElement.textContent = '';
    errorElement.classList.remove('visible');
    inputElement.classList.remove('invalid');
  }
}

function markValid(inputId) {
  const inputElement = document.getElementById(inputId);
  if (inputElement) {
    inputElement.classList.add('valid');
    inputElement.classList.remove('invalid');
  }
  hideError(inputId);
}

function showToast(type, title, message) {
  const toast = document.getElementById('toast');
  const toastTitle = toast.querySelector('.toast-title');
  const toastMessage = toast.querySelector('.toast-message');
  
  toast.className = `toast ${type}`;
  toastTitle.textContent = title;
  toastMessage.textContent = message;
  
  setTimeout(() => toast.classList.add('show'), 10);
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 5000);
}

function setButtonLoading(button, loading) {
  if (loading) {
    button.classList.add('loading');
    button.disabled = true;
  } else {
    button.classList.remove('loading');
    button.disabled = false;
  }
}

function switchPage(toPage) {
  const loginPage = document.getElementById('loginPage');
  const signupPage = document.getElementById('signupPage');
  
  if (toPage === 'signup') {
    loginPage.classList.remove('active');
    setTimeout(() => {
      signupPage.classList.add('active');
      AppState.currentPage = 'signup';
    }, 150);
  } else {
    signupPage.classList.remove('active');
    setTimeout(() => {
      loginPage.classList.add('active');
      AppState.currentPage = 'login';
    }, 150);
  }
}

// ============================================
// Login Page Logic
// ============================================

function initLoginPage() {
  const loginForm = document.getElementById('loginForm');
  const loginEmail = document.getElementById('loginEmail');
  const loginPassword = document.getElementById('loginPassword');
  const loginPasswordToggle = document.getElementById('loginPasswordToggle');
  const goToSignup = document.getElementById('goToSignup');
  const forgotPasswordLink = document.getElementById('forgotPasswordLink');
  
  // Email validation
  loginEmail.addEventListener('blur', () => {
    const email = loginEmail.value.trim();
    if (!email) {
      showError('loginEmail', 'Email is required');
    } else if (!validateEmail(email)) {
      showError('loginEmail', ValidationRules.email.message);
    } else {
      hideError('loginEmail');
    }
  });
  
  // Password toggle
  loginPasswordToggle.addEventListener('click', () => {
    const type = loginPassword.type === 'password' ? 'text' : 'password';
    loginPassword.type = type;
  });
  
  // Form submission
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = loginEmail.value.trim();
    const password = loginPassword.value;
    const role = document.querySelector('input[name="loginRole"]:checked').value;
    const rememberMe = document.getElementById('rememberMe').checked;
    
    // Validate
    let isValid = true;
    
    if (!email) {
      showError('loginEmail', 'Email is required');
      isValid = false;
    } else if (!validateEmail(email)) {
      showError('loginEmail', ValidationRules.email.message);
      isValid = false;
    }
    
    if (!password) {
      showError('loginPassword', 'Password is required');
      isValid = false;
    }
    
    if (!isValid) return;
    
    // Simulate authentication
    const loginBtn = document.getElementById('loginBtn');
    setButtonLoading(loginBtn, true);
    
    setTimeout(() => {
      // Check against mock users
      const user = mockUsers.find(u => 
        u.email === email && 
        u.password === password && 
        u.role === role
      );
      
      setButtonLoading(loginBtn, false);
      
      if (user) {
        AppState.currentUser = user;
        showToast('success', 'Login Successful!', `Welcome back, ${user.name}!`);
        
        // Clear form
        loginForm.reset();
        hideError('loginEmail');
        hideError('loginPassword');
        
        // Simulate redirect
        setTimeout(() => {
          showToast('info', 'Redirecting...', `Taking you to your ${role} dashboard`);
        }, 1500);
      } else {
        showToast('error', 'Login Failed', 'Invalid email, password, or role selection');
      }
    }, 1500);
  });
  
  // Navigation
  goToSignup.addEventListener('click', (e) => {
    e.preventDefault();
    switchPage('signup');
  });
  
  // Forgot Password
  forgotPasswordLink.addEventListener('click', (e) => {
    e.preventDefault();
    showModal();
  });
}

// ============================================
// Signup Page Logic
// ============================================

function initSignupPage() {
  const signupForm = document.getElementById('signupForm');
  const signupName = document.getElementById('signupName');
  const signupEmail = document.getElementById('signupEmail');
  const signupPassword = document.getElementById('signupPassword');
  const signupConfirmPassword = document.getElementById('signupConfirmPassword');
  const signupPasswordToggle = document.getElementById('signupPasswordToggle');
  const signupConfirmPasswordToggle = document.getElementById('signupConfirmPasswordToggle');
  const passwordStrength = document.getElementById('passwordStrength');
  const studentIdGroup = document.getElementById('studentIdGroup');
  const adminCodeGroup = document.getElementById('adminCodeGroup');
  const studentId = document.getElementById('studentId');
  const adminCode = document.getElementById('adminCode');
  const goToLogin = document.getElementById('goToLogin');
  const termsCheckbox = document.getElementById('termsCheckbox');
  
  // Real-time name validation
  let nameTimeout;
  signupName.addEventListener('input', () => {
    clearTimeout(nameTimeout);
    nameTimeout = setTimeout(() => {
      const name = signupName.value.trim();
      if (name && validateFullName(name)) {
        markValid('signupName');
      } else if (name) {
        showError('signupName', ValidationRules.fullName.message);
      }
    }, 500);
  });
  
  signupName.addEventListener('blur', () => {
    const name = signupName.value.trim();
    if (!name) {
      showError('signupName', 'Full name is required');
    } else if (!validateFullName(name)) {
      showError('signupName', ValidationRules.fullName.message);
    }
  });
  
  // Real-time email validation
  let emailTimeout;
  signupEmail.addEventListener('input', () => {
    clearTimeout(emailTimeout);
    emailTimeout = setTimeout(() => {
      const email = signupEmail.value.trim();
      if (email && validateEmail(email)) {
        markValid('signupEmail');
      } else if (email) {
        showError('signupEmail', ValidationRules.email.message);
      }
    }, 500);
  });
  
  signupEmail.addEventListener('blur', () => {
    const email = signupEmail.value.trim();
    if (!email) {
      showError('signupEmail', 'Email is required');
    } else if (!validateEmail(email)) {
      showError('signupEmail', ValidationRules.email.message);
    }
  });
  
  // Password strength indicator
  signupPassword.addEventListener('input', () => {
    const password = signupPassword.value;
    const strength = getPasswordStrength(password);
    
    passwordStrength.className = 'password-strength';
    
    if (!password) {
      passwordStrength.querySelector('.strength-text').textContent = 'Enter a password';
      return;
    }
    
    if (strength === 'weak') {
      passwordStrength.classList.add('weak');
      passwordStrength.querySelector('.strength-text').textContent = 'Password is weak';
    } else if (strength === 'medium') {
      passwordStrength.classList.add('medium');
      passwordStrength.querySelector('.strength-text').textContent = 'Password is medium';
    } else {
      passwordStrength.classList.add('strong');
      passwordStrength.querySelector('.strength-text').textContent = 'Password is strong';
    }
  });
  
  signupPassword.addEventListener('blur', () => {
    const password = signupPassword.value;
    if (!password) {
      showError('signupPassword', 'Password is required');
    } else if (!validatePassword(password)) {
      showError('signupPassword', ValidationRules.password.message);
    } else {
      hideError('signupPassword');
    }
  });
  
  // Confirm password validation
  let confirmPasswordTimeout;
  signupConfirmPassword.addEventListener('input', () => {
    clearTimeout(confirmPasswordTimeout);
    confirmPasswordTimeout = setTimeout(() => {
      const password = signupPassword.value;
      const confirmPassword = signupConfirmPassword.value;
      
      if (confirmPassword && password === confirmPassword) {
        markValid('signupConfirmPassword');
      } else if (confirmPassword) {
        showError('signupConfirmPassword', 'Passwords do not match');
      }
    }, 500);
  });
  
  signupConfirmPassword.addEventListener('blur', () => {
    const password = signupPassword.value;
    const confirmPassword = signupConfirmPassword.value;
    
    if (!confirmPassword) {
      showError('signupConfirmPassword', 'Please confirm your password');
    } else if (password !== confirmPassword) {
      showError('signupConfirmPassword', 'Passwords do not match');
    }
  });
  
  // Password toggles
  signupPasswordToggle.addEventListener('click', () => {
    const type = signupPassword.type === 'password' ? 'text' : 'password';
    signupPassword.type = type;
  });
  
  signupConfirmPasswordToggle.addEventListener('click', () => {
    const type = signupConfirmPassword.type === 'password' ? 'text' : 'password';
    signupConfirmPassword.type = type;
  });
  
  // Role selection - show/hide conditional fields
  const roleInputs = document.querySelectorAll('input[name="signupRole"]');
  roleInputs.forEach(input => {
    input.addEventListener('change', () => {
      const role = document.querySelector('input[name="signupRole"]:checked').value;
      
      if (role === 'student') {
        studentIdGroup.classList.remove('hidden');
        adminCodeGroup.classList.add('hidden');
        studentId.required = true;
        adminCode.required = false;
        adminCode.value = '';
      } else {
        adminCodeGroup.classList.remove('hidden');
        studentIdGroup.classList.add('hidden');
        adminCode.required = true;
        studentId.required = false;
        studentId.value = '';
      }
    });
  });
  
  // Student ID validation
  let studentIdTimeout;
  studentId.addEventListener('input', () => {
    clearTimeout(studentIdTimeout);
    studentIdTimeout = setTimeout(() => {
      const id = studentId.value.trim();
      if (id && validateStudentId(id)) {
        markValid('studentId');
      } else if (id) {
        showError('studentId', ValidationRules.studentId.message);
      }
    }, 500);
  });
  
  studentId.addEventListener('blur', () => {
    const id = studentId.value.trim();
    if (!id && studentId.required) {
      showError('studentId', 'Student ID is required');
    } else if (id && !validateStudentId(id)) {
      showError('studentId', ValidationRules.studentId.message);
    }
  });
  
  // Admin code validation
  let adminCodeTimeout;
  adminCode.addEventListener('input', () => {
    clearTimeout(adminCodeTimeout);
    adminCodeTimeout = setTimeout(() => {
      const code = adminCode.value.trim();
      if (code && validateAdminCode(code)) {
        markValid('adminCode');
      } else if (code) {
        showError('adminCode', ValidationRules.adminCode.message);
      }
    }, 500);
  });
  
  adminCode.addEventListener('blur', () => {
    const code = adminCode.value.trim();
    if (!code && adminCode.required) {
      showError('adminCode', 'Admin code is required');
    } else if (code && !validateAdminCode(code)) {
      showError('adminCode', ValidationRules.adminCode.message);
    }
  });
  
  // Form submission
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = signupName.value.trim();
    const email = signupEmail.value.trim();
    const password = signupPassword.value;
    const confirmPassword = signupConfirmPassword.value;
    const role = document.querySelector('input[name="signupRole"]:checked').value;
    const roleId = role === 'student' ? studentId.value.trim() : adminCode.value.trim();
    const termsAccepted = termsCheckbox.checked;
    
    // Validate all fields
    let isValid = true;
    
    if (!name) {
      showError('signupName', 'Full name is required');
      isValid = false;
    } else if (!validateFullName(name)) {
      showError('signupName', ValidationRules.fullName.message);
      isValid = false;
    }
    
    if (!email) {
      showError('signupEmail', 'Email is required');
      isValid = false;
    } else if (!validateEmail(email)) {
      showError('signupEmail', ValidationRules.email.message);
      isValid = false;
    }
    
    if (!password) {
      showError('signupPassword', 'Password is required');
      isValid = false;
    } else if (!validatePassword(password)) {
      showError('signupPassword', ValidationRules.password.message);
      isValid = false;
    }
    
    if (!confirmPassword) {
      showError('signupConfirmPassword', 'Please confirm your password');
      isValid = false;
    } else if (password !== confirmPassword) {
      showError('signupConfirmPassword', 'Passwords do not match');
      isValid = false;
    }
    
    if (role === 'student') {
      if (!roleId) {
        showError('studentId', 'Student ID is required');
        isValid = false;
      } else if (!validateStudentId(roleId)) {
        showError('studentId', ValidationRules.studentId.message);
        isValid = false;
      }
    } else {
      if (!roleId) {
        showError('adminCode', 'Admin code is required');
        isValid = false;
      } else if (!validateAdminCode(roleId)) {
        showError('adminCode', ValidationRules.adminCode.message);
        isValid = false;
      }
    }
    
    if (!termsAccepted) {
      showError('termsCheckbox', 'You must agree to the terms and conditions');
      isValid = false;
    } else {
      hideError('termsCheckbox');
    }
    
    if (!isValid) return;
    
    // Simulate signup
    const signupBtn = document.getElementById('signupBtn');
    setButtonLoading(signupBtn, true);
    
    setTimeout(() => {
      setButtonLoading(signupBtn, false);
      
      // Create new user object
      const newUser = {
        name,
        email,
        password,
        role,
        [role === 'student' ? 'studentId' : 'adminCode']: roleId
      };
      
      // Add to mock users
      mockUsers.push(newUser);
      
      showToast('success', 'Account Created!', 'Your account has been successfully created. Please login.');
      
      // Clear form
      signupForm.reset();
      
      // Clear all validation states
      ['signupName', 'signupEmail', 'signupPassword', 'signupConfirmPassword', 'studentId', 'adminCode'].forEach(id => {
        const input = document.getElementById(id);
        if (input) {
          input.classList.remove('valid', 'invalid');
          hideError(id);
        }
      });
      
      // Reset password strength
      passwordStrength.className = 'password-strength';
      passwordStrength.querySelector('.strength-text').textContent = 'Enter a password';
      
      // Switch to login page
      setTimeout(() => {
        switchPage('login');
      }, 2000);
    }, 1500);
  });
  
  // Navigation
  goToLogin.addEventListener('click', (e) => {
    e.preventDefault();
    switchPage('login');
  });
}

// ============================================
// Modal Logic
// ============================================

function showModal() {
  const modal = document.getElementById('forgotPasswordModal');
  modal.classList.add('show');
}

function hideModal() {
  const modal = document.getElementById('forgotPasswordModal');
  modal.classList.remove('show');
}

function initModal() {
  const modal = document.getElementById('forgotPasswordModal');
  const modalOverlay = document.getElementById('modalOverlay');
  const modalClose = document.getElementById('modalClose');
  const modalCancelBtn = document.getElementById('modalCancelBtn');
  const modalSendBtn = document.getElementById('modalSendBtn');
  const recoveryEmail = document.getElementById('recoveryEmail');
  
  modalOverlay.addEventListener('click', hideModal);
  modalClose.addEventListener('click', hideModal);
  modalCancelBtn.addEventListener('click', hideModal);
  
  modalSendBtn.addEventListener('click', () => {
    const email = recoveryEmail.value.trim();
    
    if (!email) {
      showToast('error', 'Error', 'Please enter your email address');
      return;
    }
    
    if (!validateEmail(email)) {
      showToast('error', 'Invalid Email', 'Please enter a valid email address');
      return;
    }
    
    showToast('success', 'Email Sent!', 'Password reset instructions have been sent to your email');
    recoveryEmail.value = '';
    hideModal();
  });
}

// ============================================
// Toast Close
// ============================================

function initToast() {
  const toastClose = document.getElementById('toastClose');
  const toast = document.getElementById('toast');
  
  toastClose.addEventListener('click', () => {
    toast.classList.remove('show');
  });
}

// ============================================
// Initialize App
// ============================================

function initApp() {
  initLoginPage();
  initSignupPage();
  initModal();
  initToast();
  
  console.log('Attendance Management System initialized');
  console.log('Demo Credentials:');
  console.log('Student - Email: student@example.com, Password: Student123');
  console.log('Admin - Email: admin@example.com, Password: Admin123');
}

// Start the app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}