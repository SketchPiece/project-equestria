/* eslint-disable no-template-curly-in-string */
import path from 'path'
import fs from 'fs-extra'
import os from 'os'
import crypto from 'crypto'
import ConfigManager from './ConfigManager'
import { validateRules, mojangFriendlyOS } from './utils'
import Logger from './Logger'
import AdmZip from 'adm-zip'
import { spawn } from 'child_process'

const logger = new Logger(
  '%c[ProcessBuilder]',
  'color: #003996; font-weight: bold'
)

export default class ProcessBuilder {
  constructor(versionData, authUser, cb) {
    this.commonDir = ConfigManager.getCommonDirectory()
    this.versionData = versionData
    this.authUser = authUser
    this.libPath = path.join(this.commonDir, 'libraries')
    this.cb = cb
  }

  build() {
    const tempNativePath = path.join(
      os.tmpdir(),
      ConfigManager.getTempNativeFolder(),
      crypto.pseudoRandomBytes(16).toString('hex')
    )
    const args = this.constructJVMArguments(tempNativePath)
    logger.log('JVM Args', args)

    const minecraft = spawn(ConfigManager.getJavaExecutable(), args, {
      cwd: this.commonDir
    })

    minecraft.stdout.setEncoding('utf8')
    minecraft.stderr.setEncoding('utf8')

    const loggerMCstdout = new Logger(
      '%c[Minecraft]',
      'color: #36b030; font-weight: bold'
    )
    const loggerMCstderr = new Logger(
      '%c[Minecraft]',
      'color: #b03030; font-weight: bold'
    )

    minecraft.stdout.on('data', (data) => {
      if (data.includes('Setting user')) {
        if (this.onOpen) this.onOpen()
      }
      loggerMCstdout.log(data)
    })
    minecraft.stderr.on('data', (data) => {
      loggerMCstderr.log(data)
    })

    minecraft.on('close', (code, signal) => {
      logger.log('Exited with code', code)
      // fs.remove(tempNativePath, (err) => {
      //   if (err) {
      //     logger.warn('Error while deleting temp dir', err)
      //   } else {
      //     logger.log('Temp dir deleted successfully.')
      //   }
      // })
      this.cb()
    })
    return minecraft
  }

  constructJVMArguments(tempNativePath) {
    let args = []
    args.push('-cp')
    args.push(
      this.classpathArgs(tempNativePath).join(
        process.platform === 'win32' ? ';' : ':'
      )
    )
    // TODO: ICON
    if (process.platform === 'darwin') {
      args.push('-Xdock:name=PocketEquestria')
      // args.push(
      //   '-Xdock:icon=' + path.join(__dirname, '..', 'images', 'minecraft.icns')
      // )
    }
    args.push('-Xmx' + ConfigManager.getMaxRAM())
    // args.push('-Xms' + ConfigManager.getMinRAM())
    args = args.concat(ConfigManager.getJVMOptions())
    args.push(`-Djava.library.path=${tempNativePath}`)
    // args.push(
    //   '-Djava.library.path=' +
    //     'C:\\Users\\AndreyVX\\AppData\\Roaming\\.minecraft\\versions\\Forge 1.12.2\\natives'
    // )
    args.push(this.versionData.mainClass)

    args = args.concat(this._resolveExtraArgs())

    return args
  }

  classpathArgs(tempNativePath) {
    let cpArgs = []
    const version = this.versionData.id
    cpArgs.push(
      path.join(this.commonDir, 'versions', version, `${version}.jar`)
    )
    const mojangLibs = this._resolveMojangLibraries(tempNativePath)
    cpArgs = cpArgs.concat(Object.values(mojangLibs))

    this._processClassPathList(cpArgs)
    // console.log('cpArgs', cpArgs)

    return cpArgs
  }

