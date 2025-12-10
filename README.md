# 🧬 Neural Network Life Simulation

<div align="center">

![Simulation Screenshot](public/screenshots/simulation_running.png)

**A web-based evolutionary simulation where creatures evolve neural networks to survive and reproduce.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Build Status](https://img.shields.io/github/actions/workflow/status/username/life-simulation/ci.yml?branch=main)](https://github.com/username/life-simulation/actions)
[![GitHub issues](https://img.shields.io/github/issues/username/life-simulation)](https://github.com/username/life-simulation/issues)
[![GitHub stars](https://img.shields.io/github/stars/username/life-simulation)](https://github.com/username/life-simulation/stargazers)

[Live Demo](#) · [Report Bug](https://github.com/username/life-simulation/issues) · [Request Feature](https://github.com/username/life-simulation/issues)

</div>

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Quick Start](#-quick-start)
- [Key Features](#-key-features)
- [Simulation Mechanics](#-simulation-mechanics)
- [Technical Architecture](#-technical-architecture)
- [Contributing](#-contributing)
- [License](#-license)

## 🌟 Overview

This project simulates a closed ecosystem where simple organisms (creatures) compete for food and survival. Each creature has a unique **Neural Network (Brain)** that dictates its movement and actions based on sensory input. Through **Genetic Algorithm (Evolution)**, the fittest creatures—those that eat enough food to survive—pass their genes (neural weights and physical traits) to the next generation.

## 🚀 Quick Start

Get the simulation running locally in minutes:

```bash
git clone https://github.com/username/life-simulation.git
cd life-simulation
npm install && npm run dev
```

Visit `http://localhost:5173` to watch the evolution begin!

## 🧩 Key Features

- **🧠 Neural Network Brains**: Feedforward networks processing sensory inputs for movement decisions.
- **🧬 Genetic Evolution**: Natural selection with elitism, tournament selection, crossover, and mutation.
- **🦁 Predator & Prey Ecosystem**: Dynamic balance with specialized traits and cannibalism prevention.
- **🌍 Complex Environment**: Map obstacles, territories, and strategic choke points.
- **⚖️ Dynamic Balancing**: Food scarcity and overpopulation penalties to ensure ecosystem stability.
- **💾 Save & Load**: Persist your simulation state to JSON and resume experiments later.
- **📊 Real-time Visualization**: Interactive charts tracking fitness, population ratios, and genetic drift.

## 🧠 Simulation Mechanics

### 1. The Creature
Each creature is an autonomous agent with:
- **Sensors**: Ray-casting to detect food (Green) and other creatures (Red/Blue).
- **Brain**: Neural Network inputs -> Movement outputs (speed, turn angle).
- **Energy**: Consumed by living/moving, replenished by eating. Zero energy = death.

### 2. Genetics & Traits
Variable traits affecting physical capabilities:
- **Size**: Strength vs. Speed trade-off.
- **Metabolism**: Speed vs. Energy efficiency.
- **Vision**: Sensor range.
- **Aggression**: Predator probability.

### 3. Evolution Cycle
Generations last 20,000 ticks.
1.  **Live Phase**: Hunting, eating, survival.
2.  **Selection**: Top 10% (Elites) survive automatically.
3.  **Reproduction**: Tournament selection (Top of 5 randoms) -> Crossover -> Mutation.
4.  **Next Gen**: Elites + Offspring populate the world.

### 4. Fitness Calculation
- **Survival**: +0.01 per tick.
- **Eating**: +Energy value.
- **Predator Bonus**: +150 per kill + 50% of prey's fitness.
- **Penalties**: -20% if species overpopulates.

## 🛠️ Technical Architecture

```
src/
├── engine/           # Core logic (NeuralNetwork, GeneticAlgorithm)
├── world/            # Entities (Creature, Food, World)
├── renderer/         # Canvas 2D visualization
├── ui/               # Stats and DOM interaction
└── main.js           # Entry point and game loop
```

**Tech Stack:**
- **Vanilla JavaScript (ES6+)**: No heavy frameworks for core logic.
- **HTML5 Canvas**: High-performance 2D rendering.
- **Vite**: Ultra-fast development server and bundler.

## 🤝 Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1.  See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.
2.  Fork the Project.
3.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`).
4.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`).
5.  Push to the Branch (`git push origin feature/AmazingFeature`).
6.  Open a Pull Request.

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<div align="center">
  <p>If you find this project interesting, please consider giving it a star! ⭐</p>
</div>
