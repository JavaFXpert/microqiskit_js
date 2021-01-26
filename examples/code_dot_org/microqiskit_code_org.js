// This is a JavaScript version of Qiskit. For the full version, see qiskit.org.
// It has many more features, and access to real quantum computers.
var r2 = 0.70710678118;
function QuantumCircuit(n, m) {
  this.numQubits = n;
  this.numClbits = m;
  this.data = [];
}
(QuantumCircuit.prototype).x = function (q) {
  this.data.push(['x', q]);
  return this;
};
(QuantumCircuit.prototype).rx = function(theta, q) {
  this.data.push(['rx', theta, q]);
  return this;
};
(QuantumCircuit.prototype).h = function(q) {
  this.data.push(['h', q]);
  return this;
};
(QuantumCircuit.prototype).cx = function(s, t) {
  this.data.push(['cx', s, t]);
  return this;
};
(QuantumCircuit.prototype).crx = function(theta, s, t) {
  this.data.push(['crx', theta, s, t]);
  return this;
};
(QuantumCircuit.prototype).cp = function(theta, s, t) {
  this.data.push(['cp', theta, s, t]);
  return this;
};
(QuantumCircuit.prototype).crz = function(theta, s, t) {
  this.h(t);
  this.crx(theta, s, t);
  this.h(t);
  return this;
};
(QuantumCircuit.prototype).swap = function(s, t) {
  this.data.push(['swap', s, t]);
  return this;
};
(QuantumCircuit.prototype).rz = function(theta, q) {
  this.h(q);
  this.rx(theta, q);
  this.h(q);
  return this;
};
(QuantumCircuit.prototype).ry = function(theta, q) {
  this.rx(Math.PI / 2, q);
  this.rz(theta, q);
  this.rx(-Math.PI / 2, q);
  return this;
};
(QuantumCircuit.prototype).z = function(q) {
  this.rz(Math.PI, q);
  return this;
};
(QuantumCircuit.prototype).s = function(q) {
  this.rz(Math.PI / 2, q);
  return this;
};
(QuantumCircuit.prototype).sdg = function(q) {
  this.rz(-Math.PI / 2, q);
  return this;
};
(QuantumCircuit.prototype).t = function(q) {
  this.rz(Math.PI / 4, q);
  return this;
};
(QuantumCircuit.prototype).tdg = function(q) {
  this.rz(-Math.PI / 4, q);
  return this;
};
(QuantumCircuit.prototype).y = function(q) {
  this.rz(Math.PI, q);
  this.x(q);
  return this;
};
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
var simulate = function (qc, shots, get) {
  var superpose = function (x, y) {
    var sup = [
      [(x[0] + y[0]) * r2, (x[1] + y[1]) * r2],
      [(x[0] - y[0]) * r2, (x[1] - y[1]) * r2]
    ];
    return sup;
  };
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
  var phaseTurn = function(x, y, theta) {
    var phsTrn = [
      [
        y[0] - x[1],
        y[1] + x[0]
      ],
      [
        y[0] * Math.cos(theta) - x[1] * Math.sin(theta),
        y[1] * Math.cos(theta) + x[0] * Math.sin(theta)
      ]
    ];
    return phsTrn;
  };
  var k = [];
  for (j = 0; j < Math.pow(2, qc.numQubits); j++) {
    k.push([0, 0]);
  }
  k[0] = [1.0, 0.0];
  var outputMap = {};
  for (var idx = 0; idx < qc.data.length; idx++) {
    var gate = qc.data[idx];
    if (gate[0] == 'm') {
      outputMap[gate[2]] = gate[1];
    } else if (gate[0] == "x" || gate[0] == "h" || gate[0] == "rx") {
      var j = gate.slice(-1)[0];
      for (var i0 = 0; i0 < Math.pow(2, j); i0++) {
        for (var i1 = 0; i1 < Math.pow(2, qc.numQubits - j - 1); i1++) {
          var b0 = i0 + Math.pow(2, (j + 1)) * i1;
          var b1 = b0 + Math.pow(2, j);
          if (gate[0] == 'x') {
            var temp0 = k[b0];
            var temp1 = k[b1];
            k[b0] = temp1;
            k[b1] = temp0;
          } else if (gate[0] == 'h') {
            var sup = superpose(k[b0], k[b1]);
            k[b0] = sup[0];
            k[b1] = sup[1];
          } else if (gate[0] == 'rx') {
            var theta = gate[1];
            var trn = turn(k[b0], k[b1], theta);
            k[b0] = trn[0];
            k[b1] = trn[1];
          }
        }
      }
    }
    else if (gate[0] == 'cx' || gate[0] == 'swap' || gate[0] == 'crx' || gate[0] == 'cp' ) {
      var s, t, theta;
      if (gate[0] == 'cx' || gate[0] == 'swap') {
        s = gate[1];
        t = gate[2];
      }
      else if (gate[0] == 'crx') {
        theta = gate[1];
        s = gate[2];
        t = gate[3];
      }
      else if (gate[0] == 'cp') {
        theta = gate[1];
        s = gate[2];
        t = gate[3];
      }

      var l = Math.min(s, t);
      var h = Math.max(s, t);
      for (var i0 = 0; i0 < Math.pow(2, l); i0++) {
        for (var i1 = 0; i1 < Math.pow(2, (h - l - 1)); i1++) {
          for (var i2 = 0; i2 < Math.pow(2, (qc.numQubits - h - 1)); i2++) {
            // var b0 = i0 + Math.pow(2, l + 1) * i1 + Math.pow(2, h + 1) * i2 + Math.pow(2, s);
            // var b1 = b0 + Math.pow(2, t);

            var b00 = i0 + Math.pow(2, l + 1) * i1 + Math.pow(2, h + 1) * i2;
            var b01 = i0 + Math.pow(2, t);
            var b10 = i0 + Math.pow(2, s);
            var b11 = b00 + Math.pow(2, s) + Math.pow(2, t);

            if (gate[0] == 'cx') {
              var tmp10 = k[b10];
              var tmp11 = k[b11];
              k[b10] = tmp11;
              k[b11] = tmp10;
            }
            else if (gate[0] == 'swap') {
              var tmp10 = k[b10];
              var tmp01 = k[b01];
              k[b01] = tmp10;
              k[b10] = tmp01;
            }
            else if (gate[0] == 'crx') {
              theta = gate[1];
              var trn = turn(k[b10], k[b11], theta);
              k[b10] = trn[0];
              k[b11] = trn[1];
            }
            else if (gate[0] == 'cp') {
              theta = gate[1];
              var phsTrn = phaseTurn(k[b10], k[b11], theta);
              //k[b10] = phsTrn[0];
              k[b11] = phsTrn[1];
              console.log();
            }
          }
        }
      }
    }
  }
  if (get == 'statevector') {
    return k;
  }
  else {
    var m = [];
    for (var idx = 0; idx < qc.numQubits; idx++) {
      m.push(false);
    }
    for (var i = 0; i < qc.data.length; i++) {
      var gate = qc.data[i];
      for (var j = 0; j < qc.numQubits; j++) {
        if (((gate.slice(-1)[0] == j) && m[j])) {
          throw ('Incorrect or missing measure command.');
        }
        m[j] = (gate[0] == 'm' && gate[1] == j && gate[2] == j);
      }
    }
    var probs = [];
    for (var i = 0; i < k.length; i++) {
      probs.push((Math.pow(k[i][0], 2) + Math.pow(k[i][1], 2)));
    }
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
            var bitStr = j.toString(2);
            var padStr = Math.pow(10, qc.numQubits - bitStr.length).toString().substr(1, qc.numQubits);
            var rawOut = padStr + bitStr;
            var outList = [];
            for (var i = 0; i < qc.numClbits; i++) {
              outList.push('0');
            }
            for (var bit in outputMap) {
              outList[qc.numClbits - 1 - bit] =
                rawOut[qc.numQubits - 1 - outputMap[bit]];
            }
            var out = outList.join("");
            me.push(out);
            un = false;
          }
        }
      }
      if (get == 'memory') {
        return m;
      } else {
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


// Example circuits:
var qft2 = new QuantumCircuit(2, 2);
qft2.x(0);
qft2.swap(0,1);
qft2.h(0);
qft2.cp(Math.PI/2, 0, 1);
qft2.h(1);
var qft2Statevector = simulate(qft2, 0, 'statevector');
console.log('qft2Statevector: ' + qft2Statevector);



var cpQc = new QuantumCircuit(2, 2);
cpQc.h(0);
cpQc.h(1);
cpQc.cp(Math.PI/8, 0, 1 );
var cpQcStatevector = simulate(cpQc, 0, 'statevector');
console.log('cpQcStatevector: ' + cpQcStatevector);


var crzQc = new QuantumCircuit(2, 2);
crzQc.h(0);
crzQc.h(1);
crzQc.crz(Math.PI/4, 0, 1 );
var crzQcStatevector = simulate(crzQc, 0, 'statevector');
console.log('crzQcStatevector: ' + crzQcStatevector);


// var phiPlus = new QuantumCircuit(2, 2);
// phiPlus.h(0);
// phiPlus.cx(0, 1);
// phiPlus.measure(0, 0);
// phiPlus.measure(1, 1);
// var phiPlusStatevector = simulate(phiPlus, 0, 'statevector');
// console.log('phiPlusStatevector: ' + phiPlusStatevector);
// console.log(simulate(phiPlus, 5, 'counts'));
//

//
// var swapCirc = new QuantumCircuit(2, 2);
// swapCirc.x(0);
// swapCirc.swap(0, 1);
// var swapCircStatevector = simulate(swapCirc, 0, 'statevector');
// console.log('swapCirc: ' + swapCircStatevector);
// console.log(simulate(phiPlus, 5, 'counts'));


// var psiMinus = new QuantumCircuit(2, 2);
// psiMinus.h(0);
// psiMinus.x(1);
// psiMinus.cx(0, 1);
// psiMinus.z(1);
// psiMinus.measure(0, 0);
// psiMinus.measure(1, 1);
// var psiMinusStatevector = simulate(psiMinus, 0, 'statevector');
// console.log('psiMinusStatevector: ' + psiMinusStatevector);
// console.log(simulate(psiMinus, 5, 'counts'));
//
//
// var ghz = new QuantumCircuit(3, 3);
// ghz.h(0);
// ghz.cx(0, 1);
// ghz.cx(0, 2);
// ghz.measure(0, 0);
// ghz.measure(1, 1);
// ghz.measure(2, 2);
// var ghzStatevector = simulate(ghz, 0, 'statevector');
// console.log('ghzStatevector: ' + ghzStatevector);
// console.log(simulate(ghz, 5, 'counts'));
//
// var qc = new QuantumCircuit(3, 3);
// qc.x(0);
// qc.rx(Math.PI, 1);
// qc.x(1);
// qc.h(2);
// qc.cx(0, 1);
// qc.z(1)
// qc.rz(Math.PI / 2, 1);
// qc.ry(Math.PI / 4, 1);
// qc.measure(0, 0);
// qc.measure(1, 1);
// qc.measure(2, 2);
// console.log(qc.data);
// console.log(simulate(qc, 5, "counts"));

