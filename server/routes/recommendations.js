import express from 'express'
import { db } from '../db.js'

const router = express.Router()

router.get('/', async (req, res) => {
  try {
    // Ejemplo de consulta (puedes ajustar según tu esquema)
    const [rows] = await db.execute('SELECT id, title, category FROM courses LIMIT 5')
    res.json({ recommendations: rows })
  } catch (err) {
    console.error('❌ Error obteniendo recomendaciones:', err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

export default router
