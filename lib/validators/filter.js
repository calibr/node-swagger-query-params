var ValidationError = require("../errors/validation");
var Promise = require("bluebird");

function parseFieldFilter(fieldFilter) {
  var comparators,
    values;
  if(typeof fieldFilter !== "object") {
    comparators = ["eq"];
    values = [fieldFilter];
  }
  else if(Array.isArray(fieldFilter)) {
    comparators = ["in"];
    values = [fieldFilter];
  }
  else {
    var objectKeys = Object.keys(fieldFilter);
    if(objectKeys.length === 0) {
      throw new Error(
        "Fail to extract field filter comparator from " + JSON.stringify(fieldFilter)
      );
    }
    comparators = objectKeys;
    values = [];
    comparators.forEach(function(comparator) {
      values.push(fieldFilter[comparator]);
    });
  }
  // replace leading dollar sign in comparator
  for(var i = 0; i != comparators.length; i++) {
    comparators[i] = comparators[i].replace(/^\$/, "");
  }
  return {
    comparators: comparators,
    values: values
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
          fieldFilter.comparators.forEach(function(comparator) {
            if(fieldRule.allowedComparators.indexOf(comparator) === -1) {
              throw new ValidationError(
                "filter", "Comparator " + comparator + " isn't allowed for field " + k,
                {reason: "allowedComparators"}
              );
            }
          });
        }
        if(fieldRule.valueType) {
          fieldFilter.values.forEach(function(value) {
            if(!hasType(value, fieldRule.valueType)) {
              throw new ValidationError(
                "filter", k + " value type isn't allowed",
                {reason: "valueType"}
              );
            }
          });
        }
        if(fieldRule.func) {
          return fieldRule.func(fieldFilter.values, req);
        }
      }
    });
  });
}

module.exports = validateFilter;