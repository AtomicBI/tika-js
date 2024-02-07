import { createReadStream, createWriteStream } from 'fs'
import { TikaClient } from './index'

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

async function main() {
  const client = new TikaClient({ host: 'https://tika.atomic.dev' })

  // Version
  const version = await client.getVersion()
  console.info(`version: ${version}`)

  // Content
  console.info('text/plain', await client.getContent(createReadStream('data/input.pdf'), 'text/plain', 'input.pdf'))
  console.info('text/xml', await client.getContent(createReadStream('data/input.pdf'), 'text/xml', 'input.pdf'))
  console.info('text/html', await client.getContent(createReadStream('data/input.pdf'), 'text/html', 'input.pdf'))
  console.info('application/json', await client.getContent(createReadStream('data/input.pdf'), 'application/json', 'input.pdf'))

  // Pipe
  await client.pipe(createReadStream('data/input.pdf'), createWriteStream('data/output.txt'), 'text/plain', 'input.pdf')
  await client.pipe(createReadStream('data/input.pdf'), createWriteStream('data/output.xml'), 'text/xml', 'input.pdf')
  await client.pipe(createReadStream('data/input.pdf'), createWriteStream('data/output.html'), 'text/html', 'input.pdf')
  await client.pipe(createReadStream('data/input.pdf'), createWriteStream('data/output.json'), 'application/json', 'input.pdf')
}

main()
