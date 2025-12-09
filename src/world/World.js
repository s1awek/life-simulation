import { Creature } from './Creature.js';
import { Food } from './Food.js';
import { Obstacle } from './Obstacle.js';
import { GeneticAlgorithm } from '../engine/GeneticAlgorithm.js';
import { EvolutionLog } from '../engine/EvolutionLog.js';

/**
 * World - The simulation environment
 * Now with predator/prey ecosystem and evolution logging
 */
export class World {
  constructor(width, height, options = {}) {
    this.width = width;
    this.height = height;

    // Simulation settings
    this.populationSize = options.populationSize || 40;
    this.foodCount = options.foodCount || 60;
    this.meatCount = options.meatCount || 5;
    this.obstacleCount = options.obstacleCount || 15;
    this.generationLength = options.generationLength || 1000;
    this.predatorRatio = options.predatorRatio || 0.2;

    // State
    this.creatures = [];
    this.foods = [];
    this.obstacles = [];
    this.generation = 1;
    this.tick = 0;
    this.isPaused = false;
    this.speed = 1;

    // Statistics
    this.stats = {
      generation: 1,
      tick: 0,
      alive: 0,
      predators: 0,
      herbivores: 0,
      avgFitness: 0,
      maxFitness: 0,
      avgEnergy: 0,
      foodEaten: 0,
      kills: 0,
      history: []
    };

    // Evolution log
    this.evolutionLog = new EvolutionLog(150);

    // Records tracking (best ever)
    this.records = {
      maxFitness: 0,
      maxFitnessGen: 0,
      bestAvgFitness: 0,
      bestAvgFitnessGen: 0,
      mostKills: 0,
      mostKillsGen: 0,
      longestSurvival: 0
    };

    // Previous generation stats for trends
    this.prevStats = {
      avgFitness: 0,
      maxFitness: 0,
      predators: 0,
      herbivores: 0
    };

    // Ecosystem balancing parameters
    this.balancing = {
      dynamicFoodEnabled: options.dynamicFoodEnabled ?? true,
      foodScalingFactor: options.foodScalingFactor ?? 0.8,
      overpopulationThreshold: options.overpopulationThreshold ?? 0.7,
      herbivorePenalty: options.herbivorePenalty ?? 0.15,
      predatorPenalty: options.predatorPenalty ?? 0.10,
      predatorThreshold: options.predatorThreshold ?? 0.5
    };

    // Genetic algorithm
    this.ga = new GeneticAlgorithm({
      mutationRate: 0.1,
      mutationStrength: 0.3,
      elitismRate: 0.1,
      tournamentSize: 5,
      traitMutationRate: 0.15,
      traitMutationStrength: 0.2
    });

    // Initialize
    this.init();
  }

  init() {
    this.spawnCreatures();
    this.spawnFood();
    this.spawnObstacles();
  }

  spawnCreatures() {
    this.creatures = [];
    const predatorCount = Math.floor(this.populationSize * this.predatorRatio);

    for (let i = 0; i < this.populationSize; i++) {
      const x = Math.random() * this.width;
      const y = Math.random() * this.height;
      const isPredator = i < predatorCount;
      this.creatures.push(new Creature(x, y, this, { isPredator }));
    }
  }

  /**
   * Calculate dynamic food count based on population ratios
   * When herbivores overpopulate, reduce plant availability
   */
  calculateFoodCount() {
    if (!this.balancing.dynamicFoodEnabled) {
      return this.foodCount;
    }

    const alive = this.creatures.filter(c => c.isAlive());
    if (alive.length === 0) return this.foodCount;

    const herbivores = alive.filter(c => !c.isPredator).length;
    const herbivoreRatio = herbivores / alive.length;

    // Scale down food when herbivores dominate
    // Formula: baseFoodCount * (1.5 - herbivoreRatio * scalingFactor)
    // At 70% herbivores: foodCount * (1.5 - 0.7 * 0.8) = foodCount * 0.94
    // At 90% herbivores: foodCount * (1.5 - 0.9 * 0.8) = foodCount * 0.78
    const scalingFactor = this.balancing.foodScalingFactor;
    const adjustedCount = Math.floor(
      this.foodCount * (1.5 - herbivoreRatio * scalingFactor)
    );

    // Ensure minimum food availability
    return Math.max(Math.floor(this.foodCount * 0.6), adjustedCount);
  }

