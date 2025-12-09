/**
 * Food - Resource that creatures compete for
 * Types: plant (herbivores), meat (predators only)
 */
export class Food {
  constructor(x, y, energy = 10, type = 'plant', isPredatorMeat = false, fromHunt = false) {
    this.x = x;
    this.y = y;
    this.energy = energy;
    this.type = type; // 'plant' or 'meat'
    this.isPredatorMeat = isPredatorMeat; // If true, meat from predator (toxic to other predators)
    this.radius = type === 'meat' ? 6 + energy / 8 : 5 + energy / 5;
    this.consumed = false;
    this.pulsePhase = Math.random() * Math.PI * 2;

    // Lifetime system (only for meat)
    this.age = 0;
    if (type === 'meat') {
      // Hunted meat lasts longer (incentivizes hunting)
      // Starvation meat spoils faster
      this.lifetime = fromHunt ? 800 : 300; // ticks before spoiling
    } else {
      this.lifetime = Infinity; // Plants don't spoil
    }

    // Color based on type and source
    if (type === 'meat') {
      if (isPredatorMeat) {
        // Predator meat - purple/toxic looking
        this.colors = {
          glow: 'rgba(139, 92, 246, 0.6)',
          mid: 'rgba(109, 40, 217, 0.3)',
          core: '#8b5cf6'
        };
      } else {
        // Herbivore meat - normal red
        this.colors = {
          glow: 'rgba(239, 68, 68, 0.8)',
          mid: 'rgba(220, 38, 38, 0.3)',
          core: '#ef4444'
        };
      }
    } else {
      // Plant - green
      this.colors = {
        glow: 'rgba(74, 222, 128, 0.8)',
        mid: 'rgba(34, 197, 94, 0.3)',
        core: '#4ade80'
      };
    }
  }

  /**
   * Update food (age and check expiration)
   */
  update() {
    if (this.type === 'meat' && !this.consumed) {
      this.age++;
      if (this.age >= this.lifetime) {
        this.consumed = true; // Mark as spoiled
      }
    }
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
    gradient.addColorStop(0, this.colors.glow);
    gradient.addColorStop(0.5, this.colors.mid);
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.beginPath();
    ctx.arc(this.x, this.y, glowRadius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    // Core
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * pulse, 0, Math.PI * 2);
    ctx.fillStyle = this.colors.core;
    ctx.fill();

    // Meat has different shape indicator (diamond for herbivore, skull for predator)
    if (this.type === 'meat') {
      if (this.isPredatorMeat) {
        // Skull symbol for toxic predator meat
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.font = `${this.radius * 1.2}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.fillText('☠', 0, 0);
        ctx.restore();
      } else {
        // Diamond for edible herbivore meat
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(Math.PI / 4);
        ctx.beginPath();
        ctx.rect(-this.radius * 0.3, -this.radius * 0.3, this.radius * 0.6, this.radius * 0.6);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fill();
        ctx.restore();
      }
    } else {
      // Highlight for plants
      ctx.beginPath();
      ctx.arc(this.x - this.radius * 0.3, this.y - this.radius * 0.3, this.radius * 0.3, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.fill();
    }
  }
}
