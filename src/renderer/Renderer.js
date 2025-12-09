/**
 * Renderer - Canvas 2D rendering engine
 */
export class Renderer {
  constructor(canvas, world) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.world = world;

    // Visual settings
    this.showGrid = true;
    this.showSensors = false;
    this.showTrails = true;

    // Stars background
    this.stars = [];
    this.initStars();
  }

  initStars() {
    for (let i = 0; i < 100; i++) {
      this.stars.push({
        x: Math.random(),
        y: Math.random(),
        size: Math.random() * 1.5 + 0.5,
        brightness: Math.random()
      });
    }
  }

  /**
   * Resize canvas
   */
  resize(width, height) {
    this.canvas.width = width;
    this.canvas.height = height;
  }

  /**
   * Main render loop
   */
  render(time) {
    const ctx = this.ctx;
    const { width, height } = this.canvas;

    // Clear with dark gradient background
    const bgGradient = ctx.createLinearGradient(0, 0, width, height);
    bgGradient.addColorStop(0, '#0f0f1a');
    bgGradient.addColorStop(0.5, '#1a1a2e');
    bgGradient.addColorStop(1, '#16213e');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // Draw stars
    this.drawStars(ctx, time);

    // Draw grid
    if (this.showGrid) {
      this.drawGrid(ctx);
    }

    // Draw food
    for (const food of this.world.foods) {
      food.draw(ctx, time);
    }

    // Draw creatures
    for (const creature of this.world.creatures) {
      if (creature.isAlive()) {
        creature.draw(ctx, time);

        if (this.showSensors) {
          creature.drawSensors(ctx);
        }
      }
    }

    // Draw generation progress bar
    this.drawProgressBar(ctx);
  }

  drawStars(ctx, time) {
    const { width, height } = this.canvas;

    for (const star of this.stars) {
      const twinkle = 0.5 + Math.sin(time * 0.002 + star.brightness * 10) * 0.5;
      ctx.beginPath();
      ctx.arc(
        star.x * width,
        star.y * height,
        star.size * twinkle,
        0,
        Math.PI * 2
      );
      ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness * twinkle * 0.3})`;
      ctx.fill();
    }
  }

  drawGrid(ctx) {
    const { width, height } = this.canvas;
    const gridSize = 50;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;

    // Vertical lines
    for (let x = 0; x <= width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Horizontal lines
    for (let y = 0; y <= height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  }

  drawProgressBar(ctx) {
    const { width } = this.canvas;
    const progress = this.world.tick / this.world.generationLength;
    const barHeight = 3;

    // Background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(0, 0, width, barHeight);

    // Progress
    const gradient = ctx.createLinearGradient(0, 0, width * progress, 0);
    gradient.addColorStop(0, '#6366f1');
    gradient.addColorStop(1, '#8b5cf6');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width * progress, barHeight);
  }

  /**
   * Toggle options
   */
  toggleGrid() {
    this.showGrid = !this.showGrid;
    return this.showGrid;
  }

  toggleSensors() {
    this.showSensors = !this.showSensors;
    return this.showSensors;
  }
}
