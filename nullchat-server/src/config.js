import 'dotenv/config'

const config = {
  server: {
    port: parseInt(process.env.PORT) || 3001,
    host: process.env.HOST || '0.0.0.0',
    nodeEnv: process.env.NODE_ENV || 'development',
  },
  security: {
    jwtSecret: process.env.JWT_SECRET,
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
  },
}

const required = [
  ['JWT_SECRET', config.security.jwtSecret],
]

for (const [name, value] of required) {
  if (!value) {
    console.error(`Missing required environment variable: ${name}`)
    process.exit(1)
  }
}

console.log(`Config loaded — environment: ${config.server.nodeEnv}`)

export default config