var validateFilter = require("./lib/validators/filter");
var validateRange = require("./lib/validators/range");
var validateOrder = require("./lib/validators/order");

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
    var paramsToParse = ["filter", "order", "range"];
    function returnError(err) {
      if(res && res.api) {
        return res.api.error(err);
      }
      return next(err);
    }
    try {
      for(var i = 0; i != paramsToParse.length; i++) {
        var paramName = paramsToParse[i];
        var p = req.swagger.params[paramName];
        if(p && p.schema.in === "query" && p.value) {
          var v;
          try {
            v = JSON.parse(p.value);
          }
          catch(ex) {
            return returnError(ex);
          }
          if(paramName === "filter" && options.validateFilter) {
            validateFilter(v, options.validateFilter);
          }
          else if(paramName === "range" && options.validateRange) {
            validateRange(v, options.validateRange);
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
              validateOrder(v, options.validateOrder);
            }
          }
          if(req.api) {
            req.api[paramName] = v;
          }
          else {
            req.swagger.params[paramName].value = v;
          }
        }
      }
    }
    catch(err) {
      return returnError(err);
    }
    next();
  };
};
