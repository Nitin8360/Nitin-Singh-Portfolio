/**
 * Simple Auto-Scroll for Memories Section
 * Direct implementation that will definitely work
 */

function initMemoryAutoScroll() {
  console.log('🚀 Starting simple auto-scroll initialization...');
  
  const container = document.querySelector('.clients-list');
  if (!container) {
    console.error('❌ Container .clients-list not found');
    return;
  }
  
  const items = container.children;
  console.log(`📊 Found ${items.length} memory items`);
  
  if (items.length < 2) {
    console.log('⚠️ Need at least 2 items to scroll');
    return;
  }
  
  // Simple scroll variables
  let scrollDirection = 1; // 1 = right, -1 = left
  let scrollSpeed = 5; // Increased to 5 pixels per step for more visible movement
  let isScrolling = false;
  
  function startScrolling() {
    if (isScrolling) return;
    isScrolling = true;
    
    console.log('✅ Auto-scroll started!');
    
    let animationId;
    let lastTime = 0;
    const frameInterval = 200; // Update every 200ms for clearly visible movement
    
    function animate(currentTime) {
      if (currentTime - lastTime >= frameInterval) {
        const maxScroll = container.scrollWidth - container.clientWidth;
        
        console.log(`📊 Container: width=${container.clientWidth}, scrollWidth=${container.scrollWidth}, maxScroll=${maxScroll}`);
        
        if (maxScroll <= 0) {
          console.log('⚠️ Content fits, no scrolling needed');
          return;
        }
        
        // Change direction at edges
        if (container.scrollLeft >= maxScroll - 10) {
          scrollDirection = -1;
          console.log('← Scrolling left');
        } else if (container.scrollLeft <= 10) {
          scrollDirection = 1;
          console.log('→ Scrolling right');
        }
        
        // Apply scroll movement
        const oldScroll = container.scrollLeft;
        
        // Try multiple methods to ensure scrolling works
        const newPosition = container.scrollLeft + (scrollSpeed * scrollDirection);
        container.scrollLeft = newPosition; // Direct assignment
        container.scrollTo(newPosition, 0); // Use scrollTo method
        
        const newScroll = container.scrollLeft;
        
        // Log movement for debugging
        console.log(`📍 Scrolled: ${oldScroll} → ${newScroll} (direction: ${scrollDirection})`);
        
        lastTime = currentTime;
      }
      
      animationId = requestAnimationFrame(animate);
    }
    
    animationId = requestAnimationFrame(animate);
    
    // Add visual indicator
    addScrollIndicator();
    
    // Store animation ID for cleanup
    container._autoScrollAnimation = animationId;
  }
  
  function addScrollIndicator() {
    const clientsSection = document.querySelector('.clients');
    if (!clientsSection) return;
    
    const indicator = document.createElement('div');
    indicator.id = 'scroll-indicator';
    indicator.innerHTML = '🔄 Auto-scrolling';
    indicator.style.cssText = `
      position: absolute;
      top: 10px;
      right: 10px;
      background: #ffdb70;
      color: #2e2e2e;
      padding: 5px 10px;
      border-radius: 15px;
      font-size: 12px;
      font-weight: bold;
      z-index: 999;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    `;
    
    clientsSection.style.position = 'relative';
    clientsSection.appendChild(indicator);
    
    console.log('📋 Scroll indicator added');
  }
  
  // Start scrolling after 2 seconds
  setTimeout(() => {
    console.log('⏰ Starting auto-scroll in 2 seconds...');
    startScrolling();
  }, 2000);
}

// Multiple initialization methods to ensure it works
document.addEventListener('DOMContentLoaded', () => {
  console.log('📄 DOM loaded - attempting auto-scroll...');
  initMemoryAutoScroll();
});

window.addEventListener('load', () => {
  console.log('🌐 Window loaded - backup auto-scroll attempt...');
  setTimeout(initMemoryAutoScroll, 1000);
});

// Force initialization after 5 seconds as final fallback
setTimeout(() => {
  console.log('🔥 Force initialization after 5 seconds...');
  initMemoryAutoScroll();
}, 5000);

console.log('📜 Auto-scroll script loaded');
