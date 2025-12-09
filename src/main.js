import './styles/main.css';
import { World } from './world/World.js';
import { Renderer } from './renderer/Renderer.js';
import { UI } from './ui/UI.js';

/**
 * Life Simulation - Main Entry Point
 * Neural Network Evolution Simulation
 */

class Simulation {
  constructor() {
    this.canvas = null;
    this.world = null;
    this.renderer = null;
    this.ui = null;
    this.lastTime = 0;

    this.init();
  }

  init() {
    // Create canvas
    this.canvas = document.createElement('canvas');
    this.canvas.id = 'simulation-canvas';
    document.body.appendChild(this.canvas);

    // Set canvas size
    this.resize();
    window.addEventListener('resize', () => this.resize());

    // Create world (2x window size for more space)
    const worldWidth = this.canvas.width * 2;
    const worldHeight = this.canvas.height * 2;

    this.world = new World(worldWidth, worldHeight, {
      populationSize: 40,
      foodCount: 80,              // Increased from 60 (+33%)
      meatCount: 10,              // Increased from 5 (+100%)
      generationLength: 2000,     // Increased from 800 (+150%)
      predatorRatio: 0.25,        // Increased from 0.2 (+25%)

      // Stronger ecosystem balancing
      foodScalingFactor: 0.9,     // More aggressive (was 0.8)
      overpopulationThreshold: 0.65, // Earlier penalty (was 0.7)
      herbivorePenalty: 0.20      // Stronger penalty (was 0.15)
    });

    // Create renderer
    this.renderer = new Renderer(this.canvas, this.world);

    // Create UI
    this.ui = new UI(this.world, this.renderer);

    // Click handler for creature selection
    this.canvas.addEventListener('click', (e) => this.handleClick(e));

    // Start animation loop
    this.animate(0);

    console.log('🧬 Life Simulation Started!');
    console.log('Population:', this.world.populationSize);
    console.log('Neural Network Weights:', this.world.creatures[0]?.brain.getWeightCount());
  }

  handleClick(e) {
    const rect = this.canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    // Transform screen coordinates to world coordinates through camera
    const worldX = (screenX - this.canvas.width / 2) / this.renderer.camera.zoom + this.renderer.camera.x;
    const worldY = (screenY - this.canvas.height / 2) / this.renderer.camera.zoom + this.renderer.camera.y;

    // Find creature under click
    let closest = null;
    let closestDist = Infinity;

    for (const creature of this.world.creatures) {
      if (!creature.isAlive()) continue;

      const dx = creature.x - worldX;
      const dy = creature.y - worldY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < creature.radius + 10 && dist < closestDist) {
        closest = creature;
        closestDist = dist;
      }
    }

    // Toggle selection
    if (closest) {
      if (this.renderer.selectedCreature === closest) {
        this.renderer.selectedCreature = null; // Deselect if clicking same
      } else {
        this.renderer.selectedCreature = closest;
      }
    } else {
      this.renderer.selectedCreature = null; // Click on empty space deselects
    }
  }

  resize() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.canvas.width = width;
    this.canvas.height = height;

    if (this.world) {
      this.world.resize(width, height);
    }

    if (this.renderer) {
      this.renderer.resize(width, height);
    }
  }

  animate(time) {
    // Update simulation
    this.world.update();

    // Render
    this.renderer.render(time);

    // Update UI (throttled)
    if (time - this.lastTime > 100) {
      this.ui.update();
      this.lastTime = time;
    }

    // Next frame
    requestAnimationFrame((t) => this.animate(t));
  }
}

// Start simulation when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new Simulation();
});
