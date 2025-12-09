/**
 * Renderer - Canvas 2D rendering engine
 * With creature selection and stats tooltips
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
    this.showAllTooltips = false; // Toggle for showing all tooltips (when paused)

    // Selected creature
    this.selectedCreature = null;

    // Camera system for zoom and pan
    this.camera = {
      x: world.width / 2,    // Center of world
      y: world.height / 2,
      zoom: 1.0,             // 1.0 = 100%, 0.5 = 50%, 2.0 = 200%
      minZoom: 0.5,
      maxZoom: 2.0
    };

    // Stars background
    this.stars = [];
    this.initStars();

    // Keyboard controls
    this.keys = {};
    this.setupControls();

    // Mouse drag panning
    this.isDragging = false;
    this.dragStart = { x: 0, y: 0 };
    this.setupMouseDrag();

    // FPS tracking
    this.fps = 60;
    this.frameCount = 0;
    this.lastFpsUpdate = performance.now();
    this.frameTimes = [];
  }

  setupMouseDrag() {
    this.canvas.addEventListener('mousedown', (e) => {
      // Right click or middle click for dragging
      if (e.button === 2 || e.button === 1) {
        e.preventDefault();
        this.isDragging = true;
        this.dragStart = { x: e.clientX, y: e.clientY };
        this.canvas.style.cursor = 'grabbing';
      }
    });

    this.canvas.addEventListener('mousemove', (e) => {
      if (this.isDragging) {
        const dx = e.clientX - this.dragStart.x;
        const dy = e.clientY - this.dragStart.y;

        // Move camera (inverse of drag direction)
        this.camera.x -= dx / this.camera.zoom;
        this.camera.y -= dy / this.camera.zoom;

        // Update drag start for next frame
        this.dragStart = { x: e.clientX, y: e.clientY };

        // Constrain to bounds
        this.constrainCamera();
      }
    });

    this.canvas.addEventListener('mouseup', () => {
      this.isDragging = false;
      this.canvas.style.cursor = 'default';
    });

    this.canvas.addEventListener('mouseleave', () => {
      this.isDragging = false;
      this.canvas.style.cursor = 'default';
    });

    // Prevent context menu on right click
    this.canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });
  }

  setupControls() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.key.toLowerCase()] = true;

      // Zoom controls
      if (e.key === '+' || e.key === '=') {
        this.zoomIn();
      } else if (e.key === '-' || e.key === '_') {
        this.zoomOut();
      } else if (e.key === '0') {
        this.resetZoom();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false;
    });

    // Mouse wheel zoom
    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      if (e.deltaY < 0) {
        this.zoomIn();
      } else {
        this.zoomOut();
      }
    });
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
    // Track FPS
    this.updateFPS(time);

    const ctx = this.ctx;
    const { width, height } = this.canvas;

    // Update camera position based on keyboard input
    this.updateCamera();

    // Clear with dark gradient background
    const bgGradient = ctx.createLinearGradient(0, 0, width, height);
    bgGradient.addColorStop(0, '#0f0f1a');
    bgGradient.addColorStop(0.5, '#1a1a2e');
    bgGradient.addColorStop(1, '#16213e');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // Draw stars (background - not affected by camera)
    this.drawStars(ctx, time);

    // Save context and apply camera transform
    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.scale(this.camera.zoom, this.camera.zoom);
    ctx.translate(-this.camera.x, -this.camera.y);

    // Draw grid
    if (this.showGrid) {
      this.drawGrid(ctx);
    }

    // Draw obstacles
    if (this.world.obstacles && this.world.obstacles.length > 0) {
      for (const obstacle of this.world.obstacles) {
        obstacle.draw(ctx);
      }
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

        // Draw tooltips when paused and showAllTooltips is on
        if (this.showAllTooltips && this.world.isPaused) {
          this.drawTooltip(ctx, creature);
        }
      }
    }

    // Draw selected creature highlight and tooltip
    if (this.selectedCreature && this.selectedCreature.isAlive()) {
      this.drawSelection(ctx, this.selectedCreature, time);
      this.drawTooltip(ctx, this.selectedCreature);
    }

    // Restore context (exit camera transform)
    ctx.restore();

    // Draw UI elements (not affected by camera)
    // Draw generation progress bar
    this.drawProgressBar(ctx);

    // Draw pause indicator
    if (this.world.isPaused) {
      this.drawPauseIndicator(ctx);
    }

    // Draw zoom level
    this.drawZoomLevel(ctx);

    // Draw FPS counter
    this.drawFPS(ctx);
  }

  /**
   * Update FPS counter
   */
  updateFPS(time) {
    this.frameCount++;
    const now = performance.now();
    const elapsed = now - this.lastFpsUpdate;

    // Update FPS every 500ms
    if (elapsed >= 500) {
      this.fps = Math.round((this.frameCount * 1000) / elapsed);
      this.frameCount = 0;
      this.lastFpsUpdate = now;
    }
  }

  /**
   * Draw FPS counter
   */
  drawFPS(ctx) {
    ctx.save();

    // Semi-transparent background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(10, 10, 80, 30);

    // FPS text
    ctx.font = 'bold 18px Inter, monospace, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    // Color based on FPS
    if (this.fps >= 50) {
      ctx.fillStyle = '#4ade80'; // Green
    } else if (this.fps >= 30) {
      ctx.fillStyle = '#fbbf24'; // Yellow
    } else {
      ctx.fillStyle = '#ef4444'; // Red
    }

    ctx.fillText(`FPS: ${this.fps}`, 18, 25);

    ctx.restore();
  }

  /**
   * Update camera position based on keyboard input
   */
  updateCamera() {
    const panSpeed = 10 / this.camera.zoom; // Faster pan when zoomed out

    // WASD or Arrow keys for panning
    if (this.keys['w'] || this.keys['arrowup']) {
      this.camera.y -= panSpeed;
    }
    if (this.keys['s'] || this.keys['arrowdown']) {
      this.camera.y += panSpeed;
    }
    if (this.keys['a'] || this.keys['arrowleft']) {
      this.camera.x -= panSpeed;
    }
    if (this.keys['d'] || this.keys['arrowright']) {
      this.camera.x += panSpeed;
    }

    this.constrainCamera();
  }

  /**
   * Constrain camera to world bounds
   */
  constrainCamera() {
    const viewWidth = this.canvas.width / this.camera.zoom;
    const viewHeight = this.canvas.height / this.camera.zoom;

    this.camera.x = Math.max(viewWidth / 2, Math.min(this.world.width - viewWidth / 2, this.camera.x));
    this.camera.y = Math.max(viewHeight / 2, Math.min(this.world.height - viewHeight / 2, this.camera.y));
  }

  /**
   * Draw selection ring around creature
   */
  drawSelection(ctx, creature, time) {
    const pulse = 1 + Math.sin(time * 0.01) * 0.2;

    ctx.beginPath();
    ctx.arc(creature.x, creature.y, creature.radius * 2 * pulse, 0, Math.PI * 2);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  /**
   * Draw stats tooltip for a creature
   */
  drawTooltip(ctx, creature) {
    const padding = 10;
    const lineHeight = 16;
    const tooltipWidth = 160;

    // Stats to display
    const stats = [
      `#${creature.id} ${creature.isPredator ? '🔴 Predator' : '🟢 Herbivore'}`,
      `Energy: ${creature.energy.toFixed(0)}/${creature.maxEnergy.toFixed(0)}`,
      `Fitness: ${creature.fitness.toFixed(1)}`,
      `Food: ${creature.foodEaten} | Kills: ${creature.kills}`,
      `───── Traits ─────`,
      `Size: ${creature.traits.size.toFixed(2)}`,
      `Metabolism: ${creature.traits.metabolism.toFixed(2)}`,
      `Aggression: ${creature.traits.aggression.toFixed(2)}`,
      `Vision: ${creature.traits.vision.toFixed(2)}`,
    ];

    const tooltipHeight = stats.length * lineHeight + padding * 2;

    // Position tooltip above creature, keeping it on screen
    let tooltipX = creature.x - tooltipWidth / 2;
    let tooltipY = creature.y - creature.radius - tooltipHeight - 15;

    // Keep on screen
    if (tooltipX < 10) tooltipX = 10;
    if (tooltipX + tooltipWidth > this.canvas.width - 10) {
      tooltipX = this.canvas.width - tooltipWidth - 10;
    }
    if (tooltipY < 10) {
      tooltipY = creature.y + creature.radius + 15; // Show below instead
    }

    // Background
    ctx.fillStyle = 'rgba(15, 15, 30, 0.95)';
    ctx.strokeStyle = creature.isPredator ? '#ef4444' : '#22c55e';
    ctx.lineWidth = 2;

    // Rounded rect
    this.roundRect(ctx, tooltipX, tooltipY, tooltipWidth, tooltipHeight, 10);
    ctx.fill();
    ctx.stroke();

    // Arrow pointing to creature
    const arrowX = Math.max(tooltipX + 20, Math.min(tooltipX + tooltipWidth - 20, creature.x));
    ctx.beginPath();
    if (tooltipY < creature.y) {
      // Arrow at bottom
      ctx.moveTo(arrowX - 8, tooltipY + tooltipHeight);
      ctx.lineTo(arrowX, tooltipY + tooltipHeight + 10);
      ctx.lineTo(arrowX + 8, tooltipY + tooltipHeight);
    } else {
      // Arrow at top
      ctx.moveTo(arrowX - 8, tooltipY);
      ctx.lineTo(arrowX, tooltipY - 10);
      ctx.lineTo(arrowX + 8, tooltipY);
    }
    ctx.fillStyle = 'rgba(15, 15, 30, 0.95)';
    ctx.fill();

    // Text
    ctx.font = '12px Inter, sans-serif';
    ctx.textAlign = 'left';

    stats.forEach((line, i) => {
      const y = tooltipY + padding + (i + 1) * lineHeight - 3;

      if (i === 0) {
        ctx.fillStyle = creature.isPredator ? '#ef4444' : '#22c55e';
        ctx.font = 'bold 12px Inter, sans-serif';
      } else if (i === 4) {
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.font = '10px Inter, sans-serif';
      } else {
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.font = '12px Inter, sans-serif';
      }

      ctx.fillText(line, tooltipX + padding, y);
    });
  }

  /**
   * Draw rounded rectangle
   */
  roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  /**
   * Draw pause indicator
   */
  drawPauseIndicator(ctx) {
    ctx.font = '14px Inter, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.textAlign = 'center';
    ctx.fillText('⏸ PAUSED - Click creatures to see stats', this.canvas.width / 2, 30);
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
    const gridSize = 50;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;

    // Vertical lines
    for (let x = 0; x <= this.world.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.world.height);
      ctx.stroke();
    }

    // Horizontal lines
    for (let y = 0; y <= this.world.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.world.width, y);
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

  toggleAllTooltips() {
    this.showAllTooltips = !this.showAllTooltips;
    return this.showAllTooltips;
  }

  /**
   * Zoom controls
   */
  zoomIn() {
    this.camera.zoom = Math.min(this.camera.maxZoom, this.camera.zoom * 1.2);
  }

  zoomOut() {
    this.camera.zoom = Math.max(this.camera.minZoom, this.camera.zoom / 1.2);
  }

  resetZoom() {
    this.camera.zoom = 1.0;
    this.camera.x = this.world.width / 2;
    this.camera.y = this.world.height / 2;
  }

  setZoom(zoom) {
    this.camera.zoom = Math.max(this.camera.minZoom, Math.min(this.camera.maxZoom, zoom));
  }

  /**
   * Draw zoom level indicator
   */
  drawZoomLevel(ctx) {
    const zoomPercent = Math.round(this.camera.zoom * 100);
    ctx.font = '12px Inter, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.textAlign = 'right';
    ctx.fillText(`Zoom: ${zoomPercent}%`, this.canvas.width - 15, this.canvas.height - 15);
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = '10px Inter, sans-serif';
    ctx.fillText('WASD: Pan | Right-Click Drag: Pan | +/-: Zoom | 0: Reset', this.canvas.width - 15, this.canvas.height - 35);
  }
}
