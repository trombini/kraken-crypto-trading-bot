import { stringify } from 'query-string'
import { getMessageSignature } from './utils'

describe('KrakenAPI', () => {
  it('Signature should be valid', async () => {
    const key = 'kQH5HW/8p1uGOVjbgWA7FunAmGO8lsSUXNsu3eow76sz84Q18fWxnyRzBHCd3pd5nE9qa99HAZtuZuj6F1huXg=='
    const nonce = '1616492376594'
    const uri = '/0/private/AddOrder'
    const params = {
      nonce: nonce,
      ordertype: 'limit',
      pair: 'XBTUSD',
      price: '37500',
      type: 'buy',
      volume: '1.25',
    }

    const signature = getMessageSignature(uri, stringify(params), key, nonce)
    expect(signature).toBe('4/dpxb3iT4tp/ZCVEwSnEsLxx0bqyhLpdfOpc6fn7OR8+UClSV5n9E6aSS8MPtnRfp32bAb0nmbRn6H8ndwLUQ==')
  })
})
