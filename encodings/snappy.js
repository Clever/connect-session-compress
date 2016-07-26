'use strict';

const snappy = require('snappy');

module.exports = class Snappy {
  compress(uncompressed, cb) {
    snappy.compress(uncompressed, (err, compressed) => {
      if (err) {
        cb(err);
        return
      }

      // I don't know that all backing stores would handle buffers correctly so let's convert it to
      // a string
      cb(null, compressed.toString('binary'));
    });
  }

  decompress(compressed, cb) {
    snappy.uncompress(Buffer.from(compressed, 'binary'), cb);
  }
}
