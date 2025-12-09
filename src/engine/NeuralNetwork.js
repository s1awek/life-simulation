/**
 * Neural Network - Brain of the creature
 * Simple feedforward network with configurable layers
 */
export class NeuralNetwork {
  constructor(inputSize, hiddenLayers, outputSize) {
    this.inputSize = inputSize;
    this.hiddenLayers = hiddenLayers;
    this.outputSize = outputSize;
    this.layers = [];
    this.biases = [];

    // Build network architecture
    let prevSize = inputSize;
    for (const size of hiddenLayers) {
      this.layers.push(this.createLayer(prevSize, size));
      this.biases.push(new Array(size).fill(0).map(() => (Math.random() - 0.5) * 0.5));
      prevSize = size;
    }
    // Output layer
    this.layers.push(this.createLayer(prevSize, outputSize));
    this.biases.push(new Array(outputSize).fill(0).map(() => (Math.random() - 0.5) * 0.5));
  }

  createLayer(inputSize, outputSize) {
    const layer = [];
    for (let i = 0; i < outputSize; i++) {
      const neuron = [];
      for (let j = 0; j < inputSize; j++) {
        // Xavier initialization
        neuron.push((Math.random() - 0.5) * Math.sqrt(2 / inputSize));
      }
      layer.push(neuron);
    }
    return layer;
  }

  /**
   * Forward pass through the network
   * @param {number[]} inputs - Input values
   * @returns {number[]} - Output values
   */
  forward(inputs) {
    let current = inputs;

    for (let l = 0; l < this.layers.length; l++) {
      const layer = this.layers[l];
      const bias = this.biases[l];
      const next = [];

      for (let i = 0; i < layer.length; i++) {
        let sum = bias[i];
        for (let j = 0; j < current.length; j++) {
          sum += current[j] * layer[i][j];
        }
        // ReLU for hidden layers, tanh for output
        if (l < this.layers.length - 1) {
          next.push(Math.max(0, sum)); // ReLU
        } else {
          next.push(Math.tanh(sum)); // tanh for output (-1 to 1)
        }
      }
      current = next;
    }

    return current;
  }

  /**
   * Get all weights as flat array (for genetic algorithm)
   */
  getWeights() {
    const weights = [];

    for (let l = 0; l < this.layers.length; l++) {
      for (const neuron of this.layers[l]) {
        weights.push(...neuron);
      }
      weights.push(...this.biases[l]);
    }

    return weights;
  }

  /**
   * Set weights from flat array
   */
  setWeights(weights) {
    let idx = 0;

    for (let l = 0; l < this.layers.length; l++) {
      for (let i = 0; i < this.layers[l].length; i++) {
        for (let j = 0; j < this.layers[l][i].length; j++) {
          this.layers[l][i][j] = weights[idx++];
        }
      }
      for (let i = 0; i < this.biases[l].length; i++) {
        this.biases[l][i] = weights[idx++];
      }
    }
  }

  /**
   * Create a copy of this network
   */
  clone() {
    const copy = new NeuralNetwork(this.inputSize, this.hiddenLayers, this.outputSize);
    copy.setWeights(this.getWeights());
    return copy;
  }

  /**
   * Get total weight count
   */
  getWeightCount() {
    return this.getWeights().length;
  }

  /**
   * Serialize network to JSON object
   */
  toJSON() {
    return {
      inputSize: this.inputSize,
      hiddenLayers: this.hiddenLayers,
      outputSize: this.outputSize,
      weights: this.getWeights()
    };
  }

  /**
   * Deserialize network from JSON object
   */
  static fromJSON(data) {
    const nn = new NeuralNetwork(data.inputSize, data.hiddenLayers, data.outputSize);
    nn.setWeights(data.weights);
    return nn;
  }
}
