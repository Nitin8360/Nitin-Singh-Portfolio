'use strict';

// Admin Panel JavaScript
class AdminPanel {
  constructor() {
    this.currentUser = null;
    this.currentSection = 'profile';
    this.portfolioData = null; // Will be loaded asynchronously
    
    this.init();
  }

  async init() {
    // Load portfolio data first
    this.portfolioData = await this.loadPortfolioData();
    
    this.checkExistingSession();
    this.setupEventListeners();
    this.loadInitialData();
  }

  checkExistingSession() {
    // Check localStorage first (remember me option)
    let savedSession = localStorage.getItem('adminSession');
    let isFromLocalStorage = true;
    
    // If not in localStorage, check sessionStorage
    if (!savedSession) {
      savedSession = sessionStorage.getItem('adminSession');
      isFromLocalStorage = false;
    }
    
    if (savedSession) {
      const sessionData = JSON.parse(savedSession);
      const currentTime = Date.now();
      
      // Check if session is still valid
      if (sessionData.expires > currentTime) {
        this.currentUser = sessionData.username;
        document.getElementById('loginModal').classList.remove('active');
        document.getElementById('adminPanel').classList.add('active');
        
        const sessionType = isFromLocalStorage ? 'persistent' : 'temporary';
        this.showMessage(`Welcome back! (${sessionType} session)`, 'success');
        return;
      } else {
        // Session expired, remove it
        if (isFromLocalStorage) {
          localStorage.removeItem('adminSession');
        } else {
          sessionStorage.removeItem('adminSession');
        }
        this.showMessage('Session expired. Please log in again.', 'warning');
      }
    }
    
    // No valid session, show login
    document.getElementById('loginModal').classList.add('active');
  }

