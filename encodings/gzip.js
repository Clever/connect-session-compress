'use strict';

const zlib = require('zlib');

module.exports = class GZip {
  compress(uncompressed, cb) {
    zlib.gzip(uncompressed, (err, compressed) => {
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
    zlib.gunzip(Buffer.from(compressed, 'binary'), cb);
  }
}