  _resolveExtraArgs() {
    const mcArgs = this.versionData.minecraftArguments.split(' ')
    const argDiscovery = /\${*(.*)}/

    for (let i = 0; i < mcArgs.length; i++) {
      const arg = mcArgs[i]
      if (argDiscovery.test(arg)) {
        const identifier = arg.match(argDiscovery)[1]
        let val = null
        switch (identifier) {
          case 'auth_player_name':
            val = this.authUser.displayName.trim()
            break
          case 'version_name':
            val = 'SketchCraft'
            break
          case 'game_directory':
            val = this.commonDir
            break
          case 'assets_root':
            val = path.join(this.commonDir, 'assets')
            break
          case 'assets_index_name':
            val = this.versionData.assets
            break
          case 'auth_uuid':
            val = this.authUser.uuid.trim()
            break
          case 'auth_access_token':
            val = this.authUser.accessToken
            break
          case 'user_type':
            val = 'legacy'
            break
          case 'user_properties': // 1.8.9 and below.
            val = '{}'
            break
          case 'version_type':
            val = this.versionData.type
            break
        }
        if (val != null) {
          mcArgs[i] = val
        }
      }
    }

    // Prepare game resolution
    if (ConfigManager.getFullscreen()) {
      mcArgs.push('--fullscreen')
      mcArgs.push(true)
    } else {
      mcArgs.push('--width')
      mcArgs.push(ConfigManager.getGameWidth())
      mcArgs.push('--height')
      mcArgs.push(ConfigManager.getGameHeight())
    }

    // Mod List File Argument
    // mcArgs.push('--modListFile')
    // if (this._lteMinorVersion(9)) {
    //   mcArgs.push(path.basename(this.fmlDir))
    // } else {
    //   mcArgs.push('absolute:' + this.fmlDir)
    // }

    // LiteLoader
    // if (this.usingLiteLoader) {
    //   mcArgs.push('--modRepo')
    //   mcArgs.push(this.llDir)

    //   // Set first arg to liteloader tweak class
    //   mcArgs.unshift('com.mumfrey.liteloader.launch.LiteLoaderTweaker')
    //   mcArgs.unshift('--tweakClass')
    // }
    // console.log('MC_ARGS', mcArgs)

    return mcArgs
  }

  _processClassPathList(list) {
    const ext = '.jar'
    const extLen = ext.length
    for (let i = 0; i < list.length; i++) {
      const extIndex = list[i].indexOf(ext)
      if (extIndex > -1 && extIndex !== list[i].length - extLen) {
        list[i] = list[i].substring(0, extIndex + extLen)
      }
    }
  }

  _resolveMojangLibraries(tempNativePath) {
    const libs = {}
    const libArr = this.versionData.libraries
    fs.ensureDirSync(tempNativePath)
    for (let lib of libArr) {
      if (!validateRules(lib.rules, lib.natives)) continue
      if (lib.natives == null) {
        const artifact = lib.artifact
        const to = artifact.path.startsWith('libraries/')
          ? path.join(this.commonDir, artifact.path)
          : path.join(this.libPath, artifact.path)
        const versionIndependentId = lib.name.substring(
          0,
          lib.name.lastIndexOf(':')
        )
        libs[versionIndependentId] = to
      } else {
        const exclusionArr =
          lib.extract != null ? lib.extract.exclude : ['META-INF/']

        const artifact = lib.classifies[mojangFriendlyOS()]

        // Location of native zip.
        const to = path.join(this.libPath, artifact.path)
        console.log(to)
        let zip = new AdmZip(to)
        let zipEntries = zip.getEntries()

        // Unzip the native zip.
        for (let i = 0; i < zipEntries.length; i++) {
          const fileName = zipEntries[i].entryName

          let shouldExclude = false

          // Exclude noted files.
          exclusionArr.forEach(function(exclusion) {
            if (fileName.indexOf(exclusion) > -1) {
              shouldExclude = true
            }
          })

          // Extract the file.
          if (!shouldExclude) {
            fs.writeFile(
              path.join(tempNativePath, fileName),
              zipEntries[i].getData(),
              (err) => {
                if (err) {
                  logger.error('Error while extracting native library:', err)
                }
              }
            )
          }
        }
      }
    }

    return libs
  }
}
