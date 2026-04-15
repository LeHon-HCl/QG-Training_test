function logger(req, res, next) {
  console.log(`[LOGGER] ${new Date().toISOString()} ${req.method} ${req.url}`)
  next()
}

module.exports = logger