const { Router } = require('express');
const empresas = require('../data/empresas.store');

const router = Router();
const monedas = new Set(['COP', 'USD', 'EUR']);
const formatos = new Set(['DD/MM/YYYY', 'YYYY-MM-DD', 'MM/DD/YYYY']);

function responder(res, estado, mensaje, datos) {
  const cuerpo = { Success: estado < 400, Status: estado, Message: mensaje };
  if (datos !== undefined) cuerpo.Data = datos;
  return res.status(estado).json(cuerpo);
}

function leerEmpresa(cuerpo) {
  const { nombre, correo, moneda, formato_fecha } = cuerpo ?? {};

  if (typeof nombre !== 'string' || !nombre.trim() || nombre.includes('\0') ||
      typeof correo !== 'string' || !/^[^\s@\0]+@[^\s@\0]+\.[^\s@\0]+$/.test(correo.trim()) ||
      !monedas.has(moneda) || !formatos.has(formato_fecha)) {
    return null;
  }

  return { nombre: nombre.trim(), correo: correo.trim(), moneda, formato_fecha };
}

router.param('id', (_req, res, next, valor) => {
  const id = Number(valor);
  if (!/^\d+$/.test(valor) || id < 1 || id > 2147483647) {
    return responder(res, 400, 'El ID de empresa debe ser un entero positivo');
  }
  res.locals.idEmpresa = id;
  return next();
});

router.get('/', async (_req, res) => {
  return responder(res, 200, 'Empresas obtenidas con éxito', await empresas.listar());
});

router.get('/:id', async (_req, res) => {
  const empresa = await empresas.buscar(res.locals.idEmpresa);
  if (!empresa) return responder(res, 404, 'Empresa no encontrada');
  return responder(res, 200, 'Empresa obtenida con éxito', empresa);
});

router.post('/', async (req, res) => {
  const entrada = leerEmpresa(req.body);
  if (!entrada) return responder(res, 400, 'Revisa el nombre, correo, moneda y formato de fecha');
  return responder(res, 201, 'Empresa creada con éxito', await empresas.crear(entrada));
});

router.put('/:id', async (req, res) => {
  const entrada = leerEmpresa(req.body);
  if (!entrada) return responder(res, 400, 'Revisa el nombre, correo, moneda y formato de fecha');

  const empresa = await empresas.actualizar(res.locals.idEmpresa, entrada);
  if (!empresa) return responder(res, 404, 'Empresa no encontrada');
  return responder(res, 200, 'Empresa actualizada con éxito', empresa);
});

router.delete('/:id', async (_req, res) => {
  if (!await empresas.desactivar(res.locals.idEmpresa)) {
    return responder(res, 404, 'No existe una empresa activa con ese ID');
  }
  return responder(res, 200, 'Empresa desactivada con éxito');
});

function manejarError(error, _req, res, next) {
  if (res.headersSent) return next(error);
  if (error.type === 'entity.parse.failed') {
    return responder(res, 400, 'El JSON recibido es inválido');
  }
  if (error.type === 'entity.too.large') {
    return responder(res, 413, 'El JSON recibido supera el tamaño permitido');
  }

  console.error('Error en Empresas:', error.code ?? error.name);
  return responder(res, 500, 'No se pudo completar la operación de empresa');
}

module.exports = { router, manejarError };