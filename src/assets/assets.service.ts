import { BadRequestException, Injectable } from '@nestjs/common'
import * as path from 'path'
import * as fs from 'fs-extra'
import {
  cashAssets,
  DOWNLOADS_FOLDER,
  hashFiles,
  hashFolders,
  ROOT_FOLDER,
  ROOT_FOLDER_NAME,
} from './utils'
import * as config from '../assets.config.json'

export interface IAssetInfo {
  root: { name: string; size: number }
  forceFolders: Array<{ name: string; hash: string; size: number }>
  hashedFiles: Array<{ path: string; hash: string; size: number }>
  validateOptions: { include: string[]; exclude: string[] }
  downloadUri: string
}

@Injectable()
export class AssetsService {
  async getAssetValidationInfo(): Promise<IAssetInfo> {
    const forceFolders = await hashFolders(ROOT_FOLDER, config.includeForse)
    const hashedFiles = await hashFiles(ROOT_FOLDER, config.validateOptions)
    return {
      root: {
        name: ROOT_FOLDER_NAME,
        size: fs.statSync(
          path.resolve(DOWNLOADS_FOLDER, `${ROOT_FOLDER_NAME}.zip`),
        ).size,
      },
      forceFolders,
      hashedFiles,
      validateOptions: config.validateOptions,
      downloadUri: config.downloadUri,
    }
  }

  async getAssets(asset: { type: string; value: string } | null) {
    if (asset.type === 'name') {
      const assetPath = path.join(DOWNLOADS_FOLDER, `${asset.value}.zip`)
      if (!config.includeForse.includes(asset.value))
        throw new BadRequestException()
      if (!fs.existsSync(assetPath)) await cashAssets()
      return assetPath
    } else if (asset.type === 'path') {
      const assetPath = path.join(ROOT_FOLDER, asset.value)
      if (!fs.existsSync(assetPath)) throw new BadRequestException()
      return assetPath
    }
    const assetsPath = path.join(DOWNLOADS_FOLDER, `${ROOT_FOLDER_NAME}.zip`)
    if (!fs.existsSync(assetsPath)) await cashAssets()
    return assetsPath
  }
}
