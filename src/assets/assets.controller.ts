import { Controller, Get, Res, Query } from '@nestjs/common'
import { Response } from 'express'
import { AssetsService } from './assets.service'

@Controller('assets')
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Get()
  async download(
    @Res() res: Response,
    @Query('name') name,
    @Query('path') path,
  ) {
    let asset = { type: '', value: '' }
    if (name) asset = { type: 'name', value: name }
    if (path) asset = { type: 'path', value: path }
    const assetsPath = await this.assetsService.getAssets(asset)
    res.download(assetsPath)
  }

  @Get('info')
  info() {
    return this.assetsService.getAssetValidationInfo()
  }
}
