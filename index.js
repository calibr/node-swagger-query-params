var validateFilter = require("./lib/validators/filter");
var validateRange = require("./lib/validators/range");
var validateOrder = require("./lib/validators/order");
var ValidationError = require('./lib/errors/validation')

var JSONPath = require("jsonpath-plus");

var Promise = require("bluebird");

function isValidOrder(order) {
  if(!Array.isArray(order)) {
    return false;
  }
  // all sub elements must be arrays with two string values
  for(var i = 0; i != order.length; i++) {
    var orderArray = order[i];
    if(!Array.isArray(orderArray) || orderArray.length !== 2) {
      return false;
    }
    if(typeof orderArray[0] !== "string" || typeof orderArray[1] !== "string") {
      return false;
    }
  }
  return true;
}


module.exports = function(options) {
  options = options || {};
  let hasRequiredFieldsInFilter = false
  if(options.validateFilter) {
    for(let k in options.validateFilter) {
      if(options.validateFilter[k]) {
        hasRequiredFieldsInFilter = true
        break
      }
    }
  }
  return function(req, res, next) {
    var validatorsContext = {
      req: req,
      res: res
    };
    var paramsToParse = ["filter", "order", "range"];
    function returnError(err) {
      if(res && res.api) {
        return res.api.error(err);
      }
      return next(err);
    }
    if(hasRequiredFieldsInFilter && (!req.swagger.params.filter || !req.swagger.params.filter.value)) {
      // need to add an empty object filter, because there are some required fields in the filter rule
      req.swagger.params.filter = {
        value: '{}',
        schema: {
          in: 'query'
        }
      }
    }
    return Promise.try(function() {
      return Promise.each(paramsToParse, function(paramName) {
        var p = req.swagger.params[paramName];
        if(p && p.schema.in === "query" && p.value) {
          var v = JSON.parse(p.value);
          return Promise.try(function() {
            if(paramName === "filter") {
              if(typeof v !== "object" || Array.isArray(v)) {
                throw new ValidationError("filter", "filter must be an object and not an array")
              }
              if(options.validateFilter) {
                return validateFilter.call(validatorsContext, v, options.validateFilter);
              }
            }
            else if(paramName === "range" && options.validateRange) {
              return validateRange.call(validatorsContext, v, options.validateRange);
            }
            else if(paramName === "order") {
              if(typeof v[0] === "string") {
                // it's short format, need to expand to full
                v = [v];
              }
              if(!isValidOrder(v)) {
                throw new Error("Order format is invalid");
              }
              if(options.validateOrder) {
                return validateOrder.call(validatorsContext, v, options.validateOrder);
              }
            }
          }).then(function() {
            if(req.api) {
              req.api[paramName] = v;
            }
            else {
              req.swagger.params[paramName].value = v;
            }
          });
        }
      }).then(function() {
        if(options.validateParams) {
          // need to validate the swagger params
          return Promise.each(Object.keys(options.validateParams), function(jsonPathOrig) {
            var parts = jsonPathOrig.split(".");
            parts.splice(1, 0, "value");
            var jsonPath = "$." + parts.join(".");
            var values = JSONPath({path: jsonPath, json: req.swagger.params});
            if(values.length === 1) {
              var value = values[0];
              if(typeof value !== "undefined") {
                return options.validateParams[jsonPathOrig](value, req);
              }
            }
            else if(values.length > 1) {
              throw new Error(
                "Field validation is ambiguous, path: " + jsonPath + ", values: " + values.join(",")
              );
            }
          });
        }
      });
    })
    .then(function() {
      process.nextTick(function() {
        next();
      });
    })
    .catch(returnError)
  };
};

module.exports.ValidationError = ValidationError