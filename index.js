module.exports = function(req, res, next) {
  var paramsToParse = ["filter", "order", "range"];
  paramsToParse.forEach(function(paramName) {
    var p = req.swagger.params[paramName];
    if(p && p.schema.in === "query" && p.value) {
      var v;
      try {
        v = JSON.parse(p.value);
      }
      catch(ex) {
        if(res.api) {
          return res.api.error(ex);
        }
        return next(ex);
      }
      if(req.api) {
        req.api[paramName] = v;
      }
      else {
        req.swagger.params[paramName].value = v;
      }
      if(paramName === "order") {
        if(typeof v[0] === "string") {
          // it's short format, need to expand to full
          if(req.api) {
            req.api[paramName] = [v];
          }
          else {
            req.swagger.params[paramName].value = [v];
          }
        }
      }
    }
  });
  next();
};