'use strict';

const async        = require('async');
const EventEmitter = require('events');
const zlib         = require('zlib');

module.exports = class SessionCompress extends EventEmitter {
  constructor(store) {
    super();
    this.store = store;

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
    zlib.gzip(uncompressed, (err, compressed) => {
      if (err) {
        cb(err);
        return
      }

      // I don't know that all backing stores would handle buffers correctly so let's convert it to
      // a string
      compressed = compressed.toString('binary');
      console.log(`turned len ${uncompressed.length} to len ${compressed.length}`)
      cb(null, compressed);
    })
  }

  decompress(compressed, cb) {
    zlib.gunzip(Buffer.from(compressed, 'binary'), (err, uncompressed) => {
      if (err) {
        cb(err);
        return
      }

      cb(null, JSON.parse(uncompressed));
    });
  }
}
