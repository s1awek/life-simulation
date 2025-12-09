/**
 * Genetic Algorithm Engine
 * Handles evolution of neural network weights across generations
 */
export class GeneticAlgorithm {
  constructor(options = {}) {
    this.mutationRate = options.mutationRate || 0.1;
    this.mutationStrength = options.mutationStrength || 0.3;
    this.elitismRate = options.elitismRate || 0.05;
    this.tournamentSize = options.tournamentSize || 5;
  }

  /**
   * Evolve a population based on fitness scores
   * @param {Array} population - Array of creatures with fitness
   * @param {Function} createCreature - Factory function to create new creature
   * @returns {Array} - New generation
   */
  evolve(population, createCreature) {
    // Sort by fitness (descending)
    const sorted = [...population].sort((a, b) => b.fitness - a.fitness);
    const newGen = [];
    const popSize = population.length;

    // Elitism - keep top performers unchanged
    const eliteCount = Math.max(1, Math.floor(popSize * this.elitismRate));
    for (let i = 0; i < eliteCount; i++) {
      const elite = createCreature();
      elite.brain.setWeights(sorted[i].brain.getWeights());
      elite.isElite = true;
      newGen.push(elite);
    }

    // Fill rest with offspring
    while (newGen.length < popSize) {
      const parent1 = this.tournamentSelect(sorted);
      const parent2 = this.tournamentSelect(sorted);

      const child = createCreature();
      const childWeights = this.crossover(
        parent1.brain.getWeights(),
        parent2.brain.getWeights()
      );

      this.mutate(childWeights);
      child.brain.setWeights(childWeights);
      newGen.push(child);
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

    return { avg, max, min };
  }
}
