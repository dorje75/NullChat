export default async function healthRoutes(server) {
  server.get('/health', async (request, reply) => {

    const redisPing = await server.redis.ping()

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()) + 's',
      redis: redisPing === 'PONG' ? 'connected' : 'error',
    }
  })
}
