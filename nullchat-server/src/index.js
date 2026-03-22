import Fastify from 'fastify'
import fastifyWebsocket from '@fastify/websocket'
import config from './config.js'
import corsPlugin from './plugins/cors.js'
import redisPlugin from './plugins/redis.js'
import jwtPlugin from './plugins/jwt.js'
import healthRoutes from './routes/health.js'
import roomRoutes from './routes/rooms.js'
import wsHandler from './websocket/handler.js'

const server = Fastify({
  logger: config.server.nodeEnv === 'development'
    ? {
        transport: {
          target: 'pino-pretty',
          options: { colorize: true }
        }
      }
    : true
})


//plugins
server.register(corsPlugin)
server.register(redisPlugin)
server.register(jwtPlugin)
server.register(fastifyWebsocket)

//routes
server.register(healthRoutes, { prefix: '/api' })
server.register(roomRoutes,   { prefix: '/api' })
server.register(wsHandler)          

server.setNotFoundHandler((request, reply) => {
  reply.status(404).send({
    error: 'Not Found',
    message: `Route ${request.method} ${request.url} does not exist`,
  })
})

const start = async () => {
  try {
    await server.listen({
      port: config.server.port,
      host: config.server.host,
    })
  } catch (err) {
    server.log.error(err)
    process.exit(1)
  }
}

start()
