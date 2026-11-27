const productos = require('../data/productos.store');

function responder(res, estado, mensaje, datos) {
  const cuerpo = { Success: estado < 400, Status: estado, Message: mensaje };
  if (datos !== undefined) cuerpo.Data = datos;
  return res.status(estado).json(cuerpo);
}

function enteroValido(valor, minimo) {
  return Number.isInteger(valor) && valor >= minimo && valor <= 2147483647;
}

function obtenerID(req) {
  const valor = req.params.id;
  const id = Number(valor);
  return /^\d+$/.test(valor) && enteroValido(id, 1) ? id : null;
}

function leerProducto(cuerpo, stockMinimoPredeterminado) {
  const {
    id_categoria, id_bodega, codigo, nombre, precio, stock,
    stock_minimo = stockMinimoPredeterminado,
  } = cuerpo ?? {};

  if (!enteroValido(id_categoria, 1) || !enteroValido(id_bodega, 1) ||
      typeof codigo !== 'string' || !codigo.trim() ||
      typeof nombre !== 'string' || !nombre.trim() ||
      !Number.isFinite(precio) || precio < 0 || precio > 9999999999.99 ||
      !enteroValido(stock, 0) ||
      (cuerpo?.stock_minimo !== undefined && !enteroValido(stock_minimo, 0))) {
    return null;
  }

  return {
    id_categoria, id_bodega, codigo: codigo.trim(), nombre: nombre.trim(),
    precio, stock, stock_minimo,
  };
}

async function listar(_req, res) {
  const datos = await productos.listarProductos();
  return responder(res, 200, 'Productos obtenidos con éxito', datos);
}

async function consultar(req, res) {
  const id = obtenerID(req);
  if (id === null) return responder(res, 400, 'El ID debe ser un entero positivo');

  const producto = await productos.buscarProducto(id);
  if (!producto) return responder(res, 404, 'Producto no encontrado');
  return responder(res, 200, 'Producto obtenido con éxito', producto);
}

async function crear(req, res) {
  const datos = leerProducto(req.body, 0);
  if (!datos) return responder(res, 400, 'Los datos del producto son inválidos');

  const producto = await productos.crearProducto(datos);
  if (!producto) return responder(res, 400, 'Selecciona una categoría y una bodega activas');
  return responder(res, 201, 'Producto creado con éxito', producto);
}

async function actualizar(req, res) {
  const id = obtenerID(req);
  if (id === null) return responder(res, 400, 'El ID debe ser un entero positivo');

  const datos = leerProducto(req.body, null);
  if (!datos) return responder(res, 400, 'Los datos del producto son inválidos');

  const resultado = await productos.actualizarProducto(id, datos);
  if (!resultado.existe) return responder(res, 404, 'Producto no encontrado');
  if (!resultado.producto) {
    return responder(res, 400, 'Selecciona una categoría y una bodega activas');
  }
  return responder(res, 200, 'Producto actualizado con éxito', resultado.producto);
}

async function eliminar(req, res) {
  const id = obtenerID(req);
  if (id === null) return responder(res, 400, 'El ID debe ser un entero positivo');

  if (!await productos.eliminarProducto(id)) {
    return responder(res, 404, 'Producto no encontrado');
  }
  return responder(res, 200, 'Producto eliminado con éxito');
}

function manejarError(error, req, res, next) {
  if (res.headersSent) return next(error);

  if (error.type === 'entity.parse.failed') {
    return responder(res, 400, 'El JSON recibido es inválido');
  }
  if (error.type === 'entity.too.large') {
    return responder(res, 413, 'El JSON recibido supera el tamaño permitido');
  }
  if (error.code === '23505') {
    return responder(res, 409, 'Ya existe un producto con ese código');
  }
  if (error.code === '23503') {
    return req.method === 'DELETE'
      ? responder(res, 409, 'El producto tiene registros asociados')
      : responder(res, 400, 'La categoría o la bodega no existe');
  }

  console.error('Error en Productos:', error.code ?? error.name);
  return responder(res, 500, 'No se pudo completar la operación');
}

module.exports = { listar, consultar, crear, actualizar, eliminar, manejarError };