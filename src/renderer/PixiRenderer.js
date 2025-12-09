import * as PIXI from 'pixi.js';

/**
 * PixiRenderer - GPU-Accelerated WebGL rendering engine
 * Replaces Canvas 2D rendering with PixiJS for 2-3x performance improvement
 */
export class PixiRenderer {
  constructor(canvas, world) {
    this.canvas = canvas;
    this.world = world;

    // Visual settings
    this.showGrid = true;
    this.showSensors = false;
    this.showTrails = true;
    this.showAllTooltips = false;

    // Selected creature
    this.selectedCreature = null;

    // Camera system
    this.camera = {
      x: world.width / 2,
      y: world.height / 2,
      zoom: 1.0,
      minZoom: 0.5,
      maxZoom: 2.0
    };

    // Keyboard controls
    this.keys = {};

    // Mouse drag
    this.isDragging = false;
    this.dragStart = { x: 0, y: 0 };

    // Sprite pools for performance
    this.creatureSprites = new Map();
    this.foodSprites = new Map();
    this.obstacleSprites = new Map();

    // Graphics objects for dynamic rendering
    this.graphics = {
      trails: new PIXI.Graphics(),
      sensors: new PIXI.Graphics(),
      grid: new PIXI.Graphics(),
      selection: new PIXI.Graphics(),
      ui: new PIXI.Graphics()
    };

    // Initialize PixiJS
    this.initPixi();
    this.setupControls();
  }

  /**
   * Initialize PixiJS Application and containers
   */
  async initPixi() {
    // Create PIXI Application with WebGL
    this.app = new PIXI.Application();

    await this.app.init({
      canvas: this.canvas,
      width: this.canvas.width,
      height: this.canvas.height,
      backgroundColor: 0x0f0f1a,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
      powerPreference: 'high-performance'
    });

    // Create container hierarchy
    this.backgroundContainer = new PIXI.Container();
    this.gameContainer = new PIXI.Container();
    this.uiContainer = new PIXI.Container();

    this.app.stage.addChild(this.backgroundContainer);
    this.app.stage.addChild(this.gameContainer);
    this.app.stage.addChild(this.uiContainer);

    // Add graphics objects to appropriate containers
    this.gameContainer.addChild(this.graphics.grid);
    this.gameContainer.addChild(this.graphics.trails);
    this.gameContainer.addChild(this.graphics.sensors);
    this.gameContainer.addChild(this.graphics.selection);
    this.uiContainer.addChild(this.graphics.ui);

    // Create starfield background
    this.createStarfield();

    // Position game container for camera
    this.updateCameraTransform();

    console.log('✨ PixiJS WebGL Renderer initialized!');
    console.log('📊 GPU:', this.app.renderer.type === PIXI.RENDERER_TYPE.WEBGL ? 'WebGL' : 'Canvas');
  }

  /**
   * Create animated starfield background
   */
  createStarfield() {
    this.stars = [];
    const starContainer = new PIXI.Container();
    this.backgroundContainer.addChild(starContainer);

    for (let i = 0; i < 100; i++) {
      const star = new PIXI.Graphics();
      const size = Math.random() * 1.5 + 0.5;
      const brightness = Math.random();

      star.circle(0, 0, size);
      star.fill({ color: 0xffffff, alpha: brightness * 0.3 });

      star.x = Math.random() * this.canvas.width;
      star.y = Math.random() * this.canvas.height;

      this.stars.push({ graphics: star, brightness, phase: Math.random() * Math.PI * 2 });
      starContainer.addChild(star);
    }

    this.starContainer = starContainer;
  }

