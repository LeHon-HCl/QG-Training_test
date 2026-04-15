const crypto = require('crypto')
const SECRET_KEY = process.env.JWT_SECRET || 'your-secret-key-at-least-32-chars!'

function base64UrlEncode(str) {
  return Buffer.from(str).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

function base64UrlDecode(str) {
  str = str.replace(/\-/g, '+').replace(/\_/g, '/')
  while (str.length % 4 !== 0) {
    str += '='
  }
  return Buffer.from(str, 'base64').toString()
}

function generateToken(payload, expiresIn = '24h') {
  const header = { alg: 'HS256', typ: 'JWT' }
  const exp = Date.now() + (expiresIn === '24h' ? 86400000 : 0)
  const fullPayload = { ...payload, exp }

  const encodedHeader = base64UrlEncode(JSON.stringify(header))
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload))
  const signature = crypto
    .createHmac('sha256', SECRET_KEY)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')

  return `${encodedHeader}.${encodedPayload}.${signature}`
}

function verifyToken(token) {
  const parts = token.split('.')
  if (parts.length !== 3) throw new Error('Invalid token format')

  const [encodedHeader, encodedPayload, signature] = parts
  const expectedSignature = crypto
    .createHmac('sha256', SECRET_KEY)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')

  if (expectedSignature !== signature) {
    throw new Error('无效的签名')
  }

  const payload = JSON.parse(base64UrlDecode(encodedPayload))
  if (payload.exp < Date.now()) {
    throw new Error('过期的JWT')
  }
  return payload
}

module.exports = {
  generateToken,
  verifyToken
}