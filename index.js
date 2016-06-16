var validateFilter = require("./lib/validators/filter");
var validateRange = require("./lib/validators/range");
var validateOrder = require("./lib/validators/order");

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
    return Promise.try(function() {
      return Promise.each(paramsToParse, function(paramName) {
        var p = req.swagger.params[paramName];
        if(p && p.schema.in === "query" && p.value) {
          var v = JSON.parse(p.value);
          return Promise.try(function() {
            if(paramName === "filter" && options.validateFilter) {
              return validateFilter.call(validatorsContext, v, options.validateFilter);
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
              return options.validateParams[jsonPathOrig](value, req);
            }
            else {
              throw new Error("Field validation is ambiguous, path: " + jsonPath);
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
