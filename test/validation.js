var validateFilter = require("../lib/validators/filter");
var validateRange = require("../lib/validators/range");
var validateOrder = require("../lib/validators/order");
var ValidationError = require("../lib/errors/validation");

var middlewareFactory = require("../index");

var Promise = require("bluebird");
var should = require("should");

describe("Validation", function() {
  describe("Custom param validation", function() {
    it("successful validation(nested param)", function() {
      var called = false;
      var request = {
        swagger: {
          params: {
            field: {
              value: {
                subfield: "OK"
              }
            }
          }
        }
      };
      var middleware = middlewareFactory({
        validateParams: {
          "field.subfield": function(value, req) {
            called = true;
            req.should.equal(request);
            value.should.equal("OK");
            return Promise.resolve();
          }
        }
      });
      return middleware(request, null, function(err) {
        should.not.exists(err);
        called.should.equal(true);
      });
    });

    it("successful validation(direct param)", function() {
      var called = false;
      var request = {
        swagger: {
          params: {
            field: {
              value: "OK"
            }
          }
        }
      };
      var middleware = middlewareFactory({
        validateParams: {
          field: function(value, req) {
            called = true;
            req.should.equal(request);
            value.should.equal("OK");
            return Promise.resolve();
          }
        }
      });
      return middleware(request, null, function(err) {
        should.not.exists(err);
        called.should.equal(true);
      });
    });

    it("failed validation", function() {
      var called = false;
      var request = {
        swagger: {
          params: {
            field: {
              value: "OK"
            }
          }
        }
      };
      var middleware = middlewareFactory({
        validateParams: {
          field: function(value, req) {
            called = true;
            req.should.equal(request);
            value.should.equal("OK");
            return Promise.reject(new Error("myfail"));
          }
        }
      });
      return middleware(request, null, function(err) {
        should.exists(err);
        err.message.should.equal("myfail");
        called.should.equal(true);
      });
    });

    it("if param is not set should ignore", function() {
      var called = false;
      var request = {
        swagger: {
          params: {
            anotherField: {
              value: "OK"
            }
          }
        }
      };
      var middleware = middlewareFactory({
        validateParams: {
          field: function(value, req) {
            called = true;
          }
        }
      });
      return middleware(request, null, function(err) {
        should.not.exists(err);
        called.should.equal(false);
      });
    });

    it("if param is undefined should ignore", function() {
      var called = false;
      var request = {
        swagger: {
          params: {
            field: {
              value: undefined
            }
          }
        }
      };
      var middleware = middlewareFactory({
        validateParams: {
          field: function(value, req) {
            called = true;
            return Promise.reject(new Error("myfail"));
          }
        }
      });
      return middleware(request, null, function(err) {
        should.not.exists(err);
        called.should.equal(false);
      });
    });
  });

  describe("Validate order", function() {
    it("should be successfully validated", function() {
      validateOrder([["amount", "asc"], ["user_id", "desc"]], {
        allowedFields: ["amount", "user_id"]
      });
    });

    it("should throw allowedFields error", function() {
      try {
        validateOrder([["price", "asc"], ["user_id", "desc"]], {
          allowedFields: ["amount", "user_id"]
        });
      }
      catch(err) {
        err.should.be.an.instanceof(ValidationError);
        err.extra.reason.should.equal("allowedFields");
        return;
      }
      throw "failed";
    });
  });

  describe("Validate range", function() {
    it("should be successfully validated", function() {
      validateRange({
        offset: 10,
        limit: 30
      }, {
        maxLimit: 35
      });
    });

    it("should throw maxLimit error", function() {
      try {
        validateRange({
          offset: 10,
          limit: 40
        }, {
          maxLimit: 35
        });
      }
      catch(err) {
        err.should.be.an.instanceof(ValidationError);
        err.extra.reason.should.equal("maxLimit");
        return;
      }
      throw "failed";
    });
  });

  describe("validateFilter", function() {
    it("should be successfully validated", function() {
      return validateFilter({
        payout: {gt: 20},
        country: ["US", "UK"],
        state: "received"
      }, {
        payout: {
          valueType: "number",
          allowedComparators: ["gt"]
        },
        country: {
          valueType: "string",
          allowedComparators: ["in"]
        },
        state: {
          valueType: "string",
          allowedComparators: ["eq"]
        }
      });
    });

    it("should be successfully validated with dollar prefix in comparator", function() {
      return validateFilter({
        payout: {$gt: 20},
        country: {
          $in: ["US", "UK"]
        },
        state: {
          $eq: "received"
        }
      }, {
        payout: {
          valueType: "number",
          allowedComparators: ["gt"]
        },
        country: {
          valueType: "string",
          allowedComparators: ["in"]
        },
        state: {
          valueType: "string",
          allowedComparators: ["eq"]
        }
      });
    });

    it("should return comparator error", function() {
      return validateFilter({
        payout: {gt: 20},
        country: ["US", "UK"],
        state: "received"
      }, {
        payout: {
          valueType: "number",
          allowedComparators: ["eq"]
        },
        country: {
          valueType: "string",
          allowedComparators: ["in"]
        },
        state: {
          valueType: "string",
          allowedComparators: ["eq"]
        }
      }).then(function() {
        throw "Failed";
      }).catch(function(err) {
        err.should.be.an.instanceof(ValidationError);
        err.extra.reason.should.equal("allowedComparators");
      });
    });

    it("should return type error", function() {
      return validateFilter({
        payout: {gt: 20},
        country: ["US", "UK"],
        state: "received"
      }, {
        payout: {
          valueType: "string",
          allowedComparators: ["gt"]
        },
        country: {
          valueType: "string",
          allowedComparators: ["in"]
        },
        state: {
          valueType: "string",
          allowedComparators: ["eq"]
        }
      }).then(function() {
        throw "failed";
      }).catch(function(err) {
        err.should.be.an.instanceof(ValidationError);
        err.extra.reason.should.equal("valueType");
      });
    });

    it("should return unexpectedField error", function() {
      return validateFilter({
        something: "new",
        payout: {gt: 20},
        country: ["US", "UK"],
        state: "received"
      }, {
        payout: {
          valueType: "number",
          allowedComparators: ["gt"]
        },
        country: {
          valueType: "string",
          allowedComparators: ["in"]
        },
        state: {
          valueType: "string",
          allowedComparators: ["eq"]
        }
      }).then(function() {
        throw "failed";
      }).catch(function(err) {
        err.should.be.an.instanceof(ValidationError);
        err.extra.reason.should.equal("unexpectedField");
      });
    });
  });

  describe("Validate filter with custom function", function() {
    it("should successfully validate", function() {
      var request = {};
      var funcCalled = false;
      return validateFilter.bind({req: request})({
        payout: {gt: 20},
        country: ["US", "UK"],
        state: "received"
      }, {
        payout: {
          valueType: "number",
          allowedComparators: ["gt"]
        },
        country: {
          valueType: "string",
          allowedComparators: ["in"]
        },
        state: {
          valueType: "string",
          allowedComparators: ["eq"],
          func: function(value, req) {
            funcCalled = true;
            req.should.equal(request);
            value.should.equal("received");
            return Promise.resolve();
          }
        }
      }).then(function() {
        funcCalled.should.equal(true);
      });
    });

    it("shouldn't validate", function() {
      var request = {};
      return validateFilter.bind({req: request})({
        payout: {gt: 20},
        country: ["US", "UK"],
        state: "received"
      }, {
        payout: {
          valueType: "number",
          allowedComparators: ["gt"]
        },
        country: {
          valueType: "string",
          allowedComparators: ["in"]
        },
        state: {
          valueType: "string",
          allowedComparators: ["eq"],
          func: function(value, req) {
            req.should.equal(request);
            value.should.equal("received");
            return Promise.reject(new Error("myerror"));
          }
        }
      }).then(function() {
        throw "failed";
      }).catch(function(err) {
        err.message.should.equal("myerror");
      });
    });
  });
});