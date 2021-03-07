let Target = require('./Services')[process.argv[2]]
if (!Target) {
  process.send({
    context: 'error',
    data: null,
    error: 'Invalid class name'
  })
  console.log('Invalid class name passed to argv[2], cannot continue.')
  process.exit(1)
}
let instance = new Target(...process.argv.splice(3))
console.log('AssetService Started')

process.on('unhandledRejection', (r) => console.log(r))

let percent = 0
function assignListeners() {
  instance.on('validate', (data) => {
    console.log('validate', { data })
    process.send({ context: 'validate', data })
  })
  instance.on('progress', (data, acc, total) => {
    const currPercent = (acc / total) * 100
    // console.log(currPercent)
    if (currPercent !== percent) {
      percent = currPercent
      // console.log('progress', { data, value: acc, total, percent })
      // console.log(percent)
      process.send({
        context: 'progress',
        result: {
          data,
          value: acc,
          total,
          percent
        }
      })
    }
  })
  instance.on('complete', (data, ...args) => {
    process.send({
      context: 'complete',
      result: { data, args }
    })
  })
  instance.on('error', (data, error) => {
    // TODO: Handle error
    console.log('error', { data, error })
  })
}

assignListeners()

process.on('message', ({ task, func, selectClass, args, argsArr }) => {
  switch (task) {
    case 'execute': {
      const staticFunc = Target[func]
      const instanceFunc = instance[func]
      if (
        typeof staticFunc !== 'function' &&
        typeof instanceFunc !== 'function'
      ) {
        return process.send({
          context: 'error',
          data: null,
          error: `Function ${func} not found on ${process.argv[2]}`
        })
      }
      const f = typeof instanceFunc === 'function' ? instanceFunc : staticFunc
      const res = f.apply(f === instanceFunc ? instance : null, argsArr)
      if (res instanceof Promise) {
        res
          .then((r) => {
            process.send({ result: r, context: func })
          })
          .catch((err) => {
            process.send({ err, result: null, context: func })
          })
      } else {
        process.send({ result: res, context: func })
      }
      break
    }
    case 'change_context': {
      Target = require('./Services')[selectClass]
      if (!Target) {
        return process.send({
          context: 'error',
          data: null,
          error: `Invalid class ${selectClass}`
        })
      }
      instance = new Target(...args)
      assignListeners()
    }
  }
})

process.on('disconnect', () => {
  console.log('AssetService Disconnected')
  process.exit(0)
})
