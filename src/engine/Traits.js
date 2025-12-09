/**
 * Traits - Genetic trait system for creatures
 * Defines heritable characteristics that affect behavior and survival
 */

/**
 * Default trait ranges and effects
 */
export const TRAIT_DEFINITIONS = {
  size: {
    min: 0.6,
    max: 1.4,
    default: 1.0,
    description: 'Affects hitbox, max energy, and speed (inverse)'
  },
  metabolism: {
    min: 0.5,
    max: 1.5,
    default: 1.0,
    description: 'Affects energy consumption and movement speed'
  },
  aggression: {
    min: 0,
    max: 1,
    default: 0.3,
    description: 'Likelihood to attack and hunting efficiency'
  },
  vision: {
    min: 0.5,
    max: 1.5,
    default: 1.0,
    description: 'Sensor range multiplier'
  }
};

/**
 * Generate random traits for a new creature
 * @param {boolean} isPredator - Whether to bias traits for predator role
 * @returns {object} Trait object
 */
export function generateTraits(isPredator = false) {
  const traits = {
    size: randomInRange(TRAIT_DEFINITIONS.size.min, TRAIT_DEFINITIONS.size.max),
    metabolism: randomInRange(TRAIT_DEFINITIONS.metabolism.min, TRAIT_DEFINITIONS.metabolism.max),
    aggression: isPredator
      ? randomInRange(0.6, 1.0)
      : randomInRange(0, 0.4),
    vision: randomInRange(TRAIT_DEFINITIONS.vision.min, TRAIT_DEFINITIONS.vision.max)
  };

  return traits;
}

/**
 * Crossover two parent traits to create child traits
 * @param {object} traits1 - Parent 1 traits
 * @param {object} traits2 - Parent 2 traits
 * @returns {object} Child traits
 */
export function crossoverTraits(traits1, traits2) {
  const child = {};

  for (const key of Object.keys(TRAIT_DEFINITIONS)) {
    // Random blend with slight variation
    const blend = Math.random();
    child[key] = traits1[key] * blend + traits2[key] * (1 - blend);
  }

  return child;
}

/**
 * Mutate traits with Gaussian noise
 * @param {object} traits - Traits to mutate
 * @param {number} rate - Mutation probability per trait
 * @param {number} strength - Mutation strength
 * @returns {object} Mutated traits (new object)
 */
export function mutateTraits(traits, rate = 0.15, strength = 0.2) {
  const mutated = { ...traits };

  for (const key of Object.keys(TRAIT_DEFINITIONS)) {
    if (Math.random() < rate) {
      const def = TRAIT_DEFINITIONS[key];
      const noise = gaussianRandom() * strength;
      mutated[key] = clamp(mutated[key] + noise, def.min, def.max);
    }
  }

  return mutated;
}

/**
 * Apply trait effects to creature stats
 * @param {object} traits - Creature traits
 * @returns {object} Calculated stats
 */
export function calculateTraitEffects(traits) {
  return {
    // Larger creatures have more energy but move slower
    maxEnergy: 100 + (traits.size - 1) * 80,
    maxSpeed: 4 * (1.2 - traits.size * 0.3) * traits.metabolism,

    // Energy cost modified by metabolism and size
    energyCostBase: 0.05 * traits.metabolism * traits.size,
    energyCostMove: 0.02 * traits.metabolism,

    // Sensor range
    sensorLength: 150 * traits.vision,

    // Visual radius
    radius: 12 * traits.size,

    // Attack power (only matters for predators)
    attackPower: 30 * traits.aggression * traits.size,

    // Hunting cooldown
    attackCooldown: 60 / traits.metabolism
  };
}

/**
 * Determine if creature should be a predator based on traits
 * Higher aggression = more likely predator
 */
export function shouldBePredator(traits, predatorRatio = 0.2) {
  // Base chance modified by aggression
  const baseProbability = predatorRatio;
  const aggressionBonus = (traits.aggression - 0.5) * 0.3;
  return Math.random() < (baseProbability + aggressionBonus);
}

/**
 * Get a color hue based on creature type and traits
 * Predators: red-orange range (0-40)
 * Herbivores: green-cyan range (100-180)
 */
export function getTraitColor(traits, isPredator) {
  if (isPredator) {
    // Red to orange based on aggression
    return 0 + traits.aggression * 30;
  } else {
    // Green to cyan based on metabolism
    return 120 + (traits.metabolism - 0.5) * 60;
  }
}

// Helper functions
function randomInRange(min, max) {
  return min + Math.random() * (max - min);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function gaussianRandom() {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}
