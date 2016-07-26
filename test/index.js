'use strict';

const assert                 = require('assert');
const sinon                  = require('sinon');
const ConnectSessionCompress = require('../index.js');

describe('connect session compress', () => {
  it("takes in a backing store",() => {
    new ConnectSessionCompress({});
  });

  it("has methods that the backing store has", () => {
    let csc = new ConnectSessionCompress({all: "doesn't matter"});
    assert(csc.all);
  });

  it("doesn't have methods that the backing store doesn't", () => {
    let csc = new ConnectSessionCompress({});
    assert(!csc.all);
  });

  it("passes through basic methods", (done) => {
    let destroy = sinon.stub();
    destroy.withArgs("sid").yields(null);

    let csc = new ConnectSessionCompress({destroy: destroy});

    csc.destroy("sid", done);
  });

  describe("set", () => {
    it("compresses sessions", (done) => {
      let set = sinon.stub();
      set.withArgs("sid", "compressed").yields(null);
      let compress = sinon.stub();
      compress.withArgs("uncompressed").yields(null, "compressed");

      let csc = new ConnectSessionCompress({set: set});
      csc.compress = compress;

      csc.set("sid", "uncompressed", done);
    });
  });

  describe("get", () => {
    it("uncompresses sessions that it gets", (done) => {
      let get = sinon.stub();
      get.withArgs("sid").yields(null, "compressed");
      let decompress = sinon.stub();
      decompress.withArgs("compressed").yields(null, "uncompressed");

      let csc = new ConnectSessionCompress({get: get});
      csc.decompress = decompress;

      csc.get("sid", done);
    });
  });

  describe("touch", () => {
    it("compresses sessions", (done) => {
      let touch = sinon.stub();
      touch.withArgs("sid", "compressed").yields(null);
      let compress = sinon.stub();
      compress.withArgs("uncompressed").yields(null, "compressed");

      let csc = new ConnectSessionCompress({touch: touch});
      csc.compress = compress;

      csc.touch("sid", "uncompressed", done);
    });
  });

  describe("all", () => {
    it("uncompresses all the sessions", (done) => {
      let all = sinon.stub();
      all.yields(null, ["uncompressed1", "uncompressed2"]);
      let decompress = sinon.stub();
      decompress.withArgs("uncompressed1").yields(null, "compressed1");
      decompress.withArgs("uncompressed2").yields(null, "compressed2");

      let csc = new ConnectSessionCompress({all: all});
      csc.decompress = decompress;

      csc.all((err, sessions) => {
        assert.ifError(err);

        assert.deepEqual(sessions, ["compressed1", "compressed2"]);
        done();
      });
    });
  });

  describe("compress", () => {
    it("compresses rich data", (done) => {
      let csc = new ConnectSessionCompress({});
      csc.compress({key: "val"}, (err, compressed) => {
        assert.ifError(err);
        assert.equal(compressed.length, 33);

        done();
      });
    });
  });

  describe("decompress", () => {
    it("decompresses rich data", (done) => {
      let csc = new ConnectSessionCompress({});
      csc.compress({key: "val"}, (err, compressed) => {
        assert.ifError(err);
        csc.decompress(compressed, (err, original) => {
          assert.ifError(err);
          assert.deepEqual(original, {key: "val"});

          done();
        });
      });
    });
  });
});
