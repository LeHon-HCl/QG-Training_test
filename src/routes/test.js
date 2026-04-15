// src/routes/test.js
module.exports = {
  'GET /api/ping': (req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('pong');
  }
};