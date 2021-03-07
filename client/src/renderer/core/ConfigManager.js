import fs from 'fs-extra'
import os from 'os'
import path from 'path'
import { remote } from 'electron'
import appConfig from '../config.json'
import { validateKeySet } from './utils'
import axios from 'axios'

const SYS_ROOT =
  process.env.APPDATA ||
  (process.platform === 'darwin'
    ? process.env.HOME + '/Library/Application Support'
    : process.env.HOME) ||
  ''
const DATA_PATH = path.join(SYS_ROOT, appConfig.root_name)
const LAUNCHER_DIR =
  process.env.CONFIG_DIRECT_PATH || remote.app.getPath('userData')

let config
const CONFIG_PATH = path.join(LAUNCHER_DIR, 'config.json')
const CONFIG_PATH_LEGECY = path.join(DATA_PATH, 'config.json')

// const FIRST_LAUNCH = !fs.existsSync(CONFIG_PATH) && !fs.existsSync(CONFIG_PATH_LEGECY)

export default class ConfigManager {
  static api = axios.create({
    baseURL: appConfig.api
  })
  static getLauncherDirectory() {
    console.log(LAUNCHER_DIR)
    return LAUNCHER_DIR
  }
  static getDataDirectory(def = false) {
    return !def
      ? config.settings.launcher.dataDirectory
      : DEFAULT_CONFIG.settings.launcher.dataDirectory
  }
  static getJavaExecutable() {
    return config.settings.java.executable
  }

  static setJavaExecutable(executable) {
    config.settings.java.executable = executable
  }

  static getAuthToken() {
    return config.user.authToken
  }

  static setAuthToken(token) {
    config.user.authToken = token
  }

  static getCommonDirectory() {
    return path.join(this.getDataDirectory(), 'common')
  }

  static getTempNativeFolder() {
    return 'MCLauncherNatives'
  }

  static getAutoConnect(def = false) {
    return !def
      ? config.settings.game.autoConnect
      : DEFAULT_CONFIG.settings.game.autoConnect
  }

  static setAutoConnect(state) {
    config.settings.game.autoConnect = state
  }

  static getServer() {
    return appConfig.server
  }

  static getFullscreen(def = false) {
    return !def
      ? config.settings.game.fullscreen
      : DEFAULT_CONFIG.settings.game.fullscreen
  }

  static setFullscreen(state) {
    config.settings.game.fullscreen = state
  }

  static getGameWidth(def = false) {
    return !def
      ? config.settings.game.resWidth
      : DEFAULT_CONFIG.settings.game.resWidth
  }

  static getGameHeight(def = false) {
    return !def
      ? config.settings.game.resHeight
      : DEFAULT_CONFIG.settings.game.resHeight
  }

  static getJVMOptions(def = false) {
    return !def
      ? config.settings.java.jvmOptions
      : DEFAULT_CONFIG.settings.java.jvmOptions
  }

  static getMaxRAM(def = false) {
    return !def ? config.settings.java.maxRAM : _resolveMaxRAM()
  }

  static setMaxRAM(ram) {
    config.settings.java.maxRAM = ram
  }

  static getAbsoluteMaxRAM() {
    const mem = os.totalmem()
    const gT16 = mem - 16000000000
    return Math.floor(
      (mem -
        1000000000 -
        (gT16 > 0 ? Number.parseInt(gT16 / 8) + 16000000000 / 4 : mem / 4)) /
        1000000000
    )
  }

  static save() {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 4), 'UTF-8')
  }

  static load() {
    let doLoad = true

    if (!fs.existsSync(CONFIG_PATH)) {
      fs.ensureDirSync(path.join(CONFIG_PATH, '..'))
      if (fs.existsSync(CONFIG_PATH_LEGECY)) {
        fs.moveSync(CONFIG_PATH_LEGECY, CONFIG_PATH)
      } else {
        doLoad = false
        config = DEFAULT_CONFIG
        this.save()
      }
    }
    if (doLoad) {
      let doValidate = false
      try {
        config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'UTF-8'))
        doValidate = true
      } catch (err) {
        console.error(err)
        console.log('Configuration file contains malformed JSON or is corrupt.')
        console.log('Generating a new configuration file.')
        fs.ensureDirSync(path.join(CONFIG_PATH, '..'))
        config = DEFAULT_CONFIG
        this.save()
      }
      if (doValidate) {
        config = validateKeySet(DEFAULT_CONFIG, config)
        this.save()
      }
    }
  }
}

function _resolveMaxRAM() {
  const mem = os.totalmem()
  return mem >= 8000000000 ? '4000M' : mem >= 6000000000 ? '3000M' : '2000M'
}

// function _resolveMinRAM() {
//   return _resolveMaxRAM()
// }

const DEFAULT_CONFIG = {
  settings: {
    java: {
      maxRAM: _resolveMaxRAM(),
      executable: null,
      jvmOptions: [
        '-XX:+UseConcMarkSweepGC',
        '-XX:+CMSIncrementalMode',
        '-XX:-UseAdaptiveSizePolicy',
        '-Xmn128M'
      ]
    },
    game: {
      resWidth: 1280,
      resHeight: 720,
      fullscreen: false,
      autoConnect: true
    },
    launcher: {
      allowPrerelease: false,
      dataDirectory: DATA_PATH
    }
  },
  user: {
    authToken: null
  }
}
