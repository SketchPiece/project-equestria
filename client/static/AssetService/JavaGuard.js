/* eslint-disable camelcase */
/* eslint-disable no-return-await */
/* eslint-disable indent */
const EventEmmiter = require('events')
const fs = require('fs-extra')
const path = require('path')
const { exec } = require('child_process')
const axios = require('axios')
const Registry = require('winreg')

class JavaGuard extends EventEmmiter {
  static async scanJava(dataDir) {
    return await _javaScanner(process.platform)(dataDir)
  }

  static async latestOpenJDK(major = '8') {
    if (process.platform === 'darwin') {
      return await latestCorretto(major)
    } else {
      return await latestAdoptOpenJDK(major)
    }
  }

  static validateJavaBinary(binaryExecPath) {
    return new Promise((resolve, reject) => {
      if (!isJavaExecPath(binaryExecPath)) {
        resolve({ valid: false })
      } else if (fs.existsSync(binaryExecPath)) {
        if (binaryExecPath.includes('javaw.exe')) {
          binaryExecPath.replace('javaw.exe', 'java.exe')
        }
        exec(
          '"' + binaryExecPath + '" -XshowSettings:properties',
          (_err, _out, stderr) => {
            try {
              resolve(validateJVMProperties(stderr))
            } catch (err) {
              resolve({ valid: false })
            }
          }
        )
      } else {
        resolve({ valid: false })
      }
    })
  }

  static javaExecFromRoot(rootDir) {
    if (process.platform === 'win32') {
      return path.join(rootDir, 'bin', 'javaw.exe')
    } else if (process.platform === 'darwin') {
      return path.join(rootDir, 'Contents', 'Home', 'bin', 'java')
    } else if (process.platform === 'linux') {
      return path.join(rootDir, 'bin', 'java')
    }
    return rootDir
  }
}

function _javaScanner(platform) {
  switch (platform) {
    case 'linux':
      return _linuxJavaScan
    case 'darwin':
      return _darwinJavaScan
    case 'win32':
      return _win32JavaScan
  }
}

/* Systems Java Scan */

async function _linuxJavaScan(dataDir) {
  const pathSet1 = await scanFileSystem('/usr/lib/jvm')
  const pathSet2 = await scanFileSystem(path.join(dataDir, 'runtime', 'x64'))
  const uberSet = new Set([...pathSet1, ...pathSet2])
  const jHome = scanJavaHome()
  if (jHome) uberSet.add(jHome)
  let pathArr = await validateJavaRootSet(uberSet)
  pathArr = sortValidJavaArray(pathArr)

  if (pathArr.length > 0) {
    return pathArr[0].execPath
  } else {
    return null
  }
}

async function _darwinJavaScan(dataDir) {
  const pathSet1 = await scanFileSystem('/Library/Java/JavaVirtualMachines')

  const pathSet2 = await scanFileSystem(path.join(dataDir, 'runtime', 'x64'))

  const uberSet = new Set([...pathSet1, ...pathSet2])

  const iPPath = scanInternetPlugins()
  if (iPPath != null) {
    uberSet.add(iPPath)
  }

  let jHome = scanJavaHome()
  if (jHome != null) {
    // Ensure we are at the absolute root.
    if (jHome.contains('/Contents/Home')) {
      jHome = jHome.substring(0, jHome.indexOf('/Contents/Home'))
    }
    uberSet.add(jHome)
  }
  let pathArr = await validateJavaRootSet(uberSet)
  pathArr = sortValidJavaArray(pathArr)

  if (pathArr.length > 0) {
    return pathArr[0].execPath
  } else {
    return null
  }
}

async function _win32JavaScan(dataDir) {
  let pathSet1 = await scanRegistry()

  if (pathSet1.size === 0) {
    pathSet1 = new Set([
      ...pathSet1,
      ...(await scanFileSystem('C:\\Program Files\\Java')),
      ...(await scanFileSystem('C:\\Program Files\\AdoptOpenJDK'))
    ])
  }

  const pathSet2 = await scanFileSystem(path.join(dataDir, 'runtime', 'x64'))

  const uberSet = new Set([...pathSet1, ...pathSet2])

  const jHome = scanJavaHome()
  if (jHome != null && jHome.indexOf('(x86)') === -1) {
    uberSet.add(jHome)
  }

  let pathArr = await validateJavaRootSet(uberSet)
  pathArr = sortValidJavaArray(pathArr)

  if (pathArr.length > 0) {
    return pathArr[0].execPath
  } else {
    return null
  }
}

/* JavaGuard private functions */

