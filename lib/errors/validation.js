var util = require("util");

function ValidationError(parameter, message, extra) {
  Error.captureStackTrace(this, this.constructor);
  this.name = "ValidationError";
  this.message = "Fail to validate parameter " + parameter + ", " + message;
  this.extra = extra;
}
util.inherits(ValidationError, Error);

module.exports = ValidationError;