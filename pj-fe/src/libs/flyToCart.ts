export interface FlyToCartOptions {
  color?: string;
  size?: number;
  duration?: number;
  cartSelector?: string;
}

function createParticle(size: number, color: string): HTMLElement {
  const particle = document.createElement('div');
  particle.style.cssText = `
    position: fixed;
    width: ${size}px;
    height: ${size}px;
    background: ${color};
    border-radius: 50%;
    pointer-events: none;
    z-index: 9999;
    box-shadow: 0 0 6px rgba(0,0,0,0.25);
  `;
  return particle;
}

function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

export function flyToCart(
  sourceEl: HTMLElement,
  options: FlyToCartOptions = {},
): void {
  const {
    color = '#F26631',
    size = 18,
    duration = 700,
    cartSelector = '[data-cart-icon]',
  } = options;

  const cartEl = document.querySelector<HTMLElement>(cartSelector);
  if (!cartEl) {
    return;
  }
  const target: HTMLElement = cartEl;

  const sourceRect = sourceEl.getBoundingClientRect();
  const cartRect = target.getBoundingClientRect();

  const startX = sourceRect.left + sourceRect.width / 2 - size / 2;
  const startY = sourceRect.top + sourceRect.height / 2 - size / 2;
  const endX = cartRect.left + cartRect.width / 2 - size / 2;
  const endY = cartRect.top + cartRect.height / 2 - size / 2;

  const particle = createParticle(size, color);
  particle.style.left = `${startX}px`;
  particle.style.top = `${startY}px`;
  document.body.appendChild(particle);

  const controlX = (startX + endX) / 2 - 80;
  const controlY = Math.min(startY, endY) - 120;

  let startTime: number | null = null;

  function animate(timestamp: number): void {
    if (!startTime) {
      startTime = timestamp;
    }
    const elapsed = timestamp - startTime;
    const rawProgress = Math.min(elapsed / duration, 1);
    const progress = easeInOutQuad(rawProgress);

    const t = progress;
    const currentX = (1 - t) * (1 - t) * startX + 2 * (1 - t) * t * controlX + t * t * endX;
    const currentY = (1 - t) * (1 - t) * startY + 2 * (1 - t) * t * controlY + t * t * endY;

    const scale = 1 - progress * 0.5;
    const opacity = 1 - Math.max(0, progress - 0.7) / 0.3;

    particle.style.left = `${currentX}px`;
    particle.style.top = `${currentY}px`;
    particle.style.transform = `scale(${scale})`;
    particle.style.opacity = `${opacity}`;

    if (rawProgress < 1) {
      requestAnimationFrame(animate);
    } else {
      document.body.removeChild(particle);
      target.animate(
        [
          { transform: 'scale(1)' },
          { transform: 'scale(1.35)' },
          { transform: 'scale(1)' },
        ],
        { duration: 300, easing: 'ease-out' },
      );
    }
  }

  requestAnimationFrame(animate);
}