async function scanFileSystem(scanDir) {
  let res = new Set()
  if (await fs.pathExists(scanDir)) {
    const files = await fs.readdir(scanDir)
    for (let i = 0; i < files.length; i++) {
      const combinedPath = path.join(scanDir, files[i])
      const execPath = JavaGuard.javaExecFromRoot(combinedPath)

      if (await fs.pathExists(execPath)) {
        res.add(combinedPath)
      }
    }
  }

  return res
}

function scanRegistry() {
  return new Promise((resolve) => {
    const regKeys = [
      '\\SOFTWARE\\JavaSoft\\Java Runtime Environment',
      '\\SOFTWARE\\JavaSoft\\Java Development Kit'
    ]

    let keysDone = 0

    const candidates = new Set()

    for (let i = 0; i < regKeys.length; i++) {
      const key = new Registry({
        hive: Registry.HKLM,
        key: regKeys[i],
        arch: 'x64'
      })
      key.keyExists((err, exists) => {
        if (exists) {
          key.keys((err, javaVers) => {
            if (err) {
              keysDone++
              console.error(err)
              if (keysDone === regKeys.length) {
                resolve(candidates)
              }
            } else {
              if (javaVers.length === 0) {
                keysDone++
                if (keysDone === regKeys.length) {
                  resolve(candidates)
                }
              } else {
                let numDone = 0

                for (let j = 0; j < javaVers.length; j++) {
                  const javaVer = javaVers[j]
                  const vKey = javaVer.key.substring(
                    javaVer.key.lastIndexOf('\\') + 1
                  )
                  // Only Java 8 is supported currently.
                  if (parseFloat(vKey) === 1.8) {
                    javaVer.get('JavaHome', (err, res) => {
                      const jHome = res.value
                      if (jHome.indexOf('(x86)') === -1) {
                        candidates.add(jHome)
                      }
                      numDone++
                      if (numDone === javaVers.length) {
                        keysDone++
                        if (keysDone === regKeys.length) {
                          resolve(candidates)
                        }
                      }
                    })
                  } else {
                    numDone++
                    if (numDone === javaVers.length) {
                      keysDone++
                      if (keysDone === regKeys.length) {
                        resolve(candidates)
                      }
                    }
                  }
                }
              }
            }
          })
        } else {
          keysDone++
          if (keysDone === regKeys.length) {
            resolve(candidates)
          }
        }
      })
    }
  })
}

function scanInternetPlugins() {
  const pth = '/Library/Internet Plug-Ins/JavaAppletPlugin.plugin'
  const res = fs.existsSync(JavaGuard.javaExecFromRoot(pth))
  return res ? pth : null
}

function scanJavaHome() {
  const jHome = process.env.JAVA_HOME
  try {
    let res = fs.existsSync(jHome)
    return res ? jHome : null
  } catch (err) {
    return null
  }
}

function isJavaExecPath(pth) {
  if (process.platform === 'win32') {
    return pth.endsWith(path.join('bin', 'javaw.exe'))
  } else if (process.platform === 'darwin') {
    return pth.endsWith(path.join('bin', 'java'))
  } else if (process.platform === 'linux') {
    return pth.endsWith(path.join('bin', 'java'))
  }
  return false
}

async function validateJavaRootSet(rootSet) {
  const rootArr = Array.from(rootSet)
  const validArr = []
  for (let root of rootArr) {
    const execPath = JavaGuard.javaExecFromRoot(root)
    const metaOb = await JavaGuard.validateJavaBinary(execPath)
    if (metaOb.valid) {
      metaOb.execPath = execPath
      validArr.push(metaOb)
    }
  }

  return validArr
}

function sortValidJavaArray(validArr) {
  const retArr = validArr.sort((a, b) => {
    if (a.version.major === b.version.major) {
      if (a.version.major < 9) {
        // Java 8
        if (a.version.update === b.version.update) {
          if (a.version.build === b.version.build) {
            // Same version, give priority to JRE.
            if (a.execPath.toLowerCase().indexOf('jdk') > -1) {
              return b.execPath.toLowerCase().indexOf('jdk') > -1 ? 0 : 1
            } else {
              return -1
            }
          } else {
            return a.version.build > b.version.build ? -1 : 1
          }
        } else {
          return a.version.update > b.version.update ? -1 : 1
        }
      } else {
        // Java 9+
        if (a.version.minor === b.version.minor) {
          if (a.version.revision === b.version.revision) {
            // Same version, give priority to JRE.
            if (a.execPath.toLowerCase().indexOf('jdk') > -1) {
              return b.execPath.toLowerCase().indexOf('jdk') > -1 ? 0 : 1
            } else {
              return -1
            }
          } else {
            return a.version.revision > b.version.revision ? -1 : 1
          }
        } else {
          return a.version.minor > b.version.minor ? -1 : 1
        }
      }
    } else {
      return a.version.major > b.version.major ? -1 : 1
    }
  })

  return retArr
}

