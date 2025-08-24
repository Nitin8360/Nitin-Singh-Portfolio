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
    // Auto-scroll is now handled by separate auto-scroll.js file
  }

  loadAdminData() {
    const adminData = localStorage.getItem('portfolioData');
    if (adminData) {
      const data = JSON.parse(adminData);
      this.updatePortfolioElements(data);
    }
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
  console.log('DOM loaded, initializing portfolio data manager...');
  window.portfolioDataManager = new PortfolioDataManager();
  
  // Force auto-scroll setup after a delay to ensure it works
  setTimeout(() => {
    console.log('Force-initializing auto-scroll after 3 seconds...');
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
