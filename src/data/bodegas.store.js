const pool = require('./postgres');

const campos = `
  id AS id_bodega, codigo, nombre, direccion, ciudad, telefono,
  responsable, capacidad AS capacidad_maxima, activo,
  fecha_creacion, fecha_modificacion
`;

async function listar() {
  const { rows } = await pool.query(`
    SELECT ${campos} FROM inventario.bodega ORDER BY id
  `);
  return rows;
}

async function buscar(id) {
  const { rows } = await pool.query(`
    SELECT ${campos} FROM inventario.bodega WHERE id = $1
  `, [id]);
  return rows[0];
}

function valores(bodega) {
  return [
    bodega.codigo, bodega.nombre, bodega.direccion, bodega.ciudad,
    bodega.telefono, bodega.responsable, bodega.capacidad_maxima,
  ];
}

async function crear(bodega) {
  const { rows } = await pool.query(`
    INSERT INTO inventario.bodega
      (codigo, nombre, direccion, ciudad, telefono, responsable, capacidad)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING ${campos}
  `, valores(bodega));
  return rows[0];
}

async function actualizar(id, bodega) {
  const { rows } = await pool.query(`
    UPDATE inventario.bodega
    SET codigo = $1, nombre = $2, direccion = $3, ciudad = $4,
        telefono = $5, responsable = $6, capacidad = $7
    WHERE id = $8
    RETURNING ${campos}
  `, [...valores(bodega), id]);
  return rows[0];
}

async function desactivar(id) {
  const resultado = await pool.query(`
    UPDATE inventario.bodega
    SET activo = false
    WHERE id = $1 AND activo
    RETURNING id
  `, [id]);
  return resultado.rowCount === 1;
}

module.exports = { listar, buscar, crear, actualizar, desactivar };