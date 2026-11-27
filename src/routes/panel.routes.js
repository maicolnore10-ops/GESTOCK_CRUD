const { Router } = require('express');
const pool = require('../data/postgres');

const router = Router();

router.get('/actividad', async (_req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        (SELECT count(*)::integer
         FROM seguridad.usuario
         WHERE activo) AS usuarios_activos,
        COALESCE((
          SELECT json_agg(m ORDER BY m.fecha DESC, m.id DESC)
          FROM (
            SELECT id, id_producto, tipo, cantidad, fecha, responsable
            FROM inventario.movimiento
            WHERE activo
            ORDER BY fecha DESC, id DESC
            LIMIT 5
          ) AS m
        ), '[]'::json) AS ultimos_movimientos
    `);

    return res.status(200).json({
      Success: true,
      Status: 200,
      Message: 'Actividad del panel obtenida con éxito',
      Data: rows[0],
    });
  } catch (error) {
    console.error('Error al consultar actividad del Panel:', error.code ?? error.name);
    return res.status(500).json({
      Success: false,
      Status: 500,
      Message: 'No se pudo consultar la actividad del panel',
    });
  }
});

module.exports = router;
