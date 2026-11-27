require('dotenv').config({ quiet: true });

const express = require('express');
const pool = require('./src/data/postgres');

const app = express();
const puerto = Number(process.env.PORT || 8082);

app.use(express.json());

app.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT id FROM inventario.producto LIMIT 0');
    res.status(200).json({
      Success: true,
      Status: 200,
      Message: 'CRUD conectado a PostgreSQL',
    });
  } catch (error) {
    console.error('No se pudo consultar inventario.producto:', error.message);
    res.status(503).json({
      Success: false,
      Status: 503,
      Message: 'No se pudo consultar la base de datos',
    });
  }
});

app.use('/v1/productos', require('./src/routes/productos.routes'));
const bodegas = require('./src/routes/bodegas.routes');
app.use('/v1/bodega', bodegas.router);
app.use('/v1/bodega', bodegas.manejarError);
app.use('/v1', require('./src/routes/catalogos.routes'));
app.use('/v1/productos', require('./src/controllers/productos.controller').manejarError);

app.listen(puerto, '127.0.0.1', (error) => {
  if (error) {
    console.error('No se pudo iniciar el CRUD:', error.message);
    process.exitCode = 1;
    return;
  }

  console.log(`GESTOCK_CRUD escuchando en http://127.0.0.1:${puerto}`);
});