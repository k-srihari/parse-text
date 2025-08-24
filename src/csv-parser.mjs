import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import csvParser from 'csv-parser'

const currFilePath = fileURLToPath(import.meta.url)
const currDir = path.dirname(currFilePath)

const inputFilePath = path.resolve(currDir, '..', 'input/csv/Assessment_title_questions.csv')
const inputFileExt = path.extname(inputFilePath)
const outputFilePath = path.resolve(currDir, '..', 'output/csv', `${path.basename(inputFilePath, inputFileExt)}.txt`)

async function parseTextFromCSV(csvPath) {
  let parsedText
  const parser = csvParser() // no customization needed as of now
  const readStream = fs.createReadStream(csvPath).pipe(parser)
  const csvRows = []
  readStream.on('data', (data) => {
    csvRows.push(JSON.stringify(data))
  })
  await new Promise((resolve, reject) => {
    readStream.on('end', resolve)
    readStream.on('error', reject)
  })
  parsedText = csvRows.join('\n') // join each row in the csv with a '\n' separator
  return parsedText
}

parseTextFromCSV(inputFilePath)
.then((text) => {
  fs.writeFile(outputFilePath, text, { encoding: 'utf-8' }, (err) => {
  if (err) console.error(`error with writeFile - ${err.message}`)
})
})
.catch((error) => console.error(`error in parseTextFromCSV - ${error.message}`))
