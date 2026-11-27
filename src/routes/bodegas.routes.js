const { Router } = require('express');
const bodegas = require('../data/bodegas.store');

const router = Router();
const enteroMaximo = 2147483647;

function responder(res, estado, mensaje, datos) {
  const cuerpo = { Success: estado < 400, Status: estado, Message: mensaje };
  if (datos !== undefined) cuerpo.Data = datos;
  return res.status(estado).json(cuerpo);
}

router.param('id', (req, res, next, valor) => {
  const id = Number(valor);
  if (!/^\d+$/.test(valor) || id < 1 || id > enteroMaximo) {
    return responder(res, 400, 'El ID debe ser un entero positivo');
  }

  res.locals.idBodega = id;
  return next();
});

function leerBodega(cuerpo) {
  const bodega = {};
  for (const campo of ['codigo', 'nombre', 'direccion', 'ciudad', 'telefono', 'responsable']) {
    const valor = cuerpo?.[campo];
    if (typeof valor !== 'string' || !valor.trim() || valor.includes('\0')) {
      return null;
    }
    bodega[campo] = valor.trim();
  }

  const capacidad = cuerpo?.capacidad_maxima;
  if (!Number.isInteger(capacidad) || capacidad < 1 || capacidad > enteroMaximo) {
    return null;
  }

  bodega.capacidad_maxima = capacidad;
  return bodega;
}

router.get('/', async (_req, res) => {
  return responder(res, 200, 'Lista de bodegas obtenida con éxito', await bodegas.listar());
});

router.get('/:id', async (_req, res) => {
  const datos = await bodegas.buscar(res.locals.idBodega);
  if (!datos) return responder(res, 404, 'La bodega solicitada no existe');
  return responder(res, 200, 'Bodega obtenida con éxito', datos);
});

router.post('/', async (req, res) => {
  const bodega = leerBodega(req.body);
  if (!bodega) return responder(res, 400, 'Revisa los campos obligatorios y la capacidad máxima');

  const datos = await bodegas.crear(bodega);
  return responder(res, 201, 'Bodega creada con éxito', datos);
});

router.put('/:id', async (req, res) => {
  const bodega = leerBodega(req.body);
  if (!bodega) return responder(res, 400, 'Revisa los campos obligatorios y la capacidad máxima');

  const datos = await bodegas.actualizar(res.locals.idBodega, bodega);
  if (!datos) return responder(res, 404, 'La bodega solicitada no existe');
  return responder(res, 200, 'Bodega actualizada con éxito', datos);
});

router.delete('/:id', async (_req, res) => {
  if (!await bodegas.desactivar(res.locals.idBodega)) {
    return responder(res, 404, 'No existe una bodega activa con ese ID');
  }
  return responder(res, 200, 'Bodega desactivada con éxito');
});

function manejarError(error, _req, res, next) {
  if (res.headersSent) return next(error);
  if (error.type === 'entity.parse.failed') {
    return responder(res, 400, 'El JSON recibido es inválido');
  }
  if (error.type === 'entity.too.large') {
    return responder(res, 413, 'El JSON recibido supera el tamaño permitido');
  }
  if (error.code === '23505') {
    return responder(res, 409, 'Ya existe una bodega con ese código');
  }

  console.error('Error en Bodegas:', error.code ?? error.name);
  return responder(res, 500, 'No se pudo completar la operación de bodega');
}

module.exports = { router, manejarError };