// This is a JavaScript version of Qiskit. For the full version, see qiskit.org.
// It has many more features, and access to real quantum computers.
function QuantumCircuit(n, m) {
  this.numQubits = n;
  this.numClbits = m;
  this.data = [];
}
// Applies an x gate to the given qubit.
(QuantumCircuit.prototype).x = function (q) {
  this.data.push('x', q);
  return this;
};
// Applies an rx gate to the given qubit by the given angle.
(QuantumCircuit.prototype).rx = function(theta, q) {
  this.data.push('rx', theta, q);
  return this;
};
// Applies an h gate to the given qubit.
(QuantumCircuit.prototype).h = function(q) {
  this.data.push('h', q);
  return this;
};
// Applies a cx gate to the given source and target qubits.
(QuantumCircuit.prototype).cx = function(s, t) {
  this.data.push('cx', s, t);
  return this;
};
// Applies an rz gate to the given qubit by the given angle.
(QuantumCircuit.prototype).rz = function(theta, q) {
  // This gate is constructed from `h` and `rx`.
  this.h(q);
  this.rx(theta, q);
  this.h(q);
  return this;
};
// Applies an ry gate to the given qubit by the given angle.
(QuantumCircuit.prototype).ry = function(theta, q) {
  // This gate is constructed from `rx` and `rz`.
  this.rx(Math.PI / 2, q);
  this.rz(theta, q);
  this.rx(-Math.PI / 2, q);
  return this;
};
// Applies a z gate to the given qubit.
(QuantumCircuit.prototype).z = function(q) {
  // This gate is constructed from `rz`.
  this.rz(Math.PI, q);
  return this;
};
// Applies a y gate to the given qubit.
(QuantumCircuit.prototype).y = function(q) {
  // This gate is constructed from `rz` and `x`.
  this.rz(Math.PI, q);
  this.x(q);
  return this;
};
// Applies a measure gate to the given qubit and bit.
(QuantumCircuit.prototype).measure = function(q, b) {
  if (q >= this.numQubits) {
    throw 'Index for qubit out of range.';
  }
  if (b >= this.numClbits) {
    throw 'Index for output bit out of range.';
  }
  this.data.push('m', q, b);
  return this;
};


// Usage:
var qc = new QuantumCircuit(3, 3);
qc.x(0);
qc.rx(Math.PI, 1);
qc.h(1);
qc.cx(2, 1);
qc.rz(Math.PI / 2, 1);
qc.ry(Math.PI / 4, 1);
qc.x(0);
qc.measure(1, 1);
console.log(qc.data);
