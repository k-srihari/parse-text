import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const currFilePath = fileURLToPath(import.meta.url)
const currDir = path.dirname(currFilePath)

const inputFilePath = path.resolve(currDir, '..', 'input/csv/Assessment_title_questions.csv')
const inputFileExt = path.extname(inputFilePath)
const outputFilePath = path.resolve(currDir, '..', 'output/csv', `${path.basename(inputFilePath, inputFileExt)}.txt`)

async function parseTextFromCSV(csvPath) {
  let parsedText
  const readStream = fs.createReadStream(csvPath)
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

parseTextFromCSV(inputFilePath)
.then((text) => {
  fs.writeFile(outputFilePath, text, { encoding: 'utf-8' }, (err) => {
  if (err) console.error(`error with writeFile - ${err.message}`)
})
})
.catch((error) => console.error(`error in parseTextFromCSV - ${error.message}`))
