import axios, { AxiosResponse } from 'axios'
import { createHash, createHmac } from 'crypto'
import { stringify } from 'query-string'
import { Logger } from '../common/logger'
import moment from 'moment'

const logger = Logger('KrakenApiV2.utils')

const BASE_URL = 'https://api.kraken.com'

export const getMessageSignature = (path: string, message: string, secret: string, nonce: string) => {
  const decodedSecret = Buffer.from(secret, 'base64')
  const hash = createHash('sha256')
  const hash_xt = hash.update(nonce + message)
  const hash_digest = hash_xt.digest().toString('binary')
  const hmac = createHmac('sha512', decodedSecret)
  const hmac_digest = hmac.update(path + hash_digest, 'binary').digest('base64')
  return hmac_digest
}

export const rawRequest = async (path: string, headers: any, params: any): Promise<AxiosResponse> => {
  const instance = axios.create({
    baseURL: BASE_URL,
    timeout: 5000,
    headers,
  })

  return await instance.post(path, stringify(params))
}

export const responseHandler = (response) => {
  if (response.data.error && response.data.error.length) {
    const error = response.data.error.filter((e) => e.startsWith('E')).map((e) => e.substr(1))
    if (!error.length) {
      throw new Error('Kraken API returned an unknown error')
    }
    throw new Error(error.join(', '))
  }

  // all good
  return response
}

export const publicMethod = async (key: string, secret: string, method: string, params: any): Promise<any> => {
  const path = `/0/public/${method}`
  const response = await rawRequest(path, {}, params)
  const data = responseHandler(response)
  return data
}

export const privateMethod = async (key: string, secret: string, method: string, params: any): Promise<any> => {
  if (!params.nonce) {
    params = {
      nonce: moment().unix() * 1000 * 1000,
      ...params,
    }
  }

  logger.info(`Sending private request to ${method} with params: ${JSON.stringify(params)}`)
  // logger.debug(`Sending private request to ${method} with params: ${JSON.stringify(params)}`)

  const path = `/0/private/${method}`
  const signature = getMessageSignature(path, stringify(params), secret, params.nonce)
  const headers = {
    'API-Key': key,
    'API-Sign': signature,
  }

  const response = await rawRequest(path, headers, params)
  const data = responseHandler(response)
  return data
}
