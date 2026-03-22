import fp from 'fastify-plugin'
import fastifyRedis from '@fastify/redis'
import config from '../config.js'

export default fp(async function redisPlugin(server) {
  server.register(fastifyRedis, {
    host: config.redis.host,
    port: config.redis.port,

    closeClient: true,
  })

  server.addHook('onReady', async () => {
    server.log.info('Redis connected!!!! ahhhh..')
  })
})