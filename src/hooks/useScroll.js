import gsap from 'gsap';
import { WORLD_HEIGHT } from '../components/Environment.js';

const H = WORLD_HEIGHT;

/**
 * One-directional infinite scroll (downward).
 * 
 * The world is mirrored: the camera Y follows a triangle wave.
 * progress 0.00 → Surface (Y = 0.5H)  ← start here
 * progress 0.25 → Core    (Y = 0)
 * progress 0.50 → Surface (Y = 0.5H)
 * progress 0.75 → Space   (Y = H)
 * progress 1.00 → Surface (Y = 0.5H)  ← wraps to 0.00
 * 
 * Scrolling down always increases progress. Scrolling up decreases it.
 * The wrap at progress 0/1 is at the surface, which is seamless.
 */
export function createScrollController(env) {
  let progress = 0; // start at surface
  const scrollSpeed = 0.00008;

  window.addEventListener('wheel', (e) => {
    e.preventDefault();
    // Only scroll down increases progress (positive deltaY)
    // But allow scrolling up too for usability
    progress += e.deltaY * scrollSpeed;
    progress = ((progress % 1) + 1) % 1;
  }, { passive: false });

  let touchStartY = 0;
  window.addEventListener('touchstart', (e) => {
    touchStartY = e.touches[0].clientY;
  }, { passive: true });
  window.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const dy = touchStartY - e.touches[0].clientY;
    touchStartY = e.touches[0].clientY;
    progress += dy * scrollSpeed * 3;
    progress = ((progress % 1) + 1) % 1;
  }, { passive: false });

  return {
    update() {
      // Triangle wave mapping:
      // progress 0.0→0.25: Surface→Core  (Y goes from 0.5H down to 0)
      // progress 0.25→0.75: Core→Space   (Y goes from 0 up to H)
      // progress 0.75→1.0: Space→Surface (Y goes from H down to 0.5H)
      const p = progress;
      let y;
      if (p <= 0.25) {
        // Descending: surface to core
        y = H * (0.5 - p * 2); // p=0→Y=0.5H, p=0.25→Y=0
      } else if (p <= 0.75) {
        // Ascending through the other side: core to space
        y = H * ((p - 0.25) * 2); // p=0.25→Y=0, p=0.75→Y=H
      } else {
        // Descending back: space to surface
        y = H * (1 - (p - 0.75) * 2); // p=0.75→Y=H, p=1.0→Y=0.5H
      }
      env.targetY = y;
    },

    goToSurface() {
      // Find shortest path to progress=0 (surface)
      let target = 0;
      let diff = target - progress;
      if (diff > 0.5) diff -= 1;
      if (diff < -0.5) diff += 1;
      const finalTarget = progress + diff;

      gsap.to({ p: progress }, {
        p: finalTarget,
        duration: 1.5,
        ease: 'power2.inOut',
        onUpdate() {
          progress = ((this.targets()[0].p % 1) + 1) % 1;
        },
      });
    },

    getProgress() { return progress; },
  };
}
