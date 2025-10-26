import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { Poppler } from 'node-poppler'

const currentDir = path.dirname(fileURLToPath(import.meta.url))

const inputFilePath = path.resolve(currentDir, '..', 'input/pdf/cp43-full-issue.pdf')
const outputFilePath = path.resolve(currentDir, '..', `output/pdf/${path.basename(inputFilePath, '.pdf')}.txt`)

export async function readPdfAndWriteTxt(inputPdfpath, outputTxtPath) {
  let output, images
  try {
    const poppler = new Poppler()
    output = await poppler.pdfToText(inputPdfpath)
    // also check if there are images in pdf
    images = await poppler.pdfImages(inputPdfpath, undefined, { list: true })
  } catch (err) {
    console.error(`Poppler failed to parse the PDF at: '${inputPdfpath}'`, err)
    throw err
  }
  console.info(`Poppler parsed ${output.length} output characters and ${images.length} images from the PDF at: '${inputPdfpath}'`)
  try {
    fs.writeFileSync(outputFilePath, output)
  } catch (err) {
    console.error(`Failed to write to ${outputTxtPath}: ${err}`)
    throw err
  }
}

await readPdfAndWriteTxt(inputFilePath, outputFilePath)
