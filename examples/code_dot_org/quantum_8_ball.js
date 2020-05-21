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
          } else {
            var theta = gate[1];
            var trn = turn(k[b0], k[b1], theta);
            k[b0] = trn[0];
            k[b1] = trn[1];
          }
        }
      }
    }
    else if (gate[0] == 'cx') {
      var s = gate[1];
      var t = gate[2];
      var l = Math.min(s, t);
      var h = Math.max(s, t);
      for (var i0 = 0; i0 < Math.pow(2, l); i0++) {
        for (var i1 = 0; i1 < Math.pow(2, (h - l - 1)); i1++) {
          for (var i2 = 0; i2 < Math.pow(2, (qc.numQubits - h - 1)); i2++) {
            var b0 = i0 + Math.pow(2, l + 1) * i1 + Math.pow(2, h + 1) * i2 + Math.pow(2, s);
            var b1 = b0 + Math.pow(2, t);
            var tmp0 = k[b0];
            var tmp1 = k[b1];
            k[b0] = tmp1;
            k[b1] = tmp0;
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



// ---------------------- Quantum 8-Ball code --------------------------
function lookupAnswer(bitStr) {
  var ketStr = '\u007c' + bitStr + '\u3009';
  var answerStr = '';
  if (bitStr == "0000") {
    answerStr = 'It is certain.';
  }
  else if (bitStr == "0001") {
    answerStr = 'It is decidedly so.';
  }
  else if (bitStr == "0010") {
    answerStr = 'Without a doubt.';
  }
  else if (bitStr == "0011") {
    answerStr = 'Yes – definitely.';
  }
  else if (bitStr == "0100") {
    answerStr = 'You may rely on it.';
  }
  else if (bitStr == "0101") {
    answerStr = 'As I see it, yes.';
  }
  else if (bitStr == "0110") {
    answerStr = 'Most likely.';
  }
  else if (bitStr == "0111") {
    answerStr = 'Outlook good.';
  }
  else if (bitStr == "1000") {
    answerStr = 'Yes.';
  }
  else if (bitStr == "1001") {
    answerStr = 'Signs point to yes.';
  }
  else if (bitStr == "1010") {
    answerStr = 'Reply hazy, try again.';
  }
  else if (bitStr == "1011") {
    answerStr = 'Ask again later.';
  }
  else if (bitStr == "1100") {
    answerStr = 'Better not tell you now.';
  }
  else if (bitStr == "1101") {
    answerStr = 'Cannot predict now.';
  }
  else if (bitStr == "1110") {
    answerStr = 'Concentrate and ask again.';
  }
  else {
    answerStr = 'Outlook not so good.';
  }
  return answerStr + ' ' + ketStr;
}


var qc8Ball = new QuantumCircuit(4, 4);
qc8Ball.h(0);
qc8Ball.h(1);
qc8Ball.h(2);
qc8Ball.h(3);
qc8Ball.measure(0, 0);
qc8Ball.measure(1, 1);
qc8Ball.measure(2, 2);
qc8Ball.measure(3, 3);

setProperty("fadeButton", "background-color", rgb(244, 244, 244, 0));


onEvent("askButton", "click", function(event) {
  console.log("askButton clicked!");
  var qc8BallCounts = simulate(qc8Ball, 1, 'counts');
  var basisStateStr = Object.getOwnPropertyNames(qc8BallCounts)[0];
  var answer = lookupAnswer(basisStateStr);
  fadeIn();
  setProperty("fadeButton", "background-color", rgb(244, 244, 244, 1));
  setText("answerText", answer);
  console.log(answer);
});

function fadeIn() {
  var opacity = 1;
  timedLoop(50, function() {
    setProperty("fadeButton", "background-color", rgb(244, 244, 244, opacity));
    opacity = opacity-0.05;
    if (opacity <= 0) {
      stopTimedLoop();
    }
  });
}
