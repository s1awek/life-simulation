# 🧬 Neural Network Life Simulation

A web-based evolutionary simulation where creatures evolve neural networks to survive and reproduce. Built with Vanilla JavaScript and Vite.

![Simulation Screenshot](public/screenshots/simulation_running.png)

## 🌟 Overview

This project simulates a closed ecosystem where simple organisms (creatures) compete for food and survival. Each creature has a unique **Neural Network (Brain)** that dictates its movement and actions based on sensory input. Through **Genetic Algorithm (Evolution)**, the fittest creatures—those that eat enough food to survive—pass their genes (neural weights and physical traits) to the next generation.

### Key Features
- **Neural Network Brains**: Creatures use a feedforward neural network to process inputs (food location, other creatures) and decide how to move.
- **Genetic Evolution**: Successful creatures reproduce. Offspring inherit traits and brain weights with mutations, leading to smarter behaviors over time.
- **Dynamic Traits**: Creatures have variable traits like **Size**, **Speed**, **Metabolism**, and **Vision Radius**.
- **Predator & Prey System**: Some creatures can evolve into predators, creating a dynamic balance in the ecosystem.
- **Real-time Visualization**: Watch the evolution happen in real-time on an HTML5 Canvas.

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v14 or higher)
- npm (Node Package Manager)

### Installation

1.  **Clone the repository**
    ```bash
    git clone <repository-url>
    cd life-simulation
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Start the development server**
    ```bash
    npm run dev
    ```

4.  **Open in Browser**
    Visit `http://localhost:5173` (or the URL shown in your terminal) to see the simulation running.

### Build for Production
To build the project for deployment:
```bash
npm run build
```

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

### 3. Evolution Cycle
The simulation runs in **Generations** (epochs).
1.  **Generation Start**: A population is spawned.
2.  **Live Phase**: Creatures eat, move, and survive for a fixed time steps.
3.  **Selection**: At the end of the generation, creatures are ranked by **Fitness** (Food eaten + Time survived).
4.  **Reproduction**: Top performers replicate. Offspring have slightly mutated brains and traits.
5.  **Next Generation**: The new population starts the cycle again.

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
│   └── Food.js            # Resources
├── renderer/         # Visualization
│   └── Renderer.js        # HTML5 Canvas drawing logic
├── ui/               # User Interface
│   └── UI.js              # DOM manipulation for stats/charts
└── main.js           # Entry point and loop
```

### Technologies Used
- **Vanilla JavaScript (ES6+)**: Core logic, no heavy frameworks.
- **HTML5 Canvas**: High-performance 2D rendering.
- **Vite**: Fast development build tool.
- **Chart.js** (implied): For visualizing population stats over generations.

## 🖥️ UI & User Experience

### Interactive Inspection
The simulation allows you to inspect individual creatures to understand their behavior and genetics:
- **Click to Select**: Click on any creature on the canvas to select it.
- **Visual Feedback**: The selected creature is highlighted with a pulsing white dashed ring.
- **Live Stats Panel**: A tooltip appears near the creature showing real-time data:
    - **Type**: Predator (Red) or Herbivore (Green).
    - **Energy**: Current energy level vs Maximum.
    - **Fitness**: Current score based on survival and food consumed.
    - **Traits**: Specific values for **Size**, **Metabolism**, **Aggression**, and **Vision**.

### Main Dashboard
The left-side panel provides global simulation statistics and controls:
- **Controls**: Pause/Play simulation and adjust speed (1x to 10x).
- **Population Stats**: Real-time counts of Predators vs Herbivores.
- **Statistics**: Current ticks, alive count, and kills.
- **Fitness History**: A graph tracking Average and Max fitness over generations.
- **Evolution Log**: A running log of major events (Births, Kill, Elite selection).
- **Generation Survivors**: Breakdown of the survivors from the previous generation.

## 🎮 Controls & Interactions
- **Click on a Creature**: Selects it to view its stats.
- **Click Empty Space**: Deselects the current creature.
- **Pause (Spacebar/Button)**: Pauses the simulation.
- **Toggle "Show All Stats"**: When paused, this reveals tooltips for ALL creatures simultaneously.

---
*Created for the Neural Network Life Simulation Project.*