  /**
   * Setup keyboard and mouse controls
   */
  setupControls() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.key.toLowerCase()] = true;

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

    // Mouse drag panning
    this.canvas.addEventListener('mousedown', (e) => {
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

        this.camera.x -= dx / this.camera.zoom;
        this.camera.y -= dy / this.camera.zoom;

        this.dragStart = { x: e.clientX, y: e.clientY };
        this.constrainCamera();
        this.updateCameraTransform();
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

    this.canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });
  }

  /**
   * Update camera based on keyboard input
   */
  updateCamera() {
    const panSpeed = 10 / this.camera.zoom;

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
    this.updateCameraTransform();
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
   * Apply camera transform to game container
   */
  updateCameraTransform() {
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;

    this.gameContainer.scale.set(this.camera.zoom);
    this.gameContainer.position.set(
      centerX - this.camera.x * this.camera.zoom,
      centerY - this.camera.y * this.camera.zoom
    );
  }

  /**
   * Main render loop
   */
  render(time) {
    // Update camera
    this.updateCamera();

    // Update starfield animation
    this.updateStars(time);

    // Clear dynamic graphics
    this.graphics.trails.clear();
    this.graphics.sensors.clear();
    this.graphics.selection.clear();
    this.graphics.ui.clear();

    // Draw grid
    if (this.showGrid) {
      this.drawGrid();
    }

    // Draw obstacles
    this.drawObstacles();

    // Draw food
    this.drawFood(time);

    // Draw creatures
    this.drawCreatures(time);

    // Draw selection ring
    if (this.selectedCreature && this.selectedCreature.isAlive()) {
      this.drawSelection(this.selectedCreature, time);
      this.drawTooltip(this.selectedCreature);
    }

    // Draw all tooltips when paused
    if (this.showAllTooltips && this.world.isPaused) {
      for (const creature of this.world.creatures) {
        if (creature.isAlive()) {
          this.drawTooltip(creature);
        }
      }
    }

    // Draw UI elements
    this.drawProgressBar();
    if (this.world.isPaused) {
      this.drawPauseIndicator();
    }
    this.drawZoomLevel();
  }

  /**
   * Update star animation
   */
  updateStars(time) {
    for (const star of this.stars) {
      const twinkle = 0.5 + Math.sin(time * 0.002 + star.phase) * 0.5;
      star.graphics.alpha = star.brightness * twinkle * 0.3;
    }
  }

  /**
   * Draw grid
   */
  drawGrid() {
    const g = this.graphics.grid;
    g.clear();

    const gridSize = 50;
    g.lineStyle(1, 0xffffff, 0.03);

    // Vertical lines
    for (let x = 0; x <= this.world.width; x += gridSize) {
      g.moveTo(x, 0);
      g.lineTo(x, this.world.height);
    }

    // Horizontal lines
    for (let y = 0; y <= this.world.height; y += gridSize) {
      g.moveTo(0, y);
      g.lineTo(this.world.width, y);
    }

    g.stroke();
  }

  /**
   * Draw obstacles
   */
  drawObstacles() {
    for (const obstacle of this.world.obstacles) {
      let sprite = this.obstacleSprites.get(obstacle);

      if (!sprite) {
        // Create new obstacle graphic
        sprite = new PIXI.Graphics();
        this.obstacleSprites.set(obstacle, sprite);
        this.gameContainer.addChild(sprite);
      }

      // Redraw obstacle
      sprite.clear();

      const centerX = obstacle.x + obstacle.width / 2;
      const centerY = obstacle.y + obstacle.height / 2;
      const radius = obstacle.radius;

      // Shadow
      sprite.circle(centerX + 3, centerY + 3, radius);
      sprite.fill({ color: 0x000000, alpha: 0.3 });

      // Main rock
      sprite.circle(centerX, centerY, radius);
      sprite.fill({ color: 0x4b5563 });

      // Highlight
      sprite.circle(centerX - radius * 0.3, centerY - radius * 0.3, radius * 0.3);
      sprite.fill({ color: 0x9ca3af, alpha: 0.3 });
    }
  }

  /**
   * Draw food items
   */
  drawFood(time) {
    for (const food of this.world.foods) {
      if (food.consumed) continue;

      let sprite = this.foodSprites.get(food);

      if (!sprite) {
        sprite = new PIXI.Graphics();
        this.foodSprites.set(food, sprite);
        this.gameContainer.addChild(sprite);
      }

      sprite.clear();

      const pulse = 1 + Math.sin(time * 0.003 + food.pulsePhase) * 0.2;
      const glowRadius = food.radius * 2 * pulse;

      // Determine color based on food type
      let color, glowColor;
      if (food.type === 'meat') {
        if (food.isPredatorMeat) {
          color = 0x8b5cf6; // Purple
          glowColor = 0x8b5cf6;
        } else {
          color = 0xef4444; // Red
          glowColor = 0xef4444;
        }
      } else {
        color = 0x4ade80; // Green
        glowColor = 0x4ade80;
      }

      // Glow
      sprite.circle(food.x, food.y, glowRadius);
      sprite.fill({ color: glowColor, alpha: 0.3 });

      // Core
      sprite.circle(food.x, food.y, food.radius * pulse);
      sprite.fill({ color });

      // Highlight
      sprite.circle(food.x - food.radius * 0.3, food.y - food.radius * 0.3, food.radius * 0.3);
      sprite.fill({ color: 0xffffff, alpha: 0.6 });
    }

    // Clean up consumed food sprites
    for (const [food, sprite] of this.foodSprites) {
      if (food.consumed) {
        this.gameContainer.removeChild(sprite);
        this.foodSprites.delete(food);
      }
    }
  }

  /**
   * Draw creatures
   */
  drawCreatures(time) {
    for (const creature of this.world.creatures) {
      if (!creature.isAlive()) continue;

      // Draw trail
      if (this.showTrails && creature.trail.length > 1) {
        this.drawTrail(creature);
      }

      // Draw creature body
      this.drawCreature(creature, time);

      // Draw sensors (debug)
      if (this.showSensors) {
        this.drawSensors(creature);
      }
    }
  }

  /**
   * Draw a single creature
   */
  drawCreature(creature, time) {
    const g = new PIXI.Graphics();

    const pulse = 1 + Math.sin(time * 0.005) * 0.1;
    const flashMod = creature.flashTime > 0 ? 1.5 : 1;
    const flashAlpha = creature.flashTime > 0 ? 0.8 : 0.6;
    const glowRadius = creature.radius * 2.5 * pulse * flashMod;
    const alpha = creature.energy / creature.maxEnergy;

    // Glow effect
    g.circle(creature.x, creature.y, glowRadius);
    g.fill({
      color: this.hslToHex(creature.hue, 80, 60),
      alpha: alpha * flashAlpha * 0.6
    });

    // Body
    g.circle(creature.x, creature.y, creature.radius * pulse);
    g.fill({ color: this.hslToHex(creature.hue, 70, 50) });

    // Predator spikes
    if (creature.isPredator) {
      for (let i = 0; i < 4; i++) {
        const spikeAngle = (i / 4) * Math.PI * 2 + creature.angle;
        const spikeX = creature.x + Math.cos(spikeAngle) * creature.radius * 1.2;
        const spikeY = creature.y + Math.sin(spikeAngle) * creature.radius * 1.2;
        g.circle(spikeX, spikeY, 3 * creature.traits.size);
        g.fill({ color: this.hslToHex(creature.hue, 90, 40) });
      }
    }

    // Elite crown
    if (creature.isElite) {
      g.circle(creature.x, creature.y, creature.radius * pulse + 4);
      g.stroke({ color: 0xffd700, width: 2 });
    }

    // Direction indicator (eye)
    const eyeX = creature.x + Math.cos(creature.angle) * creature.radius * 0.7;
    const eyeY = creature.y + Math.sin(creature.angle) * creature.radius * 0.7;
    g.circle(eyeX, eyeY, 4 * creature.traits.size);
    g.fill({ color: 0xffffff });

    if (creature.isPredator) {
      g.circle(eyeX, eyeY, 2 * creature.traits.size);
      g.fill({ color: 0x000000 });
    }

    // Energy bar
    const barWidth = creature.radius * 2;
    const barHeight = 3;
    const barY = creature.y - creature.radius - 8;

    g.rect(creature.x - barWidth / 2, barY, barWidth, barHeight);
    g.fill({ color: 0x000000, alpha: 0.5 });

    const barColor = creature.energy > 30
      ? (creature.isPredator ? 0xef4444 : 0x4ade80)
      : 0xfbbf24;

    g.rect(creature.x - barWidth / 2, barY, barWidth * (creature.energy / creature.maxEnergy), barHeight);
    g.fill({ color: barColor });

    this.gameContainer.addChild(g);
    this.creatureSprites.set(creature.id, g);
  }

  /**
   * Draw creature trail
   */
  drawTrail(creature) {
    const g = this.graphics.trails;

    if (creature.trail.length < 2) return;

    g.moveTo(creature.trail[0].x, creature.trail[0].y);
    for (let i = 1; i < creature.trail.length; i++) {
      g.lineTo(creature.trail[i].x, creature.trail[i].y);
    }

    g.stroke({
      color: this.hslToHex(creature.hue, 70, 50),
      width: 2,
      alpha: 0.3
    });
  }

  /**
   * Draw sensor rays (debug)
   */
  drawSensors(creature) {
    const g = this.graphics.sensors;
    const directions = [0, Math.PI / 2, Math.PI, -Math.PI / 2];

    for (let i = 0; i < 4; i++) {
      const sensorAngle = creature.angle + directions[i];

      // Food sensors (green)
      if (creature.foodSensors[i] > 0) {
        const endX = creature.x + Math.cos(sensorAngle) * creature.sensorLength * creature.foodSensors[i];
        const endY = creature.y + Math.sin(sensorAngle) * creature.sensorLength * creature.foodSensors[i];
        g.moveTo(creature.x, creature.y);
        g.lineTo(endX, endY);
        g.stroke({ color: 0x4ade80, width: 1, alpha: 0.5 });
      }

      // Predator sensors (red)
      if (creature.predatorSensors[i] > 0) {
        const endX = creature.x + Math.cos(sensorAngle) * creature.sensorLength * creature.predatorSensors[i];
        const endY = creature.y + Math.sin(sensorAngle) * creature.sensorLength * creature.predatorSensors[i];
        g.moveTo(creature.x, creature.y);
        g.lineTo(endX, endY);
        g.stroke({ color: 0xef4444, width: 2, alpha: 0.5 });
      }

      // Prey sensors (cyan)
      if (creature.preySensors[i] > 0) {
        const endX = creature.x + Math.cos(sensorAngle) * creature.sensorLength * creature.preySensors[i];
        const endY = creature.y + Math.sin(sensorAngle) * creature.sensorLength * creature.preySensors[i];
        g.moveTo(creature.x, creature.y);
        g.lineTo(endX, endY);
        g.stroke({ color: 0x06b6d4, width: 2, alpha: 0.5 });
      }
    }
  }

  /**
   * Draw selection ring around creature
   */
  drawSelection(creature, time) {
    const g = this.graphics.selection;
    const pulse = 1 + Math.sin(time * 0.01) * 0.2;

    g.circle(creature.x, creature.y, creature.radius * 2 * pulse);
    g.stroke({ color: 0xffffff, width: 2, alpha: 1 });
  }

  /**
   * Draw tooltip for creature
   */
  drawTooltip(creature) {
    const g = this.graphics.ui;

    const padding = 10;
    const lineHeight = 16;
    const tooltipWidth = 160;

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

    // Transform creature position to screen position
    const screenPos = this.gameContainer.toGlobal({ x: creature.x, y: creature.y });

    let tooltipX = screenPos.x - tooltipWidth / 2;
    let tooltipY = screenPos.y - creature.radius * this.camera.zoom - tooltipHeight - 15;

    // Keep on screen
    if (tooltipX < 10) tooltipX = 10;
    if (tooltipX + tooltipWidth > this.canvas.width - 10) {
      tooltipX = this.canvas.width - tooltipWidth - 10;
    }
    if (tooltipY < 10) {
      tooltipY = screenPos.y + creature.radius * this.camera.zoom + 15;
    }

    // Background
    g.roundRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight, 10);
    g.fill({ color: 0x0f0f1e, alpha: 0.95 });

    const borderColor = creature.isPredator ? 0xef4444 : 0x22c55e;
    g.roundRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight, 10);
    g.stroke({ color: borderColor, width: 2 });

    // Text (using PIXI.Text)
    stats.forEach((line, i) => {
      const y = tooltipY + padding + (i + 1) * lineHeight - 3;

      let style = {
        fontFamily: 'Inter, sans-serif',
        fontSize: 12,
        fill: 0xffffff,
        alpha: 0.8
      };

      if (i === 0) {
        style.fill = borderColor;
        style.fontWeight = 'bold';
      } else if (i === 4) {
        style.fontSize = 10;
        style.alpha = 0.4;
      }

      const text = new PIXI.Text({ text: line, style });
      text.x = tooltipX + padding;
      text.y = y - 12;
      this.uiContainer.addChild(text);
    });
  }

  /**
   * Draw progress bar
   */
  drawProgressBar() {
    const g = this.graphics.ui;
    const progress = this.world.tick / this.world.generationLength;
    const barHeight = 3;

    // Background
    g.rect(0, 0, this.canvas.width, barHeight);
    g.fill({ color: 0xffffff, alpha: 0.1 });

    // Progress
    g.rect(0, 0, this.canvas.width * progress, barHeight);
    g.fill({ color: 0x6366f1 });
  }

  /**
   * Draw pause indicator
   */
  drawPauseIndicator() {
    const text = new PIXI.Text({
      text: '⏸ PAUSED - Click creatures to see stats',
      style: {
        fontFamily: 'Inter, sans-serif',
        fontSize: 14,
        fill: 0xffffff,
        alpha: 0.5
      }
    });

    text.x = this.canvas.width / 2 - text.width / 2;
    text.y = 30;

    this.uiContainer.addChild(text);
  }

  /**
   * Draw zoom level indicator
   */
  drawZoomLevel() {
    const zoomPercent = Math.round(this.camera.zoom * 100);

    const text1 = new PIXI.Text({
      text: `Zoom: ${zoomPercent}%`,
      style: {
        fontFamily: 'Inter, sans-serif',
        fontSize: 12,
        fill: 0xffffff,
        alpha: 0.5,
        align: 'right'
      }
    });

    text1.x = this.canvas.width - text1.width - 15;
    text1.y = this.canvas.height - 30;

    const text2 = new PIXI.Text({
      text: 'WASD: Pan | Right-Click Drag: Pan | +/-: Zoom | 0: Reset',
      style: {
        fontFamily: 'Inter, sans-serif',
        fontSize: 10,
        fill: 0xffffff,
        alpha: 0.3,
        align: 'right'
      }
    });

    text2.x = this.canvas.width - text2.width - 15;
    text2.y = this.canvas.height - 50;

    this.uiContainer.addChild(text1);
    this.uiContainer.addChild(text2);
  }

  /**
   * Resize handler
   */
  resize(width, height) {
    this.app.renderer.resize(width, height);
    this.canvas.width = width;
    this.canvas.height = height;

    // Reposition stars
    if (this.starContainer) {
      for (const star of this.stars) {
        star.graphics.x = Math.random() * width;
        star.graphics.y = Math.random() * height;
      }
    }
  }

  /**
   * Toggle functions
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
    this.updateCameraTransform();
  }

  zoomOut() {
    this.camera.zoom = Math.max(this.camera.minZoom, this.camera.zoom / 1.2);
    this.updateCameraTransform();
  }

  resetZoom() {
    this.camera.zoom = 1.0;
    this.camera.x = this.world.width / 2;
    this.camera.y = this.world.height / 2;
    this.updateCameraTransform();
  }

  setZoom(zoom) {
    this.camera.zoom = Math.max(this.camera.minZoom, Math.min(this.camera.maxZoom, zoom));
    this.updateCameraTransform();
  }

  /**
   * Convert HSL to Hex for PIXI
   */
  hslToHex(h, s, l) {
    s /= 100;
    l /= 100;
    const k = n => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    const r = Math.round(255 * f(0));
    const g = Math.round(255 * f(8));
    const b = Math.round(255 * f(4));
    return (r << 16) | (g << 8) | b;
  }
}
