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

module.exports = function(req, res, next) {
  var paramsToParse = ["filter", "order", "range"];
  function returnError(err) {
    if(res.api) {
      return res.api.error(err);
    }
    return next(err);
  }
  paramsToParse.forEach(function(paramName) {
    var p = req.swagger.params[paramName];
    if(p && p.schema.in === "query" && p.value) {
      var v;
      try {
        v = JSON.parse(p.value);
      }
      catch(ex) {
        return returnError(ex);
      }
      if(paramName === "order") {
        if(typeof v[0] === "string") {
          // it's short format, need to expand to full
          v = [v];
        }
        if(!isValidOrder(v)) {
          return returnError(new Error("Order format is invalid"));
        }
      }
      if(req.api) {
        req.api[paramName] = v;
      }
      else {
        req.swagger.params[paramName].value = v;
      }
    }
  });
  next();
};