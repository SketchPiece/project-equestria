import * as fs from 'fs'
import * as archiver from 'archiver'
import { Logger } from '@nestjs/common'
import * as path from 'path'
import * as config from '../assets.config.json'
import * as hasha from 'hasha'
import { hashElement } from 'folder-hash'
const { readdir } = fs.promises

export const ROOT_FOLDER_NAME = 'minecraft'
export const DOWNLOADS_FOLDER_NAME = 'downloads'

export const ROOT_FOLDER = path.join(process.cwd(), ROOT_FOLDER_NAME)

export const DOWNLOADS_FOLDER = path.join(process.cwd(), DOWNLOADS_FOLDER_NAME)

class LoggerBuilder {
  constructor(private context: string) {}

  log(message: string) {
    Logger.log(message, this.context, true)
  }
}

export async function cashAssets() {
  const logger = new LoggerBuilder('AssetCasher')
  logger.log('Starting cashing assets...')
  const minecraftZipFolder = path.join(DOWNLOADS_FOLDER, 'minecraft.zip')
  await zipFolder(ROOT_FOLDER, minecraftZipFolder)
  logger.log('Minecraft folder zipped')
  const folders = config.includeForse
  for (const folder of folders) {
    await zipFolder(
      path.join(ROOT_FOLDER, folder),
      path.join(DOWNLOADS_FOLDER, `${folder}.zip`),
    )
    logger.log(`${folder} folder zipped`)
  }
}

export function zipFolder(path: string, output: string): Promise<number> {
  const archive = archiver('zip', { zlib: { level: 9 } })
  const stream = fs.createWriteStream(output)

  return new Promise((resolve, reject) => {
    stream.on('close', () => {
      resolve(archive.pointer())
    })

    archive.on('error', (err) => reject(err))
    archive.pipe(stream)
    archive.directory(path, false)
    archive.finalize()
  })
}

export async function hashFolders(pth, folders) {
  if (!fs.existsSync(path.resolve(DOWNLOADS_FOLDER, 'minecraft.zip')))
    await cashAssets()
  const hashedFolders = []
  for (const folder of folders) {
    const { hash } = await hashElement(path.resolve(pth, folder))
    const zipped = path.resolve(DOWNLOADS_FOLDER, `${folder}.zip`)
    if (!fs.existsSync(zipped)) await cashAssets()
    const size = fs.statSync(zipped).size
    hashedFolders.push({ name: folder, hash, size })
  }
  return hashedFolders
}

export async function hashFiles(localPath, options) {
  const files = await scanFiles(localPath, options)
  return files
    .filter((f) => {
      let notIgnore = true
      config.ignoreFiles.forEach((ignore) => {
        if (f.includes(ignore)) notIgnore = false
      })
      return notIgnore
    })
    .map((f) => ({
      path: f,
      hash: hasha.fromFileSync(path.resolve(localPath, f)),
      size: fs.statSync(path.resolve(localPath, f)).size,
    }))
}

async function getFiles(dir) {
  const dirents = await readdir(dir, { withFileTypes: true })
  const files = await Promise.all(
    dirents.map((dirent) => {
      const res = path.resolve(dir, dirent.name)
      return dirent.isDirectory() ? getFiles(res) : res
    }),
  )
  return Array.prototype.concat(...files)
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
