var should = require("should");
var middlewareFactory = require("../index");
var sinon = require("sinon");

var validateFilter = require("../lib/validators/filter");
var validateOrder = require("../lib/validators/order");
var validateRange = require("../lib/validators/range");

var middleware = middlewareFactory({
  validateOrder: {
    allowedFields: ["field1", "field2"]
  },
  validateFilter: {
    field1: {},
    field2: {},
  },
  validateRange: {
    maxLimit: 11
  }
});

describe("Usage", function() {
  var validateFilterSpy;
  var validateOrderSpy;
  var validateRangeSpy;

  it("should parse filter", function() {
    var filter = {
      field1: {gt: 2},
      field2: "test"
    };
    var req = {
      api: {},
      swagger: {
        params: {
          filter: {
            schema: {in: "query"},
            value: JSON.stringify(filter)
          }
        }
      }
    };
    middleware(req, null, function(err) {
      should.not.exists(err);
    });
    req.api.filter.should.eql(filter);
  });

  it("should parse order", function() {
    var order = [["field1", "asc"], ["field2", "desc"]];
    var req = {
      api: {},
      swagger: {
        params: {
          order: {
            schema: {in: "query"},
            value: JSON.stringify(order)
          }
        }
      }
    };
    middleware(req, null, function(err) {
      should.not.exists(err);
    });
    req.api.order.should.eql(order);
  });

  it("should parse range", function() {
    var limit = {offset: 0, limit: 10};
    var req = {
      api: {},
      swagger: {
        params: {
          range: {
            schema: {in: "query"},
            value: JSON.stringify(limit)
          }
        }
      }
    };
    middleware(req, null, function() {});
    req.api.range.should.eql(limit);
  });

  it("short order should be expanded to full one", function() {
    var order = ["field1", "asc"];
    var req = {
      api: {},
      swagger: {
        params: {
          order: {
            schema: {in: "query"},
            value: JSON.stringify(order)
          }
        }
      }
    };
    middleware(req, null, function(err) {
      should.not.exists(err);
    });
    req.api.order.should.eql([["field1", "asc"]]);
  });

  it("passing malformed order should return an error", function() {
    var malformedOrders = [
      [[["field1", "asc"]]],
      ["field"],
      "field"
    ];
    malformedOrders.forEach(function(order) {
      var req = {
        api: {},
        swagger: {
          params: {
            order: {
              schema: {in: "query"},
              value: JSON.stringify(order)
            }
          }
        }
      };
      var err;
      middleware(req, {
        api: {
          error: function(e) {err = e;}
        }
      }, function() {});
      should.exists(err);
    });
  });

  it("parsing error should be catched", function() {
    var order = ["field1", "asc"];
    var req = {
      api: {},
      swagger: {
        params: {
          order: {
            schema: {in: "query"},
            value: "{|something wild||xxx"
          }
        }
      }
    };
    var err;
    middleware(req, {
      api: {
        error: function(e) {err = e;}
      }
    }, function() {
      throw new Error("next should not be called");
    });
    should.exists(err);
  });
});