class Util {
  static mcVersionAtLeast(desired, actual) {
    const des = desired.split('.')
    const act = actual.split('.')

    for (let i = 0; i < des.length; i++) {
      if (!(parseInt(act[i]) >= parseInt(des[i]))) {
        return false
      }
    }
    return true
  }
}

class DLTracker {
  /**
   * Create a DLTracker
   *
   * @param {Array.<Asset>} dlqueue An array containing assets queued for download.
   * @param {number} dlsize The combined size of each asset in the download queue array.
   * @param {function(Asset)} callback Optional callback which is called when an asset finishes downloading.
   */
  constructor(dlqueue, dlsize, callback = null) {
    this.dlqueue = dlqueue
    this.dlsize = dlsize
    this.callback = callback
  }
}

class Asset {
  /**
   * Create an asset.
   *
   * @param {any} id The id of the asset.
   * @param {string} hash The hash value of the asset.
   * @param {number} size The size in bytes of the asset.
   * @param {string} from The url where the asset can be found.
   * @param {string} to The absolute local file path of the asset.
   */
  constructor(id, hash, size, from, to) {
    this.id = id
    this.hash = hash
    this.size = size
    this.from = from
    this.to = to
  }
}

module.exports = {
  Util,
  DLTracker,
  Asset
}
