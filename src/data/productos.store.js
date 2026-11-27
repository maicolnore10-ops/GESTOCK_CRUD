const pool = require('./postgres');

const campos = `
  id, id_categoria, id_bodega, codigo, nombre, precio::double precision AS precio,
  stock, stock_minimo, activo, fecha_creacion, fecha_modificacion
`;

async function listarProductos() {
  const { rows } = await pool.query(`
    SELECT ${campos}
    FROM inventario.producto
    ORDER BY id
  `);
  return rows;
}

async function buscarProducto(id) {
  const { rows } = await pool.query(`
    SELECT ${campos}
    FROM inventario.producto
    WHERE id = $1
  `, [id]);
  return rows[0];
}

async function crearProducto(producto) {
  const { rows } = await pool.query(`
    INSERT INTO inventario.producto
      (id_categoria, id_bodega, codigo, nombre, precio, stock, stock_minimo)
    SELECT c.id, b.id, $3, $4, $5, $6, $7
    FROM inventario.categoria AS c
    CROSS JOIN inventario.bodega AS b
    WHERE c.id = $1 AND c.activo AND b.id = $2 AND b.activo
    RETURNING ${campos}
  `, valores(producto));
  return rows[0];
}

async function actualizarProducto(id, producto) {
  const { rows } = await pool.query(`
    WITH actualizado AS (
      UPDATE inventario.producto
      SET id_categoria = $1, id_bodega = $2, codigo = $3, nombre = $4,
          precio = $5, stock = $6, stock_minimo = COALESCE($7, stock_minimo)
      WHERE id = $8
        AND (
          id_categoria = $1 OR EXISTS (
            SELECT 1 FROM inventario.categoria WHERE id = $1 AND activo
          )
        )
        AND (
          id_bodega = $2 OR EXISTS (
            SELECT 1 FROM inventario.bodega WHERE id = $2 AND activo
          )
        )
      RETURNING ${campos}
    )
    SELECT
      (SELECT row_to_json(a) FROM actualizado AS a) AS producto,
      EXISTS (SELECT 1 FROM inventario.producto WHERE id = $8) AS existe
  `, [...valores(producto), id]);
  return rows[0];
}

async function eliminarProducto(id) {
  const resultado = await pool.query(
    'DELETE FROM inventario.producto WHERE id = $1',
    [id],
  );
  return resultado.rowCount === 1;
}

function valores(producto) {
  return [
    producto.id_categoria, producto.id_bodega, producto.codigo,
    producto.nombre, producto.precio, producto.stock, producto.stock_minimo,
  ];
}

module.exports = {
  listarProductos,
  buscarProducto,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
};