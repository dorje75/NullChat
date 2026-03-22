import fp from 'fastify-plugin'
import cors from '@fastify/cors'
import config from '../config.js'

// fp() (fastify-plugin) makes this plugin global
// Without fp(), Fastify scopes plugins to the context they're registered in
// With fp(), it applies to the entire server including all child contexts
//remember this
export default fp(async function corsPlugin(server) {
  server.register(cors, {
    origin: config.security.corsOrigin,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
})