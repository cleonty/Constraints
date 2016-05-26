function Connector() {
  this.value = 0;
  this.informant = false;
  this.constraints = [];

  this.hasValue = function () {
    if (this.informant) {
      return true;
    } else {
      return false;
    }
  };

  this.setValue = function (newval, setter) {
    if (!this.hasValue()) {
      this.value = newval;
      this.informant = setter;
      this.forEachExcept(setter, 'processNewValue', this.constraints);
      return "ok";
    } else if (newval != this.value) {
      return "Противоречие";
    } else {
      return "ignore";
    }
  };

  this.getValue = function () {
    return this.value;
  };

  this.forgetValue = function (retractor) {
    if (retractor == this.informant) {
      this.informant = false;
      this.forEachExcept(retractor, 'processNoValue', this.constraints);
      return "ok";
    } else {
      return "ignored";
    }
  };

  this.connect = function (newConstraint) {
    var exists = false;
    for (var i = 0; i < this.constraints.length; i++) {
      if (this.constraints[i] == newConstraint) {
        exists = true;
        break;
      }
    }
    if (!exists) {
      this.constraints.push(newConstraint);
    }
    if (this.hasValue()) {
      newConstraint.processNewValue();
    }
  };

  this.forEachExcept = function (except, procedure, list) {
    for (var i = 0; i < list.length; i++) {
      if (list[i] != except) {
        list[i][procedure]();
      }
    }
  }
}

function Probe(name, connector) {
  this.name = name;
  this.connector = connector;
  connector.connect(this);

  this.processNewValue = function () {
    console.log("Тестер: " + this.name + " = " + this.connector.getValue());
  };

  this.processNoValue = function () {
    console.log("Тестер: " + this.name + " = " + "?");
  };
}

function Equal(a, b) {
  this.a = a;
  this.b = b;
  this.a.connect(this);
  this.b.connect(this);

  this.processNewValue = function () {
    if (this.a.hasValue()) {
      this.b.setValue(this.a.getValue(),this);
    } else if(this.b.hasValue()) {
      this.a.setValue(this.b.getValue(),this);
    }
  };

  this.processNoValue = function () {
    this.a.forgetValue(this);
    this.b.forgetValue(this);
    this.processNewValue();
  };
}

function Adder(a, b, c) {
  this.a = a;
  this.b = b;
  this.c = c;
  this.a.connect(this);
  this.b.connect(this);
  this.c.connect(this);

  this.processNewValue = function () {
    if (this.a.hasValue() && this.b.hasValue()) {
      this.c.setValue(this.a.getValue() + this.b.getValue(),this);
    } else if (this.a.hasValue() && this.c.hasValue()) {
      this.b.setValue(this.c.getValue() - this.a.getValue(),this);
    } else if (this.b.hasValue() && this.c.hasValue()) {
      this.a.setValue(this.c.getValue() - this.b.getValue(),this);
    }
  };

  this.processNoValue = function () {
    this.a.forgetValue(this);
    this.b.forgetValue(this);
    this.c.forgetValue(this);
    this.processNewValue();
  };
}

function Multiplier(a, b, c) {
  this.a = a;
  this.b = b;
  this.c = c;
  this.a.connect(this);
  this.b.connect(this);
  this.c.connect(this);

  this.processNewValue = function () {
    if ((this.a.hasValue() && this.a.getValue() == 0) || (this.b.hasValue() && this.b.getValue() == 0)) {
      this.c.setValue(0);
    } else if (this.a.hasValue() && this.b.hasValue()) {
      this.c.setValue(this.a.getValue() * this.b.getValue(),this);
    } else if (this.a.hasValue() && this.c.hasValue()) {
      this.b.setValue(this.c.getValue() / this.a.getValue(),this);
    } else if (this.b.hasValue() && this.c.hasValue()) {
      this.a.setValue(this.c.getValue() / this.b.getValue(),this);
    }
  };

  this.processNoValue = function () {
    this.a.forgetValue(this);
    this.b.forgetValue(this);
    this.c.forgetValue(this);
    this.processNewValue();
  };
}


function Constant(value, connector) {
  this.connector = connector;
  this.connector.setValue(value, this);
}

function CelsiusFahrenheitConverter(c, f) {
  this.u = new Connector();
  this.v = new Connector();
  this.w = new Connector();
  this.x = new Connector();
  this.y = new Connector();
  this.multiplier1 = new Multiplier(c, this.w, this.u);
  this.multiplier2 = new Multiplier(this.v, this.x, this.u);
  this.adder = new Adder(this.v, this.y, f);
  this.c9 = new Constant(9, this.w);
  this.c5 = new Constant(5, this.x);
  this.c32 = new Constant(32, this.y);
}

function Binder(connector, element, resetElement) {
  this.element = element;
  this.connector = connector;
  connector.connect(this);

  this.onchange = function () {
    var newval = parseInt(element.value, 10);
    if (!isNaN(newval)) {
      connector.forgetValue('user');
      connector.setValue(newval, 'user');
    } 
  };

  this.reset = function () {
    connector.forgetValue('user');
  };
  
  //this.element.addEventListener('onchange',this.onchange,false)
  this.element.onchange = this.onchange;

  if(resetElement) {
    if(resetElement.onclick) {
      var oldHandler = resetElement.onclick;
      resetElement.onclick = function () {
        oldHandler();
        connector.forgetValue('user');
      };
    } else {
      resetElement.onclick = this.reset;
    }
  }

  this.processNewValue = function () {
    this.element.value = connector.getValue();
  };

  this.processNoValue = function () {
    this.element.value = "?";
  };
}

function ADD(a, b) {
  this.c = new Connector();
  this.adder = new Adder(a, b, this.c);
  return this.c;
}

function MUL(a, b) {
  this.c = new Connector();
  this.multiplier = new Multiplier(a, b, this.c);
  return this.c;
}

function SUB(a, b) {
  this.c = new Connector();
  this.adder = new Adder(this.c, b, a);
  return this.b;
}

function DIV(a, b) {
  this.c = new Connector();
  this.multiplier = new Multiplier(this.c, b, a);
  return this.c;
}

function C(value) {
  this.c = new Connector();
  this.constant = new Constant(value, this.c);
  return this.c;
}

function CF(x) {
  return new ADD(new MUL(new DIV(new C(5), new C(9)), x), new C(32));
}

function Test() {
  var c = new Connector();
  var f = new Connector(); // CF(c); //
  //new Probe("По Цельсию", c);
  //new Probe("По Фаренгейту", f);
  new Binder(c, document.getElementById("c_id"),document.getElementById("reset_id"));
  new Binder(f, document.getElementById("f_id"),document.getElementById("reset_id"));
  new CelsiusFahrenheitConverter(c, f);
  c.setValue(25, 'user');
  f.setValue(212, 'user')
  c.forgetValue('user');
  f.setValue(212, 'user');
  document.getElementById("reset_id").onclick();

  var x = new Connector();
  var y = new Connector();
  var z = new Connector();
  var k = new Connector();
  var h = new Connector();

  new Binder(x, document.getElementById("x_id"),document.getElementById("reset1_id"));
  new Binder(y, document.getElementById("y_id"),document.getElementById("reset1_id"));
  //new Binder(z, document.getElementById("z_id"),document.getElementById("reset1_id"));
  new Binder(k, document.getElementById("k_id"),document.getElementById("reset1_id"));
  new Binder(h, document.getElementById("h_id"),document.getElementById("reset1_id"));
  new Adder(x, y, z);
  new Multiplier(z,k,h);
  document.getElementById("reset1_id").onclick();

}

angular.module('Constraints', []);
