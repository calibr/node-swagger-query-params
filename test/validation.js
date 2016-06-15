var validateFilter = require("../lib/validators/filter");
var validateRange = require("../lib/validators/range");
var validateOrder = require("../lib/validators/order");
var ValidationError = require("../lib/errors/validation");

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
      validateFilter({
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
      try {
        validateFilter({
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
        });
      }
      catch(err) {
        err.should.be.an.instanceof(ValidationError);
        err.extra.reason.should.equal("allowedComparators");
        return;
      }
      throw "failed";
    });

    it("should return type error", function() {
      try {
        validateFilter({
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
        });
      }
      catch(err) {
        err.should.be.an.instanceof(ValidationError);
        err.extra.reason.should.equal("valueType");
        return;
      }
      throw "failed";
    });

    it("should return unexpectedField error", function() {
      try {
        validateFilter({
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
        });
      }
      catch(err) {
        err.should.be.an.instanceof(ValidationError);
        err.extra.reason.should.equal("unexpectedField");
        return;
      }
      throw "failed";
    });
  });
});