  spawnFood() {
    this.foods = [];

    // Spawn plants (with dynamic count based on herbivore population)
    const dynamicFoodCount = this.calculateFoodCount();
    for (let i = 0; i < dynamicFoodCount; i++) {
      this.addRandomFood('plant');
    }

    // Spawn some initial meat
    for (let i = 0; i < this.meatCount; i++) {
      this.addRandomFood('meat');
    }
  }

  addRandomFood(type = 'plant') {
    const x = Math.random() * this.width;
    const y = Math.random() * this.height;
    const energy = type === 'meat'
      ? 20 + Math.random() * 25
      : 5 + Math.random() * 15;
    this.foods.push(new Food(x, y, energy, type));
  }

  /**
   * Spawn meat at specific location (when prey dies)
   * @param {boolean} fromPredator - If true, meat is from predator (toxic to other predators)
   * @param {boolean} fromHunt - If true, meat is from successful hunt (lasts longer)
   */
  spawnMeat(x, y, fromPredator = false, fromHunt = false) {
    const energy = 25 + Math.random() * 20;
    this.foods.push(new Food(x, y, energy, 'meat', fromPredator, fromHunt));
  }

  /**
   * Spawn obstacles on the map
   */
  spawnObstacles() {
    console.log('🪨 Spawning obstacles... obstacleCount =', this.obstacleCount);

    // Create clusters of rocks
    const clusterCount = Math.floor(this.obstacleCount / 3);
    console.log('Creating', clusterCount, 'clusters');

    for (let c = 0; c < clusterCount; c++) {
      const clusterX = Math.random() * this.width;
      const clusterY = Math.random() * this.height;
      const rocksInCluster = 5 + Math.floor(Math.random() * 4);

      for (let i = 0; i < rocksInCluster; i++) {
        const offsetX = (Math.random() - 0.5) * 150;
        const offsetY = (Math.random() - 0.5) * 150;
        const x = Math.max(50, Math.min(this.width - 50, clusterX + offsetX));
        const y = Math.max(50, Math.min(this.height - 50, clusterY + offsetY));
        const size = 50 + Math.random() * 70;

        this.obstacles.push(new Obstacle(x, y, size, size, 'rock'));
      }
    }

    console.log('✅ Spawned', this.obstacles.length, 'obstacles');
  }

  /**
   * Main update loop
   */
  update() {
    if (this.isPaused) return;

    for (let s = 0; s < this.speed; s++) {
      this.tick++;

      // Update all foods (age meat)
      for (const food of this.foods) {
        food.update();
      }

      // Update all creatures
      for (const creature of this.creatures) {
        if (creature.isAlive()) {
          creature.update();
        }
      }

      // Check for generation end (early exit from speed loop)
      const alive = this.creatures.filter(c => c.isAlive()).length;
      if (this.tick >= this.generationLength || alive === 0) {
        this.nextGeneration();
        break; // Exit speed loop after generation change
      }
    }

    // These operations only need to happen once per frame, not per speed iteration
    // Log deaths from starvation AND spawn meat
    for (const creature of this.creatures) {
      if (!creature.isAlive() && creature.energy <= 0 && !creature._deathLogged) {
        creature._deathLogged = true;
        // Only log if not already logged (kill logs death separately)
        const recentKillLog = this.evolutionLog.entries.find(
          e => e.type === 'death' && e.creatureId === creature.id
        );
        if (!recentKillLog) {
          this.evolutionLog.logDeath(creature, 'starvation');
          // Spawn meat when creature starves (spoils faster)
          this.spawnMeat(creature.x, creature.y, creature.isPredator, false);
        }
      }
    }

    // Respawn eaten food (with dynamic count for plants) - once per frame
    const consumedPlants = this.foods.filter(f => f.consumed && f.type === 'plant').length;
    const consumedMeat = this.foods.filter(f => f.consumed && f.type === 'meat').length;
    const dynamicFoodCount = this.calculateFoodCount();

    if (consumedPlants > dynamicFoodCount * 0.3 || consumedMeat > 0) {
      this.foods = this.foods.filter(f => !f.consumed);
      // Respawn plants up to dynamic limit
      const plantsToSpawn = Math.min(consumedPlants, dynamicFoodCount - this.foods.filter(f => f.type === 'plant').length);
      for (let i = 0; i < plantsToSpawn; i++) {
        this.addRandomFood('plant');
      }
      // Meat respawns more sparingly
      for (let i = 0; i < Math.floor(consumedMeat * 0.3); i++) {
        this.addRandomFood('meat');
      }
    }

    this.updateStats();
  }

