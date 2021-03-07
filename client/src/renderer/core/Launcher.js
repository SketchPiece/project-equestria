/* eslint-disable space-before-function-paren */
import Logger from './Logger'
import ConfigManager from './ConfigManager'
import ProcessBuilder from './ProcessBuilder'
import { AssetServiceProcess } from './AssetServiceProcess'
import { validateCommonFolder, loadVersionData, isDev } from './utils'

// const isDev = process.env.NODE_ENV === 'development'

const logger = new Logger('%c[Launcher]', 'color: #0d21ff; font-weight: bold')
// TODO: Сделать что то с версионностью
const VER = '1.12.2'

// const ASSET_SERVICE_PATH = isDev
//   ? path.join(process.cwd(), 'static', 'AssetService')
//   : path.join(__dirname, 'static', 'AssetService')
const isWinDev = process.platform === 'win32' && isDev

export default class Launcher {
  constructor(UIProvider) {
    this.ui = UIProvider
    this.process = null
  }

  async launch({ onFinish, onClose }) {
    if (this.process) return
    this.ui.setStatus('Пожалуйста подождите..')
    this.ui.setDownloadPercent(0)
    this.onClose = onClose
    try {
      logger.log('Checking Java...')
      await _checkJava.call(this)
      logger.log('Checking Assets...')
      if (!isWinDev) await _checkAssets.call(this)
      logger.log('Starting game...')
      await _startGame.call(
        this,
        loadVersionData(VER, ConfigManager.getCommonDirectory())
      )
      this.ui.setStatus()
      logger.log('Finish!')
      if (onFinish) onFinish()
    } catch (err) {
      logger.error(err)
    }
    // const javaExe = ConfigManager.getJavaExecutable()
    // if (!javaExe) return _asyncSystemJavaScan.call(this)
    // const meta = await _validateJavaBinary(javaExe)
    // logger.log('Java version meta', meta)
    // if (!meta.valid) return _asyncSystemJavaScan.call(this)
    // _asyncDownload.call(this)
  }

  close() {
    if (this.process) this.process.kill()
  }
}

function _checkJava() {
  if (!this) throw new Error('Context is undefined!')
  return new Promise(async (resolve, reject) => {
    const javaExe = ConfigManager.getJavaExecutable()
    if (javaExe) {
      const meta = await _validateJavaBinary(javaExe)
      logger.log('Java version meta', meta)
      if (meta.valid) return resolve()
    }
    const AssetService = new AssetServiceProcess('JavaGuard', [])

    AssetService.on('scanJava', (result, err) => {
      console.log(result, err)
      if (err) return reject(err)
      logger.log('Java validate result:', result)
      if (result) {
        ConfigManager.setJavaExecutable(result)
        ConfigManager.save()
        AssetService.disconnect()
        resolve()
      } else {
        this.ui.suggestJava((responce) => {
          if (!responce) return this.ui.setStatus()
          this.ui.setStatus('Установка Java..')
          AssetService.changeContext(
            'AssetGuard',
            ConfigManager.getCommonDirectory(),
            ConfigManager.getJavaExecutable()
          )
          AssetService.exec('downloadOpenJDK', ConfigManager.getDataDirectory())
        })
      }
    })
    AssetService.on('downloadOpenJDK', (_, err) => {
      if (err) {
        this.ui.setStatus('Непредвиденная ошибка')
        AssetService.disconnect()
      } else {
        this.ui.setStatus('Установка Java..')
      }
    })

    AssetService.on('progress', (result) =>
      this.ui.setDownloadPercent(Math.round(result.percent))
    )
    AssetService.on('complete', (result) => {
      const { data, args } = result
      if (data === 'download') {
        this.ui.setDownloadPercent(0)
        this.ui.setStatus('Распаковка..')
      }
      if (data === 'java') {
        this.ui.setStatus('Java установлен!')
        ConfigManager.setJavaExecutable(args[0])
        ConfigManager.save()
        AssetService.disconnect()
        resolve()
      }
    })

    this.ui.setStatus('Поиск Java на системе..')
    AssetService.exec('scanJava', ConfigManager.getDataDirectory())
  })
}

