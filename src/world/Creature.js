import { NeuralNetwork } from '../engine/NeuralNetwork.js';
import { generateTraits, calculateTraitEffects, getTraitColor } from '../engine/Traits.js';

/**
 * Creature - AI-controlled entity that evolves
 * Now with genetic traits and predator/prey mechanics
 */
let creatureIdCounter = 0;

export class Creature {
  constructor(x, y, world, options = {}) {
    this.id = ++creatureIdCounter;
    this.x = x;
    this.y = y;
    this.world = world;

    // Genetic traits
    this.isPredator = options.isPredator ?? Math.random() < 0.2;
    this.traits = options.traits ?? generateTraits(this.isPredator);

    // Calculate stats from traits
    const effects = calculateTraitEffects(this.traits);

    // Physical properties (modified by traits)
    this.radius = effects.radius;
    this.angle = Math.random() * Math.PI * 2;
    this.speed = 0;
    this.maxSpeed = effects.maxSpeed;

    // Energy and fitness
    this.energy = effects.maxEnergy * 0.8;
    this.maxEnergy = effects.maxEnergy;
    this.fitness = 0;
    this.foodEaten = 0;
    this.distanceTraveled = 0;
    this.age = 0;
    this.kills = 0;

    // Combat (for predators)
    this.attackPower = effects.attackPower;
    this.attackCooldown = 0;
    this.attackCooldownMax = effects.attackCooldown;

    // Energy costs
    this.energyCostBase = effects.energyCostBase;
    this.energyCostMove = effects.energyCostMove;

    // Visual
    this.hue = getTraitColor(this.traits, this.isPredator);
    this.isElite = false;
    this.trail = [];
    this.flashTime = 0; // For attack flash effect

    // Brain - 12 inputs now (added creature detection + isPredator bias)
    // Inputs: 4 food sensors, 4 creature sensors, energy, speed, sin(angle), cos(angle)
    this.brain = new NeuralNetwork(12, [16, 12], 4);
    // Outputs: thrust, turn, boost, attack

    // Sensor data
    this.sensorLength = effects.sensorLength;
    this.foodSensors = new Array(4).fill(0);
    this.creatureSensors = new Array(4).fill(0);
    this.nearestCreature = null;
  }

  /**
   * Sense the environment - detect food and other creatures in 4 directions
   */
  sense() {
    const directions = [0, Math.PI / 2, Math.PI, -Math.PI / 2]; // front, right, back, left

    // Reset sensors
    this.foodSensors.fill(0);
    this.creatureSensors.fill(0);
    this.nearestCreature = null;
    let nearestCreatureDist = Infinity;

    for (let i = 0; i < 4; i++) {
      const sensorAngle = this.angle + directions[i];
      let closestFoodDist = this.sensorLength;
      let closestCreatureDist = this.sensorLength;

      // Sense food (predators sense meat, herbivores sense plants)
      for (const food of this.world.foods) {
        if (food.consumed) continue;

        // Filter by food type
        if (this.isPredator && food.type !== 'meat') continue;
        if (!this.isPredator && food.type !== 'plant') continue;

        const dx = food.x - this.x;
        const dy = food.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > this.sensorLength) continue;

        const angleToFood = Math.atan2(dy, dx);
        let angleDiff = angleToFood - sensorAngle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

        if (Math.abs(angleDiff) < Math.PI / 4 && dist < closestFoodDist) {
          closestFoodDist = dist;
        }
      }

      // Sense other creatures
      for (const other of this.world.creatures) {
        if (other === this || !other.isAlive()) continue;

        const dx = other.x - this.x;
        const dy = other.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > this.sensorLength) continue;

        // Track nearest for attack targeting
        if (dist < nearestCreatureDist) {
          nearestCreatureDist = dist;
          this.nearestCreature = other;
        }

        const angleToCreature = Math.atan2(dy, dx);
        let angleDiff = angleToCreature - sensorAngle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

        if (Math.abs(angleDiff) < Math.PI / 4 && dist < closestCreatureDist) {
          closestCreatureDist = dist;
        }
      }

