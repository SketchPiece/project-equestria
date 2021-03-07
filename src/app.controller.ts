import { Controller, Get } from '@nestjs/common'
import { AppService } from './app.service'
// import { resolve } from 'path'
// import * as path from 'path'
// import { promises } from 'fs'

// const { readdir } = promises
// const MINECRAFT_FOLDER = path.join(process.cwd(), 'minecraft')
// async function getFiles(dir) {
//   const dirents = await readdir(dir, { withFileTypes: true })
//   const files = await Promise.all(
//     dirents.map((dirent) => {
//       const res = resolve(dir, dirent.name)
//       return dirent.isDirectory() ? getFiles(res) : res
//     }),
//   )
//   return Array.prototype.concat(...files)
// }

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  async getHello(): Promise<string> {
    // await getFiles(MINECRAFT_FOLDER)
    return this.appService.getHello()
  }
}
