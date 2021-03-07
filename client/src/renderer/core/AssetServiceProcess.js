import EventEmmiter from 'events'
import { fork } from 'child_process'
import path from 'path'
import Logger from './Logger'

const logger = new Logger(
  '%c[AssetService]',
  'color: #353232; font-weight: bold'
)

const isDev = process.env.NODE_ENV === 'development'

const ASSET_SERVICE_PATH = isDev
  ? path.join(process.cwd(), 'static', 'AssetService')
  : path.join(__dirname, 'static', 'AssetService')

export class AssetServiceProcess extends EventEmmiter {
  constructor(selectedClass, ...args) {
    super()
    this.process = fork(ASSET_SERVICE_PATH, [selectedClass, ...args], {
      stdio: 'pipe'
    })
    this.process.stdout.setEncoding('utf8')
    this.process.stdout.on('data', (data) => logger.log(data))
    this.process.stderr.setEncoding('utf8')
    this.process.stderr.on('data', (data) => logger.error(data))

    this.process.on('message', ({ context, result, err }) => {
      this.emit(context, result, err)
    })
  }

  exec(func, ...args) {
    this.process.send({
      task: 'execute',
      func,
      argsArr: [...args]
    })
  }

  changeContext(selectClass, ...args) {
    this.process.send({
      task: 'change_context',
      selectClass,
      args: [...args]
    })
  }

  disconnect() {
    this.process.disconnect()
  }
}
