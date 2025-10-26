import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const currFilePath = fileURLToPath(import.meta.url)
const currDir = path.dirname(currFilePath)

const inputFilePath = path.resolve(currDir, '..', 'input/jason/course.json')
const inputFileExt = path.extname(inputFilePath)
const outputFilePath = path.resolve(currDir, '..', 'output/jason', `${path.basename(inputFilePath, inputFileExt)}.txt`)

async function parseTextFromJSON(jsonPath) {
  let parsedText
  const readStream = fs.createReadStream(jsonPath)
  const chunks = []
  readStream.on('data', (data) => {
    chunks.push(data)
  })
  await new Promise((resolve, reject) => {
    readStream.on('end', resolve)
    readStream.on('error', reject)
  })
  parsedText = chunks.join('') // join chunks from the stream
  return parsedText
}

parseTextFromJSON(inputFilePath)
.then((text) => {
  fs.writeFile(outputFilePath, text, { encoding: 'utf-8' }, (err) => {
  if (err) console.error(`error with writeFile - ${err.message}`)
})
})
.catch((error) => console.error(`error in parseTextFromJSON - ${error.message}`))
