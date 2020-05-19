// This is the JavaScript version of Qiskit. For the full version, see qiskit.org.
// It has many more features, and access to real quantum computers.
class QuantumCircuit {

  constructor(n, m = 0) {
    this.numQubits = n;
    this.numClbits = m;
    this.data = [];
  }

  // TODO: Implement def __add__(self,self2):
  // Allows QuantumCircuit objects to be added, as in Qiskit.


  // Initializes the qubits in a given state.
  // TODO: Use or remove
  initialize(k) {
    // Clear existing gates.
    this.data.clear();

    // Add the instruction to initialize, including the required state.
    this.data.add('init');

    // TODO: Make this like the MicroQiskit python implementation
    this.data.add(k);

    return this;
  }


  // Applies an x gate to the given qubit.
  x(q) {
    this.data.push('x', q);
    return this;
  }


  // Applies an rx gate to the given qubit by the given angle.
  rx(theta, q) {
    this.data.push('rx', theta, q);
    return this;
  }


  // Applies an h gate to the given qubit.
  h(q) {
    this.data.push('h', q);
    return this;
  }


  // Applies a cx gate to the given source and target qubits.
  cx(s, t) {
    this.data.push('cx', s, t);
    return this;
  }


  /// Applies a measure gate to the given qubit and bit.
  measure(q, b) {
  if (q >= this.numQubits) {
    throw 'Index for qubit out of range.';
  }
  if (b >= this.numClbits) {
    throw 'Index for output bit out of range.';
  }
  this.data.push('m', q, b);
  return this;
}


  // Applies an rz gate to the given qubit by the given angle.
  rz(theta, q) {
    // This gate is constructed from `h` and `rx`.
    this.h(q);
    this.rx(theta, q);
    this.h(q);
    return this;
  }


  // Applies an ry gate to the given qubit by the given angle.
  ry(theta, q) {
    // This gate is constructed from `rx` and `rz`.
    this.rx(Math.PI / 2, q);
    this.rz(theta, q);
    this.rx(-Math.PI / 2, q);
    return this;
  }


  // Applies a z gate to the given qubit.
  z(q) {
    // This gate is constructed from `rz`.
    this.rz(Math.PI, q);
    return this;
  }


  // Applies a y gate to the given qubit.
  y(q) {
    // This gate is constructed from `rz` and `x`.
    this.rz(Math.PI, q);
    this.x(q);
    return this;
  }


  sayHi() {
    console.log(this.numQubits);
    console.log(this.numClbits);
    console.log(this.data);
  }

}

// Usage:
let qc = new QuantumCircuit(3, 3);
qc.x(0);
qc.rx(Math.PI, 1);
qc.h(1);
qc.cx(2, 1);
qc.rz(Math.PI/2, 1);
qc.ry(Math.PI/4, 1);
qc.measure(1, 1);
qc.sayHi();