function _checkAssets() {
  if (!this) throw new Error('Context is undefined!')
  return new Promise(async (resolve, reject) => {
    this.ui.setStatus('Проверка целостности игры..')
    const { data } = await ConfigManager.api.get('/assets/info')
    console.log('data', data)
    const result = await validateCommonFolder(
      data,
      ConfigManager.getCommonDirectory()
    )
    console.log('result')
    if (result.valid) return resolve()
    const AssetService = new AssetServiceProcess('AssetGuard', [])

    AssetService.on('downloadAssets', (_, err) => {
      if (err) {
        this.ui.setStatus('Непредвиденная ошибка')
        reject(err)
        logger.error(err)
        AssetService.disconnect()
      } else {
        this.ui.setStatus('Файлы игры установлены!')
        AssetService.disconnect()
        resolve()
      }
    })

    AssetService.on('progress', (result) =>
      this.ui.setDownloadPercent(Math.round(result.percent))
    )

    AssetService.on('complete', (result) => {
      const { data } = result
      if (data === 'download') {
        this.ui.setStatus('Разпаковка..')
      }
      if (data === 'extract') {
        this.ui.setStatus('Загрузка файлов игры..')
      }
    })

    this.ui.setStatus('Загрузка файлов игры..')
    AssetService.exec(
      'downloadAssets',
      ConfigManager.getDataDirectory(),
      data,
      result
    )
  })
}

function _validateJavaBinary(javaExe) {
  return new Promise((resolve) => {
    const AssetService = new AssetServiceProcess('JavaGuard', [])
    AssetService.on('validateJavaBinary', (result) => {
      AssetService.disconnect()
      resolve(result)
    })
    AssetService.exec('validateJavaBinary', javaExe)
  })
}

// function _asyncSystemJavaScan() {
//   if (!this) throw new Error('Context is undefined!')

//   const AssetService = new AssetServiceProcess('JavaGuard', [])
//   AssetService.on('validateJava', (result) => {
//     if (!result) {
//       _debug(result)
//       this.ui.suggestJava((responce) => {
//         if (!responce) return this.ui.setStatus('')
//         this.ui.setStatus('Preparing Java Download..')
//         AssetService.changeContext(
//           'AssetGuard',
//           ConfigManager.getCommonDirectory(),
//           ConfigManager.getJavaExecutable()
//         )
//         AssetService.exec('enqueueOpenJDK', ConfigManager.getDataDirectory())
//       })
//     } else {
//       _debug(result)

//       ConfigManager.setJavaExecutable(result)
//       ConfigManager.save()
//       _asyncDownload.call(this)
//       AssetService.disconnect()
//     }
//   })
//   AssetService.on('enqueueOpenJDK', (result) => {
//     if (result) {
//       this.ui.setStatus('Downloading Java..')
//       AssetService.exec('processDlQueues', [{ id: 'java', limit: 1 }])
//     } else {
//       this.ui.setStatus('Unexpected Issue')
//       AssetService.disconnect()
//     }
//   })
//   AssetService.on('progress', (result) =>
//     this.ui.setDownloadPercent(Math.round(result.percent))
//   )
//   AssetService.on('complete', (result) => {
//     const { data, args } = result
//     if (data === 'download') {
//       this.ui.setStatus('Extracting..')
//     }
//     if (data === 'java') {
//       this.ui.setStatus('Java installed!')
//       ConfigManager.setJavaExecutable(args[0])
//       ConfigManager.save()
//       AssetService.disconnect()
//     }
//   })
//   this.ui.setStatus('Checking system info..')
//   AssetService.exec('validateJava', ConfigManager.getDataDirectory())
// }

// function _asyncDownload() {
//   if (!this) throw new Error('Context is undefined!')

//   this.ui.setStatus('Download assets..')
//   _startGame.call(this)
//   const AssetService = new AssetServiceProcess(
//     'AssetGuard',
//     ConfigManager.getCommonDirectory(),
//     ConfigManager.getJavaExecutable()
//   )
//   AssetService.on('validateEverything', (result) => {
//     _startGame.call(this, result)
//   })

//   AssetService.exec('validateEverything')
// }

function _startGame(versionData) {
  if (!this) throw new Error('Context is undefined!')
  return new Promise((resolve) => {
    this.ui.setStatus('Запуск игры..')
    this.ui.setDownloadPercent(100)
    _debug(versionData)
    const auth = {
      displayName: 'Sketch',
      uuid: 'UUID_OG_USER',
      accessToken: 'ACCESS_TOKEN'
    }
    const pb = new ProcessBuilder(versionData, auth, () => {
      this.process = null
      if (this.onClose) this.onClose()
    })
    pb.onOpen = () => resolve()
    this.process = pb.build()
  })
}

function _debug(...args) {
  logger.debug(...args)
}
