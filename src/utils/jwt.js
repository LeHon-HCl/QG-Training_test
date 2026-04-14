const crypto = require('crypto')

function generateJWT(payload, sercret, expiresIn = '24h') {
  const header = { alg: 'HS256', typ: 'JWT' }
  const exp = Date.now() + (expiresIn === '24h' ? 86400000 : 0)
  const fullPayload = { ...payload, exp }

  const base64Header = Buffer.from(JSON.stringify(header)).toString('base64url')
  const base64Payload = Buffer.from(JSON.stringify(fullPayload)).toString('base64url')
  const signature = crypto
    .createHmac('sha256', sercret)
    .update(`${base64Header}.${base64Payload}`)
    .digest('base64url')

  return `${base64Header}.${base64Payload}.${signature}`
}

function verifyJWT(token, sercret) {
  const [headerB64, payloadB64, signature] = token.split('.')
  const expectedSignature = crypto
    .createHmac('sha256', sercret)
    .update(`${headerB64}.${payloadB64}`)
    .digest('base64url')

  if (expectedSignature !== signature) {
    throw new Error('无效的签名')
  }

  const payload = JSON.parse(Buffer.from(payloadB64, 'base64url')).toString()
  if (payload.exp < Date.now()) {
    throw new Error('过期的JWT')
  }
  return payload
}