// This is a JavaScript version of Qiskit. For the full version, see qiskit.org.
// It has many more features, and access to real quantum computers.
// 1/sqrt(2) will come in handy
const r2 = 0.70710678118;
function QuantumCircuit(n, m) {
  this.numQubits = n;
  this.numClbits = m;
  this.data = [];
}
// Applies an x gate to the given qubit.
(QuantumCircuit.prototype).x = function (q) {
  this.data.push(['x', q]);
  return this;
};
// Applies an rx gate to the given qubit by the given angle.
(QuantumCircuit.prototype).rx = function(theta, q) {
  this.data.push(['rx', theta, q]);
  return this;
};
// Applies an h gate to the given qubit.
(QuantumCircuit.prototype).h = function(q) {
  this.data.push(['h', q]);
  return this;
};
// Applies a cx gate to the given source and target qubits.
(QuantumCircuit.prototype).cx = function(s, t) {
  this.data.push(['cx', s, t]);
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
  this.data.push(['m', q, b]);
  return this;
};

// Simulates the given circuit `qc`, and outputs the results in the form
// specified by `shots` and `get`.
simulate = function (qc, shots, get) {
  // For two elements of the statevector, x and y, return (x+y)/sqrt(2)
  // and (x-y)/sqrt(2)
  const superpose = function (x, y) {
    let sup = [
      [(x[0] + y[0]) * r2, (x[1] + y[1]) * r2],
      [(x[0] - y[0]) * r2, (x[1] - y[1]) * r2]
    ];
    return sup;
  }

  /// For two elements of the statevector, x and y, return
  /// return cos(theta/2)*x - i*sin(theta/2)*y and
  /// cos(theta/2)*y - i*sin(theta/2)*x
  const turn = function(x, y, theta) {
    let trn = [
      [
        x[0] * cos(theta / 2) + y[1] * sin(theta / 2),
        x[1] * cos(theta / 2) - y[0] * sin(theta / 2)
      ],
      [
        y[0] * cos(theta / 2) + x[1] * sin(theta / 2),
        y[1] * cos(theta / 2) - x[0] * sin(theta / 2)
      ]
    ];
    return trn;
  }

  // Initialize a 2^n element statevector. Complex numbers are expressed as a
  // list of two real numbers.
  //let k = List<List>.generate(pow(2, qc.numQubits), (j) => ([0, 0]));
  let k = [];
  for (j = 0; j < Math.pow(2, qc.numQubits); j++) {
    k.push([0, 0]);
  }

  // Then a single 1 to create the all |0> state.
  k[0] = [1.0, 0.0];

  // The `outputMap` keeps track of which qubits are read out to which output bits
  let outputMap = {};

  // Now we go through the gates and apply them to the statevector.
  // Each gate is specified by a List, as defined in the QuantumCircuit class
  //for (const gate in qc.data) {
  for (let idx = 0; idx < qc.data.length; idx++) {
    // TODO? For initialization, copy in the given statevector.
    const gate = qc.data[idx];
    if (gate[0] == 'm') {
      // For measurement, keep a record of which bit goes with which qubit.
      outputMap[gate[2]] = gate[1];
    } else if (['x', 'h', 'rx'].includes(gate[0])) {
      // These are the only single qubit gates recognized by the simulator.
      // The qubit on which these gates act is the final element of the tuple.
      let j = gate.slice(-1)[0];

      // These gates affect elements of the statevector in pairs.
      // These pairs are the elements whose corresponding bit strings differ only on bit `j`.
      // The following loops allow us to loop over all of these pairs.
      for (let i0 = 0; i0 < Math.pow(2, j); i0++) {
        for (let i1 = 0; i1 < Math.pow(2, qc.numQubits - j - 1); i1++) {
          // Index corresponding to bit string for which the `j`th digit is '0'.
          let b0 = i0 + Math.pow(2, (j + 1)) * i1;

          // Index corresponding to the same bit string except that the `j`th digit is '1'.
          let b1 = b0 + Math.pow(2, j);

          if (gate[0] == 'x') {
            // For x, just flip the values
            let temp0 = k[b0];
            let temp1 = k[b1];
            k[b0] = temp1;
            k[b1] = temp0;
          } else if (gate[0] == 'h') {
            // For h, superpose them
            let sup = superpose(k[b0], k[b1]);
            k[b0] = sup[0];
            k[b1] = sup[1];
          } else {
            // For rx, construct the superposition required for the given angle
            let theta = gate[1];
            let trn = turn(k[b0], k[b1], theta);
            k[b0] = trn[0];
            k[b1] = trn[1];
          }
        }
      }
    }
    /*
    else if (gate[0] == 'cx') {
      // This is the only two qubit gate recognized by the simulator.
      // Get the source and target qubits
      var s = gate[1];
      var t = gate[2];

      // Also get them sorted as highest and lowest
      var l = min<int>(s, t);
      var h = max<int>(s, t);

      // This gate only effects elements whose corresponding bit strings have a '1' on bit 's'.
      // Of those, it effects elements in pairs whose corresponding bit strings differ only on bit `t`.
      // The following loops allow us to loop over all of these pairs.
      for (var i0 in List<int>.generate(pow(2, l), (ia) => ia)) {
        for (var i1 in List<int>.generate(pow(2, (h - l - 1)), (ib) => ib)) {
          for (var i2 in List<int>.generate(
            Math.pow(2, (qc.numQubits - h - 1)), (ic) => ic)) {
            // Index corresponding to bit string for which digit `s` is `1` and digit `t` is '0'.
            let b0 = i0 + Math.pow(2, l + 1) * i1 + Math.pow(2, h + 1) * i2 + Math.pow(2, s);

            // Index corresponding to the same bit string except that digit `t` is '1'.
            let b1 = b0 + pow(2, t);

            // Flip the values.
            let tmp0 = k[b0];
            let tmp1 = k[b1];
            k[b0] = tmp1;
            k[b1] = tmp0;
          }
        }
      }
    }

     */
  }

  // Now for the outputs.

  // For the statevector output, simply return the statevector.
  if (get == 'statevector') {
    return k;
  }
  /*
  else {
    // Other kinds of output involve measurements.
    // The following block is to raise errors when the user does things
    // regarding measurements that are allowed in Qiskit but not in MicroQiskit.
    // We demand that no gates are applied to a qubit after its measure command.

    var m = List<bool>.generate(qc.numQubits, (i) => (false));
    for (var gate in qc.data) {
      for (var j in List<int>.generate(qc.numQubits, (i) => i)) {
        if (((gate.last == j) && m[j])) {
          throw ('Incorrect or missing measure command.');
        }
        m[j] = (gate[0] == 'm' && gate[1] == j && gate[2] == j);
      }
    }

    // To calculate outputs, we convert the statevector into a list of probabilities.
    // Here `probs[j]` is the probability for the output bit string to be
    // the n bit representation of j.
    var probs = List<double>.generate(
      k.length, (i) => (pow(k[i][0], 2) + pow(k[i][1], 2)));

    // The 'counts' and 'memory' outputs require us to sample from the above
    // probability distribution.
    // The `shots` samples that result are then collected in the list `m`.
    if (['counts', 'memory'].includes(get)) {
      var me = [];
      for (var _ in List<int>.generate(shots, (i) => i)) {
        var cumu = 0.0;
        var un = true;
        var r = random.nextDouble();
        for (let j = 0; j < probs.length; j++) {
          let p = probs[j];
          cumu += p;
          if (r < cumu && un) {
            // When the `j`th element is chosen, get the n bit representation of j.
            let rawOut = j.toRadixString(2).padLeft(qc.numQubits, '0');

            // Convert this into an m bit string, with the order specified by
            // the measure commands
            let outList = List<String>.generate(qc.numClbits, (i) => ('0'));
            outputMap.forEach((bit, value) => outList[qc.numClbits - 1 - bit] =
              rawOut[qc.numQubits - 1 - outputMap[bit]]);
            let out = outList.join();

            // Add this to the list of samples
            me.push(out);
            un = false;
          }
        }
      }
      // For the memory output, we simply return `m`
      if (get == 'memory') {
        return m;
      } else {
        // For the counts output, we turn it into a counts dictionary first
        let counts = {};
        for (let out in me) {
          if (counts.containsKey(out)) {
            counts[out] += 1;
          } else {
            counts[out] = 1;
          }
        }
        return counts;
      }
    }

   */

    /* TODO?
    else if (get == 'expected_counts') {
      // For simplicity and speed, the expectation values for the counts can be obtained.
      // For each p=probs[j], the key is the n bit representation of j, and
      // the value is `p*shots`.
      var expMap = {};
      for (var j = 0; j < probs.length; j++) {
        var p = probs[j];
        var bitStr = j.toRadixString(2).padLeft(qc.numQubits, '0');
        expMap[bitStr] = p;
      }
      return expMap;
    }
  }
     */

}


// Usage:
var qc = new QuantumCircuit(1, 1);
//qc.x(0);
//qc.rx(Math.PI, 1);
qc.x(0);
qc.h(0);
//qc.cx(2, 1);
//qc.rz(Math.PI / 2, 1);
//qc.ry(Math.PI / 4, 1);
//qc.measure(1, 1);
console.log(qc.data);

console.log(simulate(qc, 1024, "statevector"));
