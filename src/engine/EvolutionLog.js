/**
 * EvolutionLog - Track and log evolutionary events
 * Records who survives, who reproduces, and why
 */
export class EvolutionLog {
  constructor(maxEntries = 100) {
    this.entries = [];
    this.maxEntries = maxEntries;
    this.generationSummaries = [];
  }

  /**
   * Log an event
   * @param {string} type - Event type: 'elite', 'birth', 'death', 'kill', 'generation'
   * @param {object} data - Event data
   */
  log(type, data) {
    const entry = {
      id: Date.now() + Math.random(),
      timestamp: performance.now(),
      type,
      ...data
    };

    this.entries.unshift(entry);

    // Trim old entries
    if (this.entries.length > this.maxEntries) {
      this.entries.pop();
    }

    return entry;
  }

  /**
   * Log elite survivor (passed to next generation unchanged)
   */
  logElite(creature, generation, rank) {
    return this.log('elite', {
      creatureId: creature.id,
      generation,
      rank,
      fitness: creature.fitness,
      foodEaten: creature.foodEaten,
      traits: creature.traits ? { ...creature.traits } : null,
      isPredator: creature.isPredator || false,
      reason: `Top ${rank} by fitness (${creature.fitness.toFixed(1)})`
    });
  }

  /**
   * Log birth (offspring created from parents)
   */
  logBirth(child, parent1, parent2, generation) {
    return this.log('birth', {
      childId: child.id,
      parent1Id: parent1.id,
      parent2Id: parent2.id,
      generation,
      parent1Fitness: parent1.fitness,
      parent2Fitness: parent2.fitness,
      childTraits: child.traits ? { ...child.traits } : null,
      isPredator: child.isPredator || false
    });
  }

  /**
   * Log death (creature ran out of energy)
   */
  logDeath(creature, cause = 'starvation') {
    return this.log('death', {
      creatureId: creature.id,
      cause,
      age: creature.age,
      fitness: creature.fitness,
      foodEaten: creature.foodEaten,
      isPredator: creature.isPredator || false
    });
  }

  /**
   * Log kill (predator killed prey)
   */
  logKill(predator, prey) {
    return this.log('kill', {
      predatorId: predator.id,
      preyId: prey.id,
      predatorFitness: predator.fitness,
      preyFitness: prey.fitness
    });
  }

  /**
   * Log generation summary
   */
  logGeneration(generation, stats) {
    const summary = {
      generation,
      avgFitness: stats.avgFitness,
      maxFitness: stats.maxFitness,
      predatorCount: stats.predatorCount || 0,
      preyCount: stats.preyCount || 0,
      killCount: stats.killCount || 0,
      totalDeaths: stats.totalDeaths || 0
    };

    this.generationSummaries.push(summary);

    // Keep only last 50 generations
    if (this.generationSummaries.length > 50) {
      this.generationSummaries.shift();
    }

    return this.log('generation', summary);
  }

  /**
   * Get survivor summary for the last generation
   * Returns elites and offspring details
   */
  getSurvivorSummary() {
    // Get entries from the last generation change
    const generationEntry = this.entries.find(e => e.type === 'generation');
    if (!generationEntry) return null;

    const genTimestamp = generationEntry.timestamp;

    // Find all elites and births logged around the same time (within 100ms)
    const elites = this.entries.filter(e =>
      e.type === 'elite' &&
      Math.abs(e.timestamp - genTimestamp) < 100
    ).sort((a, b) => a.rank - b.rank);

    const births = this.entries.filter(e =>
      e.type === 'birth' &&
      Math.abs(e.timestamp - genTimestamp) < 100
    );

    // Calculate trait averages from elites
    const traitAverages = {};
    if (elites.length > 0 && elites[0].traits) {
      const traitKeys = Object.keys(elites[0].traits);
      for (const key of traitKeys) {
        const sum = elites.reduce((acc, e) => acc + (e.traits?.[key] || 0), 0);
        traitAverages[key] = sum / elites.length;
      }
    }

    return {
      generation: generationEntry.generation,
      eliteCount: elites.length,
      offspringCount: births.length,
      elites: elites.map(e => ({
        rank: e.rank,
        fitness: e.fitness,
        isPredator: e.isPredator,
        traits: e.traits
      })),
      avgFitness: generationEntry.avgFitness,
      maxFitness: generationEntry.maxFitness,
      traitAverages
    };
  }

  /**
   * Get recent entries filtered by type
   */
  getEntries(type = null, limit = 20) {
    let filtered = type
      ? this.entries.filter(e => e.type === type)
      : this.entries;

    return filtered.slice(0, limit);
  }

  /**
   * Get formatted log messages for UI display
   */
  getFormattedEntries(limit = 15) {
    return this.entries.slice(0, limit).map(entry => {
      switch (entry.type) {
        case 'elite':
          return {
            type: 'elite',
            icon: '👑',
            text: `#${entry.rank} Elite survived (fitness: ${entry.fitness.toFixed(1)})`,
            isPredator: entry.isPredator,
            timestamp: entry.timestamp
          };

        case 'birth':
          return {
            type: 'birth',
            icon: '🐣',
            text: `New ${entry.isPredator ? 'predator' : 'herbivore'} born`,
            isPredator: entry.isPredator,
            timestamp: entry.timestamp
          };

        case 'death':
          const causeText = entry.cause === 'hunted' ? 'was hunted' : 'starved';
          return {
            type: 'death',
            icon: '💀',
            text: `Creature ${causeText} (age: ${entry.age})`,
            isPredator: entry.isPredator,
            timestamp: entry.timestamp
          };

        case 'kill':
          return {
            type: 'kill',
            icon: '⚔️',
            text: `Predator hunted prey!`,
            isPredator: true,
            timestamp: entry.timestamp
          };

        case 'generation':
          return {
            type: 'generation',
            icon: '🧬',
            text: `Gen ${entry.generation}: Avg ${entry.avgFitness.toFixed(1)} | Max ${entry.maxFitness.toFixed(1)}`,
            isPredator: false,
            timestamp: entry.timestamp
          };

        default:
          return {
            type: 'info',
            icon: 'ℹ️',
            text: JSON.stringify(entry),
            timestamp: entry.timestamp
          };
      }
    });
  }

  /**
   * Clear all logs
   */
  clear() {
    this.entries = [];
  }
}
