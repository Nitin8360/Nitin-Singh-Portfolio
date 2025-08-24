/**
 * Portfolio Data Manager
 * This script handles syncing data between admin panel and main portfolio
 */

class PortfolioDataManager {
  constructor() {
    this.init();
  }

  init() {
    // Load admin data and apply to portfolio if available
    this.loadAdminData();
    // Setup memory modal functionality
    this.setupMemoryModal();
    // Setup resume data refresh
    this.setupResumeRefresh();
    // Auto-scroll is now handled by separate auto-scroll.js file
  }

  setupResumeRefresh() {
    // Listen for storage changes (when admin panel updates data)
    window.addEventListener('storage', (e) => {
      if (e.key === 'portfolioData' && e.newValue) {
        console.log('Portfolio data updated from admin panel, refreshing...');
        this.loadAdminData();
      }
    });

    // Also check for updates every few seconds when tab is active
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        // Page became visible, check for updates
        setTimeout(() => {
          this.loadAdminData();
        }, 500);
      }
    });

    // Hook into navigation to refresh resume data when resume page is viewed
    const navigationLinks = document.querySelectorAll("[data-nav-link]");
    navigationLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        const targetPage = e.target.innerHTML.toLowerCase();
        if (targetPage === 'resume') {
          console.log('🎯 Resume page selected, refreshing data...');
          setTimeout(() => {
            this.refreshResumeData();
          }, 500); // Small delay to ensure page is visible
        }
      });
    });

    // Also listen for when resume page becomes active
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          const resumePage = document.querySelector('[data-page="resume"]');
          if (resumePage && resumePage.classList.contains('active')) {
            console.log('🎯 Resume page became active via mutation observer');
            setTimeout(() => {
              this.refreshResumeData();
            }, 200);
          }
        }
      });
    });

    // Observe the resume page for class changes
    const resumePage = document.querySelector('[data-page="resume"]');
    if (resumePage) {
      observer.observe(resumePage, { attributes: true, attributeFilter: ['class'] });
    }
  }

  // Wait for Firebase manager with retry logic (similar to admin.js)
  async waitForFirebaseManager(maxAttempts = 5, delay = 1000) {
    console.log('🔄 Portfolio: Waiting for Firebase manager...');
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      console.log(`🔍 Portfolio attempt ${attempt}/${maxAttempts} - Checking Firebase manager...`);
      
      if (window.firebaseManager && window.firebaseManager.isInitialized) {
        console.log('✅ Portfolio: Firebase manager is ready!');
        return window.firebaseManager;
      }
      
      // Try to manually initialize if available
      if (window.initializeFirebaseManager) {
        console.log('🔧 Portfolio: Trying manual Firebase initialization...');
        try {
          const success = window.initializeFirebaseManager();
          if (success && window.firebaseManager && window.firebaseManager.isInitialized) {
            console.log('✅ Portfolio: Manual initialization successful!');
            return window.firebaseManager;
          }
        } catch (error) {
          console.log('⚠️ Portfolio: Manual initialization failed:', error.message);
        }
      }
      
      // Try backup Firebase manager creation
      if (attempt === maxAttempts && typeof createBackupFirebaseManager === 'function') {
        console.log('🚨 Portfolio: Trying backup Firebase manager...');
        try {
          const success = createBackupFirebaseManager();
          if (success && window.firebaseManager && window.firebaseManager.isInitialized) {
            console.log('✅ Portfolio: Backup Firebase manager successful!');
            return window.firebaseManager;
          }
        } catch (error) {
          console.log('⚠️ Portfolio: Backup Firebase manager failed:', error.message);
        }
      }
      
      if (attempt < maxAttempts) {
        console.log(`⏰ Portfolio: Waiting ${delay}ms before next attempt...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    console.log('⚠️ Portfolio: Firebase manager not available after all attempts');
    return null;
  }

  async loadAdminData() {
    let data = null;
    
    console.log('🔄 Portfolio page: Starting data load...');
    console.log('🔍 Firebase manager check:', !!window.firebaseManager);
    console.log('🔍 Firebase initialized:', window.firebaseManager?.isInitialized);
    
    // Wait for Firebase manager with retry logic (like in admin.js)
    const firebaseManager = await this.waitForFirebaseManager(5, 1000);
    
    if (firebaseManager && firebaseManager.isInitialized) {
      console.log('📥 Loading portfolio data from Firebase...');
      data = await firebaseManager.loadFromFirebase();
      
      if (data) {
        console.log('✅ Portfolio data loaded from Firebase');
      }
    }
    
    // Fallback to localStorage if Firebase data is not available
    if (!data) {
      console.log('📥 Loading portfolio data from localStorage...');
      const adminData = localStorage.getItem('portfolioData');
      
      if (adminData) {
        try {
          data = JSON.parse(adminData);
          console.log('✅ Portfolio data loaded from localStorage');
        } catch (error) {
          console.error('❌ Error parsing admin data:', error);
          return;
        }
      } else {
        console.log('❌ No portfolio data found');
        return;
      }
    }

    console.log('📊 Updating portfolio elements with loaded data');
    this.updatePortfolioElements(data);
  }

  updatePortfolioElements(data) {
    // Update profile information
    if (data.profile) {
      this.updateProfile(data.profile);
    }

    // Update projects
    if (data.projects && data.projects.length > 0) {
      this.updateProjects(data.projects);
    }

    // Update certificates (add to resume section)
    if (data.certificates && data.certificates.length > 0) {
      this.updateCertificates(data.certificates);
    }

    // Update memories
    if (data.memories && data.memories.length > 0) {
      this.updateMemories(data.memories);
    }

    // Update resume data
    if (data.education && data.education.length > 0) {
      console.log('Updating education with', data.education.length, 'entries');
      this.updateEducation(data.education);
    } else {
      console.log('No education data found');
    }

    if (data.resumeExperience && data.resumeExperience.length > 0) {
      console.log('Updating experience with', data.resumeExperience.length, 'entries');
      this.updateResumeExperience(data.resumeExperience);
    } else {
      console.log('No experience data found');
    }

    if (data.resumeSkills && data.resumeSkills.length > 0) {
      console.log('Updating skills with', data.resumeSkills.length, 'entries');
      this.updateResumeSkills(data.resumeSkills);
    } else {
      console.log('No skills data found');
    }
  }

  updateProfile(profile) {
    // Update name
    if (profile.fullName) {
      const nameElements = document.querySelectorAll('.name');
      nameElements.forEach(el => {
        el.textContent = profile.fullName;
        el.setAttribute('title', profile.fullName);
      });
    }

    // Update title
    if (profile.title) {
      const titleElements = document.querySelectorAll('.title');
      titleElements.forEach(el => {
        if (el.tagName === 'P') { // Only update <p> elements, not page titles
          el.textContent = profile.title;
        }
      });
    }

    // Update avatar image
    if (profile.avatar) {
      const avatarElements = document.querySelectorAll('.avatar-box img, .my-avatar');
      avatarElements.forEach(el => {
        el.src = profile.avatar;
      });
    }

    // Update contact info
    if (profile.email) {
      const emailLink = document.querySelector('a[href^="mailto:"]');
      if (emailLink) {
        emailLink.href = `mailto:${profile.email}`;
        emailLink.textContent = profile.email;
      }
    }

    if (profile.phone) {
      const phoneLink = document.querySelector('a[href^="tel:"]');
      if (phoneLink) {
        phoneLink.href = `tel:${profile.phone.replace(/\s/g, '')}`;
        phoneLink.textContent = profile.phone;
      }
    }

    if (profile.birthday) {
      const birthdayElement = document.querySelector('time[datetime]');
      if (birthdayElement) {
        const date = new Date(profile.birthday);
        birthdayElement.setAttribute('datetime', profile.birthday);
        birthdayElement.textContent = date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      }
    }

    if (profile.location) {
      const locationElement = document.querySelector('address');
      if (locationElement) {
        locationElement.textContent = profile.location;
      }
    }

    // Update about text
    if (profile.aboutText) {
      const aboutSection = document.querySelector('.about-text');
      if (aboutSection) {
        const paragraphs = profile.aboutText.split('\n\n');
        aboutSection.innerHTML = paragraphs.map(p => `<p>${p}</p>`).join('');
      }
    }
  }

  updateProjects(projects) {
    const projectList = document.querySelector('.project-list');
    if (!projectList) return;

    // Clear existing projects
    projectList.innerHTML = '';

    // Add new projects
    projects.forEach(project => {
      const projectElement = this.createProjectElement(project);
      projectList.appendChild(projectElement);
    });
  }

  createProjectElement(project) {
    const li = document.createElement('li');
    li.className = 'project-item active';
    li.setAttribute('data-filter-item', '');
    li.setAttribute('data-category', project.category);

    li.innerHTML = `
      <a href="${project.url || '#'}">
        <figure class="project-img">
          <div class="project-item-icon-box">
            <ion-icon name="eye-outline"></ion-icon>
          </div>
          <img src="${project.image || './assets/images/project-1.jpg'}" alt="${project.title}" loading="lazy">
        </figure>
        <h3 class="project-title">${project.title}</h3>
        <p class="project-category">${project.category}</p>
      </a>
    `;

    return li;
  }

  updateCertificates(certificates) {
    // Add certificates to the resume section
    const resumeSection = document.querySelector('.resume');
    if (!resumeSection) return;

    // Check if certificates section already exists
    let certificatesSection = resumeSection.querySelector('.certificates-timeline');
    
    if (!certificatesSection) {
      // Create certificates section
      certificatesSection = document.createElement('section');
      certificatesSection.className = 'timeline certificates-timeline';
      certificatesSection.innerHTML = `
        <div class="title-wrapper">
          <div class="icon-box">
            <ion-icon name="trophy-outline"></ion-icon>
          </div>
          <h3 class="h3">Certificates</h3>
        </div>
        <ol class="timeline-list certificates-list"></ol>
      `;
      
      // Insert after skills section or at the end
      const skillsSection = resumeSection.querySelector('.skill');
      if (skillsSection) {
        skillsSection.parentNode.insertBefore(certificatesSection, skillsSection.nextSibling);
      } else {
        resumeSection.appendChild(certificatesSection);
      }
    }

    const certificatesList = certificatesSection.querySelector('.certificates-list');
    certificatesList.innerHTML = '';

    certificates.forEach(cert => {
      const certElement = this.createCertificateElement(cert);
      certificatesList.appendChild(certElement);
    });
  }

  createCertificateElement(certificate) {
    const li = document.createElement('li');
    li.className = 'timeline-item';

    const date = new Date(certificate.date);
    const formattedDate = date.getFullYear();

    li.innerHTML = `
      <h4 class="h4 timeline-item-title">${certificate.title}</h4>
      <span>${formattedDate}</span>
      <p class="timeline-text">
        Issued by ${certificate.issuer}
        ${certificate.url ? `<br><a href="${certificate.url}" target="_blank" rel="noopener">View Certificate</a>` : ''}
      </p>
    `;

    return li;
  }

  updateMemories(memories) {
    const memoriesList = document.querySelector('.clients-list');
    if (!memoriesList) return;

    // Clear existing memories
    memoriesList.innerHTML = '';

    // Add new memories
    memories.forEach(memory => {
      const memoryElement = this.createMemoryElement(memory);
      memoriesList.appendChild(memoryElement);
    });
    
    // Auto-scroll is now handled by separate auto-scroll.js file
    // It will automatically detect when memories are updated
  }

  createMemoryElement(memory) {
    const li = document.createElement('li');
    li.className = 'clients-item';

    li.innerHTML = `
      <a href="#" onclick="portfolioDataManager.showMemoryModal(${memory.id}); return false;">
        <img src="${memory.image || './assets/images/avatar-1.png'}" alt="${memory.title}" title="${memory.title}${memory.description ? ' - ' + memory.description : ''}">
      </a>
    `;

    return li;
  }

  // Resume Update Methods
  updateEducation(education) {
    console.log('📚 updateEducation called with:', education);
    
    // Wait a bit to ensure DOM is ready
    setTimeout(() => {
      const resumeSection = document.querySelector('.resume');
      if (!resumeSection) {
        console.log('❌ Resume section not found (.resume)');
        // Try alternative selectors
        const resumeAlt = document.querySelector('[data-page="resume"]');
        if (resumeAlt) {
          console.log('✅ Found resume section with data-page attribute');
          this.updateEducationInSection(resumeAlt, education);
        }
        return;
      }

      this.updateEducationInSection(resumeSection, education);
    }, 100);
  }

  updateEducationInSection(resumeSection, education) {
    // Find the education timeline section
    let educationSection = resumeSection.querySelector('.timeline:first-child');
    if (!educationSection) {
      console.log('❌ Education timeline section not found');
      // Let's try to find any timeline
      const allTimelines = resumeSection.querySelectorAll('.timeline');
      console.log('Found', allTimelines.length, 'timeline sections');
      if (allTimelines.length > 0) {
        educationSection = allTimelines[0];
        console.log('✅ Using first timeline for education');
      } else {
        console.log('❌ No timeline sections found at all');
        return;
      }
    }

    const timelineList = educationSection.querySelector('.timeline-list');
    if (!timelineList) {
      console.log('❌ Education timeline list not found');
      console.log('Available elements in education section:', educationSection.innerHTML.substring(0, 200));
      return;
    }

    console.log('✅ Found education timeline list, updating with', education.length, 'items');

    // Clear existing education entries
    timelineList.innerHTML = '';

    // Add new education entries
    education.forEach((edu, index) => {
      console.log(`Adding education item ${index + 1}:`, edu);
      const educationElement = this.createEducationElement(edu);
      timelineList.appendChild(educationElement);
    });

    console.log('✅ Education update complete - DOM updated');
  }

  createEducationElement(education) {
    const li = document.createElement('li');
    li.className = 'timeline-item';

    li.innerHTML = `
      <h4 class="h4 timeline-item-title">${education.title}</h4>
      ${education.institution ? `<h5>${education.institution}</h5>` : ''}
      <span>${education.startYear} — ${education.endYear}</span>
      <p class="timeline-text">
        ${education.description || 'No additional details provided.'}
      </p>
    `;

    return li;
  }

  updateResumeExperience(experience) {
    console.log('💼 updateResumeExperience called with:', experience);
    
    setTimeout(() => {
      const resumeSection = document.querySelector('.resume') || document.querySelector('[data-page="resume"]');
      if (!resumeSection) {
        console.log('❌ Resume section not found for experience');
        return;
      }

      // Find the experience timeline section (usually the second timeline)
      const timelineSections = resumeSection.querySelectorAll('.timeline');
      let experienceSection = null;
      
      console.log('Found', timelineSections.length, 'timeline sections');
      
      // Look for the section with "Experience" heading
      timelineSections.forEach((section, index) => {
        const heading = section.querySelector('h3');
        console.log(`Timeline ${index + 1} heading:`, heading ? heading.textContent : 'No heading');
        if (heading && heading.textContent.toLowerCase().includes('experience')) {
          experienceSection = section;
          console.log('✅ Found experience section at index', index);
        }
      });

      if (!experienceSection && timelineSections.length > 1) {
        experienceSection = timelineSections[1]; // Fallback to second timeline
        console.log('Using fallback: second timeline section for experience');
      }

      if (!experienceSection) {
        console.log('❌ Experience section not found');
        return;
      }

      const timelineList = experienceSection.querySelector('.timeline-list');
      if (!timelineList) {
        console.log('❌ Experience timeline list not found');
        return;
      }

      console.log('✅ Found experience timeline list, updating with', experience.length, 'items');

      // Clear existing experience entries
      timelineList.innerHTML = '';

      // Add new experience entries
      experience.forEach((exp, index) => {
        console.log(`Adding experience item ${index + 1}:`, exp);
        const experienceElement = this.createExperienceElement(exp);
        timelineList.appendChild(experienceElement);
      });

      console.log('✅ Experience update complete - DOM updated');
    }, 100);
  }

  createExperienceElement(experience) {
    const li = document.createElement('li');
    li.className = 'timeline-item';

    li.innerHTML = `
      <h4 class="h4 timeline-item-title">${experience.title}</h4>
      ${experience.company ? `<h5>${experience.company}</h5>` : ''}
      <span>${experience.startYear} — ${experience.endYear}</span>
      <p class="timeline-text">
        ${experience.description || 'No additional details provided.'}
      </p>
    `;

    return li;
  }

  updateResumeSkills(skills) {
    console.log('⚡ updateResumeSkills called with:', skills);
    
    setTimeout(() => {
      const resumeSection = document.querySelector('.resume') || document.querySelector('[data-page="resume"]');
      if (!resumeSection) {
        console.log('❌ Resume section not found for skills');
        return;
      }

      // Find the skills section
      let skillsSection = resumeSection.querySelector('.skill');
      if (!skillsSection) {
        console.log('❌ Skills section not found (.skill)');
        // Try alternative selector
        skillsSection = resumeSection.querySelector('.skills');
        if (skillsSection) {
          console.log('✅ Found skills section with .skills class');
        } else {
          console.log('❌ No skills section found at all');
          return;
        }
      }

      const skillsList = skillsSection.querySelector('.skills-list');
      if (!skillsList) {
        console.log('❌ Skills list not found');
        console.log('Available elements in skills section:', skillsSection.innerHTML.substring(0, 200));
        return;
      }

      console.log('✅ Found skills list, updating with', skills.length, 'items');

      // Clear existing skills
      skillsList.innerHTML = '';

      // Add new skills
      skills.forEach((skill, index) => {
        console.log(`Adding skill item ${index + 1}:`, skill);
        const skillElement = this.createSkillElement(skill);
        skillsList.appendChild(skillElement);
      });

      console.log('✅ Skills update complete - DOM updated');
    }, 100);
  }

  createSkillElement(skill) {
    const li = document.createElement('li');
    li.className = 'skills-item';

    li.innerHTML = `
      <div class="title-wrapper">
        <h5 class="h5">${skill.name}</h5>
        <data value="${skill.level}">${skill.level}%</data>
      </div>
      <div class="skill-progress-bg">
        <div class="skill-progress-fill" style="width: ${skill.level}%;"></div>
      </div>
    `;

    return li;
  }

  // Method to explicitly refresh resume data
  refreshResumeData() {
    console.log('🔄 Refreshing resume data...');
    const adminData = localStorage.getItem('portfolioData');
    if (!adminData) {
      console.log('❌ No portfolio data found in localStorage');
      alert('No resume data found. Please add data in the admin panel first.');
      return;
    }

    try {
      const data = JSON.parse(adminData);
      console.log('📊 Current portfolio data:', data);
      
      // Check each section
      console.log('🎓 Education data:', data.education || 'None');
      console.log('💼 Experience data:', data.resumeExperience || 'None');
      console.log('⚡ Skills data:', data.resumeSkills || 'None');
      
      let hasData = false;
      
      if (data.education && data.education.length > 0) {
        console.log('Updating education:', data.education.length, 'entries');
        this.updateEducation(data.education);
        hasData = true;
      } else {
        console.log('No education data found');
      }

      if (data.resumeExperience && data.resumeExperience.length > 0) {
        console.log('Updating experience:', data.resumeExperience.length, 'entries');
        this.updateResumeExperience(data.resumeExperience);
        hasData = true;
      } else {
        console.log('No experience data found');
      }

      if (data.resumeSkills && data.resumeSkills.length > 0) {
        console.log('Updating skills:', data.resumeSkills.length, 'entries');
        this.updateResumeSkills(data.resumeSkills);
        hasData = true;
      } else {
        console.log('No skills data found');
      }

      if (!hasData) {
        console.log('❌ No resume data found in any section');
        alert('No resume data found. Please add education, experience, or skills in the admin panel.');
      } else {
        console.log('✅ Resume data refresh completed successfully');
      }
    } catch (error) {
      console.error('❌ Error parsing portfolio data:', error);
      alert('Error loading resume data: ' + error.message);
    }
  }

  showMemoryModal(memoryId) {
    // Get the current memories data
    const adminData = localStorage.getItem('portfolioData');
    if (!adminData) return;

    const data = JSON.parse(adminData);
    const memory = data.memories && data.memories.find(m => m.id == memoryId);
    
    if (!memory) return;

    // Populate modal with memory data
    document.getElementById('modalMemoryImage').src = memory.image || './assets/images/avatar-1.png';
    document.getElementById('modalMemoryTitle').textContent = memory.title || 'Untitled Memory';
    document.getElementById('modalMemoryCategory').textContent = memory.category || 'General';
    
    // Format date
    const dateSpan = document.getElementById('modalMemoryDate');
    if (memory.date) {
      const date = new Date(memory.date);
      dateSpan.textContent = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } else {
      dateSpan.textContent = 'Date not specified';
    }
    
    document.getElementById('modalMemoryDescription').textContent = memory.description || 'No description provided.';

    // Show modal
    const modal = document.getElementById('memoryModal');
    modal.style.display = 'block';
    
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
  }

  setupMemoryModal() {
    const modal = document.getElementById('memoryModal');
    const closeBtn = document.querySelector('.memory-modal-close');

    // Close modal when clicking the close button
    if (closeBtn) {
      closeBtn.addEventListener('click', this.closeMemoryModal);
    }

    // Close modal when clicking outside of modal content
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.closeMemoryModal();
        }
      });
    }

    // Close modal with Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal && modal.style.display === 'block') {
        this.closeMemoryModal();
      }
    });
  }

  closeMemoryModal() {
    const modal = document.getElementById('memoryModal');
    if (modal) {
      modal.style.display = 'none';
      document.body.style.overflow = 'auto';
    }
  }

  setupMemoryAutoScroll() {
    // Clear any existing auto-scroll first
    if (this.memoryScrollInterval) {
      clearInterval(this.memoryScrollInterval);
      this.memoryScrollInterval = null;
    }
    
    const memoriesContainer = document.querySelector('.clients-list');
    if (!memoriesContainer) {
      console.log('❌ Memories container not found');
      return;
    }

    // Check if there are enough items to scroll
    const items = memoriesContainer.children;
    if (items.length < 2) {
      console.log('❌ Not enough memory items to scroll:', items.length);
      return;
    }

    console.log('✅ Setting up auto-scroll for', items.length, 'memory items');

    let scrollDirection = 1; // 1 for right, -1 for left
    let scrollSpeed = 2; // Start with slower, more visible speed
    let isHovered = false;
    let isPaused = false;

    // Add auto-scroll indicator
    const addScrollIndicator = () => {
      const clientsSection = document.querySelector('.clients');
      if (!clientsSection) return;
      
      // Remove existing indicator
      const existingIndicator = clientsSection.querySelector('.auto-scroll-indicator');
      if (existingIndicator) existingIndicator.remove();
      
      const indicator = document.createElement('div');
      indicator.className = 'auto-scroll-indicator';
      indicator.innerHTML = '↔ Auto-scrolling';
      indicator.style.cssText = `
        position: absolute;
        top: 10px;
        right: 10px;
        background: var(--orange-yellow-crayola);
        color: var(--eerie-black-2);
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 10px;
        font-weight: 500;
        z-index: 2;
        opacity: 0.8;
        transition: opacity 0.3s ease;
        pointer-events: none;
      `;
      clientsSection.appendChild(indicator);
      return indicator;
    };

    const startAutoScroll = () => {
      if (this.memoryScrollInterval) {
        console.log('⚠️ Auto-scroll already running');
        return;
      }
      
      console.log('🚀 Starting auto-scroll with 30ms intervals...');
      this.memoryScrollInterval = setInterval(() => {
        if (isHovered || isPaused) return;

        const container = memoriesContainer;
        const maxScroll = container.scrollWidth - container.clientWidth;
        
        if (maxScroll <= 0) {
          console.log('⚠️ No scrolling needed - content fits in container');
          return;
        }

        // Change direction when reaching edges
        if (container.scrollLeft >= maxScroll - 10) {
          scrollDirection = -1;
          console.log('🔄 Direction: Left');
        } else if (container.scrollLeft <= 10) {
          scrollDirection = 1;
          console.log('🔄 Direction: Right');
        }

        // Apply scrolling
        const oldScroll = container.scrollLeft;
        container.scrollLeft += scrollSpeed * scrollDirection;
        const newScroll = container.scrollLeft;
        
        // Debug: Log only when scroll actually changes
        if (Math.abs(newScroll - oldScroll) > 0) {
          console.log(`📍 Scrolled: ${oldScroll} → ${newScroll} (${scrollDirection > 0 ? 'right' : 'left'})`);
        }
      }, 30); // 30ms = ~33fps for visible animation
    };

    const stopAutoScroll = () => {
      if (this.memoryScrollInterval) {
        clearInterval(this.memoryScrollInterval);
        this.memoryScrollInterval = null;
        console.log('⏹️ Auto-scroll stopped');
      }
    };

    // Hover pause functionality
    memoriesContainer.addEventListener('mouseenter', () => {
      isHovered = true;
      console.log('⏸️ Hover pause');
    });

    memoriesContainer.addEventListener('mouseleave', () => {
      isHovered = false;
      console.log('▶️ Hover resume');
    });

    // Manual scroll pause
    memoriesContainer.addEventListener('scroll', () => {
      if (!isPaused) {
        isPaused = true;
        stopAutoScroll();
        console.log('⏸️ Manual scroll detected - pausing auto-scroll');
        
        const indicator = document.querySelector('.auto-scroll-indicator');
        if (indicator) indicator.style.opacity = '0.3';
        
        // Resume after 3 seconds
        setTimeout(() => {
          isPaused = false;
          if (indicator) indicator.style.opacity = '0.8';
          console.log('▶️ Resuming auto-scroll');
          startAutoScroll();
        }, 3000);
      }
    });

    // Start immediately
    const indicator = addScrollIndicator();
    console.log('⏱️ Starting auto-scroll in 1 second...');
    setTimeout(() => {
      startAutoScroll();
    }, 1000); // 1 second delay

    // Store reference for cleanup
    this.stopMemoryScroll = stopAutoScroll;
  }

  // Debug method to show current data
  debugPortfolioData() {
    const data = localStorage.getItem('portfolioData');
    if (data) {
      const parsed = JSON.parse(data);
      console.log('🔍 DEBUG: Full portfolio data structure:', parsed);
      console.log('🔍 DEBUG: Education entries:', parsed.education?.length || 0);
      console.log('🔍 DEBUG: Experience entries:', parsed.resumeExperience?.length || 0);
      console.log('🔍 DEBUG: Skills entries:', parsed.resumeSkills?.length || 0);
      return parsed;
    } else {
      console.log('🔍 DEBUG: No data in localStorage');
      return null;
    }
  }

  // Method to save current portfolio state
  saveCurrentState() {
    const currentData = {
      profile: this.extractProfileData(),
      projects: this.extractProjectsData(),
      // Add other sections as needed
    };

    localStorage.setItem('portfolioData', JSON.stringify(currentData));
    return currentData;
  }

  extractProfileData() {
    const nameEl = document.querySelector('.name');
    const titleEl = document.querySelector('.title');
    const emailEl = document.querySelector('a[href^="mailto:"]');
    const phoneEl = document.querySelector('a[href^="tel:"]');
    const birthdayEl = document.querySelector('time[datetime]');
    const locationEl = document.querySelector('address');
    const aboutEl = document.querySelector('.about-text');

    return {
      fullName: nameEl ? nameEl.textContent : '',
      title: titleEl ? titleEl.textContent : '',
      email: emailEl ? emailEl.textContent : '',
      phone: phoneEl ? phoneEl.textContent : '',
      birthday: birthdayEl ? birthdayEl.getAttribute('datetime') : '',
      location: locationEl ? locationEl.textContent : '',
      aboutText: aboutEl ? Array.from(aboutEl.querySelectorAll('p')).map(p => p.textContent).join('\n\n') : ''
    };
  }

  extractProjectsData() {
    const projects = [];
    const projectItems = document.querySelectorAll('.project-item');

    projectItems.forEach((item, index) => {
      const link = item.querySelector('a');
      const img = item.querySelector('.project-img img');
      const title = item.querySelector('.project-title');
      const category = item.querySelector('.project-category');

      if (title) {
        projects.push({
          id: index + 1,
          title: title.textContent,
          category: category ? category.textContent : 'web development',
          image: img ? img.src : './assets/images/project-1.jpg',
          url: link ? link.href : '#',
          description: ''
        });
      }
    });

    return projects;
  }
}

// Initialize data manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('📱 DOM loaded, initializing portfolio data manager...');
  window.portfolioDataManager = new PortfolioDataManager();
  
  // Make debug function globally available
  window.debugPortfolioData = () => {
    if (window.portfolioDataManager) {
      return window.portfolioDataManager.debugPortfolioData();
    } else {
      console.log('❌ Portfolio data manager not initialized');
      return null;
    }
  };
  
  // Add a test function to create sample data
  window.addTestResumeData = () => {
    const testData = {
      profile: {},
      projects: [],
      certificates: [],
      memories: [],
      education: [
        {
          id: 1,
          title: "Bachelor of Computer Science",
          institution: "Test University",
          startYear: 2018,
          endYear: 2022,
          description: "Studied computer science with focus on web development and software engineering."
        }
      ],
      resumeExperience: [
        {
          id: 1,
          title: "Web Developer",
          company: "Test Company Inc.",
          startYear: 2022,
          endYear: "Present",
          description: "Developed responsive web applications using modern frameworks and technologies."
        }
      ],
      resumeSkills: [
        {
          id: 1,
          name: "JavaScript",
          level: 85,
          category: "Programming"
        },
        {
          id: 2,
          name: "React",
          level: 80,
          category: "Framework"
        }
      ],
      skills: [],
      experience: [],
      blog: []
    };
    
    localStorage.setItem('portfolioData', JSON.stringify(testData));
    console.log('✅ Test resume data added to localStorage');
    if (window.portfolioDataManager) {
      window.portfolioDataManager.refreshResumeData();
    }
  };
  
  // Force refresh resume data after a short delay
  setTimeout(() => {
    console.log('⏰ Force refreshing resume data after 1 second...');
    if (window.portfolioDataManager) {
      window.portfolioDataManager.refreshResumeData();
    }
  }, 1000);
  
  // Force auto-scroll setup after a delay to ensure it works
  setTimeout(() => {
    console.log('📜 Force-initializing auto-scroll after 3 seconds...');
    if (window.portfolioDataManager) {
      window.portfolioDataManager.setupMemoryAutoScroll();
    }
  }, 3000); // 3000ms = 3 seconds for guaranteed initialization
});

// Additional fallback using window.onload
window.addEventListener('load', () => {
  console.log('Window fully loaded, attempting auto-scroll setup...');
  setTimeout(() => {
    const memoriesContainer = document.querySelector('.clients-list');
    if (memoriesContainer && memoriesContainer.children.length > 0) {
      console.log('Window load: Setting up auto-scroll directly');
      if (window.portfolioDataManager) {
        window.portfolioDataManager.setupMemoryAutoScroll();
      } else {
        // Create instance if it doesn't exist
        window.portfolioDataManager = new PortfolioDataManager();
        setTimeout(() => {
          window.portfolioDataManager.setupMemoryAutoScroll();
        }, 100);
      }
    }
  }, 1000);
});
