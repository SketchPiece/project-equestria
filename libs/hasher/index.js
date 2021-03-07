/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-var-requires */
const { hashElement } = require('../folder-hash')

class Hasher {
  constructor(include = [], exclude = []) {
    this.foldersInclude = _parseFoldersInclude(include)
    this.filesInclude = _parseFilesInclude(include)
  }

  async getAssetsHash(path) {
    const options = {
      folders: {
        ignoreRootName: true,
        matchPath: true,
        matchBasename: false,
        include: this.foldersInclude,
      },
      files: {
        matchPath: true,
        matchBasename: false,
        include: this.filesInclude,
      },
    }
    return await hashElement(path, options)
  }
}

function _parseFoldersInclude(include) {
  const filteredFolders = include.filter((f) => !f.includes('.'))
  const result = []
  for (let folder of filteredFolders) {
    result.push(`**/${folder}`)
    result.push(`**/${folder}/**`)
  }
  return result
}

function _parseFilesInclude(include) {
  const files = include.filter((f) => f.includes('.')).map((f) => `**/${f}`)
  const folders = include
    .filter((f) => !f.includes('.'))
    .map((f) => `**/${f}/**`)

  return [...files, ...folders]
}

module.exports = Hasher
