const pool = require('./postgres');

const campos = `
  id, nombre, correo, moneda, formato_fecha,
  activo, fecha_creacion, fecha_modificacion
`;

async function listar() {
  const { rows } = await pool.query(`
    SELECT ${campos}
    FROM empresa.empresa
    ORDER BY id DESC
  `);
  return rows;
}

async function buscar(id) {
  const { rows } = await pool.query(`
    SELECT ${campos}
    FROM empresa.empresa
    WHERE id = $1
  `, [id]);
  return rows[0];
}

async function crear({ nombre, correo, moneda, formato_fecha }) {
  const { rows } = await pool.query(`
    INSERT INTO empresa.empresa (nombre, correo, moneda, formato_fecha)
    VALUES ($1, $2, $3, $4)
    RETURNING ${campos}
  `, [nombre, correo, moneda, formato_fecha]);
  return rows[0];
}

async function actualizar(id, { nombre, correo, moneda, formato_fecha }) {
  const { rows } = await pool.query(`
    UPDATE empresa.empresa
    SET nombre = $1, correo = $2, moneda = $3, formato_fecha = $4
    WHERE id = $5
    RETURNING ${campos}
  `, [nombre, correo, moneda, formato_fecha, id]);
  return rows[0];
}

async function desactivar(id) {
  const { rowCount } = await pool.query(`
    UPDATE empresa.empresa
    SET activo = false
    WHERE id = $1 AND activo
  `, [id]);
  return rowCount === 1;
}

module.exports = { listar, buscar, crear, actualizar, desactivar };