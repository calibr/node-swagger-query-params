var validateFilter = require("../lib/validators/filter");
var validateRange = require("../lib/validators/range");
var validateOrder = require("../lib/validators/order");
var ValidationError = require("../lib/errors/validation");

var Promise = require("bluebird");
var should = require("should");

describe("Validation", function() {
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