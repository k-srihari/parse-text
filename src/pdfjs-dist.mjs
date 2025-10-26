import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { fileURLToPath } from 'url'
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'
import { downloadFileFromS3, trackMemoryAndCPU, uploadFileToS3 } from './utils/s3-utils.mjs'

const currentDir = path.dirname(fileURLToPath(import.meta.url))

const s3FileKey = 'input/pdf/50mb.pdf'
const s3FileBaseName = path.basename(s3FileKey, '.pdf')

const inputFilePath = path.resolve(currentDir, '..', `input/pdf/${s3FileBaseName}.pdf`)

const outputFilePath = path.resolve(currentDir, '..', `output/pdf/${s3FileBaseName}.txt`)

async function readPdfAndStreamText(pdfPath, txtPath) {
  try {
    const pdfBuffer = fs.readFileSync(pdfPath)
    const pdfDocument = await getDocument({
      data: new Uint8Array(pdfBuffer),
      standardFontDataUrl: path.join('node_modules/pdfjs-dist/standard_fonts/'),
    }).promise
    console.log(`Processing ${pdfDocument.numPages} pages...`)
    const outputStream = fs.createWriteStream(txtPath)
    for (let i = 1; i <= pdfDocument.numPages; i++) {
      if (i === 1 || i === pdfDocument.numPages || i%500 === 0) {
        trackMemoryAndCPU()
      }
      const page = await pdfDocument.getPage(i)
      const textContent = await page.getTextContent()
      const pageText = textContent.items.map(item => item.str).join(' ')
      outputStream.write(pageText + '\n\n')
    }
    outputStream.end()
    console.log('PDF processed and text saved to:', txtPath)
    const pdfText = fs.readFileSync(txtPath, { encoding: 'utf-8' })
    const pdfHash = crypto.createHash('md5').update(pdfText).digest('hex')
    console.log('PDF hash:', pdfHash)
    trackMemoryAndCPU()
  } catch (error) {
    console.error(`error in streamPdf2Text - ${error.message}`)
    throw error
  }
}

async function readPdfAndWriteTxt(pdfPath, txtPath) {
  try {
    const pageTexts = []
    const pdfDocument = await getDocument(pdfPath).promise
    for (let i = 1; i <= pdfDocument.numPages; i++) {
      if (i === 1 || i === pdfDocument.numPages || i%500 === 0) {
        console.log(`Processeed ${i} out of ${pdfDocument.numPages} pages...`)
        trackMemoryAndCPU()
      }
      const page = await pdfDocument.getPage(i)
      const textContent = await page.getTextContent()
      const pageText = textContent.items.map(item => item.str).join(' ')
      pageTexts.push(pageText)
    }
    const pdfText = pageTexts.join('\n\n')
    const pdfHash = crypto.createHash('md5').update(pdfText).digest('hex')
    console.log('PDF hash:', pdfHash)
    trackMemoryAndCPU()
    fs.writeFileSync(txtPath, pdfText)
    trackMemoryAndCPU()
    console.log('PDF processed and text saved to:', txtPath)
  } catch (error) {
    console.error(`error in streamPdf2Text - ${error.message}`)
    throw error
  }
}


// await downloadFileFromS3(s3FileKey, inputFilePath)

await readPdfAndWriteTxt(inputFilePath, outputFilePath)
// await readPdfAndStreamText(inputFilePath, outputFilePath)

const s3FileKeyToUpload = `stream-test/upload/${s3FileBaseName}.txt`
// await uploadFileToS3(s3FileKeyToUpload, outputFilePath)
