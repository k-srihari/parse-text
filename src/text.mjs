import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { promisify } from 'util'

const currFilePath = fileURLToPath(import.meta.url)
const currDir = path.dirname(currFilePath)

const inputFilePath = path.resolve(currDir, '..', 'input/txt/test.txt')
const inputFileExt = path.extname(inputFilePath)
const outputFilePath = path.resolve(currDir, '..', 'output/txt', `${path.basename(inputFilePath, inputFileExt)}.txt`)

async function copyFromInputToOutput(inputPath, outputPath) {
  const input = await promisify(fs.readFile)(inputPath, { encoding: 'utf-8' })
  await promisify(fs.writeFile)(outputPath, input, { encoding: 'utf-8' })
}

function streamFromInputToOutput(inputPath, outputPath, callback) {
  const readStream = fs.createReadStream(inputPath, { encoding: 'utf-8' })
  const writeStream = fs.createWriteStream(outputPath, { encoding: 'utf-8' })
  
  writeStream.on('error', (err) => {
    console.error('write stream errored!', err.message)
    readStream.destroy()
    callback(err)
  })

  readStream.on('error', (err) => {
    console.error('read stream errored!', err.message)
    writeStream.end()
    callback(err)
  })

  /*
  readStream
    .on('open', () => console.log('stream opened'))
    .on('ready', () => console.log('stream ready!'))
    .on('readable', () => console.log('stream is readable'))
    .on('data', (data) => {
      console.log('data received')
      writeStream.write(data)
    })
    .on('end', () => {
      console.log('read stream ended')
      writeStream.end()
    })
    .on('close', () => {
      console.log('read stream closed')
      writeStream.on('finish', () => {
        console.log('write stream finished')
        callback(null, 'success')
      })
    })
  */

  readStream
    .pipe(writeStream)
    .on('finish', () => {
      console.log('write stream finished')
      callback(null, 'success')
    })
}

// copyFromInputToOutput(inputFilePath, outputFilePath)
// .then(() => console.info(`successfully copied contents from ${inputFilePath} to ${outputFilePath}`))
// .catch((err) => console.error(`error copying contents: ${err.message}`))

promisify(streamFromInputToOutput)(inputFilePath, outputFilePath)
.then(() => console.info(`successfully streamed contents from ${inputFilePath} to ${outputFilePath}`))
.catch((err) => console.error(`error streaming contents: ${err.message}`))
