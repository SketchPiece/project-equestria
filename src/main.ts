import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { cashAssets } from './assets/utils'

const CASH_ASSETS = process.env.NODE_ENV === 'build'

async function bootstrap() {
  if (CASH_ASSETS) return await cashAssets()
  const app = await NestFactory.create(AppModule)
  app.enableCors({
    origin: '*',
  })
  await app.listen(3000)
}
bootstrap()
