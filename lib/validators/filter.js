var ValidationError = require("../errors/validation");
var Promise = require("bluebird");

function parseFieldFilter(fieldFilter) {
  var comparator,
    value;
  if(typeof fieldFilter !== "object") {
    comparator = "eq";
    value = fieldFilter;
  }
  else if(Array.isArray(fieldFilter)) {
    comparator = "in";
    value = fieldFilter;
  }
  else {
    var objectKeys = Object.keys(fieldFilter);
    if(objectKeys.length !== 1) {
      throw new Error(
        "Fail to extract field filter comparator from " + JSON.stringify(fieldFilter)
      );
    }
    comparator = objectKeys[0];
    value = fieldFilter[comparator];
  }
  return {
    comparator: comparator,
    value: value
  };
}

function hasType(value, type) {
  if(!Array.isArray(value)) {
    return typeof value === type;
  }
  else {
    for(var i = 0; i != value.length; i++) {
      if(typeof value[i] !== type) {
        return false;
      }
    }
    return true;
  }
}

function validateFilter(filter, rule) {
  var req = this.req;
  return Promise.try(function() {
    for(var k in filter) {
      if(typeof filter.hasOwnProperty === "function" && !filter.hasOwnProperty(k)) {
        continue;
      }
      if(!rule.hasOwnProperty(k)) {
        throw new ValidationError(
          "filter", "has unexpected field " + k,
          {reason: "unexpectedField"}
        );
      }
    }
    var fieldsInRule = Object.keys(rule);
    return Promise.each(fieldsInRule, function(k) {
      var fieldRule = rule[k];
      if(filter.hasOwnProperty(k)) {
        var fieldFilter = parseFieldFilter(filter[k]);
        if(fieldRule.allowedComparators) {
          if(fieldRule.allowedComparators.indexOf(fieldFilter.comparator) === -1) {
            throw new ValidationError(
              "filter", "Comparator " + fieldFilter.comparator + " isn't allowed for field " + k,
              {reason: "allowedComparators"}
            );
          }
        }
        if(fieldRule.valueType) {
          if(!hasType(fieldFilter.value, fieldRule.valueType)) {
            throw new ValidationError(
              "filter", k + " value type isn't allowed",
              {reason: "valueType"}
            );
          }
        }
        if(fieldRule.func) {
          return fieldRule.func(fieldFilter.value, req);
        }
      }
    });
  });
}

module.exports = validateFilter;