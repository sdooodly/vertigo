import gsap from 'gsap';
import { WORLD_HEIGHT } from '../components/Environment.js';

const H = WORLD_HEIGHT;

/**
 * Linear infinite scroll — always downward.
 * 
 * Camera Y decreases as you scroll down.
 * World layout (top to bottom):
 *   Y = H    → Deep Space (top)
 *   Y = 0.9H → ISS / Exosphere
 *   Y = 0.5H → Sea Level (surface) ← start here
 *   Y = 0.3H → Mariana Trench
 *   Y = 0    → Core (bottom)
 * 
 * When Y goes below 0, it wraps to H (space).
 * When Y goes above H, it wraps to 0 (core).
 * The wrap at Y=0/Y=H is masked by transition fog (both are dark).
 * 
 * Scrolling down = Y decreases = going deeper.
 * After core (Y=0), wraps to space (Y=H), then continues down
 * through atmosphere → surface → ocean → core again.
 */
export function createScrollController(env) {
  let currentY = H * 0.68; // start at top hemisphere sea level
  const scrollSpeed = 0.15;

  window.addEventListener('wheel', (e) => {
    e.preventDefault();
    // deltaY > 0 = scroll down = Y decreases (going deeper)
    currentY -= e.deltaY * scrollSpeed;
    // Wrap around
    currentY = ((currentY % H) + H) % H;
  }, { passive: false });

  let touchStartY = 0;
  window.addEventListener('touchstart', (e) => {
    touchStartY = e.touches[0].clientY;
  }, { passive: true });
  window.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const dy = touchStartY - e.touches[0].clientY;
    touchStartY = e.touches[0].clientY;
    // Swipe up = go deeper = Y decreases
    currentY -= dy * scrollSpeed * 0.5;
    currentY = ((currentY % H) + H) % H;
  }, { passive: false });

  return {
    update() {
      env.targetY = currentY;
    },

    goToSurface() {
      const surfaceY = H * 0.68;
      // Find shortest path around the loop
      let diff = surfaceY - currentY;
      if (diff > H / 2) diff -= H;
      if (diff < -H / 2) diff += H;
      const target = currentY + diff;

      gsap.to({ y: currentY }, {
        y: target,
        duration: 1.5,
        ease: 'power2.inOut',
        onUpdate() {
          currentY = ((this.targets()[0].y % H) + H) % H;
        },
      });
    },

    getProgress() { return 1 - currentY / H; },
  };
}
