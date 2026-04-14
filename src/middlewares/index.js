const logger = require('./logger')
const authMiddleware = require('./auth')
const bodyParser = require('./bodyParser')

//顺序：logger -> bodyParser -> authMiddleware

const middlewares = [logger, bodyParser, authMiddleware]

module.exports = middlewares
