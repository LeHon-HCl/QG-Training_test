const crypto = require('crypto')

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex')
  return `${salt}:${hash}`
}

function verifyPassword(inputPassword, storedHash) {
  const [salt, originalHash] = storedHash.split(':')
  if (!salt || !originalHash) {
    console.error('[PASSWORD] 哈希格式错误')
    return false
  }
  const inputHash = crypto.pbkdf2Sync(inputPassword, salt, 10000, 64, 'sha512').toString('hex')
  return inputHash === originalHash
}

module.exports = {
  hashPassword,
  verifyPassword
}