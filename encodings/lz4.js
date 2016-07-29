'use strict';

const lz4 = require('lz4');

module.exports = class LZ4 {
  compress(uncompressed, cb) {
    let compressed = lz4.encode(uncompressed);

    // I don't know that all backing stores would handle buffers correctly so let's convert it to
    // a string
    cb(null, compressed.toString('binary'));
  }

  decompress(compressed, cb) {
    cb(null, lz4.decode(Buffer.from(compressed, 'binary')));
  }
}
