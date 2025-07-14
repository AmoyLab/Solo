// Haptic feedback utility functions
export const haptics = {
  // Light tap feedback
  light: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(20);
    }
  },
  
  // Medium feedback for interactions
  medium: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
  },
  
  // Heavy feedback for important actions
  heavy: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(100);
    }
  },
  
  // Success pattern
  success: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([50, 30, 50, 30, 50]);
    }
  },
  
  // Error pattern
  error: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([100, 50, 100, 50, 100]);
    }
  },
  
  // Drag start pattern
  dragStart: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([30, 20, 30]);
    }
  },
  
  // Hover over drop zone
  dragHover: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(15);
    }
  },
  
  // Check if haptics are supported
  isSupported: () => {
    return 'vibrate' in navigator;
  }
};

// CSS animation utility for visual feedback
export const addShakeAnimation = (element: HTMLElement) => {
  element.style.animation = 'shake 0.3s ease-in-out';
  setTimeout(() => {
    element.style.animation = '';
  }, 300);
};

// Add shake keyframe to CSS if not already present
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-5px); }
      75% { transform: translateX(5px); }
    }
    
    @keyframes pulse-glow {
      0%, 100% { box-shadow: 0 0 0 0 rgba(var(--primary), 0.7); }
      50% { box-shadow: 0 0 0 10px rgba(var(--primary), 0); }
    }
    
    .drag-pulse {
      animation: pulse-glow 1s infinite;
    }
  `;
  document.head.appendChild(style);
}