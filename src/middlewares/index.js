const compose = require('./compose')
const logger = require('./logger')
const authMiddleware = require('./auth')
const bodyParser = require('./bodyParser')
const routeRequest = require('../router')


//顺序：logger -> bodyParser -> authMiddleware

const middlewares = [logger, bodyParser, authMiddleware, routeRequest]
const handle = compose(middlewares)

module.exports = { handle }