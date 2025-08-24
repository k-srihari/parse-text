import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import PDFParser from 'pdf2json'
import { downloadFileFromS3, trackMemoryAndCPU, uploadFileToS3 } from './utils/s3-utils.mjs'

const currentDir = path.dirname(fileURLToPath(import.meta.url))

const s3FileKey = 'stream-test/download/50mb.pdf'
const s3FileBaseName = path.basename(s3FileKey, '.pdf')

const inputFilePath = path.resolve(currentDir, '..', `input/pdf/${s3FileBaseName}.pdf`)

const outputFilePath = path.resolve(currentDir, '..', `output/pdf/${s3FileBaseName}.txt`)

async function extractTextFromPdf(pdfFilePath) {
  const pdfParser = new PDFParser(this, true)
  let interval
  return new Promise((resolve, reject) => {
    pdfParser.on('readable', (meta) => {
      console.log(`READABLE META\n${JSON.stringify(meta)}`)
      interval = setInterval(() => trackMemoryAndCPU(), 3909)
    })
    // pdfParser.on('data', (data) => console.log(`DATA (PAGE)\n${JSON.stringify(data)}`))
    pdfParser.on('pdfParser_dataReady', (output) => {
      console.log(`OUTPUT.transcoder: ${output.Transcoder}`)
      console.log(`OUTPUT.meta:: ${JSON.stringify(output.Meta)}`)
      console.log(`OUTPUT.pagesLength:: ${output.Pages.length}`)
      const rawText = pdfParser.getRawTextContent()
      clearInterval(interval)
      resolve(rawText)
    })
    pdfParser.on('pdfParser_dataError', reject)
    // load the input file
    pdfParser.loadPDF(pdfFilePath, 0)
  })
}

async function readPdfAndWriteTxt(pdfPath, txtPath) {
  try {
    const pdfText = await extractTextFromPdf(pdfPath)
    fs.writeFileSync(txtPath, pdfText, { encoding: 'utf-8' })
  } catch (error) {
    console.error(`error in readPdfAndWriteTxt - ${error.message}`)
    console.error(`stack:\n${error.stack}`)
  }
}

// await downloadFileFromS3(s3FileKey, inputFilePath)

await readPdfAndWriteTxt(inputFilePath, outputFilePath)

const s3FileKeyToUpload = `stream-test/upload/${s3FileBaseName}.txt`
await uploadFileToS3(s3FileKeyToUpload, outputFilePath)
