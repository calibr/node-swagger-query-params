module.exports = function(req, res, next) {
  var paramsToParse = ["filter", "order", "limit"];
  paramsToParse.forEach(function(paramName) {
    var p = req.swagger.params[paramName];
    if(p && p.schema.in === "query" && p.value) {
      req.swagger.params[paramName].value = JSON.parse(p.value);
    }
  });
  next();
};