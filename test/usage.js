var should = require("should");
var middleware = require("../index");

describe("Usage", function() {
  it("should parse filter", function() {
    var filter = {
      field1: {gt: 2},
      field2: "test"
    };
    var req = {
      swagger: {
        params: {
          filter: {
            schema: {in: "query"},
            value: JSON.stringify(filter)
          }
        }
      }
    };
    middleware(req, null, function() {});
    req.swagger.params.filter.value.should.eql(filter);
  });

  it("should parse order", function() {
    var order = [["field1", "asc"], ["field2", "desc"]];
    var req = {
      swagger: {
        params: {
          order: {
            schema: {in: "query"},
            value: JSON.stringify(order)
          }
        }
      }
    };
    middleware(req, null, function() {});
    req.swagger.params.order.value.should.eql(order);
  });

  it("should parse limit", function() {
    var limit = {offset: 0, limit: 10};
    var req = {
      swagger: {
        params: {
          limit: {
            schema: {in: "query"},
            value: JSON.stringify(limit)
          }
        }
      }
    };
    middleware(req, null, function() {});
    req.swagger.params.limit.value.should.eql(limit);
  });

  it("short order should be expanded to full one", function() {
    var order = ["field1", "asc"];
    var req = {
      swagger: {
        params: {
          order: {
            schema: {in: "query"},
            value: JSON.stringify(order)
          }
        }
      }
    };
    middleware(req, null, function() {});
    req.swagger.params.order.value.should.eql([["field1", "asc"]]);
  });
});