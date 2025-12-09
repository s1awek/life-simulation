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

    // Create world
    this.world = new World(this.canvas.width, this.canvas.height, {
      populationSize: 40,
      foodCount: 60,
      generationLength: 800
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
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Find creature under click
    let closest = null;
    let closestDist = Infinity;

    for (const creature of this.world.creatures) {
      if (!creature.isAlive()) continue;

      const dx = creature.x - x;
      const dy = creature.y - y;
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
