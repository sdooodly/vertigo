import gsap from 'gsap';
import { WORLD_HEIGHT } from '../components/Environment.js';
import { LANDMARKS } from '../altitude.js';

const H = WORLD_HEIGHT;

/**
 * Clamped scroll — no wrapping.
 * Y=0 is core (bottom), Y=H is Sun (top).
 * Start at sea level (norm 0.5 = Y=2500).
 */
export function createScrollController(env) {
  let currentY = H * 0.5; // sea level
  const scrollSpeed = 0.15;

  window.addEventListener('wheel', (e) => {
    e.preventDefault();
    currentY += e.deltaY * scrollSpeed; // scroll up = go higher
    currentY = Math.max(0, Math.min(H, currentY)); // clamp
  }, { passive: false });

  let touchStartY = 0;
  window.addEventListener('touchstart', (e) => {
    touchStartY = e.touches[0].clientY;
  }, { passive: true });
  window.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const dy = touchStartY - e.touches[0].clientY;
    touchStartY = e.touches[0].clientY;
    currentY += dy * scrollSpeed * 0.5;
    currentY = Math.max(0, Math.min(H, currentY));
  }, { passive: false });

  return {
    update() {
      env.targetY = currentY;
    },

    goToSurface() {
      gsap.to({ y: currentY }, {
        y: H * 0.5,
        duration: 1.5,
        ease: 'power2.inOut',
        onUpdate() { currentY = this.targets()[0].y; },
      });
    },

    /** Jump to a specific norm position (0-1) */
    jumpTo(norm) {
      const targetY = Math.max(0, Math.min(H, norm * H));
      gsap.to({ y: currentY }, {
        y: targetY,
        duration: 1.2,
        ease: 'power2.inOut',
        onUpdate() { currentY = this.targets()[0].y; },
      });
    },

    /** Jump to next landmark below current position */
    jumpDown() {
      const curNorm = currentY / H;
      for (let i = LANDMARKS.length - 1; i >= 0; i--) {
        if (LANDMARKS[i].norm < curNorm - 0.01) {
          this.jumpTo(LANDMARKS[i].norm);
          return;
        }
      }
    },

    /** Jump to next landmark above current position */
    jumpUp() {
      const curNorm = currentY / H;
      for (let i = 0; i < LANDMARKS.length; i++) {
        if (LANDMARKS[i].norm > curNorm + 0.01) {
          this.jumpTo(LANDMARKS[i].norm);
          return;
        }
      }
    },
  };
}
