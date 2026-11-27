const { Router } = require('express');
const pool = require('../data/postgres');

const router = Router();

router.get('/categorias', async (_req, res) => {
  const { rows } = await pool.query(`
    SELECT id AS id_categoria, nombre, activo
    FROM inventario.categoria
    ORDER BY nombre, id
  `);

  res.status(200).json({
    Success: true,
    Status: 200,
    Message: 'Categorías obtenidas con éxito',
    Data: rows,
  });
});


router.use((error, _req, res, next) => {
  if (res.headersSent) return next(error);

  console.error('Error al consultar catálogos:', error.code ?? error.name);
  return res.status(500).json({
    Success: false,
    Status: 500,
    Message: 'No se pudo consultar el catálogo',
  });
});

module.exports = router;