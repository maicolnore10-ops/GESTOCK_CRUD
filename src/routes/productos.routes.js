const { Router } = require('express');
const productos = require('../controllers/productos.controller');

const router = Router();
router.get('/', productos.listar);
router.get('/:id', productos.consultar);
router.post('/', productos.crear);
router.put('/:id', productos.actualizar);
router.delete('/:id', productos.eliminar);

module.exports = router;