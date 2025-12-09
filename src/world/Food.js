/**
 * Food - Resource that creatures compete for
 */
export class Food {
  constructor(x, y, energy = 10) {
    this.x = x;
    this.y = y;
    this.energy = energy;
    this.radius = 5 + energy / 5;
    this.consumed = false;
    this.pulsePhase = Math.random() * Math.PI * 2;
  }

  /**
   * Draw the food with glow effect
   */
  draw(ctx, time) {
    if (this.consumed) return;

    const pulse = 1 + Math.sin(time * 0.003 + this.pulsePhase) * 0.2;
    const glowRadius = this.radius * 2 * pulse;

    // Outer glow
    const gradient = ctx.createRadialGradient(
      this.x, this.y, 0,
      this.x, this.y, glowRadius
    );
    gradient.addColorStop(0, 'rgba(74, 222, 128, 0.8)');
    gradient.addColorStop(0.5, 'rgba(34, 197, 94, 0.3)');
    gradient.addColorStop(1, 'rgba(22, 163, 74, 0)');

    ctx.beginPath();
    ctx.arc(this.x, this.y, glowRadius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    // Core
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * pulse, 0, Math.PI * 2);
    ctx.fillStyle = '#4ade80';
    ctx.fill();

    // Highlight
    ctx.beginPath();
    ctx.arc(this.x - this.radius * 0.3, this.y - this.radius * 0.3, this.radius * 0.3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.fill();
  }
}