function validateJVMProperties(stderr) {
  const res = stderr
  const props = res.split('\n')

  const goal = 2
  let checksum = 0

  const meta = {}

  for (let prop of props) {
    if (prop.includes('sun.arch.data.model')) {
      let arch = prop.split('=')[1].trim()
      arch = Number(arch)
      if (arch === 64) {
        meta.arch = arch
        ++checksum
        if (checksum === goal) {
          break
        }
      }
    } else if (prop.includes('java.runtime.version')) {
      let verString = prop.split('=')[1].trim()
      const verOb = parseJavaRuntimeVersion(verString)

      if (verOb.major < 9) {
        // Java 8
        if (verOb.major === 8 && verOb.update > 52) {
          meta.version = verOb
          ++checksum
          if (checksum === goal) {
            break
          }
        }
      } else {
        // Java 9+
        // TODO: Убрать или оттестировать с версией 1.13 и Java 9
        // if (Util.mcVersionAtLeast('1.13', this.mcVersion)) {
        //   console.log('Java 9+ not yet tested.')
        // }
      }
    } else if (prop.lastIndexOf('java.vendor ') > -1) {
      let vendorName = prop.split('=')[1].trim()
      meta.vendor = vendorName
    }
  }

  meta.valid = checksum === goal
  return meta
}

function parseJavaRuntimeVersion(verString) {
  const major = verString.split('.')[0]
  if (Number(major) === 1) {
    return parseJavaRuntimeVersion8(verString)
  } else {
    return parseJavaRuntimeVersion9(verString)
  }
}

function parseJavaRuntimeVersion8(verString) {
  // 1.{major}.0_{update}-b{build}
  // ex. 1.8.0_152-b16
  const ret = {}
  let pts = verString.split('-')
  ret.build = Number(pts[1].substring(1))
  pts = pts[0].split('_')
  ret.update = Number(pts[1])
  ret.major = Number(pts[0].split('.')[1])
  return ret
}

function parseJavaRuntimeVersion9(verString) {
  // {major}.{minor}.{revision}+{build}
  // ex. 10.0.2+13
  const ret = {}
  let pts = verString.split('+')
  ret.build = Number(pts[1])
  pts = pts[0].split('.')
  ret.major = Number(pts[0])
  ret.minor = Number(pts[1])
  ret.revision = Number(pts[2])
  return ret
}

async function latestCorretto(major) {
  let sanitizedOS, ext

  switch (process.platform) {
    case 'win32':
      sanitizedOS = 'windows'
      ext = 'zip'
      break
    case 'darwin':
      sanitizedOS = 'macos'
      ext = 'tar.gz'
      break
    case 'linux':
      sanitizedOS = 'linux'
      ext = 'tar.gz'
      break
    default:
      sanitizedOS = process.platform
      ext = 'tar.gz'
      break
  }

  const url = `https://corretto.aws/downloads/latest/amazon-corretto-${major}-x64-${sanitizedOS}-jdk.${ext}`
  try {
    const res = await axios.head(url)
    if (res.status === 200) {
      return {
        uri: url,
        size: +res.headers['content-length'],
        name: url.substr(url.lastIndexOf('/') + 1)
      }
    } else {
      return null
    }
  } catch (error) {
    console.log(error)
    return null
  }

  // return new Promise((resolve, reject) => {
  //   request.head({ url, json: true }, (err, resp) => {
  //     if (!err && resp.statusCode === 200) {
  //       resolve({
  //         uri: url,
  //         size: parseInt(resp.headers['content-length']),
  //         name: url.substr(url.lastIndexOf('/') + 1)
  //       })
  //     } else {
  //       resolve(null)
  //     }
  //   })
  // })
}

async function latestAdoptOpenJDK(major) {
  const sanitizedOS =
    process.platform === 'win32'
      ? 'windows'
      : process.platform === 'darwin'
      ? 'mac'
      : process.platform

  const url = `https://api.adoptopenjdk.net/v2/latestAssets/nightly/openjdk${major}?os=${sanitizedOS}&arch=x64&heap_size=normal&openjdk_impl=hotspot&type=jre`
  try {
    const { data } = await axios.get(url)
    return {
      uri: data[0].binary_link,
      size: data[0].binary_size,
      name: data[0].binary_name
    }
  } catch (error) {
    console.log(error)
    return null
  }
}

module.exports = JavaGuard
