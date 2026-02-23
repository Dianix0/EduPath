// server/server.js
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import mysql from 'mysql2/promise'
import { Provider } from 'ltijs'           // Provider es un objeto en v5
import Database from 'ltijs-sequelize'
import recommendationsRouter from './routes/recommendations.js'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// === Conexión a MySQL (para tus propias consultas) ===
try {
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
  })
  console.log('✅ Conectado a MySQL en localhost')
  global.db = connection
} catch (err) {
  console.error('❌ Error al conectar con MySQL:', err.message)
  process.exit(1)
}

// === Plugin de almacenamiento para ltijs usando MySQL ===
const db = new Database(
  process.env.MYSQL_DATABASE,
  process.env.MYSQL_USER,
  process.env.MYSQL_PASSWORD,
  {
    host: process.env.MYSQL_HOST,
    port: 3306,
    dialect: 'mysql',
    logging: false
  }
)

// === CONFIGURAR LTI (ltijs v5 usa Provider como objeto) ===
const lti = Provider   // <<-- importante: NO usar `new` aquí

// Setup de ltijs (clave + plugin + opciones)
await lti.setup(process.env.LTI_KEY,
  {
    plugin: db
  },
  {
    staticPath: path.join(__dirname, '../dist'),
    cookies: { secure: false, sameSite: 'Lax' },
	appUrl: '/launch',
    devMode: true
  }
)

// Evento de LTI Launch (cuando Moodle lanza la herramienta)
lti.onConnect(async (token, req, res) => {
  console.log('🎓 LTI Launch exitoso de:', token.user)
  return res.sendFile(path.join(__dirname, '../dist/index.html'))
})

// Rutas propias del servicio (APIs)
lti.app.use('/api/recommendations', recommendationsRouter)

// Desplegar
const PORT = process.env.PORT || 3000

const start = async () => {
  try {

    
    await lti.deploy({ port: PORT })
    console.log(`🚀 Backend LTI corriendo en http://localhost:${PORT}`)

    // Registrar Moodle como plataforma (clientId que me diste)
    await lti.registerPlatform({
      url: 'http://192.168.5.127/moodle',
      name: 'Moodle Local',
      clientId: 'Wv8qjLbyUvCkOcb',
      authenticationEndpoint: 'http://192.168.5.127/moodle/mod/lti/auth.php',
      accesstokenEndpoint: 'http://192.168.5.127/moodle/mod/lti/token.php',
      authConfig: {
        method: 'JWK_SET',
        key: 'http://192.168.5.127/moodle/mod/lti/certs.php'
      }
    })

    console.log('✅ Plataforma Moodle registrada correctamente')
  } catch (error) {
    console.error('❌ Error al iniciar el servidor o registrar plataforma:', error)
    process.exit(1)
  }
}

start()
