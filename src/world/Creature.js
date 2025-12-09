import { NeuralNetwork } from '../engine/NeuralNetwork.js';

/**
 * Creature - AI-controlled entity that evolves
 */
export class Creature {
  constructor(x, y, world) {
    this.x = x;
    this.y = y;
    this.world = world;

    // Physical properties
    this.radius = 12;
    this.angle = Math.random() * Math.PI * 2;
    this.speed = 0;
    this.maxSpeed = 4;

    // Energy and fitness
    this.energy = 100;
    this.maxEnergy = 150;
    this.fitness = 0;
    this.foodEaten = 0;
    this.distanceTraveled = 0;
    this.age = 0;

    // Visual
    this.hue = Math.random() * 360;
    this.isElite = false;
    this.trail = [];

    // Brain - 8 inputs, 2 hidden layers of 12 neurons, 3 outputs
    this.brain = new NeuralNetwork(8, [12, 12], 3);

    // Sensor data
    this.sensorLength = 150;
    this.sensorData = new Array(4).fill(0);
  }

  /**
   * Sense the environment - detect food in 4 directions
   */
  sense() {
    const directions = [0, Math.PI / 2, Math.PI, -Math.PI / 2]; // front, right, back, left

    for (let i = 0; i < 4; i++) {
      const sensorAngle = this.angle + directions[i];
      let closestDist = this.sensorLength;

      for (const food of this.world.foods) {
        if (food.consumed) continue;

        const dx = food.x - this.x;
        const dy = food.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > this.sensorLength) continue;

        // Check if food is in sensor cone (45 degree cone)
        const angleToFood = Math.atan2(dy, dx);
        let angleDiff = angleToFood - sensorAngle;

        // Normalize angle
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

        if (Math.abs(angleDiff) < Math.PI / 4 && dist < closestDist) {
          closestDist = dist;
        }
      }

      // Normalize to 0-1 (closer = higher value)
      this.sensorData[i] = 1 - closestDist / this.sensorLength;
    }
  }

  /**
   * Think - process inputs through neural network
   */
  think() {
    // Prepare inputs
    const inputs = [
      ...this.sensorData,                    // 4 directional sensors
      this.energy / this.maxEnergy,          // normalized energy
      this.speed / this.maxSpeed,            // normalized speed
      Math.sin(this.angle),                  // heading sin
      Math.cos(this.angle)                   // heading cos
    ];

    // Get outputs from brain
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
      this.energy -= 0.3;
    }

    // Apply friction
    this.speed *= 0.98;
  }

  /**
   * Update creature state
   */
  update() {
    this.age++;

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
    this.energy -= 0.05 + Math.abs(this.speed) * 0.02;

    // Check for food collision
    for (const food of this.world.foods) {
      if (food.consumed) continue;

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

    // Glow effect
    const glowRadius = this.radius * 2.5 * pulse;
    const gradient = ctx.createRadialGradient(
      this.x, this.y, 0,
      this.x, this.y, glowRadius
    );

    const alpha = this.energy / this.maxEnergy;
    gradient.addColorStop(0, `hsla(${this.hue}, 80%, 60%, ${alpha * 0.6})`);
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

    // Elite crown indicator
    if (this.isElite) {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius * pulse + 3, 0, Math.PI * 2);
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Direction indicator (eye/nose)
    const eyeX = this.x + Math.cos(this.angle) * this.radius * 0.7;
    const eyeY = this.y + Math.sin(this.angle) * this.radius * 0.7;
    ctx.beginPath();
    ctx.arc(eyeX, eyeY, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();

    // Energy bar
    const barWidth = this.radius * 2;
    const barHeight = 3;
    const barY = this.y - this.radius - 8;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(this.x - barWidth / 2, barY, barWidth, barHeight);

    ctx.fillStyle = this.energy > 30 ? '#4ade80' : '#ef4444';
    ctx.fillRect(this.x - barWidth / 2, barY, barWidth * (this.energy / this.maxEnergy), barHeight);
  }

  /**
   * Draw sensor rays (debug)
   */
  drawSensors(ctx) {
    const directions = [0, Math.PI / 2, Math.PI, -Math.PI / 2];
    const colors = ['#ff6b6b', '#4ecdc4', '#ffe66d', '#95e1d3'];

    for (let i = 0; i < 4; i++) {
      const sensorAngle = this.angle + directions[i];
      const endX = this.x + Math.cos(sensorAngle) * this.sensorLength * this.sensorData[i];
      const endY = this.y + Math.sin(sensorAngle) * this.sensorLength * this.sensorData[i];

      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(endX, endY);
      ctx.strokeStyle = colors[i];
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.5;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }
}
