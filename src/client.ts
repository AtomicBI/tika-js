import { ReadStream, WriteStream } from 'fs'
import fetch from 'node-fetch'
import { join } from 'path'
import { ContentResource, MetadataResource } from './types'

export interface TikaClientOptions {
  host: string
}

export type TikaContentType = 'text/plain' | 'text/xml' | 'text/html' | 'application/json'

export interface TikaGetTextOptions {
  filename?: string
  contentType: TikaContentType
}

export class TikaClient {
  private metaUrl: string
  private tikaUrl: string

  constructor(private options: TikaClientOptions) {
    this.metaUrl = join(options.host, '/meta')
    this.tikaUrl = join(options.host, '/tika')
  }

  async getMetadata(body: ReadStream): Promise<MetadataResource> {
    const response = await fetch(this.metaUrl, {
      method: 'PUT',
      body,
      headers: { 'Accept': 'application/json', 'Content-Disposition': 'attachment' }
    })
    return response.json()
  }

  async getContent(body: ReadStream, contentType: Exclude<TikaContentType, 'application/json'>, filename?: string): Promise<string>
  async getContent(body: ReadStream, contentType: Extract<TikaContentType, 'application/json'>, filename?: string): Promise<ContentResource>
  async getContent(body: ReadStream, contentType: TikaContentType, filename?: string): Promise<string | ContentResource> {
    const response = await fetch(this.tikaUrl, {
      method: 'PUT',
      body,
      headers: {
        'Accept': contentType,
        'Content-Disposition': `attachment${filename ? `; filename=${filename}` : ''}`
      }
    })
    return (contentType === 'application/json') ? response.json() : response.text()
  }

  async getStream(body: ReadStream, contentType: TikaContentType, filename?: string): Promise<NodeJS.ReadableStream> {
    const response = await fetch(this.tikaUrl, {
      method: 'PUT',
      body,
      headers: {
        'Accept': contentType,
        'Content-Disposition': `attachment${filename ? `; filename=${filename}` : ''}`
      }
    })
    return response.body
  }

  async pipe(readStream: ReadStream, writeStream: WriteStream, contentType: TikaContentType = 'text/plain', filename?: string): Promise<void> {
    const tikaStream = await this.getStream(readStream, contentType, filename)
    return new Promise((resolve, reject) => {
      const stream = tikaStream.pipe(writeStream)
      stream.on('error', (error) => { reject(error) })
      stream.on('finish', () => { resolve() })
    })
  }

  private async getResource<T>(resource: string, accept: 'application/json'): Promise<T>
  private async getResource(resource: string, accept: 'text/plain'): Promise<string>
  private async getResource<T>(resource: string, accept: 'application/json' | 'text/plain' = 'application/json'): Promise<T> {
    const response = await fetch(join(this.options.host, resource), {
      method: 'GET',
      headers: { 'Accept': accept }
    })
    if (accept === 'text/plain') {
      return response.text() as T
    } else {
      return response.json()
    }
  }

  getMimeTypes() { return this.getResource('/mime-types', 'application/json') }

  getDetectors() { return this.getResource('/detectors', 'application/json') }

  getParsers() { return this.getResource('/parsers', 'application/json') }

  getDetailedParsers() { return this.getResource('/parsers/details', 'application/json') }

  async getVersion() {
    const response = await this.getResource('/version', 'text/plain')
    return response.trim()
  }
}
