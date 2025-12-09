import { NeuralNetwork } from '../engine/NeuralNetwork.js';
import { generateTraits, calculateTraitEffects, getTraitColor } from '../engine/Traits.js';

/**
 * Obstacle - Physical barrier on the map
 * Types: rock, tree, wall
 */
export class Obstacle {
  constructor(x, y, width, height, type = 'rock') {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.type = type;
    this.radius = Math.max(width, height) / 2; // For circular collision
  }

  /**
   * Check if point is inside obstacle (circular collision)
   */
  contains(px, py) {
    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2;
    const dx = px - centerX;
    const dy = py - centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    return dist < this.radius;
  }

  /**
   * Draw the obstacle
   */
  draw(ctx) {
    if (this.type === 'rock') {
      this.drawRock(ctx);
    }
  }

  drawRock(ctx) {
    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2;

    // Shadow
    ctx.beginPath();
    ctx.arc(centerX + 3, centerY + 3, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fill();

    // Main rock gradient
    const gradient = ctx.createRadialGradient(
      centerX - this.radius * 0.3,
      centerY - this.radius * 0.3,
      0,
      centerX,
      centerY,
      this.radius
    );
    gradient.addColorStop(0, '#6b7280');
    gradient.addColorStop(0.6, '#4b5563');
    gradient.addColorStop(1, '#374151');

    ctx.beginPath();
    ctx.arc(centerX, centerY, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    // Rock texture (cracks)
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 3; i++) {
      const angle = (i / 3) * Math.PI * 2 + this.x;
      const startR = this.radius * 0.3;
      const endR = this.radius * 0.9;
      ctx.beginPath();
      ctx.moveTo(
        centerX + Math.cos(angle) * startR,
        centerY + Math.sin(angle) * startR
      );
      ctx.lineTo(
        centerX + Math.cos(angle) * endR,
        centerY + Math.sin(angle) * endR
      );
      ctx.stroke();
    }

    // Highlight
    ctx.beginPath();
    ctx.arc(
      centerX - this.radius * 0.3,
      centerY - this.radius * 0.3,
      this.radius * 0.3,
      0,
      Math.PI * 2
    );
    ctx.fillStyle = 'rgba(156, 163, 175, 0.3)';
    ctx.fill();
  }
}
