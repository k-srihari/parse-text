import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import PDFParser from 'pdf2json'
import { downloadFileFromS3, MemoryAndTimeTracker, trackMemoryAndCPU, uploadFileToS3 } from './utils/s3-utils.mjs'
import { Transform } from 'stream'

const currentDir = path.dirname(fileURLToPath(import.meta.url))

const s3FileKey = 'input/pdf/php_cookbook.pdf'
const s3FileBaseName = path.basename(s3FileKey, '.pdf')

const inputFilePath = path.resolve(currentDir, '..', `input/pdf/${s3FileBaseName}.pdf`)

const outputFilePath = path.resolve(currentDir, '..', `output/pdf/${s3FileBaseName}.txt`)

async function readPdfAndWriteTxt(pdfPath, txtPath) {
  try {
    const memoryAndTimeTracker = new MemoryAndTimeTracker(console, `pdf2json: ${pdfPath}`)
    const pdfParser = new PDFParser(this, true)
    const pdfText = await new Promise((resolve, reject) => {
      pdfParser.on('readable', (meta) => {
        console.log(`READABLE META:: ${JSON.stringify(meta)}`)
      })
      pdfParser.on('pdfParser_dataReady', (output) => {
        console.log(`OUTPUT.pagesLength:: ${output.Pages.length}`)
        const rawText = pdfParser.getRawTextContent()
        memoryAndTimeTracker.logUsage('getRawTextContent')
        resolve(rawText)
      })
      pdfParser.on('pdfParser_dataError', reject)
      pdfParser.loadPDF(pdfPath, 0)
      memoryAndTimeTracker.logUsage('loadPdf')
    })
    fs.writeFileSync(txtPath, pdfText)
    console.log('written')
    memoryAndTimeTracker.logUsage('writeFileSync')
  } catch (error) {
    console.error(`error in readPdfAndWriteTxt - ${error.message}`)
    throw error
  }
}

async function streamPdfAndStreamText1(pdfPath, txtPath) {
  try {
    const interval = setInterval(() => trackMemoryAndCPU(), 3909)
    const inputStream = fs.createReadStream(pdfPath)
    const outputStream = fs.createWriteStream(txtPath)
    const pdfParser = new PDFParser(this, true)
    inputStream
      .pipe(pdfParser.createParserStream())
      .pipe(new Transform({
        objectMode: true,
        transform(chunk, _encoding, callback) {
          if (chunk.Pages) {
            const rawText = pdfParser.getRawTextContent()
            this.push(rawText)
          }
          callback()
        }
      }))
      .pipe(outputStream)
    clearInterval(interval)
  } catch (error) {
    console.error(`error in streamPdf2Text - ${error.message}`)
    throw error
  }
}

async function streamPdfAndStreamText(pdfPath, txtPath) {
  const pdfParser = new PDFParser(this, true)
  const outputStream = fs.createWriteStream(txtPath)
  let interval

  pdfParser.on('readable', () => {
    interval = setInterval(() => trackMemoryAndCPU(), 3909)
  })

  pdfParser.on('data', (page) => {
    if (page && page.Texts) {
      // Extract raw text from page.Texts
      const pageText = page.Texts.map(
        t => t.R.map(r => decodeURIComponent(r.T)).join('')
      ).join('\n')
      outputStream.write(pageText + '\n')
    }
  })

  pdfParser.on('pdfParser_dataReady', () => {
    clearInterval(interval)
    outputStream.end()
  })

  pdfParser.on('pdfParser_dataError', (err) => {
    clearInterval(interval)
    outputStream.end()
    console.error('PDF parsing error:', err)
  })

  await pdfParser.loadPDF(pdfPath, 0)
}

// await downloadFileFromS3(s3FileKey, inputFilePath)

await readPdfAndWriteTxt(inputFilePath, outputFilePath)
// await streamPdfAndStreamText1(inputFilePath, outputFilePath)

const s3FileKeyToUpload = `stream-test/upload/${s3FileBaseName}.txt`
// await uploadFileToS3(s3FileKeyToUpload, outputFilePath)
