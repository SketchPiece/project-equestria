/* eslint-disable no-return-await */
/* eslint-disable space-before-function-paren */
const EventEmmiter = require('events')
const path = require('path')
const JavaGuard = require('./JavaGuard')
// const async = require('async')
const { DLTracker, Asset } = require('./utils')
const fs = require('fs-extra')
const axios = require('axios')
const zlib = require('zlib')
const tar = require('tar-fs')
const AdmZip = require('adm-zip')

class AssetGuard extends EventEmmiter {
  constructor(commonPath, javaexec) {
    super()
    this.totalDlSize = 0
    this.progress = 0
    // this.assets = new DLTracker([], 0)
    // this.java = new DLTracker([], 0)
    // this.extractQueue = []
    this.commonPath = commonPath
    // this.javaexec = javaexec
  }

  // processDlQueues(identifiers = [{ id: 'assets', limit: 5 }]) {
  //   return new Promise((resolve) => {
  //     console.log('process', identifiers)

  //     this.totalDlSize = 0
  //     this.progress = 0

  //     this.once('complete', () => {
  //       resolve()
  //     })

  //     for (let iden of identifiers) {
  //       this.totalDlSize += this[iden.id].dlsize
  //       this.startAsyncProcess(iden.id, iden.limit)
  //     }
  //   })
  // }

  async startAsyncDownload(dlTracker) {
    this.totalDlSize = dlTracker.dlsize
    this.progress = 0
    const dlQueue = dlTracker.dlqueue
    if (dlQueue.length <= 0) return false

    const assetDownload = (asset) => {
      console.log('Download to', path.join(asset.to, '..'))
      fs.ensureDirSync(path.join(asset.to, '..'))
      return new Promise((resolve) => {
        axios({
          url: asset.from,
          method: 'GET',
          responseType: 'stream'
        }).then(({ data, headers }) => {
          const contentLength = Number(headers['content-length'])
          if (contentLength !== asset.size) {
            console.log(
              `WARN: Got ${contentLength}
              bytes for ${asset.id}: 
              Expected ${asset.size}`
            )
            this.totalDlSize -= asset.size
            this.totalDlSize += contentLength
          }
          const writer = fs.createWriteStream(asset.to)
          data.pipe(writer)
          data.on('error', (err) => {
            this.emit('error', 'download', err)
          })
          data.on('data', (chunk) => {
            this.progress += chunk.length
            this.emit('progress', 'download', this.progress, this.totalDlSize)
          })
          writer.on('close', () => {
            resolve()
          })
        })
      })
    }
    for (const asset of dlQueue) {
      await assetDownload(asset)
    }
    if (this.progress >= this.totalDlSize) {
      this.emit('complete', 'download')
    }
    if (dlTracker.callback) {
      for (const asset of dlQueue) {
        const self = this
        await dlTracker.callback(asset, self)
      }
    }
  }

  async validateEverything() {
    // TODO: Version
    const VERSION = '1.12.2'
    // const SERVER = {}
    const versionData = await this.loadVersionData(VERSION)
    console.log(versionData)
    // const forgeData = await this.loadForgeData(SERVER)
    return versionData
  }
  // TODO: Добавить проверки
  loadVersionData(version) {
    return new Promise(async (resolve) => {
      const versionPath = path.join(this.commonPath, 'versions', version)
      const versionFile = path.join(versionPath, `${version}.json`)
      resolve(JSON.parse(fs.readFileSync(versionFile)))
    })
  }

  // loadForgeData(server) {
  //   return new Promise(async (resolve) => {})
  // }
  async downloadOpenJDK(dataDir) {
    const verData = await JavaGuard.latestOpenJDK('8')
    if (!verData) return false
    dataDir = path.join(dataDir, 'runtime', 'x64')
    const fDir = path.join(dataDir, verData.name)
    const jre = new Asset(verData.name, null, verData.size, verData.uri, fDir)
    const JavaTracker = new DLTracker([jre], jre.size, (asset, self) => {
      // TODO: zip
      if (verData.name.endsWith('zip')) {
      } else {
        let head = null
        fs.createReadStream(asset.to)
          .on('error', (err) => console.log(err))
          .pipe(zlib.createGunzip())
          .on('error', (err) => console.log(err))
          .pipe(
            tar.extract(dataDir, {
              map: (header) => {
                if (!head) {
                  head = header.name
                }
              }
            })
          )
          .on('error', (err) => console.log(err))
          .on('finish', () => {
            fs.unlink(asset.to, (err) => {
              if (err) {
                console.log(err)
              }
              if (head.includes('/')) {
                head = head.substring(0, head.indexOf('/'))
              }
              const pos = path.join(dataDir, head)
              self.emit('complete', 'java', JavaGuard.javaExecFromRoot(pos))
            })
          })
      }
    })

    this.startAsyncDownload(JavaTracker)
  }
  async downloadAssets(dataDir, assetsInfo, validateResult) {
    dataDir = path.join(dataDir, 'common')
    if (!validateResult.common) {
      return await this.downloadCommon(dataDir, assetsInfo)
    }

    // let filesQueue = []
    if (validateResult.force.length) {
      const ForceTracker = await this.createForceTracker(
        dataDir,
        assetsInfo.downloadUri,
        validateResult.force
      )
      // console.log('ForceTracker', ForceTracker)
      await this.startAsyncDownload(ForceTracker)
    }
    if (validateResult.files.length) {
      const FilesTracker = await this.createFilesTracker(
        dataDir,
        assetsInfo.downloadUri,
        validateResult.files
      )
      // console.log(FilesTracker)
      await this.startAsyncDownload(FilesTracker)
    }
    // if (validateResult)
  }

