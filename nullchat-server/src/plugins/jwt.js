import fp from 'fastify-plugin'
import fastifyJwt from '@fastify/jwt'
import config from '../config.js'

export default fp(async function jwtPlugin(server) {
  server.register(fastifyJwt, {
    secret: config.security.jwtSecret,
  })

  
  server.decorate('authenticate', async function(request, reply) {
    try {
      await request.jwtVerify()
    } catch (err) {
      reply.status(401).send({
        error: 'Unauthorized',
        message: 'Invalid or expired token',
      })
    }
  })
})