  /**
   * Apply fitness penalties for overpopulated species
   * Encourages ecosystem balance by penalizing monocultures
   */
  applyPopulationPenalties() {
    const alive = this.creatures.filter(c => c.isAlive());
    if (alive.length === 0) return;

    const predators = alive.filter(c => c.isPredator).length;
    const herbivores = alive.filter(c => !c.isPredator).length;
    const predatorRatio = predators / alive.length;
    const herbivoreRatio = herbivores / alive.length;

    // Apply penalties to overpopulated species
    for (const creature of this.creatures) {
      if (!creature.isPredator && herbivoreRatio > this.balancing.overpopulationThreshold) {
        // Herbivores are overpopulated
        creature.fitness *= (1 - this.balancing.herbivorePenalty);
      } else if (creature.isPredator && predatorRatio > this.balancing.predatorThreshold) {
        // Predators are overpopulated
        creature.fitness *= (1 - this.balancing.predatorPenalty);
      }
    }
  }

  /**
   * Evolve to next generation
   */
  nextGeneration() {
    // Calculate final fitness for all creatures
    for (const c of this.creatures) {
      if (c.isAlive()) {
        c.fitness += c.energy;
      }
    }

    // Apply overpopulation penalties before selection
    this.applyPopulationPenalties();

    // Get stats and log generation
    const gaStats = this.ga.getStats(this.creatures);

    this.evolutionLog.logGeneration(this.generation, {
      avgFitness: gaStats.avg,
      maxFitness: gaStats.max,
      predatorCount: gaStats.predatorCount,
      preyCount: gaStats.preyCount,
      killCount: gaStats.totalKills,
      totalDeaths: this.creatures.filter(c => !c.isAlive()).length
    });

    // Record history
    this.stats.history.push({
      generation: this.generation,
      avgFitness: gaStats.avg,
      maxFitness: gaStats.max,
      minFitness: gaStats.min,
      predators: gaStats.predatorCount,
      herbivores: gaStats.preyCount
    });

    // Keep only last 50 generations in history
    if (this.stats.history.length > 50) {
      this.stats.history.shift();
    }

    // Update records
    if (gaStats.max > this.records.maxFitness) {
      this.records.maxFitness = gaStats.max;
      this.records.maxFitnessGen = this.generation;
    }
    if (gaStats.avg > this.records.bestAvgFitness) {
      this.records.bestAvgFitness = gaStats.avg;
      this.records.bestAvgFitnessGen = this.generation;
    }
    if (gaStats.totalKills > this.records.mostKills) {
      this.records.mostKills = gaStats.totalKills;
      this.records.mostKillsGen = this.generation;
    }

    // Save previous stats for trends
    this.prevStats = {
      avgFitness: this.stats.avgFitness,
      maxFitness: this.stats.maxFitness,
      predators: this.stats.predators,
      herbivores: this.stats.herbivores
    };

    // Evolve population with trait inheritance
    const createCreature = (options = {}) => {
      const x = Math.random() * this.width;
      const y = Math.random() * this.height;
      return new Creature(x, y, this, options);
    };

    this.creatures = this.ga.evolve(this.creatures, createCreature, this.evolutionLog);

    // Reset world state
    this.generation++;
    this.tick = 0;
    this.spawnFood();

    // Randomize creature positions
    for (const c of this.creatures) {
      c.x = Math.random() * this.width;
      c.y = Math.random() * this.height;
      c.angle = Math.random() * Math.PI * 2;
      c._deathLogged = false;
    }
  }

  updateStats() {
    const alive = this.creatures.filter(c => c.isAlive());
    const predators = alive.filter(c => c.isPredator);
    const herbivores = alive.filter(c => !c.isPredator);
    const totalFitness = this.creatures.reduce((sum, c) => sum + c.fitness, 0);
    const totalEnergy = alive.reduce((sum, c) => sum + c.energy, 0);
    const totalFood = this.creatures.reduce((sum, c) => sum + c.foodEaten, 0);
    const totalKills = this.creatures.reduce((sum, c) => sum + c.kills, 0);

    this.stats = {
      ...this.stats,
      generation: this.generation,
      tick: this.tick,
      alive: alive.length,
      predators: predators.length,
      herbivores: herbivores.length,
      avgFitness: totalFitness / this.creatures.length,
      maxFitness: Math.max(...this.creatures.map(c => c.fitness)),
      avgEnergy: alive.length > 0 ? totalEnergy / alive.length : 0,
      foodEaten: totalFood,
      kills: totalKills
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
