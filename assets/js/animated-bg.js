/**
 * Animated Canvas Background
 * Modern Interactive Animations
 */

class AnimatedBackground {
  constructor() {
    this.canvas = document.getElementById('animated-bg');
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.mouseX = 0;
    this.mouseY = 0;
    this.time = 0;
    
    this.init();
    this.createParticles();
    this.animate();
    this.handleEvents();
  }

  init() {
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
  }

  resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  createParticles() {
    const particleCount = Math.floor((this.canvas.width * this.canvas.height) / 15000);
    
    for (let i = 0; i < particleCount; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        size: Math.random() * 3 + 1,
        speedX: (Math.random() - 0.5) * 0.5,
        speedY: (Math.random() - 0.5) * 0.5,
        opacity: Math.random() * 0.5 + 0.2,
          hue: 0, // Grey hues
          life: Math.random() * 100,
          maxLife: Math.random() * 100 + 50
      });
    }
  }

  drawParticle(particle) {
    const gradient = this.ctx.createRadialGradient(
      particle.x, particle.y, 0,
      particle.x, particle.y, particle.size * 2
    );
    
    gradient.addColorStop(0, `hsla(0, 0%, 40%, ${particle.opacity})`);
    gradient.addColorStop(1, `hsla(0, 0%, 40%, 0)`);
    
    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    this.ctx.fill();
  }

  drawConnections() {
    for (let i = 0; i < this.particles.length; i++) {
      for (let j = i + 1; j < this.particles.length; j++) {
        const dx = this.particles[i].x - this.particles[j].x;
        const dy = this.particles[i].y - this.particles[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 120) {
          const opacity = (120 - distance) / 120 * 0.2;
          this.ctx.strokeStyle = `rgba(102, 102, 102, ${opacity})`;
          this.ctx.lineWidth = 1;
          this.ctx.beginPath();
          this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
          this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
          this.ctx.stroke();
        }
      }
    }
  }

  updateParticles() {
    this.particles.forEach((particle, index) => {
      // Mouse interaction
      const dx = this.mouseX - particle.x;
      const dy = this.mouseY - particle.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < 100) {
        const force = (100 - distance) / 100;
        particle.speedX += dx * force * 0.0001;
        particle.speedY += dy * force * 0.0001;
      }

      // Floating effect
      particle.x += particle.speedX + Math.sin(this.time * 0.01 + particle.x * 0.01) * 0.1;
      particle.y += particle.speedY + Math.cos(this.time * 0.01 + particle.y * 0.01) * 0.1;

      // Boundary wrapping
      if (particle.x < 0) particle.x = this.canvas.width;
      if (particle.x > this.canvas.width) particle.x = 0;
      if (particle.y < 0) particle.y = this.canvas.height;
      if (particle.y > this.canvas.height) particle.y = 0;

      // Life cycle
      particle.life++;
      if (particle.life > particle.maxLife) {
        particle.life = 0;
        particle.opacity = Math.random() * 0.5 + 0.2;
      }

      // Breathing effect
      particle.opacity += Math.sin(this.time * 0.02 + index) * 0.01;
      
      // Damping
      particle.speedX *= 0.99;
      particle.speedY *= 0.99;
    });
  }

  drawWaveEffect() {
    const amplitude = 30;
    const frequency = 0.02;
    
    this.ctx.strokeStyle = 'rgba(102, 102, 102, 0.1)';
    this.ctx.lineWidth = 2;
    
    for (let i = 0; i < 3; i++) {
      this.ctx.beginPath();
      for (let x = 0; x <= this.canvas.width; x += 10) {
        const y = this.canvas.height / 2 + 
          Math.sin(x * frequency + this.time * 0.01 + i * 2) * amplitude +
          Math.sin(x * frequency * 2 + this.time * 0.02 + i * 2) * amplitude * 0.5;
        
        if (x === 0) {
          this.ctx.moveTo(x, y);
        } else {
          this.ctx.lineTo(x, y);
        }
      }
      this.ctx.stroke();
    }
  }

  animate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Create gradient background
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    gradient.addColorStop(0, 'rgba(23, 16, 16, 0.1)');
    gradient.addColorStop(0.5, 'rgba(23, 16, 16, 0.05)');
    gradient.addColorStop(1, 'rgba(23, 16, 16, 0.1)');
    
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.drawWaveEffect();
    this.updateParticles();
    this.drawConnections();
    
    this.particles.forEach(particle => this.drawParticle(particle));
    
    this.time++;
    requestAnimationFrame(() => this.animate());
  }

  handleEvents() {
    document.addEventListener('mousemove', (e) => {
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;
    });

    // Add particles on click
    document.addEventListener('click', (e) => {
      for (let i = 0; i < 5; i++) {
        this.particles.push({
          x: e.clientX + (Math.random() - 0.5) * 20,
          y: e.clientY + (Math.random() - 0.5) * 20,
          size: Math.random() * 4 + 2,
          speedX: (Math.random() - 0.5) * 2,
          speedY: (Math.random() - 0.5) * 2,
          opacity: Math.random() * 0.8 + 0.2,
          hue: 0,
          life: 0,
          maxLife: 60
        });
      }
    });
  }
}

// Particle System for HTML Elements
class ParticleSystem {
  constructor() {
    this.container = document.getElementById('particles');
    this.createParticles();
  }

  createParticles() {
    for (let i = 0; i < 50; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.style.left = Math.random() * 100 + '%';
      particle.style.top = Math.random() * 100 + '%';
      particle.style.animationDelay = Math.random() * 3 + 's';
      particle.style.animationDuration = (Math.random() * 2 + 2) + 's';
      this.container.appendChild(particle);
    }
  }
}

// Enhanced Cursor Effect
class CursorEffect {
  constructor() {
    this.cursor = document.querySelector('.cursor-glow');
    this.init();
  }

  init() {
    document.addEventListener('mousemove', (e) => {
      this.cursor.style.left = e.clientX + 'px';
      this.cursor.style.top = e.clientY + 'px';
    });

    // Enhanced cursor on interactive elements
    const interactives = document.querySelectorAll('button, a, .hover-glow, .morph-btn');
    interactives.forEach(el => {
      el.addEventListener('mouseenter', () => {
        this.cursor.style.transform = 'translate(-50%, -50%) scale(1.5)';
        this.cursor.style.opacity = '1';
      });

      el.addEventListener('mouseleave', () => {
        this.cursor.style.transform = 'translate(-50%, -50%) scale(1)';
        this.cursor.style.opacity = '0.6';
      });
    });
  }
}

// Smooth Scrolling Animations
class ScrollAnimations {
  constructor() {
    this.observeElements();
  }

  observeElements() {
    const options = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
        }
      });
    }, options);

    document.querySelectorAll('.glass-card, .service-item, .timeline-item').forEach(el => {
      observer.observe(el);
    });
  }
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new AnimatedBackground();
  new ParticleSystem();
  new CursorEffect();
  new ScrollAnimations();
  
  // Enhanced preloader
  const preloader = document.getElementById('preloader');
  setTimeout(() => {
    preloader.style.opacity = '0';
    setTimeout(() => {
      preloader.style.display = 'none';
    }, 500);
  }, 2000);
});