      this.foodSensors[i] = 1 - closestFoodDist / this.sensorLength;
      this.creatureSensors[i] = 1 - closestCreatureDist / this.sensorLength;
    }
  }

  /**
   * Think - process inputs through neural network
   */
  think() {
    const inputs = [
      ...this.foodSensors,              // 4 food sensors
      ...this.creatureSensors,          // 4 creature sensors
      this.energy / this.maxEnergy,     // normalized energy
      this.speed / this.maxSpeed,       // normalized speed
      Math.sin(this.angle),             // heading sin
      Math.cos(this.angle)              // heading cos
    ];

    const outputs = this.brain.forward(inputs);
    return outputs;
  }

  /**
   * Act - apply neural network outputs
   */
  act(outputs) {
    // Output 0: forward/backward thrust (-1 to 1)
    const thrust = outputs[0] * 0.5;
    this.speed += thrust;
    this.speed = Math.max(-this.maxSpeed * 0.5, Math.min(this.maxSpeed, this.speed));

    // Output 1: turning (-1 to 1)
    const turnRate = outputs[1] * 0.15;
    this.angle += turnRate;

    // Output 2: boost (0 to 1) - uses more energy
    if (outputs[2] > 0.5) {
      this.speed *= 1.3;
      this.energy -= 0.3 * this.traits.metabolism;
    }

    // Output 3: attack (only for predators)
    // OR auto-attack when very close to prey (makes hunting more visible)
    if (this.isPredator && this.attackCooldown <= 0) {
      const shouldAttack = outputs[3] > 0.5;
      const nearPrey = this.nearestCreature &&
        !this.nearestCreature.isPredator &&
        this.nearestCreature.isAlive();

      if (nearPrey) {
        const dx = this.nearestCreature.x - this.x;
        const dy = this.nearestCreature.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const closeEnough = dist < this.radius + this.nearestCreature.radius + 20;

        // Auto-attack if close, or attack if neural network wants to
        if (closeEnough || shouldAttack) {
          this.tryAttack();
        }
      }
    }

    // Apply friction
    this.speed *= 0.98;
  }

  /**
   * Try to attack nearest creature (predators only)
   * Called when neural network signals attack OR automatically when very close
   */
  tryAttack() {
    if (!this.nearestCreature || this.nearestCreature.isPredator) return;

    const prey = this.nearestCreature;
    const dx = prey.x - this.x;
    const dy = prey.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Attack range based on size
    const attackRange = this.radius + prey.radius + 15;

    if (dist < attackRange) {
      // Successful attack!
      const damage = this.attackPower;
      prey.energy -= damage;

      this.attackCooldown = this.attackCooldownMax;
      this.flashTime = 15;

      // Log attack attempt (hit)
      console.log(`🔴 Predator #${this.id} attacks prey #${prey.id} for ${damage.toFixed(1)} damage!`);

      // If prey dies, gain energy and fitness
      if (prey.energy <= 0) {
        // Enhanced energy gain: 80% of prey's max energy (was 60%)
        this.energy = Math.min(this.maxEnergy, this.energy + prey.maxEnergy * 0.8);

        // Enhanced fitness rewards for successful hunting
        // Base kill bonus: 150 (was 80)
        // Prey fitness bonus: 50% (was 30%)
        // Per-kill bonus: 20 for each successful kill
        this.fitness += 150 + prey.fitness * 0.5 + (this.kills * 20);
        this.kills++;

        console.log(`☠️ Predator #${this.id} killed prey #${prey.id}! Total kills: ${this.kills}`);

        // Log the kill
        if (this.world.evolutionLog) {
          this.world.evolutionLog.logKill(this, prey);
          this.world.evolutionLog.logDeath(prey, 'hunted');
        }

        // Spawn meat where prey died
        this.world.spawnMeat(prey.x, prey.y);
      }
    }
  }

  /**
   * Update creature state
   */
  update() {
    this.age++;
    if (this.attackCooldown > 0) this.attackCooldown--;
    if (this.flashTime > 0) this.flashTime--;

    // Sense, think, act
    this.sense();
    const outputs = this.think();
    this.act(outputs);

    // Store trail
    if (this.age % 3 === 0) {
      this.trail.push({ x: this.x, y: this.y });
      if (this.trail.length > 20) this.trail.shift();
    }

    // Move
    const prevX = this.x;
    const prevY = this.y;

    this.x += Math.cos(this.angle) * this.speed;
    this.y += Math.sin(this.angle) * this.speed;

    // Track distance
    const dx = this.x - prevX;
    const dy = this.y - prevY;
    this.distanceTraveled += Math.sqrt(dx * dx + dy * dy);

    // Wrap around world edges
    const w = this.world.width;
    const h = this.world.height;
    if (this.x < 0) this.x += w;
    if (this.x > w) this.x -= w;
    if (this.y < 0) this.y += h;
    if (this.y > h) this.y -= h;

    // Energy cost for living and moving
    this.energy -= this.energyCostBase + Math.abs(this.speed) * this.energyCostMove;

    // Check for food collision
    for (const food of this.world.foods) {
      if (food.consumed) continue;

      // Filter by food type
      if (this.isPredator && food.type !== 'meat') continue;
      if (!this.isPredator && food.type !== 'plant') continue;

      const dx = food.x - this.x;
      const dy = food.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < this.radius + food.radius) {
        this.energy = Math.min(this.maxEnergy, this.energy + food.energy);
        this.foodEaten++;
        this.fitness += food.energy;
        food.consumed = true;
      }
    }

    // Bonus fitness for surviving
    this.fitness += 0.01;
  }

  /**
   * Check if creature is alive
   */
  isAlive() {
    return this.energy > 0;
  }

  /**
   * Draw the creature
   */
  draw(ctx, time) {
    const pulse = 1 + Math.sin(time * 0.005) * 0.1;
    const sizeMod = this.traits.size;

    // Draw trail
    if (this.trail.length > 1) {
      ctx.beginPath();
      ctx.moveTo(this.trail[0].x, this.trail[0].y);
      for (let i = 1; i < this.trail.length; i++) {
        ctx.lineTo(this.trail[i].x, this.trail[i].y);
      }
      ctx.strokeStyle = `hsla(${this.hue}, 70%, 50%, 0.3)`;
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Flash effect when attacking
    const flashMod = this.flashTime > 0 ? 1.5 : 1;
    const flashAlpha = this.flashTime > 0 ? 0.8 : 0.6;

    // Glow effect
    const glowRadius = this.radius * 2.5 * pulse * flashMod;
    const gradient = ctx.createRadialGradient(
      this.x, this.y, 0,
      this.x, this.y, glowRadius
    );

    const alpha = this.energy / this.maxEnergy;
    gradient.addColorStop(0, `hsla(${this.hue}, 80%, 60%, ${alpha * flashAlpha})`);
    gradient.addColorStop(0.5, `hsla(${this.hue}, 70%, 50%, ${alpha * 0.2})`);
    gradient.addColorStop(1, `hsla(${this.hue}, 60%, 40%, 0)`);

    ctx.beginPath();
    ctx.arc(this.x, this.y, glowRadius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    // Body
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * pulse, 0, Math.PI * 2);
    ctx.fillStyle = `hsl(${this.hue}, 70%, 50%)`;
    ctx.fill();

    // Predator indicator (spikes/teeth)
    if (this.isPredator) {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle);

      // Draw spikes
      for (let i = 0; i < 4; i++) {
        const spikeAngle = (i / 4) * Math.PI * 2;
        const spikeX = Math.cos(spikeAngle) * this.radius * 1.2;
        const spikeY = Math.sin(spikeAngle) * this.radius * 1.2;
        ctx.beginPath();
        ctx.arc(spikeX, spikeY, 3 * sizeMod, 0, Math.PI * 2);
        ctx.fillStyle = `hsl(${this.hue}, 90%, 40%)`;
        ctx.fill();
      }
      ctx.restore();
    }

    // Elite crown indicator
    if (this.isElite) {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius * pulse + 4, 0, Math.PI * 2);
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Direction indicator (eye/nose)
    const eyeX = this.x + Math.cos(this.angle) * this.radius * 0.7;
    const eyeY = this.y + Math.sin(this.angle) * this.radius * 0.7;
    ctx.beginPath();
    ctx.arc(eyeX, eyeY, 4 * sizeMod, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();

    // Pupil for predators
    if (this.isPredator) {
      ctx.beginPath();
      ctx.arc(eyeX, eyeY, 2 * sizeMod, 0, Math.PI * 2);
      ctx.fillStyle = '#000';
      ctx.fill();
    }

    // Energy bar
    const barWidth = this.radius * 2;
    const barHeight = 3;
    const barY = this.y - this.radius - 8;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(this.x - barWidth / 2, barY, barWidth, barHeight);

    ctx.fillStyle = this.energy > 30 ? (this.isPredator ? '#ef4444' : '#4ade80') : '#fbbf24';
    ctx.fillRect(this.x - barWidth / 2, barY, barWidth * (this.energy / this.maxEnergy), barHeight);
  }

  /**
   * Draw sensor rays (debug)
   */
  drawSensors(ctx) {
    const directions = [0, Math.PI / 2, Math.PI, -Math.PI / 2];
    const foodColors = ['#4ade80', '#4ade80', '#4ade80', '#4ade80'];
    const creatureColors = ['#8b5cf6', '#8b5cf6', '#8b5cf6', '#8b5cf6'];

    for (let i = 0; i < 4; i++) {
      const sensorAngle = this.angle + directions[i];

      // Food sensors
      const foodEndX = this.x + Math.cos(sensorAngle) * this.sensorLength * this.foodSensors[i];
      const foodEndY = this.y + Math.sin(sensorAngle) * this.sensorLength * this.foodSensors[i];
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(foodEndX, foodEndY);
      ctx.strokeStyle = foodColors[i];
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.5;
      ctx.stroke();

      // Creature sensors
      const creatureEndX = this.x + Math.cos(sensorAngle) * this.sensorLength * this.creatureSensors[i];
      const creatureEndY = this.y + Math.sin(sensorAngle) * this.sensorLength * this.creatureSensors[i];
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(creatureEndX, creatureEndY);
      ctx.strokeStyle = creatureColors[i];
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.globalAlpha = 1;
    }
  }
}
