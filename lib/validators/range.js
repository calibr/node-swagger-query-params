var ValidationError = require("../errors/validation");

module.exports = function(range, rule) {
  if(rule.hasOwnProperty("maxLimit")) {
    if(range.limit > rule.maxLimit) {
      throw new ValidationError(
        "range", "limit value must be less than " + rule.maxLimit,
        {reason: "maxLimit"}
      );
    }
  }
};