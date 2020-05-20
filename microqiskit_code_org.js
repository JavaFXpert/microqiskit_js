// This is a JavaScript version of Qiskit. For the full version, see qiskit.org.
// It has many more features, and access to real quantum computers.
// 1/sqrt(2) will come in handy
var r2 = 0.70710678118;
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
  // This gate is varructed from `h` and `rx`.
  this.h(q);
  this.rx(theta, q);
  this.h(q);
  return this;
};
// Applies an ry gate to the given qubit by the given angle.
(QuantumCircuit.prototype).ry = function(theta, q) {
  // This gate is varructed from `rx` and `rz`.
  this.rx(Math.PI / 2, q);
  this.rz(theta, q);
  this.rx(-Math.PI / 2, q);
  return this;
};
// Applies a z gate to the given qubit.
(QuantumCircuit.prototype).z = function(q) {
  // This gate is varructed from `rz`.
  this.rz(Math.PI, q);
  return this;
};
// Applies a y gate to the given qubit.
(QuantumCircuit.prototype).y = function(q) {
  // This gate is varructed from `rz` and `x`.
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
var simulate = function (qc, shots, get) {
  // For two elements of the statevector, x and y, return (x+y)/sqrt(2)
  // and (x-y)/sqrt(2)
  var superpose = function (x, y) {
    var sup = [
      [(x[0] + y[0]) * r2, (x[1] + y[1]) * r2],
      [(x[0] - y[0]) * r2, (x[1] - y[1]) * r2]
    ];
    return sup;
  };

  /// For two elements of the statevector, x and y, return
  /// return cos(theta/2)*x - i*sin(theta/2)*y and
  /// cos(theta/2)*y - i*sin(theta/2)*x
  var turn = function(x, y, theta) {
    var trn = [
      [
        x[0] * Math.cos(theta / 2) + y[1] * Math.sin(theta / 2),
        x[1] * Math.cos(theta / 2) - y[0] * Math.sin(theta / 2)
      ],
      [
        y[0] * Math.cos(theta / 2) + x[1] * Math.sin(theta / 2),
        y[1] * Math.cos(theta / 2) - x[0] * Math.sin(theta / 2)
      ]
    ];
    return trn;
  };

  // Initialize a 2^n element statevector. Complex numbers are expressed as a
  // list of two real numbers.
  //let k = List<List>.generate(pow(2, qc.numQubits), (j) => ([0, 0]));
  var k = [];
  for (j = 0; j < Math.pow(2, qc.numQubits); j++) {
    k.push([0, 0]);
  }

  // Then a single 1 to create the all |0> state.
  k[0] = [1.0, 0.0];

  // The `outputMap` keeps track of which qubits are read out to which output bits
  var outputMap = {};

  // Now we go through the gates and apply them to the statevector.
  // Each gate is specified by a List, as defined in the QuantumCircuit class
  //for (var gate in qc.data) {
  for (var idx = 0; idx < qc.data.length; idx++) {
    // TODO? For initialization, copy in the given statevector.
    var gate = qc.data[idx];
    if (gate[0] == 'm') {
      // For measurement, keep a record of which bit goes with which qubit.
      outputMap[gate[2]] = gate[1];
    } else if (gate[0] == "x" || gate[0] == "h" || gate[0] == "rx") {
      // These are the only single qubit gates recognized by the simulator.
      // The qubit on which these gates act is the final element of the tuple.
      var j = gate.slice(-1)[0];

      // These gates affect elements of the statevector in pairs.
      // These pairs are the elements whose corresponding bit strings differ only on bit `j`.
      // The following loops allow us to loop over all of these pairs.
      for (var i0 = 0; i0 < Math.pow(2, j); i0++) {
        for (var i1 = 0; i1 < Math.pow(2, qc.numQubits - j - 1); i1++) {
          // Index corresponding to bit string for which the `j`th digit is '0'.
          var b0 = i0 + Math.pow(2, (j + 1)) * i1;

          // Index corresponding to the same bit string except that the `j`th digit is '1'.
          var b1 = b0 + Math.pow(2, j);

          if (gate[0] == 'x') {
            // For x, just flip the values
            var temp0 = k[b0];
            var temp1 = k[b1];
            k[b0] = temp1;
            k[b1] = temp0;
          } else if (gate[0] == 'h') {
            // For h, superpose them
            var sup = superpose(k[b0], k[b1]);
            k[b0] = sup[0];
            k[b1] = sup[1];
          } else {
            // For rx, varruct the superposition required for the given angle
            var theta = gate[1];
            var trn = turn(k[b0], k[b1], theta);
            k[b0] = trn[0];
            k[b1] = trn[1];
          }
        }
      }
    }
    else if (gate[0] == 'cx') {
      // This is the only two qubit gate recognized by the simulator.
      // Get the source and target qubits
      var s = gate[1];
      var t = gate[2];

      // Also get them sorted as highest and lowest
      var l = Math.min(s, t);
      var h = Math.max(s, t);

      // This gate only effects elements whose corresponding bit strings have a '1' on bit 's'.
      // Of those, it effects elements in pairs whose corresponding bit strings differ only on bit `t`.
      // The following loops allow us to loop over all of these pairs.
      // for (var i0 in List<int>.generate(pow(2, l), (ia) => ia)) {
      //   for (var i1 in List<int>.generate(pow(2, (h - l - 1)), (ib) => ib)) {
      for (var i0 = 0; i0 < Math.pow(2, j); i0++) {
        for (var i1 = 0; i1 < Math.pow(2, (h - l - 1)); i1++) {
          for (var i2 = 0; i2 < Math.pow(2, (qc.numQubits - h - 1)); i2++) {
            // Index corresponding to bit string for which digit `s` is `1` and digit `t` is '0'.
            var b0 = i0 + Math.pow(2, l + 1) * i1 + Math.pow(2, h + 1) * i2 + Math.pow(2, s);

            // Index corresponding to the same bit string except that digit `t` is '1'.
            var b1 = b0 + Math.pow(2, t);

            // Flip the values.
            var tmp0 = k[b0];
            var tmp1 = k[b1];
            k[b0] = tmp1;
            k[b1] = tmp0;
          }
        }
      }
    }
  }

  // Now for the outputs.

  // For the statevector output, simply return the statevector.
  if (get == 'statevector') {
    return k;
  }
  else {
    // Other kinds of output involve measurements.
    // The following block is to raise errors when the user does things
    // regarding measurements that are allowed in Qiskit but not in MicroQiskit.
    // We demand that no gates are applied to a qubit after its measure command.

    //var m = List<bool>.generate(qc.numQubits, (i) => (false));
    var m = [];
    for (var idx = 0; idx < qc.numQubits; idx++) {
      m.push(false);
    }

    //for (var gate in qc.data) {
    for (var i = 0; i < qc.data.length; i++) {
      var gate = qc.data[i];
      //for (var j in List < int >.generate(qc.numQubits, (i) => i)) {
      for (var j = 0; j < qc.numQubits; j++) {
        if (((gate.slice(-1)[0] == j) && m[j])) {
          throw ('Incorrect or missing measure command.');
        }
        m[j] = (gate[0] == 'm' && gate[1] == j && gate[2] == j);
      }
    }

    // To calculate outputs, we convert the statevector into a list of probabilities.
    // Here `probs[j]` is the probability for the output bit string to be
    // the n bit representation of j.
    //var probs = List < double >.generate(k.length, (i) => (pow(k[i][0], 2) + pow(k[i][1], 2)));
    var probs = [];
    for (var i = 0; i < k.length; i++) {
      probs.push((Math.pow(k[i][0], 2) + Math.pow(k[i][1], 2)));
    }

    // The 'counts' and 'memory' outputs require us to sample from the above
    // probability distribution.
    // The `shots` samples that result are then collected in the list `m`.
    if (get == 'counts' || get == 'memory') {
      var me = [];
      for (var idx = 0; idx < shots; idx++) {
        var cumu = 0.0;
        var un = true;
        var r = Math.random();
        for (var j = 0; j < probs.length; j++) {
          var p = probs[j];
          cumu += p;
          if (r < cumu && un) {
            // When the `j`th element is chosen, get the n bit representation of j.
            //var rawOut = j.toRadixString(2).padLeft(qc.numQubits, '0');
            //var rawOut = j.toString(2).padStart(qc.numQubits, '0');
            var bitStr = j.toString(2);
            var padStr = Math.pow(10, qc.numQubits - bitStr.length).toString().substr(1, qc.numQubits);
            var rawOut = padStr + bitStr;

            // Convert this into an m bit string, with the order specified by
            // the measure commands
            //var outList = List < String >.generate(qc.numClbits, (i) => ('0'));
            var outList = [];
            for (var i = 0; i < qc.numClbits; i++) {
              outList.push('0');
            }

            //outputMap.forEach((bit, value) => outList[qc.numClbits - 1 - bit] =
            //  rawOut[qc.numQubits - 1 - outputMap[bit]]);

            for (var bit in outputMap) {

              //console.log(bit);
              outList[qc.numClbits - 1 - bit] =
                rawOut[qc.numQubits - 1 - outputMap[bit]];
            }

            var out = outList.join("");

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
        var counts = {};
        for (var meIdx = 0; meIdx < me.length; meIdx++) {
          var out = me[meIdx];
          if (counts.hasOwnProperty(out)) {
            counts[out] += 1;
          } else {
            counts[out] = 1;
          }
        }
        return counts;
      }
    }
  }
};


// Usage:
var qc = new QuantumCircuit(3, 3);
//qc.x(0);
//qc.rx(Math.PI, 1);
//qc.x(1);
qc.h(0);
qc.h(1);
qc.h(2);
//qc.cx(0, 1);
//qc.z(1)
//qc.rz(Math.PI / 2, 1);
//qc.ry(Math.PI / 4, 1);
qc.measure(0, 0);
qc.measure(1, 1);
qc.measure(2, 2);
console.log(qc.data);

console.log(simulate(qc, 5, "counts"));

/*
var psiMinus = new QuantumCircuit(2, 2);
psiMinus.h(0);
psiMinus.x(1);
psiMinus.cx(0, 1);
psiMinus.z(1);
psiMinus.measure(0, 0);
psiMinus.measure(1, 1);

var psiMinusStatevector = simulate(psiMinus, 0, 'statevector');
console.log('psiMinusStatevector: ' + psiMinusStatevector);
console.log(simulate(psiMinus, 5, 'counts'));
*/

var ghz = new QuantumCircuit(3, 3);
ghz.h(0);
ghz.cx(0, 1);
ghz.cx(0, 2);
ghz.measure(0, 0);
ghz.measure(1, 1);
ghz.measure(2, 2);

var ghzStatevector = simulate(ghz, 0, 'statevector');
console.log('ghzStatevector: ' + ghzStatevector);
console.log(simulate(ghz, 5, 'counts'));

