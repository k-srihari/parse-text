import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import exceljs from 'exceljs'

const currFilePath = fileURLToPath(import.meta.url)
const currDir = path.dirname(currFilePath)

const inputFilePath = path.resolve(currDir, '..', 'input/xlsx/ref-data-copy.xlsx')
const inputFileExt = path.extname(inputFilePath)
const outputFilePath = path.resolve(currDir, '..', 'output/xlsx', `${path.basename(inputFilePath, inputFileExt)}.txt`)

async function parseCSVFromXLSX(xlsxPath) {
  const book = new exceljs.Workbook()
  const xlsxFile = await book.xlsx.readFile(xlsxPath)
  const csv = xlsxFile.csv
  return csv
}

async function parseTextFromXLSX(xlsxPath) {
  const book = new exceljs.Workbook()
  const xlsxFile = await book.xlsx.readFile(xlsxPath)
  const sheetTexts = []
  xlsxFile.eachSheet((sheet) => {
    const sheetRows = []
    sheet.eachRow((row, rowNumber) => {
      const rowValues = row.values.slice(1) // first value is always null/undefined somehow
      if (rowValues.length) {
        sheetRows.push(rowValues.join(','))
      } else {
        console.warn(`Empty Row! sheet: ${sheet.name} ; row number: ${rowNumber}`)
      }
    })
    console.log(`Sheet Name: ${sheet.name} ; Rows: ${sheetRows.length}`)
    sheetTexts.push(sheetRows.join('\n'))
  })
  console.log('total sheets:', sheetTexts.length)
  return sheetTexts.join('\n\n')
}

/* parseCSVFromXLSX(inputFilePath)
  .then((csv) => {
    csv.writeFile(outputFilePath).catch((err) => {
      console.error(`error with writeFile - ${err.message}`)
    })
  })
  .catch((error) => console.error(`error in parseCSVFromXLSX - ${error.message}`)) */

parseTextFromXLSX(inputFilePath)
  .then((text) => {
    console.log('text.length', text.length)
    fs.writeFile(outputFilePath, text, (err) => {
      if (err) console.error(`error with writeFile - ${err.message}`)
    })
  })
  .catch((err) => console.error(`error in parseTextFromXLSX - ${error.message}`))
