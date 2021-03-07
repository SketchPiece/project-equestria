import { hashElement } from 'folder-hash'
import fs from 'fs-extra'
// import Hasher from '../libs/hasher'
import path from 'path'
import rimraf from 'rimraf'
import hasha from 'hasha'
const { readdir } = fs.promises

export const isDev = process.env.NODE_ENV === 'development'

export function validateKeySet(srcObj, destObj) {
  if (srcObj == null) {
    srcObj = {}
  }
  const validationBlacklist = ['authenticationDatabase']
  const keys = Object.keys(srcObj)
  for (let i = 0; i < keys.length; i++) {
    if (typeof destObj[keys[i]] === 'undefined') {
      destObj[keys[i]] = srcObj[keys[i]]
    } else if (
      typeof srcObj[keys[i]] === 'object' &&
      srcObj[keys[i]] != null &&
      !(srcObj[keys[i]] instanceof Array) &&
      validationBlacklist.indexOf(keys[i]) === -1
    ) {
      destObj[keys[i]] = validateKeySet(srcObj[keys[i]], destObj[keys[i]])
    }
  }
  return destObj
}

export function mojangFriendlyOS() {
  const opSys = process.platform
  if (opSys === 'darwin') {
    return 'osx'
  } else if (opSys === 'win32') {
    return 'windows'
  } else if (opSys === 'linux') {
    return 'linux'
  } else {
    return 'unknown_os'
  }
}

/**
 * Checks whether or not a library is valid for download on a particular OS, following
 * the rule format specified in the mojang version data index. If the allow property has
 * an OS specified, then the library can ONLY be downloaded on that OS. If the disallow
 * property has instead specified an OS, the library can be downloaded on any OS EXCLUDING
 * the one specified.
 *
 * If the rules are undefined, the natives property will be checked for a matching entry
 * for the current OS.
 *
 * @param {Array.<Object>} rules The Library's download rules.
 * @param {Object} natives The Library's natives object.
 * @returns {boolean} True if the Library follows the specified rules, otherwise false.
 */
export function validateRules(rules, natives) {
  if (rules == null) {
    if (natives == null) {
      return true
    } else {
      return natives[mojangFriendlyOS()] != null
    }
  }

  for (let rule of rules) {
    const action = rule.action
    const osProp = rule.os
    if (action != null && osProp != null) {
      const osName = osProp.name
      const osMoj = mojangFriendlyOS()
      if (action === 'allow') {
        return osName === osMoj
      } else if (action === 'disallow') {
        return osName !== osMoj
      }
    }
  }
  return true
}

export async function validateCommonFolder(info, pth) {
  const validateResult = {
    valid: false,
    common: false,
    force: []
  }
  if (!fs.existsSync(pth)) return validateResult
  validateResult.common = true
  validateResult.force = await validateForceFolders(pth, info.forceFolders)
  validateResult.files = await validateFiles(
    pth,
    info.hashedFiles,
    info.validateOptions
  )
  if (!validateResult.force.length && !validateResult.files.length) {
    validateResult.valid = true
  }

  return validateResult
}

async function validateForceFolders(pth, forceFolders) {
  const conflicts = []
  for (const forceFolder of forceFolders) {
    const forceFolderPath = path.resolve(pth, forceFolder.name)
    if (!fs.existsSync(forceFolderPath)) {
      conflicts.push(forceFolder)
      continue
    }
    const hashedFolder = await hashElement(forceFolderPath)

    const currentHash = hashedFolder.hash
    if (currentHash !== forceFolder.hash) {
      conflicts.push(forceFolder)
      rimraf.sync(forceFolderPath)
    }
  }
  return conflicts
}

async function validateFiles(pth, files, options) {
  let localFiles = await scanFiles(pth, options)

  const conflicts = []
  files.forEach((f) => {
    if (!fs.existsSync(path.resolve(pth, f.path))) {
      return conflicts.push({ path: f.path, size: f.size })
    }
    const currentHash = hasha.fromFileSync(path.resolve(pth, f.path))
    localFiles = localFiles.filter((file) => file !== f.path)

    if (currentHash !== f.hash) conflicts.push({ path: f.path, size: f.size })
  })
  localFiles.forEach((f) => fs.unlinkSync(path.resolve(pth, f)))
  return conflicts
}

async function scanFiles(localPath, options) {
  const files = await getFiles(localPath)
  return files
    .map((f) => f.replace(`${localPath}/`, ''))
    .filter((f) => {
      let isInclude = false
      options.include.forEach((include) => {
        if (f.startsWith(include)) isInclude = true
      })
      options.exclude.forEach((exclude) => {
        if (f.startsWith(exclude)) isInclude = false
      })
      return isInclude
    })
}

async function getFiles(dir) {
  const dirents = await readdir(dir, { withFileTypes: true })
  const files = await Promise.all(
    dirents.map((dirent) => {
      const res = path.resolve(dir, dirent.name)
      return dirent.isDirectory() ? getFiles(res) : res
    })
  )
  return Array.prototype.concat(...files)
}

export function loadVersionData(version, commonPath) {
  const versionPath = path.join(commonPath, 'versions', version)
  const versionFile = path.join(versionPath, `${version}.json`)
  const verData = JSON.parse(fs.readFileSync(versionFile))

  return { ...verData }
}
