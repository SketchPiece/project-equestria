import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { cacheAssets } from './assets/utils'

const CACHE_ASSETS = process.env.NODE_ENV === 'cache'

async function bootstrap() {
  if (CACHE_ASSETS) return await cacheAssets()
  const app = await NestFactory.create(AppModule)
  app.enableCors({
    origin: '*',
  })
  await app.listen(3000)
}
bootstrap()
