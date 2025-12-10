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
- [Fitness & Selection System](#-fitness--selection-system)
- [Controls & Interactions](#-controls--interactions)
- [UI & User Experience](#-ui--user-experience)
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

Visit `http://localhost:5173` (or the URL shown in your terminal) to see the simulation running.

### Build for Production
To build the project for deployment:
```bash
npm run build
```

## 🧩 Key Features

- **🧠 Neural Network Brains**: Creatures use a feedforward neural network to process inputs (food location, other creatures) and decide how to move.
- **🧬 Genetic Evolution**: Successful creatures reproduce. Offspring inherit traits and brain weights with mutations, leading to smarter behaviors over time.
- **🦁 Predator & Prey Ecosystem**: Dynamic predator-prey balance with cannibalism prevention and intelligent hunting.
- **🌍 Map Obstacles**: Rocks and barriers create strategic depth - prey can hide, predators must navigate.
- **⚖️ Ecosystem Balancing**: Dynamic food scarcity, overpopulation penalties, and meat expiration incentivize active hunting.
- **💾 Save & Load**: Persist your simulation state to JSON and resume experiments later.
- **🔍 Real-time Visualization**: Watch the evolution happen with interactive charts tracking fitness and population ratios.

## 🧠 Simulation Mechanics

### 1. The Creature
Each creature is an autonomous agent with the following properties:
- **Sensors**: Ray-casting sensors to detect food (Green) and other creatures (Red/Blue).
- **Brain**: A simple Neural Network taking sensor data as input and outputting movement commands (speed, turn angle).
- **Energy**: Consumed over time and by moving. Refilled by eating food (Green particles). If energy hits 0, the creature dies.

### 2. Genetics & Traits
Creatures are not identical. They have genetic traits that affect their physical capabilities:
- **Size**: Larger creatures are stronger but slower and need more food.
- **Metabolism**: Higher metabolism allows faster movement but drains energy quicker.
- **Vision**: Determines how far a creature can "see".
- **Aggression**: Determines if a creature is likely to be a predator.

### 3. Hunting & Food System
**Meat Types:**
- **Herbivore meat** 🔴: Red, edible for predators, spawns when herbivores die.
- **Predator meat** 🟣☠️: Purple with skull, toxic to other predators (prevents cannibalism).

**Meat Expiration:**
- **Hunted meat**: Lasts 800 ticks (incentivizes active hunting).
- **Starvation meat**: Lasts 300 ticks (spoils faster).
- **Plants**: Never expire.

### 4. Map Obstacles
Rocks and barriers scattered across the map:
- **Strategic gameplay**: Prey can hide behind obstacles.
- **Collision detection**: Creatures bounce off and turn around.
- **Spatial dynamics**: Creates territories and safe zones.

### 5. Evolution Cycle & Balancing
The simulation runs in **Generations** of 20,000 ticks each.

**Generation Flow:**
1.  **Generation Start**: Population spawns (25% predators, 75% herbivores).
2.  **Live Phase**: 20,000 ticks of hunting, eating, and survival.
3.  **Dynamic Balancing**: Food scarcity increases when herbivores overpopulate (>65%).
4.  **Overpopulation Penalties**: Dominant species get -20% fitness penalty.
5.  **Selection**: Top performers selected based on fitness.
6.  **Reproduction**: Elite creatures + mutated offspring form next generation.

**Ecosystem Balancing:**
- **Dynamic food spawning**: Fewer plants when herbivores dominate.
- **Enhanced hunting rewards**: 150 base + kill streak bonuses.
- **Population penalties**: Prevents monocultures.

## 📊 Fitness & Selection System

### Fitness Calculation
Each creature accumulates fitness points throughout its lifetime:

**Base Fitness (All Creatures):**
- **+0.01 per tick survived** - Rewards longevity.
- **+Food energy** when eating (5-20 for plants, 20-45 for meat).
- **+Remaining energy** at generation end (if alive).

**Predator Bonuses:**
- **+150 points** per kill (base reward).
- **+50% of prey's fitness** (rewards hunting strong prey).
- **+20 × kill count** (progressive bonus - encourages kill streaks).

**Penalties:**
- **-15% to -20%** fitness if species overpopulates (maintains balance).

### Genetic Algorithm Selection

The selection process uses a combination of **Elitism** and **Tournament Selection**:

#### A. Elitism (Top 10%)
```
elitismRate = 0.1  (10% of population)
```
- The **top 10% fittest creatures** pass directly to the next generation **unchanged**.
- **Guarantees**: Best solutions are never lost, avg fitness never decreases.

#### B. Tournament Selection (Remaining 90%)
For each offspring position:

**1. Parent Selection (Tournament of 5)**
```
tournamentSize = 5
```
- Randomly pick 5 candidates from population.
- Select the one with highest fitness.
- Repeat to get second parent.

**2. Crossover (Genetic Mixing)**
- **Neural network weights**: Each of 744 weights randomly inherited from parent 1 or 2 (50/50).
- **Genetic traits**: Each trait (size, metabolism, vision, etc.) from random parent.
- **Predator/Prey type**: From random parent + **5% chance to flip type**.

**3. Mutation (Innovation)**
```
mutationRate = 0.1        (10% chance per weight)
mutationStrength = 0.3    (±30% adjustment)
traitMutationRate = 0.15  (15% chance per trait)
```
- **Neural weights**: 10% of weights get Gaussian noise added (±0.3).
- **Genetic traits**: 15% of traits mutate (±20% of value).

## 🎮 Controls & Interactions

### Mouse Controls
- **Left Click**: Select/deselect creature to view stats.
- **Right Click + Drag**: Pan camera around the world.
- **Middle Click + Drag**: Alternative pan control.
- **Mouse Wheel**: Zoom in/out (50%-200%).

### Keyboard Controls
- **Spacebar**: Pause/unpause simulation.
- **WASD / Arrow Keys**: Pan camera.
- **+ / -**: Zoom in/out.
- **0 (zero)**: Reset camera to center.

### UI Controls
- **Speed Slider**: Adjust simulation speed (1x-10x).
- **Zoom Buttons**: -/100%/+ for precise zoom control.
- **Show All Stats**: When paused, show tooltips for all creatures.
- **Log Filters**: Filter evolution log by event type.
- **Display Toggles**: Grid, sensors, and tooltip visibility.

## 🖥️ UI & User Experience

### Interactive Inspection
The simulation allows you to inspect individual creatures:
- **Click to Select**: Click on any creature to select it.
- **Visual Feedback**: Pulsing white dashed ring highlights selected creature.
- **Live Stats Panel**: Tooltip showing energy, fitness, kills, and genetic traits.

### Main Dashboard
The right-side panel provides comprehensive statistics:
- **Population Stats**: Real-time predator vs herbivore counts.
- **Statistics**: Generation, tick, alive count, kills.
- **Fitness History**: Chart tracking avg/max fitness over 50 generations.
- **Population Trend**: Red/green lines showing predator/prey ratios.
- **Evolution Log**: Filterable log (births, deaths, kills, elites).
- **Generation Survivors**: Breakdown of elite creatures and offspring.
- **Records**: Best-ever fitness, kills, and generation numbers.

### Save & Load System 💾
- **Save State**: Click the **Floppy Disk** icon to download a JSON file containing the complete simulation state.
- **Load State**: Click the **Folder** icon to upload a previously saved JSON file and resume your experiment.

## 🛠️ Technical Architecture

### Project Structure
```
src/
├── engine/           # Core simulation logic
│   ├── NeuralNetwork.js   # Brain implementation (Matrix math)
│   ├── GeneticAlgorithm.js # Evolution, mutation, crossover logic
│   ├── Traits.js          # Physical traits system
│   └── EvolutionLog.js    # Statistics tracking
├── world/            # Game entities
│   ├── World.js           # Main container for entities
│   ├── Creature.js        # The agent logic
│   ├── Food.js            # Resources
│   └── Obstacle.js        # Static map elements
├── renderer/         # Visualization
│   ├── Renderer.js        # HTML5 Canvas drawing logic
│   └── PixiRenderer.js    # Experimental WebGL renderer
├── ui/               # User Interface
│   └── UI.js              # DOM manipulation for stats/charts
└── main.js           # Entry point and loop
```

### Technologies Used
- **Vanilla JavaScript (ES6+)**: Core logic, no heavy frameworks.
- **HTML5 Canvas**: High-performance 2D rendering.
- **Vite**: Fast development build tool.
- **Chart.js**: For visualizing population stats over generations.

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
