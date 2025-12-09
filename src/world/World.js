import { Creature } from './Creature.js';
import { Food } from './Food.js';
import { GeneticAlgorithm } from '../engine/GeneticAlgorithm.js';

/**
 * World - The simulation environment
 */
export class World {
  constructor(width, height, options = {}) {
    this.width = width;
    this.height = height;

    // Simulation settings
    this.populationSize = options.populationSize || 30;
    this.foodCount = options.foodCount || 50;
    this.generationLength = options.generationLength || 1000; // ticks per generation

    // State
    this.creatures = [];
    this.foods = [];
    this.generation = 1;
    this.tick = 0;
    this.isPaused = false;
    this.speed = 1;

    // Statistics
    this.stats = {
      generation: 1,
      tick: 0,
      alive: 0,
      avgFitness: 0,
      maxFitness: 0,
      avgEnergy: 0,
      foodEaten: 0,
      history: []
    };

    // Genetic algorithm
    this.ga = new GeneticAlgorithm({
      mutationRate: 0.1,
      mutationStrength: 0.3,
      elitismRate: 0.1,
      tournamentSize: 5
    });

    // Initialize
    this.init();
  }

  init() {
    this.spawnCreatures();
    this.spawnFood();
  }

  spawnCreatures() {
    this.creatures = [];
    for (let i = 0; i < this.populationSize; i++) {
      const x = Math.random() * this.width;
      const y = Math.random() * this.height;
      this.creatures.push(new Creature(x, y, this));
    }
  }

  spawnFood() {
    this.foods = [];
    for (let i = 0; i < this.foodCount; i++) {
      this.addRandomFood();
    }
  }

  addRandomFood() {
    const x = Math.random() * this.width;
    const y = Math.random() * this.height;
    const energy = 5 + Math.random() * 15;
    this.foods.push(new Food(x, y, energy));
  }

  /**
   * Main update loop
   */
  update() {
    if (this.isPaused) return;

    for (let s = 0; s < this.speed; s++) {
      this.tick++;

      // Update all creatures
      for (const creature of this.creatures) {
        if (creature.isAlive()) {
          creature.update();
        }
      }

      // Respawn eaten food
      const consumedCount = this.foods.filter(f => f.consumed).length;
      if (consumedCount > this.foodCount * 0.3) {
        this.foods = this.foods.filter(f => !f.consumed);
        for (let i = 0; i < consumedCount; i++) {
          this.addRandomFood();
        }
      }

      // Check for generation end
      const alive = this.creatures.filter(c => c.isAlive()).length;
      if (this.tick >= this.generationLength || alive === 0) {
        this.nextGeneration();
      }
    }

    this.updateStats();
  }

  /**
   * Evolve to next generation
   */
  nextGeneration() {
    // Calculate final fitness for all creatures
    for (const c of this.creatures) {
      // Bonus for surviving
      if (c.isAlive()) {
        c.fitness += c.energy;
      }
    }

    // Record history
    const gaStats = this.ga.getStats(this.creatures);
    this.stats.history.push({
      generation: this.generation,
      avgFitness: gaStats.avg,
      maxFitness: gaStats.max,
      minFitness: gaStats.min
    });

    // Keep only last 50 generations in history
    if (this.stats.history.length > 50) {
      this.stats.history.shift();
    }

    // Evolve population
    const createCreature = () => {
      const x = Math.random() * this.width;
      const y = Math.random() * this.height;
      return new Creature(x, y, this);
    };

    this.creatures = this.ga.evolve(this.creatures, createCreature);

    // Reset world state
    this.generation++;
    this.tick = 0;
    this.spawnFood();

    // Randomize creature positions
    for (const c of this.creatures) {
      c.x = Math.random() * this.width;
      c.y = Math.random() * this.height;
      c.angle = Math.random() * Math.PI * 2;
    }
  }

  updateStats() {
    const alive = this.creatures.filter(c => c.isAlive());
    const totalFitness = this.creatures.reduce((sum, c) => sum + c.fitness, 0);
    const totalEnergy = alive.reduce((sum, c) => sum + c.energy, 0);
    const totalFood = this.creatures.reduce((sum, c) => sum + c.foodEaten, 0);

    this.stats = {
      ...this.stats,
      generation: this.generation,
      tick: this.tick,
      alive: alive.length,
      avgFitness: totalFitness / this.creatures.length,
      maxFitness: Math.max(...this.creatures.map(c => c.fitness)),
      avgEnergy: alive.length > 0 ? totalEnergy / alive.length : 0,
      foodEaten: totalFood
    };
  }

  /**
   * Resize world
   */
  resize(width, height) {
    this.width = width;
    this.height = height;
  }

  /**
   * Toggle pause
   */
  togglePause() {
    this.isPaused = !this.isPaused;
    return this.isPaused;
  }

  /**
   * Set simulation speed
   */
  setSpeed(speed) {
    this.speed = Math.max(1, Math.min(10, speed));
  }
}
