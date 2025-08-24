import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { promisify } from 'util'
import { downloadFileFromS3, trackMemoryAndCPU, uploadFileToS3 } from './utils/s3-utils.mjs'

const s3FileKey = 'stream-test/download/presentation.txt'
const s3FileBaseName = path.basename(s3FileKey, '.txt')

const currDir = path.dirname(fileURLToPath(import.meta.url))

const inputFilePath = path.resolve(currDir, '..', `input/txt/${s3FileBaseName}.txt`) // download the file from s3 to here
const outputFilePath = path.resolve(currDir, '..', 'output/txt', `${s3FileBaseName}.txt`) // keep the processed output here

async function copyFromInputToOutput(inputPath, outputPath) {
  const input = await promisify(fs.readFile)(inputPath)
  await promisify(fs.writeFile)(outputPath, input, { encoding: 'utf-8' })
}

function streamFromInputToOutput(inputPath, outputPath, callback) {
  const readStream = fs.createReadStream(inputPath)
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

  readStream
    .pipe(writeStream)
    .on('finish', () => {
      console.log('write stream finished')
      callback(null, 'success')
    })
}

async function copy() {
  try {
    await copyFromInputToOutput(inputFilePath, outputFilePath)
    console.info(`successfully copied contents from ${inputFilePath} to ${outputFilePath}`)
  } catch (err) {
    console.error(`error copying contents: ${err.message}`)
  }
}

async function stream() {
  try {
    trackMemoryAndCPU()
    const streamPromise = promisify(streamFromInputToOutput)
    await streamPromise(inputFilePath, outputFilePath)
    trackMemoryAndCPU()
    console.info(`successfully streamed contents from ${inputFilePath} to ${outputFilePath}`)
  } catch (error) {
    console.error(`error streaming contents: ${error.message}`)
  }
}

await downloadFileFromS3(s3FileKey, inputFilePath)

// await copy()

await stream()

const s3UploadFileKey = `stream-test/upload/${s3FileBaseName}.txt`
await uploadFileToS3(s3UploadFileKey, outputFilePath)

console.log('DONE!')



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
