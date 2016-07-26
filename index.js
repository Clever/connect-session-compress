'use strict';

const async        = require('async');
const EventEmitter = require('events');
// We have three encoding implementations in this repository (snappy, gzip, and lz4).
// In testing, gzip was too slow for large sessions (~2mb).
// lz4 and snappy were about the same speed, but lz4 offered slightly better compression
// in our testing data set.
const LZ4          = require('./encodings/lz4.js');

module.exports = class SessionCompress extends EventEmitter {
  constructor(store) {
    super();
    this.store = store;
    this._encoding = new LZ4();

    // Some methods are optional, so only add them if the backing store has them.
    for (let meth of ['destroy', 'clear', 'length']) {
      if (this.store[meth]) {
        this.add(meth);
      }
    }

    // Touch and all need special behavior, so can't do it in the above loop.
    if (this.store.touch) {
      this.touch = (sid, session, cb) => {
        this.compress(session, (err, compressed) => {
          if (err) {
            cb(err);
            return
          }

          this.store.touch(sid, compressed, cb);
        });
      }
    }

    if (this.store.all) {
      this.all = (cb) => {
        this.store.all((err, sessions) => {
          if (err) {
            cb(err);
            return
          }

          async.map(sessions, this.decompress.bind(this), cb);
        });
      }
    }
  }

  add(meth) {
    this[meth] = (...args) => {
      this.store[meth].apply(this.store, args);
    }
  }

  get(sid, cb) {
    this.store.get(sid, (err, session) => {
      if (err) {
        cb(err);
        return
      }

      this.decompress(session, cb);
    });
  }

  set(sid, session, cb) {
    this.compress(session, (err, compressed) => {
      this.store.set(sid, compressed, cb);
    });
  }

  compress(session, cb) {
    let uncompressed = JSON.stringify(session);
    this._encoding.compress(uncompressed, (err, compressed) => {
      if (compressed) {
        console.log(`turned len ${uncompressed.length} to len ${compressed.length}`)
      }
      cb(err, compressed);
    });
  }

  decompress(session, cb) {
    this._encoding.decompress(session, (err, uncompressed) => {
      if (err) {
        cb(err);
        return
      }

      cb(null, JSON.parse(uncompressed));
    });
  }
}
