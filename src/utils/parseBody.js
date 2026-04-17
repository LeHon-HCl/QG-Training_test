const querystring = require('querystring')

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', chunk => body += chunk.toString())
    req.on('end', () => {
      try {
        if (body === '') {
          resolve({})
        } else if (req.headers['content-type'] === 'application/json') {
          resolve(JSON.parse(body))
        } else {
          resolve(querystring.parse(body))
        }
      } catch (e) {
        reject(e)
      }
    })
    req.on('error', reject)
  })
}

module.exports = { parseBody }