  async downloadCommon(dataDir, assetsInfo) {
    const fDir = path.join(dataDir, `${assetsInfo.root.name}.zip`)
    const ast = new Asset(
      assetsInfo.root.name,
      null,
      assetsInfo.root.size,
      assetsInfo.downloadUri,
      fDir
    )
    const AssetTracker = new DLTracker([ast], ast.size, (a, self) => {
      return new Promise((resolve, reject) => {
        const zip = new AdmZip(a.to)
        zip.extractAllToAsync(dataDir, true, (err) => {
          if (err) {
            console.log('ERROR!', err)
            reject(err)
          } else {
            fs.unlinkSync(a.to)
            resolve()
          }
        })
      })
    })

    return await this.startAsyncDownload(AssetTracker)
  }

  async createForceTracker(dataDir, downloadUri, forceFolders) {
    let fullSize = 0
    const forceAssets = forceFolders.map((f) => {
      fullSize += f.size
      return new Asset(
        f.name,
        f.hash,
        f.size,
        `${downloadUri}?name=${f.name}`,
        path.resolve(dataDir, f.name, `${f.name}.zip`)
      )
    })
    return new DLTracker(forceAssets, fullSize, (a, self) => {
      return new Promise((resolve, reject) => {
        const zip = new AdmZip(a.to)
        zip.extractAllToAsync(path.resolve(dataDir, a.id), true, (err) => {
          if (err) {
            console.log('ERROR!', err)
            reject(err)
          } else {
            fs.unlinkSync(a.to)
            resolve()
          }
        })
      })
    })
  }

  async createFilesTracker(dataDir, downloadUri, files) {
    console.log(dataDir, downloadUri, files)
    let fullSize = 0
    const filesAssets = files.map((file) => {
      fullSize += file.size
      return new Asset(
        file.path,
        null,
        file.size,
        `${downloadUri}?path=${file.path}`,
        path.resolve(dataDir, file.path)
      )
    })
    return new DLTracker(filesAssets, fullSize, null)
  }

  // async enqueueOpenJDK(dataDir) {
  //   const verData = await JavaGuard.latestOpenJDK('8')
  //   if (!verData) return false
  //   console.log('dataDir', dataDir)
  //   dataDir = path.join(dataDir, 'runtime', 'x64')
  //   console.log('dataDir', dataDir)
  //   const fDir = path.join(dataDir, verData.name)
  //   console.log('fDir', fDir)
  //   const jre = new Asset(verData.name, null, verData.size, verData.uri, fDir)
  //   console.log('ends zip', verData.name.endsWith('zip'))

  //   this.java = new DLTracker([jre], jre.size, (asset, self) => {
  //     console.log('afterDownload')
  //     // TODO: zip
  //     if (verData.name.endsWith('zip')) {
  //     } else {
  //       let head = null
  //       fs.createReadStream(asset.to)
  //         .on('error', (err) => console.log(err))
  //         .pipe(zlib.createGunzip())
  //         .on('error', (err) => console.log(err))
  //         .pipe(
  //           tar.extract(dataDir, {
  //             map: (header) => {
  //               if (!head) {
  //                 head = header.name
  //               }
  //             }
  //           })
  //         )
  //         .on('error', (err) => console.log(err))
  //         .on('finish', () => {
  //           fs.unlink(asset.to, (err) => {
  //             if (err) {
  //               console.log(err)
  //             }
  //             if (head.includes('/')) {
  //               head = head.substring(0, head.indexOf('/'))
  //             }
  //             const pos = path.join(dataDir, head)
  //             self.emit('complete', 'java', JavaGuard.javaExecFromRoot(pos))
  //           })
  //         })
  //     }
  //   })
  //   return true
  // }
}

Promise.eachLimit = async (funcs, limit) => {
  let rest = funcs.slice(limit)
  return await Promise.all(
    funcs.slice(0, limit).map(async (func) => {
      await func()
      while (rest.length) {
        await rest.shift()()
      }
    })
  )
}

module.exports = AssetGuard
