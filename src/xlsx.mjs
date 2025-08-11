import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import xlsx from 'xlsx'

const currFilePath = fileURLToPath(import.meta.url)
const currDir = path.dirname(currFilePath)

const inputFilePath = path.resolve(currDir, '..', 'input/xlsx/AI Assistant Flare files to move.xlsx')
const inputFileExt = path.extname(inputFilePath)
const outputFilePath = path.resolve(currDir, '..', 'output/xlsx', `${path.basename(inputFilePath, inputFileExt)}.txt`)

async function parseTextFromXLSX(xlsxPath) {
  const sheetTexts = []
  const { SheetNames, Sheets } = xlsx.readFile(xlsxPath)
  for (const sheetName of SheetNames) {
    const sheet = Sheets[sheetName]
    const sheetText = xlsx.utils.sheet_to_json(sheet).map((row) => JSON.stringify(row)).join('\n')
    console.info(`SheetText: ${sheetText.substring(0, 100)}`)
    sheetTexts.push(sheetText)
  }
  return sheetTexts.join('\n\n')
}

parseTextFromXLSX(inputFilePath)
.then((text) => {
  fs.writeFile(outputFilePath, text, { encoding: 'utf-8' }, (err) => {
  if (err) console.error(`error with writeFile - ${err.message}`)
})
})
.catch((error) => console.error(`error in parseTextFromXLSX - ${error.message}`))
