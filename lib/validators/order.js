var ValidationError = require("../errors/validation");

module.exports = function(order, rule) {
  if(rule.hasOwnProperty("allowedFields")) {
    order.forEach(function(orderField) {
      var field = orderField[0];
      if(rule.allowedFields.indexOf(field) === -1) {
        throw new ValidationError(
          "order", "field  " + field + " isn't allowed for order",
          {reason: "allowedFields"}
        );
      }
    });
  }
};