  setupEventListeners() {
    // Login
    document.getElementById('loginForm').addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleLogin(e);
    });

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', () => {
      this.handleLogout();
    });

    // Preview Portfolio
    document.getElementById('previewBtn').addEventListener('click', () => {
      window.open('index.html', '_blank');
    });

    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        const section = e.currentTarget.getAttribute('data-section');
        this.switchSection(section);
      });
    });

    // Profile Form
    document.getElementById('profileForm').addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveProfile(e);
    });

    // File upload previews
    this.setupFilePreviewListeners();

    // Modal controls
    this.setupModalControls();

    // Action buttons
    this.setupActionButtons();
    
    // Resume tabs
    this.setupResumeTabs();
    
    // Data export/import functionality
    this.setupDataManagement();
    
    // Mobile menu functionality
    this.setupMobileMenu();
  }

  setupFilePreviewListeners() {
    // Avatar preview
    const avatarInput = document.getElementById('avatar');
    if (avatarInput) {
      avatarInput.addEventListener('change', (e) => {
        this.previewImage(e.target, '.current-avatar img');
      });
    }

    // Project image preview (will be set when modal opens)
    document.addEventListener('change', (e) => {
      if (e.target.id === 'projectImage') {
        this.previewImage(e.target, '#projectImagePreview');
      }
      if (e.target.id === 'certificateImage') {
        this.previewImage(e.target, '#certificateImagePreview');
      }
      if (e.target.id === 'memoryImage') {
        this.previewMemoryImage(e.target);
      }
    });
  }

  previewImage(input, targetSelector) {
    const file = input.files[0];
    const target = document.querySelector(targetSelector);
    
    if (file && target) {
      const reader = new FileReader();
      reader.onload = function(e) {
        target.src = e.target.result;
        target.style.display = 'block';
      };
      reader.readAsDataURL(file);
    } else if (target) {
      target.style.display = 'none';
    }
  }

  previewMemoryImage(input) {
    const file = input.files[0];
    const preview = document.getElementById('memoryImagePreview');
    
    if (file && preview) {
      const reader = new FileReader();
      reader.onload = function(e) {
        preview.src = e.target.result;
        preview.style.display = 'block';
      };
      reader.readAsDataURL(file);
    } else if (preview) {
      preview.style.display = 'none';
    }
  }

  setupModalControls() {
    // Close modals
    document.querySelectorAll('.modal-close, .modal-cancel').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.closeAllModals();
      });
    });

    // Close modal when clicking outside
    document.querySelectorAll('.modal').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.closeAllModals();
        }
      });
    });

    // Project form
    document.getElementById('projectForm').addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveProject(e);
    });

    // Certificate form
    document.getElementById('certificateForm').addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveCertificate(e);
    });

    document.getElementById('memoryForm').addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveMemory(e);
    });

    // Resume forms
    document.getElementById('educationForm').addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveEducation(e);
    });

    document.getElementById('resumeExperienceForm').addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveResumeExperience(e);
    });

    document.getElementById('skillForm').addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveSkill(e);
    });
  }

  setupActionButtons() {
    // Add buttons
    document.getElementById('addProjectBtn').addEventListener('click', () => {
      this.openProjectModal();
    });

    document.getElementById('addCertificateBtn').addEventListener('click', () => {
      this.openCertificateModal();
    });

    document.getElementById('addMemoryBtn').addEventListener('click', () => {
      this.openMemoryModal();
    });

    // Resume buttons
    document.getElementById('addEducationBtn').addEventListener('click', () => {
      this.openEducationModal();
    });

    document.getElementById('addExperienceBtn').addEventListener('click', () => {
      this.openResumeExperienceModal();
    });

    document.getElementById('addSkillBtn').addEventListener('click', () => {
      this.openSkillModal();
    });

    // Skill level slider
    const skillLevelSlider = document.getElementById('skillLevel');
    const skillLevelValue = document.getElementById('skillLevelValue');
    
    if (skillLevelSlider && skillLevelValue) {
      skillLevelSlider.addEventListener('input', (e) => {
        skillLevelValue.textContent = e.target.value;
      });
    }
  }

  handleLogin(e) {
    const formData = new FormData(e.target);
    const username = formData.get('username');
    const password = formData.get('password');
    const rememberMe = formData.get('rememberMe');

    // Simple authentication (in real app, this would be server-side)
    if (username === 'nitin8303' && password === 'nitin@8303') {
      this.currentUser = username;
      
      // Save session to localStorage based on remember me option
      if (rememberMe) {
        const sessionData = {
          username: username,
          loginTime: Date.now(),
          expires: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
          rememberMe: true
        };
        localStorage.setItem('adminSession', JSON.stringify(sessionData));
      } else {
        // Session only for current browser session (until tab is closed)
        const sessionData = {
          username: username,
          loginTime: Date.now(),
          expires: Date.now() + (60 * 60 * 1000), // 1 hour
          rememberMe: false
        };
        sessionStorage.setItem('adminSession', JSON.stringify(sessionData));
      }
      
      document.getElementById('loginModal').classList.remove('active');
      document.getElementById('adminPanel').classList.add('active');
      this.showMessage('Login successful!', 'success');
    } else {
      this.showMessage('Invalid credentials!', 'error');
    }
  }

  handleLogout() {
    this.currentUser = null;
    
    // Clear session from both storage types
    localStorage.removeItem('adminSession');
    sessionStorage.removeItem('adminSession');
    
    document.getElementById('adminPanel').classList.remove('active');
    document.getElementById('loginModal').classList.add('active');
    
    // Reset forms
    document.getElementById('loginForm').reset();
    // Reset remember me checkbox to checked by default
    document.getElementById('rememberMe').checked = true;
    
    this.showMessage('Logged out successfully!', 'success');
  }

  switchSection(section) {
    // Update navigation
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.remove('active');
    });
    document.querySelector(`[data-section="${section}"]`).classList.add('active');

    // Update content
    document.querySelectorAll('.admin-section').forEach(sec => {
      sec.classList.remove('active');
    });
    document.getElementById(section).classList.add('active');

    this.currentSection = section;
    this.loadSectionData(section);
  }

  loadSectionData(section) {
    switch(section) {
      case 'projects':
        this.loadProjects();
        break;
      case 'certificates':
        this.loadCertificates();
        break;
      case 'memories':
        this.loadMemories();
        break;
      case 'resume':
        this.loadResume();
        break;
      case 'skills':
        this.loadSkills();
        break;
      case 'experience':
        this.loadExperience();
        break;
      case 'blog':
        this.loadBlog();
        break;
    }
  }

  saveProfile(e) {
    const formData = new FormData(e.target);
    const profileData = {
      fullName: formData.get('fullName'),
      title: formData.get('title'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      birthday: formData.get('birthday'),
      location: formData.get('location'),
      aboutText: formData.get('aboutText')
    };

    // Handle avatar image upload
    const avatarFile = formData.get('avatar');
    if (avatarFile && avatarFile.size > 0) {
      this.handleImageUpload(avatarFile, 'avatar', (imageUrl) => {
        profileData.avatar = imageUrl;
        this.saveProfileData(profileData);
      });
    } else {
      this.saveProfileData(profileData);
    }
  }

  saveProfileData(profileData) {
    // Save to localStorage (in real app, this would be server-side)
    this.portfolioData.profile = profileData;
    this.savePortfolioData();

    // Update the main portfolio (this would typically be an API call)
    this.updatePortfolioHTML(profileData);
    
    this.showMessage('Profile updated successfully!', 'success');
    
    // Update the current avatar preview if a new one was uploaded
    if (profileData.avatar) {
      const currentAvatar = document.querySelector('.current-avatar img');
      if (currentAvatar) {
        currentAvatar.src = profileData.avatar;
      }
    }
  }

  updatePortfolioHTML(profileData) {
    // This is a simplified version - in a real app, you'd use an API
    console.log('Updating portfolio with:', profileData);
    
    // For demonstration, we'll store in localStorage
    // and show a success message
  }

  handleImageUpload(file, type, callback) {
    if (!file || file.size === 0) {
      callback(null);
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      this.showMessage('Please upload a valid image file (JPEG, PNG, GIF, or WebP)', 'error');
      callback(null);
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      this.showMessage('Image file is too large. Please choose a file smaller than 5MB.', 'error');
      callback(null);
      return;
    }

    // Convert file to base64 data URL for storage
    const reader = new FileReader();
    const self = this;
    reader.onload = function(e) {
      const imageUrl = e.target.result;
      callback(imageUrl);
    };
    reader.onerror = function() {
      self.showMessage('Error reading image file. Please try again.', 'error');
      callback(null);
    };
    reader.readAsDataURL(file);
  }

  loadProjects() {
    const projectsGrid = document.getElementById('projectsGrid');
    const projects = this.portfolioData.projects || [];

    if (projects.length === 0) {
      // Load default projects
      projects.push(
        {
          id: 1,
          title: 'Finance',
          category: 'web development',
          description: 'A comprehensive financial management application.',
          image: './assets/images/project-1.jpg',
          url: '#'
        },
        {
          id: 2,
          title: 'Orizon',
          category: 'web development',
          description: 'Modern web application with sleek design.',
          image: './assets/images/project-2.png',
          url: '#'
        }
      );
      this.portfolioData.projects = projects;
      this.savePortfolioData();
    }

    projectsGrid.innerHTML = projects.map(project => `
      <div class="project-card" data-id="${project.id}">
        <img src="${project.image}" alt="${project.title}" class="project-image" onerror="this.src='./assets/images/project-1.jpg'">
        <div class="project-info">
          <h3 class="project-title">${project.title}</h3>
          <p class="project-category">${project.category}</p>
          <p class="project-description">${project.description || ''}</p>
          <div class="project-actions">
            <button class="btn btn-warning btn-sm" onclick="adminPanel.editProject(${project.id})">Edit</button>
            <button class="btn btn-danger btn-sm" onclick="adminPanel.deleteProject(${project.id})">Delete</button>
          </div>
        </div>
      </div>
    `).join('');
  }

  openProjectModal(project = null) {
    const modal = document.getElementById('projectModal');
    const form = document.getElementById('projectForm');
    const title = document.getElementById('projectModalTitle');

    if (project) {
      title.textContent = 'Edit Project';
      form.elements.title.value = project.title;
      form.elements.category.value = project.category;
      form.elements.description.value = project.description || '';
      form.elements.url.value = project.url || '';
      form.setAttribute('data-editing', project.id);
    } else {
      title.textContent = 'Add New Project';
      form.reset();
      form.removeAttribute('data-editing');
    }

    modal.classList.add('active');
  }

  saveProject(e) {
    const formData = new FormData(e.target);
    const projectData = {
      title: formData.get('title'),
      category: formData.get('category'),
      description: formData.get('description'),
      url: formData.get('url') || '#'
    };

    const editingId = e.target.getAttribute('data-editing');
    
    // Handle image upload
    const imageFile = formData.get('image');
    if (imageFile && imageFile.size > 0) {
      this.handleImageUpload(imageFile, 'project', (imageUrl) => {
        if (imageUrl) {
          projectData.image = imageUrl;
        }
        this.saveProjectData(projectData, editingId);
      });
    } else {
      // Use existing image if editing, or default image if new
      if (editingId) {
        const existingProject = this.portfolioData.projects.find(p => p.id == editingId);
        projectData.image = existingProject ? existingProject.image : './assets/images/project-1.jpg';
      } else {
        projectData.image = './assets/images/project-1.jpg';
      }
      this.saveProjectData(projectData, editingId);
    }
  }

  saveProjectData(projectData, editingId) {
    if (editingId) {
      // Edit existing project
      const projectIndex = this.portfolioData.projects.findIndex(p => p.id == editingId);
      if (projectIndex !== -1) {
        this.portfolioData.projects[projectIndex] = {
          ...this.portfolioData.projects[projectIndex],
          ...projectData
        };
      }
    } else {
      // Add new project
      const newProject = {
        id: Date.now(),
        ...projectData
      };
      
      if (!this.portfolioData.projects) {
        this.portfolioData.projects = [];
      }
      this.portfolioData.projects.push(newProject);
    }

    this.savePortfolioData();
    this.loadProjects();
    this.closeAllModals();
    this.showMessage(`Project ${editingId ? 'updated' : 'added'} successfully!`, 'success');
  }

  editProject(id) {
    const project = this.portfolioData.projects.find(p => p.id == id);
    if (project) {
      this.openProjectModal(project);
    }
  }

  deleteProject(id) {
    if (confirm('Are you sure you want to delete this project?')) {
      this.portfolioData.projects = this.portfolioData.projects.filter(p => p.id != id);
      this.savePortfolioData();
      this.loadProjects();
      this.showMessage('Project deleted successfully!', 'success');
    }
  }

  loadCertificates() {
    const certificatesList = document.getElementById('certificatesList');
    const certificates = this.portfolioData.certificates || [];

    certificatesList.innerHTML = certificates.map(cert => `
      <div class="list-item certificate-item" data-id="${cert.id}">
        ${cert.image ? `<div class="cert-image"><img src="${cert.image}" alt="${cert.title}" width="60" height="60"></div>` : ''}
        <div class="item-info">
          <h3>${cert.title}</h3>
          <p><strong>Issuer:</strong> ${cert.issuer}</p>
          <p><strong>Date:</strong> ${new Date(cert.date).toLocaleDateString()}</p>
          ${cert.url ? `<p><a href="${cert.url}" target="_blank" rel="noopener">View Certificate</a></p>` : ''}
        </div>
        <div class="item-actions">
          <button class="btn btn-warning btn-sm" onclick="adminPanel.editCertificate(${cert.id})">Edit</button>
          <button class="btn btn-danger btn-sm" onclick="adminPanel.deleteCertificate(${cert.id})">Delete</button>
        </div>
      </div>
    `).join('') || '<p class="text-center">No certificates added yet.</p>';
  }

  loadMemories() {
    const memoriesGrid = document.getElementById('memoriesGrid');
    if (!memoriesGrid) {
      console.error('memoriesGrid element not found');
      return;
    }
    
    const memories = this.portfolioData.memories || [];

    memoriesGrid.innerHTML = memories.map(memory => `
      <div class="list-item memory-item" data-id="${memory.id}">
        ${memory.image ? `<div class="memory-image"><img src="${memory.image}" alt="${memory.title}" width="60" height="60"></div>` : ''}
        <div class="item-info">
          <h3>${memory.title}</h3>
          ${memory.category ? `<p><strong>Category:</strong> ${memory.category}</p>` : ''}
          ${memory.date ? `<p><strong>Date:</strong> ${new Date(memory.date).toLocaleDateString()}</p>` : ''}
          ${memory.description ? `<p>${memory.description}</p>` : ''}
        </div>
        <div class="item-actions">
          <button class="btn btn-warning btn-sm" onclick="adminPanel.editMemory(${memory.id})">Edit</button>
          <button class="btn btn-danger btn-sm" onclick="adminPanel.deleteMemory(${memory.id})">Delete</button>
        </div>
      </div>
    `).join('') || '<p class="text-center">No memories added yet.</p>';
  }

  openCertificateModal(certificate = null) {
    const modal = document.getElementById('certificateModal');
    const form = document.getElementById('certificateForm');
    const title = document.getElementById('certificateModalTitle');

    if (certificate) {
      title.textContent = 'Edit Certificate';
      form.elements.title.value = certificate.title;
      form.elements.issuer.value = certificate.issuer;
      form.elements.date.value = certificate.date;
      form.elements.url.value = certificate.url || '';
      form.setAttribute('data-editing', certificate.id);
    } else {
      title.textContent = 'Add New Certificate';
      form.reset();
      form.removeAttribute('data-editing');
    }

    modal.classList.add('active');
  }

  openMemoryModal(memory = null) {
    const modal = document.getElementById('memoryModal');
    const form = document.getElementById('memoryForm');
    const title = document.getElementById('memoryModalTitle');

    if (memory) {
      title.textContent = 'Edit Memory';
      form.elements.title.value = memory.title;
      form.elements.description.value = memory.description || '';
      form.elements.category.value = memory.category || 'hackathon';
      form.elements.date.value = memory.date || '';
      form.setAttribute('data-editing', memory.id);
      
      // Handle image preview if editing
      const preview = document.getElementById('memoryImagePreview');
      if (memory.image) {
        preview.src = memory.image;
        preview.style.display = 'block';
      } else {
        preview.style.display = 'none';
      }
    } else {
      title.textContent = 'Add New Memory';
      form.reset();
      form.removeAttribute('data-editing');
      document.getElementById('memoryImagePreview').style.display = 'none';
    }

    modal.classList.add('active');
  }

  saveCertificate(e) {
    const formData = new FormData(e.target);
    const certificateData = {
      title: formData.get('title'),
      issuer: formData.get('issuer'),
      date: formData.get('date'),
      url: formData.get('url') || ''
    };

    const editingId = e.target.getAttribute('data-editing');
    
    // Handle image upload
    const imageFile = formData.get('image');
    if (imageFile && imageFile.size > 0) {
      this.handleImageUpload(imageFile, 'certificate', (imageUrl) => {
        if (imageUrl) {
          certificateData.image = imageUrl;
        }
        this.saveCertificateData(certificateData, editingId);
      });
    } else {
      // Use existing image if editing
      if (editingId) {
        const existingCert = this.portfolioData.certificates.find(c => c.id == editingId);
        certificateData.image = existingCert ? existingCert.image : null;
      }
      this.saveCertificateData(certificateData, editingId);
    }
  }

  saveCertificateData(certificateData, editingId) {
    if (editingId) {
      // Edit existing certificate
      const certIndex = this.portfolioData.certificates.findIndex(c => c.id == editingId);
      if (certIndex !== -1) {
        this.portfolioData.certificates[certIndex] = {
          ...this.portfolioData.certificates[certIndex],
          ...certificateData
        };
      }
    } else {
      // Add new certificate
      const newCertificate = {
        id: Date.now(),
        ...certificateData
      };
      
      if (!this.portfolioData.certificates) {
        this.portfolioData.certificates = [];
      }
      this.portfolioData.certificates.push(newCertificate);
    }

    this.savePortfolioData();
    this.loadCertificates();
    this.closeAllModals();
    this.showMessage(`Certificate ${editingId ? 'updated' : 'added'} successfully!`, 'success');
  }

  saveMemory(e) {
    const formData = new FormData(e.target);
    const memoryData = {
      title: formData.get('title'),
      description: formData.get('description') || '',
      category: formData.get('category') || 'hackathon',
      date: formData.get('date') || ''
    };

    const editingId = e.target.getAttribute('data-editing');
    const imageFile = formData.get('image');
    
    // Validate that new memories have an image
    if (!editingId && (!imageFile || imageFile.size === 0)) {
      this.showMessage('Please upload an image for the memory.', 'error');
      return;
    }
    
    // Handle image upload
    if (imageFile && imageFile.size > 0) {
      this.handleImageUpload(imageFile, 'memory', (imageUrl) => {
        if (imageUrl) {
          memoryData.image = imageUrl;
        }
        this.saveMemoryData(memoryData, editingId);
      });
    } else {
      // Use existing image if editing
      if (editingId) {
        const existingMemory = this.portfolioData.memories && this.portfolioData.memories.find(m => m.id == editingId);
        memoryData.image = existingMemory ? existingMemory.image : null;
      }
      this.saveMemoryData(memoryData, editingId);
    }
  }

  saveMemoryData(memoryData, editingId) {
    try {
      if (editingId) {
        // Edit existing memory
        if (!this.portfolioData.memories) {
          this.portfolioData.memories = [];
        }
        const memoryIndex = this.portfolioData.memories.findIndex(m => m.id == editingId);
        if (memoryIndex !== -1) {
          this.portfolioData.memories[memoryIndex] = {
            ...this.portfolioData.memories[memoryIndex],
            ...memoryData
          };
        }
      } else {
        // Add new memory
        const newMemory = {
          id: Date.now(),
          ...memoryData
        };
        
        if (!this.portfolioData.memories) {
          this.portfolioData.memories = [];
        }
        this.portfolioData.memories.push(newMemory);
      }

      this.savePortfolioData();
      this.loadMemories();
      this.closeAllModals();
      this.showMessage(`Memory ${editingId ? 'updated' : 'added'} successfully!`, 'success');
    } catch (error) {
      console.error('Error saving memory:', error);
      this.showMessage('Error saving memory. Please try again.', 'error');
    }
  }

  editCertificate(id) {
    const certificate = this.portfolioData.certificates.find(c => c.id == id);
    if (certificate) {
      this.openCertificateModal(certificate);
    }
  }

  deleteCertificate(id) {
    if (confirm('Are you sure you want to delete this certificate?')) {
      this.portfolioData.certificates = this.portfolioData.certificates.filter(c => c.id != id);
      this.savePortfolioData();
      this.loadCertificates();
      this.showMessage('Certificate deleted successfully!', 'success');
    }
  }

  editMemory(id) {
    const memory = this.portfolioData.memories.find(m => m.id == id);
    if (memory) {
      this.openMemoryModal(memory);
    }
  }

  deleteMemory(id) {
    if (confirm('Are you sure you want to delete this memory?')) {
      this.portfolioData.memories = this.portfolioData.memories.filter(m => m.id != id);
      this.savePortfolioData();
      this.loadMemories();
      this.showMessage('Memory deleted successfully!', 'success');
    }
  }

  loadSkills() {
    const skillsList = document.getElementById('skillsList');
    skillsList.innerHTML = '<p class="text-center">Skills management coming soon...</p>';
  }

  loadExperience() {
    const experienceList = document.getElementById('experienceList');
    experienceList.innerHTML = '<p class="text-center">Experience management coming soon...</p>';
  }

  loadBlog() {
    const blogList = document.getElementById('blogList');
    blogList.innerHTML = '<p class="text-center">Blog management coming soon...</p>';
  }

  // Resume Management Methods
  setupResumeTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const targetTab = e.target.getAttribute('data-tab');
        this.switchResumeTab(targetTab);
      });
    });
  }

  switchResumeTab(tab) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tab}"]`).classList.add('active');

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.remove('active');
    });
    document.getElementById(`${tab}-tab`).classList.add('active');

    // Load tab data
    switch(tab) {
      case 'education':
        this.loadEducation();
        break;
      case 'experience':
        this.loadResumeExperience();
        break;
      case 'skills':
        this.loadResumeSkills();
        break;
    }
  }

  loadResume() {
    // Load the currently active tab
    const activeTab = document.querySelector('.tab-btn.active').getAttribute('data-tab');
    this.switchResumeTab(activeTab || 'education');
  }

  // Education Methods
  loadEducation() {
    const educationList = document.getElementById('educationList');
    const education = this.portfolioData.education || [];

    educationList.innerHTML = education.map(edu => `
      <div class="resume-item" data-id="${edu.id}">
        <div class="resume-item-icon">🎓</div>
        <div class="resume-item-content">
          <h4 class="resume-item-title">${edu.title}</h4>
          ${edu.institution ? `<p class="resume-item-subtitle">${edu.institution}</p>` : ''}
          <p class="resume-item-date">${edu.startYear} — ${edu.endYear}</p>
          ${edu.description ? `<p class="resume-item-description">${edu.description}</p>` : ''}
        </div>
        <div class="item-actions">
          <button class="btn btn-warning btn-sm" onclick="adminPanel.editEducation(${edu.id})">Edit</button>
          <button class="btn btn-danger btn-sm" onclick="adminPanel.deleteEducation(${edu.id})">Delete</button>
        </div>
      </div>
    `).join('') || '<p class="text-center">No education entries added yet.</p>';
  }

  openEducationModal(education = null) {
    const modal = document.getElementById('educationModal');
    const form = document.getElementById('educationForm');
    const title = document.getElementById('educationModalTitle');

    if (education) {
      title.textContent = 'Edit Education';
      form.elements.title.value = education.title;
      form.elements.institution.value = education.institution || '';
      form.elements.startYear.value = education.startYear;
      form.elements.endYear.value = education.endYear;
      form.elements.description.value = education.description || '';
      form.setAttribute('data-editing', education.id);
    } else {
      title.textContent = 'Add Education';
      form.reset();
      form.removeAttribute('data-editing');
    }

    modal.classList.add('active');
  }

  saveEducation(e) {
    const formData = new FormData(e.target);
    const educationData = {
      title: formData.get('title'),
      institution: formData.get('institution'),
      startYear: parseInt(formData.get('startYear')),
      endYear: parseInt(formData.get('endYear')),
      description: formData.get('description')
    };

    const editingId = e.target.getAttribute('data-editing');

    if (editingId) {
      // Edit existing education
      const eduIndex = this.portfolioData.education.findIndex(e => e.id == editingId);
      if (eduIndex !== -1) {
        this.portfolioData.education[eduIndex] = {
          ...this.portfolioData.education[eduIndex],
          ...educationData
        };
      }
    } else {
      // Add new education
      const newEducation = {
        id: Date.now(),
        ...educationData
      };
      
      if (!this.portfolioData.education) {
        this.portfolioData.education = [];
      }
      this.portfolioData.education.push(newEducation);
    }

    this.savePortfolioData();
    this.loadEducation();
    this.closeAllModals();
    this.showMessage(`Education ${editingId ? 'updated' : 'added'} successfully!`, 'success');
  }

  editEducation(id) {
    const education = this.portfolioData.education.find(e => e.id == id);
    if (education) {
      this.openEducationModal(education);
    }
  }

  deleteEducation(id) {
    if (confirm('Are you sure you want to delete this education entry?')) {
      this.portfolioData.education = this.portfolioData.education.filter(e => e.id != id);
      this.savePortfolioData();
      this.loadEducation();
      this.showMessage('Education deleted successfully!', 'success');
    }
  }

  // Resume Experience Methods
  loadResumeExperience() {
    const experienceList = document.getElementById('resumeExperienceList');
    const experience = this.portfolioData.resumeExperience || [];

    experienceList.innerHTML = experience.map(exp => `
      <div class="resume-item" data-id="${exp.id}">
        <div class="resume-item-icon">💼</div>
        <div class="resume-item-content">
          <h4 class="resume-item-title">${exp.title}</h4>
          ${exp.company ? `<p class="resume-item-subtitle">${exp.company}</p>` : ''}
          <p class="resume-item-date">${exp.startYear} — ${exp.endYear}</p>
          ${exp.description ? `<p class="resume-item-description">${exp.description}</p>` : ''}
        </div>
        <div class="item-actions">
          <button class="btn btn-warning btn-sm" onclick="adminPanel.editResumeExperience(${exp.id})">Edit</button>
          <button class="btn btn-danger btn-sm" onclick="adminPanel.deleteResumeExperience(${exp.id})">Delete</button>
        </div>
      </div>
    `).join('') || '<p class="text-center">No experience entries added yet.</p>';
  }

  openResumeExperienceModal(experience = null) {
    const modal = document.getElementById('resumeExperienceModal');
    const form = document.getElementById('resumeExperienceForm');
    const title = document.getElementById('resumeExperienceModalTitle');

    if (experience) {
      title.textContent = 'Edit Experience';
      form.elements.title.value = experience.title;
      form.elements.company.value = experience.company || '';
      form.elements.startYear.value = experience.startYear;
      form.elements.endYear.value = experience.endYear;
      form.elements.description.value = experience.description || '';
      form.setAttribute('data-editing', experience.id);
    } else {
      title.textContent = 'Add Experience';
      form.reset();
      form.removeAttribute('data-editing');
    }

    modal.classList.add('active');
  }

  saveResumeExperience(e) {
    const formData = new FormData(e.target);
    const experienceData = {
      title: formData.get('title'),
      company: formData.get('company'),
      startYear: parseInt(formData.get('startYear')),
      endYear: formData.get('endYear'), // Keep as string to allow "Present"
      description: formData.get('description')
    };

    const editingId = e.target.getAttribute('data-editing');

    if (editingId) {
      // Edit existing experience
      const expIndex = this.portfolioData.resumeExperience.findIndex(e => e.id == editingId);
      if (expIndex !== -1) {
        this.portfolioData.resumeExperience[expIndex] = {
          ...this.portfolioData.resumeExperience[expIndex],
          ...experienceData
        };
      }
    } else {
      // Add new experience
      const newExperience = {
        id: Date.now(),
        ...experienceData
      };
      
      if (!this.portfolioData.resumeExperience) {
        this.portfolioData.resumeExperience = [];
      }
      this.portfolioData.resumeExperience.push(newExperience);
    }

    this.savePortfolioData();
    this.loadResumeExperience();
    this.closeAllModals();
    this.showMessage(`Experience ${editingId ? 'updated' : 'added'} successfully!`, 'success');
  }

  editResumeExperience(id) {
    const experience = this.portfolioData.resumeExperience.find(e => e.id == id);
    if (experience) {
      this.openResumeExperienceModal(experience);
    }
  }

  deleteResumeExperience(id) {
    if (confirm('Are you sure you want to delete this experience entry?')) {
      this.portfolioData.resumeExperience = this.portfolioData.resumeExperience.filter(e => e.id != id);
      this.savePortfolioData();
      this.loadResumeExperience();
      this.showMessage('Experience deleted successfully!', 'success');
    }
  }

  // Resume Skills Methods
  loadResumeSkills() {
    const skillsList = document.getElementById('resumeSkillsList');
    const skills = this.portfolioData.resumeSkills || [];

    skillsList.innerHTML = skills.map(skill => `
      <div class="resume-item" data-id="${skill.id}">
        <div class="resume-item-icon">⚡</div>
        <div class="resume-item-content">
          <h4 class="resume-item-title">${skill.name}</h4>
          ${skill.category ? `<p class="resume-item-subtitle">${skill.category}</p>` : ''}
          <div class="skill-progress">
            <div class="skill-progress-fill" style="width: ${skill.level}%;"></div>
          </div>
          <p class="resume-item-date">${skill.level}%</p>
        </div>
        <div class="item-actions">
          <button class="btn btn-warning btn-sm" onclick="adminPanel.editSkill(${skill.id})">Edit</button>
          <button class="btn btn-danger btn-sm" onclick="adminPanel.deleteSkill(${skill.id})">Delete</button>
        </div>
      </div>
    `).join('') || '<p class="text-center">No skills added yet.</p>';
  }

  openSkillModal(skill = null) {
    const modal = document.getElementById('skillModal');
    const form = document.getElementById('skillForm');
    const title = document.getElementById('skillModalTitle');
    const levelSlider = document.getElementById('skillLevel');
    const levelValue = document.getElementById('skillLevelValue');

    if (skill) {
      title.textContent = 'Edit Skill';
      form.elements.name.value = skill.name;
      form.elements.level.value = skill.level;
      form.elements.category.value = skill.category || '';
      levelValue.textContent = skill.level;
      form.setAttribute('data-editing', skill.id);
    } else {
      title.textContent = 'Add Skill';
      form.reset();
      levelSlider.value = 50;
      levelValue.textContent = '50';
      form.removeAttribute('data-editing');
    }

    modal.classList.add('active');
  }

  saveSkill(e) {
    const formData = new FormData(e.target);
    const skillData = {
      name: formData.get('name'),
      level: parseInt(formData.get('level')),
      category: formData.get('category')
    };

    const editingId = e.target.getAttribute('data-editing');

    if (editingId) {
      // Edit existing skill
      const skillIndex = this.portfolioData.resumeSkills.findIndex(s => s.id == editingId);
      if (skillIndex !== -1) {
        this.portfolioData.resumeSkills[skillIndex] = {
          ...this.portfolioData.resumeSkills[skillIndex],
          ...skillData
        };
      }
    } else {
      // Add new skill
      const newSkill = {
        id: Date.now(),
        ...skillData
      };
      
      if (!this.portfolioData.resumeSkills) {
        this.portfolioData.resumeSkills = [];
      }
      this.portfolioData.resumeSkills.push(newSkill);
    }

    this.savePortfolioData();
    this.loadResumeSkills();
    this.closeAllModals();
    this.showMessage(`Skill ${editingId ? 'updated' : 'added'} successfully!`, 'success');
  }

  editSkill(id) {
    const skill = this.portfolioData.resumeSkills.find(s => s.id == id);
    if (skill) {
      this.openSkillModal(skill);
    }
  }

  deleteSkill(id) {
    if (confirm('Are you sure you want to delete this skill?')) {
      this.portfolioData.resumeSkills = this.portfolioData.resumeSkills.filter(s => s.id != id);
      this.savePortfolioData();
      this.loadResumeSkills();
      this.showMessage('Skill deleted successfully!', 'success');
    }
  }

  closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
      modal.classList.remove('active');
    });
  }

  showMessage(message, type = 'success') {
    const messageDiv = document.createElement('div');
    messageDiv.className = `${type}-message`;
    messageDiv.textContent = message;
    
    // Insert at the top of the current section
    const currentSection = document.querySelector('.admin-section.active');
    currentSection.insertBefore(messageDiv, currentSection.firstChild);
    
    // Remove after 5 seconds
    setTimeout(() => {
      messageDiv.remove();
    }, 5000);
  }

  loadInitialData() {
    // Load profile data into form
    const profile = this.portfolioData.profile;
    if (profile) {
      document.getElementById('fullName').value = profile.fullName || 'Nitin Singh';
      document.getElementById('title').value = profile.title || 'Web developer';
      document.getElementById('email').value = profile.email || 'nitinsingh@example.com';
      document.getElementById('phone').value = profile.phone || '+1 (234) 567-890';
      document.getElementById('birthday').value = profile.birthday || '1990-01-01';
      document.getElementById('location').value = profile.location || 'Your City, Your State, Your Country';
      document.getElementById('aboutText').value = profile.aboutText || '';
      
      // Update current avatar if available
      if (profile.avatar) {
        const currentAvatar = document.querySelector('.current-avatar img');
        if (currentAvatar) {
          currentAvatar.src = profile.avatar;
        }
      }
    }
  }

  async loadPortfolioData() {
    try {
      // Try to load from Firebase first
      if (window.firebaseManager && window.firebaseManager.isInitialized) {
        console.log('📥 Loading from Firebase...');
        const firebaseData = await window.firebaseManager.loadFromFirebase();
        
        if (firebaseData) {
          console.log('✅ Data loaded from Firebase');
          return firebaseData;
        }
      }
      
      // Fallback to localStorage
      console.log('📥 Loading from localStorage...');
      const saved = localStorage.getItem('portfolioData');
      return saved ? JSON.parse(saved) : {
        profile: {},
        projects: [],
        certificates: [],
        memories: [],
        education: [],
        resumeExperience: [],
        resumeSkills: [],
        skills: [],
        experience: [],
        blog: []
      };
    } catch (error) {
      console.error('❌ Error loading portfolio data:', error);
      return {
        profile: {},
        projects: [],
        certificates: [],
        memories: [],
        education: [],
        resumeExperience: [],
        resumeSkills: [],
        skills: [],
        experience: [],
        blog: []
      };
    }
  }

  async savePortfolioData() {
    try {
      const dataString = JSON.stringify(this.portfolioData);
      
      // Save to Firebase if available
      console.log('🔍 Checking Firebase manager availability...');
      console.log('window.firebaseManager exists:', !!window.firebaseManager);
      console.log('window.firebaseManager.isInitialized:', window.firebaseManager ? window.firebaseManager.isInitialized : 'N/A');
      
      if (window.firebaseManager && window.firebaseManager.isInitialized) {
        console.log('💾 Saving to Firebase...');
        const firebaseSaved = await window.firebaseManager.saveToFirebase(this.portfolioData);
        
        if (firebaseSaved) {
          console.log('✅ Data saved to Firebase successfully');
          this.showMessage('Data saved to cloud database!', 'success');
        } else {
          console.log('⚠️ Firebase save failed, using localStorage');
          localStorage.setItem('portfolioData', dataString);
          this.showMessage('Data saved locally (Firebase unavailable)', 'warning');
        }
      } else {
        console.log('⚠️ Firebase manager not available or not initialized');
        console.log('🔄 Attempting to force Firebase save anyway...');
        
        // Try to save to Firebase anyway
        if (window.firebaseManager) {
          try {
            const firebaseSaved = await window.firebaseManager.saveToFirebase(this.portfolioData);
            if (firebaseSaved) {
              console.log('✅ Force Firebase save successful!');
              this.showMessage('Data saved to cloud database!', 'success');
            } else {
              throw new Error('Firebase save returned false');
            }
          } catch (error) {
            console.log('❌ Force Firebase save failed:', error);
            localStorage.setItem('portfolioData', dataString);
            this.showMessage('Data saved locally only', 'warning');
          }
        } else {
          console.log('� No Firebase manager, saving to localStorage only');
          localStorage.setItem('portfolioData', dataString);
          this.showMessage('Data saved locally only', 'warning');
        }
      }

      this.showMessage('Data saved successfully', 'success');
      
      console.log('📊 Data includes:');
      console.log('  - Education:', this.portfolioData.education?.length || 0, 'entries');
      console.log('  - Experience:', this.portfolioData.resumeExperience?.length || 0, 'entries');
      console.log('  - Skills:', this.portfolioData.resumeSkills?.length || 0, 'entries');
      
      // Trigger portfolio update if we're on the main portfolio page
      if (window.portfolioDataManager) {
        console.log('🔄 Triggering portfolio data refresh');
        window.portfolioDataManager.loadAdminData();
      } else {
        console.log('⚠️ Portfolio data manager not available');
      }
    } catch (error) {
      console.error('❌ Error saving portfolio data:', error);
      this.showMessage('Error saving data: ' + error.message, 'error');
    }
  }
  
  setupMobileMenu() {
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const sidebar = document.querySelector('.admin-sidebar');
    const mobileOverlay = document.getElementById('mobileOverlay');
    const sidebarClose = document.getElementById('sidebarClose');
    
    // Toggle mobile menu
    if (mobileMenuToggle) {
      mobileMenuToggle.addEventListener('click', () => {
        sidebar.classList.add('active');
        mobileOverlay.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent body scrolling
      });
    }
    
    // Close mobile menu
    const closeMobileMenu = () => {
      sidebar.classList.remove('active');
      mobileOverlay.classList.remove('active');
      document.body.style.overflow = ''; // Restore body scrolling
    };
    
    // Close button
    if (sidebarClose) {
      sidebarClose.addEventListener('click', closeMobileMenu);
    }
    
    // Overlay click
    if (mobileOverlay) {
      mobileOverlay.addEventListener('click', closeMobileMenu);
    }
    
    // Close menu when nav item is clicked (mobile)
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', () => {
        // Only auto-close on mobile screens
        if (window.innerWidth <= 768) {
          setTimeout(closeMobileMenu, 100); // Small delay to allow section switch
        }
      });
    });
    
    // Close menu on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && sidebar.classList.contains('active')) {
        closeMobileMenu();
      }
    });
  }

  // Data Management Functions
  setupDataManagement() {
    // Export Data Button
    const exportBtn = document.getElementById('exportDataBtn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.exportData());
    }

    // Import Data Button and File Input
    const importBtn = document.getElementById('importDataBtn');
    const importFile = document.getElementById('importDataFile');
    
    if (importBtn) {
      importBtn.addEventListener('click', () => {
        if (importFile) {
          importFile.click();
        }
      });
    }

    if (importFile) {
      importFile.addEventListener('change', (e) => this.importData(e));
    }

    // Clear Data Button
    const clearBtn = document.getElementById('clearDataBtn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => this.clearAllData());
    }
  }

  exportData() {
    try {
      const data = this.loadPortfolioData();
      if (!data || Object.keys(data).length === 0) {
        this.showMessage('No data to export. Add some content first.', 'warning');
        return;
      }

      // Add metadata to the export
      const exportData = {
        exportedAt: new Date().toISOString(),
        exportedFrom: window.location.hostname || 'localhost',
        version: '1.0',
        data: data
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `portfolio-data-${new Date().toISOString().split('T')[0]}.json`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      this.showMessage('Portfolio data exported successfully!', 'success');
      console.log('📦 Data exported:', exportData);
    } catch (error) {
      console.error('Export error:', error);
      this.showMessage('Error exporting data: ' + error.message, 'error');
    }
  }

  importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.type !== 'application/json') {
      this.showMessage('Please select a valid JSON file.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        
        // Validate the imported data structure
        if (!importedData.data) {
          throw new Error('Invalid data format. Missing data property.');
        }

        // Confirm import with user
        const confirmMsg = `Import data exported on ${importedData.exportedAt ? new Date(importedData.exportedAt).toLocaleDateString() : 'unknown date'}?\n\nThis will replace all current data. This action cannot be undone.`;
        
        if (confirm(confirmMsg)) {
          // Backup current data first
          this.createBackup();
          
          // Import the data
          localStorage.setItem('portfolioData', JSON.stringify(importedData.data));
          this.portfolioData = importedData.data;
          
          // Reload the current section to show imported data
          this.loadInitialData();
          
          this.showMessage('Portfolio data imported successfully!', 'success');
          console.log('📥 Data imported:', importedData);
        }
      } catch (error) {
        console.error('Import error:', error);
        this.showMessage('Error importing data: ' + error.message, 'error');
      }
    };

    reader.readAsText(file);
    // Clear the file input
    event.target.value = '';
  }

  createBackup() {
    try {
      const currentData = this.loadPortfolioData();
      const backupKey = `portfolioBackup_${Date.now()}`;
      localStorage.setItem(backupKey, JSON.stringify({
        timestamp: new Date().toISOString(),
        data: currentData
      }));
      
      // Keep only last 5 backups to prevent storage bloat
      this.cleanupOldBackups();
      
      console.log('💾 Backup created:', backupKey);
    } catch (error) {
      console.error('Backup error:', error);
    }
  }

  cleanupOldBackups() {
    try {
      const backupKeys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('portfolioBackup_')) {
          backupKeys.push({
            key: key,
            timestamp: parseInt(key.split('_')[1])
          });
        }
      }

      // Sort by timestamp and keep only the latest 5
      backupKeys.sort((a, b) => b.timestamp - a.timestamp);
      
      if (backupKeys.length > 5) {
        const toDelete = backupKeys.slice(5);
        toDelete.forEach(backup => {
          localStorage.removeItem(backup.key);
          console.log('🗑️ Deleted old backup:', backup.key);
        });
      }
    } catch (error) {
      console.error('Backup cleanup error:', error);
    }
  }

  clearAllData() {
    const confirmMsg = 'Are you sure you want to clear ALL portfolio data?\n\nThis action cannot be undone and will remove:\n- Profile information\n- Projects\n- Resume data\n- Certificates\n- Memories\n- All other content';
    
    if (confirm(confirmMsg)) {
      const doubleConfirm = 'This is your final warning!\n\nType "DELETE" to confirm permanent deletion of all data:';
      const confirmation = prompt(doubleConfirm);
      
      if (confirmation === 'DELETE') {
        // Create one final backup before clearing
        this.createBackup();
        
        // Clear the data
        localStorage.removeItem('portfolioData');
        this.portfolioData = this.getDefaultPortfolioData();
        
        // Reload the interface
        this.loadInitialData();
        
        this.showMessage('All portfolio data has been cleared.', 'success');
        console.log('🗑️ All data cleared');
      } else {
        this.showMessage('Data deletion cancelled.', 'info');
      }
    }
  }

  getDefaultPortfolioData() {
    return {
      profile: {},
      projects: [],
      certificates: [],
      memories: [],
      education: [],
      resumeExperience: [],
      resumeSkills: [],
      skills: [],
      experience: [],
      blog: []
    };
  }
}

// Initialize admin panel
const adminPanel = new AdminPanel();
