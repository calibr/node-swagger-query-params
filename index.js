module.exports = function(req, res, next) {
  var paramsToParse = ["filter", "order", "limit"];
  paramsToParse.forEach(function(paramName) {
    var p = req.swagger.params[paramName];
    if(p && p.schema.in === "query" && p.value) {
      req.swagger.params[paramName].value = JSON.parse(p.value);
      if(paramName === "order") {
        var v = req.swagger.params[paramName].value;
        if(typeof v[0] === "string") {
          // it's short format, need to expand to full
          req.swagger.params[paramName].value = [v];
        }
      }
    }
  });
  next();
};