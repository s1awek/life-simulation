import { crossoverTraits, mutateTraits } from './Traits.js';

/**
 * Genetic Algorithm Engine
 * Handles evolution of neural network weights AND genetic traits across generations
 */
export class GeneticAlgorithm {
  constructor(options = {}) {
    this.mutationRate = options.mutationRate || 0.1;
    this.mutationStrength = options.mutationStrength || 0.3;
    this.elitismRate = options.elitismRate || 0.1;
    this.tournamentSize = options.tournamentSize || 5;
    this.traitMutationRate = options.traitMutationRate || 0.15;
    this.traitMutationStrength = options.traitMutationStrength || 0.2;
  }

  /**
   * Evolve a population based on fitness scores
   * @param {Array} population - Array of creatures with fitness
   * @param {Function} createCreature - Factory function to create new creature
   * @param {EvolutionLog} evolutionLog - Optional log for tracking
   * @returns {Array} - New generation
   */
  evolve(population, createCreature, evolutionLog = null) {
    // Sort by fitness (descending)
    const sorted = [...population].sort((a, b) => b.fitness - a.fitness);
    const newGen = [];
    const popSize = population.length;

    // Elitism - keep top performers unchanged
    const eliteCount = Math.max(1, Math.floor(popSize * this.elitismRate));
    for (let i = 0; i < eliteCount; i++) {
      const parent = sorted[i];
      const elite = createCreature({
        isPredator: parent.isPredator,
        traits: { ...parent.traits }
      });
      elite.brain.setWeights(parent.brain.getWeights());
      elite.isElite = true;
      newGen.push(elite);

      // Log elite
      if (evolutionLog) {
        evolutionLog.logElite(parent, evolutionLog.generationSummaries.length + 1, i + 1);
      }
    }

    // Fill rest with offspring
    while (newGen.length < popSize) {
      const parent1 = this.tournamentSelect(sorted);
      const parent2 = this.tournamentSelect(sorted);

      // Crossover and mutate traits
      const childTraits = crossoverTraits(parent1.traits, parent2.traits);
      const mutatedTraits = mutateTraits(childTraits, this.traitMutationRate, this.traitMutationStrength);

      // Decide predator status (inherit from random parent with some mutation chance)
      let isPredator = Math.random() < 0.5 ? parent1.isPredator : parent2.isPredator;
      // Small chance to flip type
      if (Math.random() < 0.05) {
        isPredator = !isPredator;
      }

      const child = createCreature({
        isPredator,
        traits: mutatedTraits
      });

      // Crossover and mutate brain weights
      const childWeights = this.crossover(
        parent1.brain.getWeights(),
        parent2.brain.getWeights()
      );
      this.mutate(childWeights);
      child.brain.setWeights(childWeights);

      newGen.push(child);

      // Log birth
      if (evolutionLog) {
        evolutionLog.logBirth(child, parent1, parent2, evolutionLog.generationSummaries.length + 1);
      }
    }

    return newGen;
  }

  /**
   * Tournament selection
   */
  tournamentSelect(sortedPopulation) {
    let best = null;

    for (let i = 0; i < this.tournamentSize; i++) {
      const idx = Math.floor(Math.random() * sortedPopulation.length);
      const candidate = sortedPopulation[idx];

      if (!best || candidate.fitness > best.fitness) {
        best = candidate;
      }
    }

    return best;
  }

  /**
   * Uniform crossover
   */
  crossover(weights1, weights2) {
    const child = [];

    for (let i = 0; i < weights1.length; i++) {
      if (Math.random() < 0.5) {
        child.push(weights1[i]);
      } else {
        child.push(weights2[i]);
      }
    }

    return child;
  }

  /**
   * Gaussian mutation
   */
  mutate(weights) {
    for (let i = 0; i < weights.length; i++) {
      if (Math.random() < this.mutationRate) {
        // Gaussian noise
        const noise = this.gaussianRandom() * this.mutationStrength;
        weights[i] += noise;
      }
    }
  }

  /**
   * Box-Muller transform for Gaussian random
   */
  gaussianRandom() {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  }

  /**
   * Calculate population statistics
   */
  getStats(population) {
    const fitnesses = population.map(c => c.fitness);
    const sum = fitnesses.reduce((a, b) => a + b, 0);
    const avg = sum / fitnesses.length;
    const max = Math.max(...fitnesses);
    const min = Math.min(...fitnesses);

    const predatorCount = population.filter(c => c.isPredator).length;
    const preyCount = population.length - predatorCount;
    const totalKills = population.reduce((sum, c) => sum + (c.kills || 0), 0);

    return { avg, max, min, predatorCount, preyCount, totalKills };
  }
}
