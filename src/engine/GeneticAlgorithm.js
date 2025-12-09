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

    // Species diversity protection
    this.minSpeciesCount = options.minSpeciesCount || 5;
    this.speciesEliteCount = options.speciesEliteCount || 2;
    this.adaptiveMutationMultiplier = options.adaptiveMutationMultiplier || 3;
  }

  /**
   * Evolve a population based on fitness scores with species diversity protection
   * @param {Array} population - Array of creatures with fitness
   * @param {Function} createCreature - Factory function to create new creature
   * @param {EvolutionLog} evolutionLog - Optional log for tracking
   * @returns {Array} - New generation
   */
  evolve(population, createCreature, evolutionLog = null) {
    const popSize = population.length;
    const newGen = [];

    // Separate by species
    const predators = population.filter(c => c.isPredator).sort((a, b) => b.fitness - a.fitness);
    const prey = population.filter(c => !c.isPredator).sort((a, b) => b.fitness - a.fitness);

    console.log(`🧬 Evolution: ${predators.length} predators, ${prey.length} prey`);

    // STEP 1: Species-based elitism (top 2 from each species)
    const predatorElites = this.selectTopNFromSpecies(predators, this.speciesEliteCount);
    const preyElites = this.selectTopNFromSpecies(prey, this.speciesEliteCount);

    for (const parent of [...predatorElites, ...preyElites]) {
      const elite = createCreature({
        isPredator: parent.isPredator,
        traits: { ...parent.traits }
      });
      elite.brain.setWeights(parent.brain.getWeights());
      elite.isElite = true;
      newGen.push(elite);

      if (evolutionLog) {
        evolutionLog.logElite(parent, evolutionLog.generationSummaries.length + 1, newGen.length);
      }
    }

    console.log(`✅ Elites: ${predatorElites.length} predators, ${preyElites.length} prey`);

    // STEP 2: Enforce minimum species count with adaptive mutation
    const currentPredators = newGen.filter(c => c.isPredator).length;
    const currentPrey = newGen.filter(c => !c.isPredator).length;

    // Add struggling predators with heavy mutation
    if (currentPredators < this.minSpeciesCount && predators.length > 0) {
      const needed = this.minSpeciesCount - currentPredators;
      console.log(`⚠️ Predators struggling! Adding ${needed} with adaptive mutation`);

      for (let i = 0; i < needed && predatorElites.length + i < predators.length; i++) {
        const weakPredator = predators[predatorElites.length + i];
        const mutant = createCreature({
          isPredator: true,
          traits: mutateTraits({ ...weakPredator.traits },
            this.traitMutationRate * 2,
            this.traitMutationStrength * 2)
        });

        const weights = weakPredator.brain.getWeights();
        this.mutateAdaptive(weights, this.adaptiveMutationMultiplier);
        mutant.brain.setWeights(weights);
        newGen.push(mutant);
      }
    }

    // Add struggling prey with heavy mutation
    if (currentPrey < this.minSpeciesCount && prey.length > 0) {
      const needed = this.minSpeciesCount - currentPrey;
      console.log(`⚠️ Prey struggling! Adding ${needed} with adaptive mutation`);

      for (let i = 0; i < needed && preyElites.length + i < prey.length; i++) {
        const weakPrey = prey[preyElites.length + i];
        const mutant = createCreature({
          isPredator: false,
          traits: mutateTraits({ ...weakPrey.traits },
            this.traitMutationRate * 2,
            this.traitMutationStrength * 2)
        });

        const weights = weakPrey.brain.getWeights();
        this.mutateAdaptive(weights, this.adaptiveMutationMultiplier);
        mutant.brain.setWeights(weights);
        newGen.push(mutant);
      }
    }

    // STEP 3: Fill rest with tournament selection
    const sorted = [...population].sort((a, b) => b.fitness - a.fitness);

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

    const finalPredators = newGen.filter(c => c.isPredator).length;
    const finalPrey = newGen.filter(c => !c.isPredator).length;
    console.log(`🎯 Next gen: ${finalPredators} predators, ${finalPrey} prey`);

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
   * Select top N creatures from species
   */
  selectTopNFromSpecies(creatures, n) {
    return creatures.slice(0, Math.min(n, creatures.length));
  }

  /**
   * Adaptive mutation with higher rates for struggling species
   */
  mutateAdaptive(weights, multiplier = 1) {
    const adaptiveRate = this.mutationRate * multiplier;
    const adaptiveStrength = this.mutationStrength * multiplier;

    for (let i = 0; i < weights.length; i++) {
      if (Math.random() < adaptiveRate) {
        const noise = this.gaussianRandom() * adaptiveStrength;
        weights[i] += noise;
      }
    }
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
