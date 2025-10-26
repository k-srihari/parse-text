import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

function chunkJsonText(jsonText, chunks = [], prefixKey = null, chunkSize = 1024) {
  let parsedJson
  try {
    parsedJson = JSON.parse(jsonText)
  } catch (error) {
    return [] // Invalid JSON, return empty array
  }
  if (!(parsedJson && typeof parsedJson === 'object')) {
    return [] // Ignore non-object types
  }
  const object = { ...parsedJson }
  const keys = Object.keys(object)
  let currentEntries = []
  let currentLength = 0
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]
    const value = object[key]
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      chunkJsonText(JSON.stringify(value), chunks)
    }
    const entry = [key, value]
    if ((JSON.stringify(entry).length + currentLength) < chunkSize) {
      currentEntries.push(entry)
      currentLength += JSON.stringify(entry).length
    } else {
      const chunkObject = Object.fromEntries(currentEntries)
      if (prefixKey) {
        chunks.push({ prefixKey, chunkObject })
      } else {
        chunks.push(chunkObject)
      }
      currentEntries = []
      currentEntries.push(entry)
      currentLength = currentEntries.reduce(((acc, curr) => (acc + JSON.stringify(curr).length)), 0)
    }
  }
  // push any of the final entries too
  if (currentEntries.length > 0) {
    const chunkObject = Object.fromEntries(currentEntries)
    if (prefixKey) {
        chunks.push({ prefixKey, chunkObject })
      } else {
        chunks.push(chunkObject)
      }
  }
  return chunks
}

function chunkSpreadsheetText(spreadsheetText, chunkSize = 2048) {
  const chunks = []
  const sheetTexts = spreadsheetText.split('\n\n')
  for (let i = 0; i < sheetTexts.length; i++) {
    const sheetText = sheetTexts[i]
    const sheetRows = sheetText.split('\n')
    if (sheetRows.length < 2) {
      console.log('less than 2 rows in the sheet, cannot be processed!')
    }
    const headerRow = sheetRows[0]
    let currentBatch = [headerRow]
    let currentLength = headerRow.length
    for (let j = 1; j < sheetRows.length; j++) {
      const sheetRow = sheetRows[j]
      if ((currentLength + sheetRow.length) < chunkSize) {
        currentBatch.push(sheetRow)
        currentLength += sheetRow.length
      } else {
        chunks.push(currentBatch.join('\n'))
        currentBatch = [headerRow, sheetRow]
        currentLength = currentBatch.reduce((acc, curr) => (acc + curr.length), 0)
      }
    }
    chunks.push(currentBatch.join('\n'))
  }
  return chunks
}

const currentDir = path.dirname(fileURLToPath(import.meta.url))

function writeChunksToFile(chunks) {
  const file = path.resolve(currentDir, 'chunks.txt')
  const chunksText = chunks.join('\n\n----CHUNK----\n\n')
  fs.writeFileSync(file, chunksText,  { encoding: 'utf-8' })
}

function readFromFile() {
  const fileName = process.argv[2]
  const filePath = path.resolve(currentDir, '../..', fileName)
  const fileText = fs.readFileSync(filePath, { encoding: 'utf-8' })
  return fileText
}

const jsonText = readFromFile()
const chunks = chunkJsonText(jsonText).map((chunk) => JSON.stringify(chunk, null, 2))

// const spreadsheetText = readFromFile()
// const chunks = chunkSpreadsheetText(spreadsheetText)

writeChunksToFile(chunks)
