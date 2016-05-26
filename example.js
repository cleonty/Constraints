angular.module('Constraints').factory('Constraints.Connector', function connectorFactory() {
  return Connector;

  function Connector() {
    this.value = 0;
    this.informant = null;
    this.constraints = [];
  }

  Connector.prototype.RESULT_OK = 0;
  Connector.prototype.RESULT_CONFLICT = 1;
  Connector.prototype.RESULT_IGNORED = 2;

  Connector.prototype.hasValue = function () {
    return (this.informant !== null);
  };

  Connector.prototype.setValue = function (newval, setter) {
    if (!this.hasValue()) {
      this.value = newval;
      this.informant = setter;
      this.forEachExcept(setter, 'processNewValue', this.constraints);
      return this.RESULT_OK;
    } else if (newval !== this.value) {
      return this.RESULT_CONFLICT;
    } else {
      return this.RESULT_IGNORED;
    }
  };

  Connector.prototype.getValue = function () {
    return this.value;
  };

  Connector.prototype.forgetValue = function (retractor) {
    if (retractor === this.informant) {
      this.informant = null;
      this.forEachExcept(retractor, 'processNoValue', this.constraints);
      return this.RESULT_OK;
    } else {
      return this.RESULT_IGNORED;
    }
  };

  Connector.prototype.connect = function (newConstraint) {
    var exists = false;
    for (var i = 0; i < this.constraints.length; i++) {
      if (this.constraints[i] === newConstraint) {
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

  Connector.prototype.forEachExcept = function (except, procedure, list) {
    for (var i = 0; i < list.length; i++) {
      if (list[i] !== except && angular.isFunction(list[i][procedure])) {
        list[i][procedure]();
      }
    }
  };

});

angular.module('Constraints').factory('Constraints.Probe', ['$log', function probeFactory($log) {
    return Probe;

    function Probe(name, connector) {
      this.name = name;
      this.connector = connector;

      connector.connect(this);
    }

    Probe.prototype.processNewValue = function () {
      $log.log('Probe: ' + this.name + ' = ' + this.connector.getValue());
    };

    Probe.prototype.processNoValue = function () {
      $log.log('Probe: ' + this.name + ' = ' + '?');
    };
  }]);

angular.module('Constraints').factory('Constraints.Adder', function adderFactory() {
  return Adder;

  function Adder(firstAddend, secondAddend, sum) {
    this.firstAddend = firstAddend;
    this.secondAddend = secondAddend;
    this.sum = sum;

    this.firstAddend.connect(this);
    this.secondAddend.connect(this);
    this.sum.connect(this);
  }

  Adder.prototype.processNewValue = function () {
    if (this.firstAddend.hasValue() && this.secondAddend.hasValue()) {
      this.sum.setValue(this.firstAddend.getValue() + this.secondAddend.getValue(), this);
    } else if (this.firstAddend.hasValue() && this.sum.hasValue()) {
      this.secondAddend.setValue(this.sum.getValue() - this.firstAddend.getValue(), this);
    } else if (this.secondAddend.hasValue() && this.sum.hasValue()) {
      this.firstAddend.setValue(this.sum.getValue() - this.secondAddend.getValue(), this);
    }
  };

  Adder.prototype.processNoValue = function () {
    this.firstAddend.forgetValue(this);
    this.secondAddend.forgetValue(this);
    this.sum.forgetValue(this);
    this.processNewValue();
  };
});


