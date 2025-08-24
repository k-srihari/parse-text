import fs from 'fs'
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'

const s3Client = new S3Client() // assumes the config from '~/.aws/config' I guess

const BUCKET_NAME = 'ssoft-use1-local-ref-doc-test'

export async function downloadFileFromS3(s3Key, downloadFilePath) {
  const writeStream = fs.createWriteStream(downloadFilePath)

  const getObjectCommand = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: s3Key
  })

  return new Promise((resolve, reject) => {
    s3Client.send(getObjectCommand)
      .then(response => {
        response.Body.pipe(writeStream)
          .on('finish', () => {
            console.log(`Successfully downloaded from key (${s3Key}) to path (${downloadFilePath})`)
            resolve()
          })
          .on('error', (error) => {
            reject(`Error writing to file: ${error}`)
          })
      })
      .catch(error => {
        reject(`Error downloading from S3: ${error}`)
      })
  })
}

export async function uploadFileToS3(s3Key, uploadFilePath) {
  const fileStream = fs.createReadStream(uploadFilePath)

  const putObjectCommand = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: s3Key,
    Body: fileStream,
    ContentType: 'text/plain'
  })

  return new Promise((resolve, reject) => {
    s3Client.send(putObjectCommand)
      .then(() => {
        console.log(`Successfully uploaded from path (${uploadFilePath}) to key (${s3Key})`)
        resolve()
      })
      .catch(error => {
        reject(`Error uploading to S3: ${error}`)
      })

    fileStream.on('error', (error) => {
      reject(`Error reading file: ${error}`)
    })
  })
}

export function trackMemoryAndCPU() {
    const used = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    console.log('\nMemory usage:');
    for (let key in used) {
        console.log(`${key}: ${Math.round(used[key] / 1024 / 1024 * 100) / 100} MB`);
    }
    
    console.log('CPU usage:');
    console.log(`user: ${cpuUsage.user / 1000000}s`);
    console.log(`system: ${cpuUsage.system / 1000000}s`);
}
