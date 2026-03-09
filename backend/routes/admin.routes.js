/**
 * RUTAS DEL ADMINISTRADOR
 * Agrupar todas las rutas de gestión de admin
 */

const express = require('express');
const router = express.Router();

// Importar el middleware de autenticación
const { verificarToken } = require('../middleware/auth');
// Importar el middleware de verificación de rol
const { esAdministrador } = require('../middleware/checkRole');

// Importar configiración de multer para la subida de imagenes
const {upload} = require('../config/multer');

// importar controladores
const categoriasController = require('../controllers/categoria.controller');
const subCategoriasController = require('../controllers/subCategoria.controller');
const productosController = require('../controllers/producto.controller');
const pedidosController = require('../controllers/pedido.controller');

// Restricciones de accesos a las rutas de admin
router.use(verificarToken, esAdministrador);

// Rutas de categorias
// Get api/admin/categorias
router.get('/categorias', categoriasController.getCategorias);
// Get api/admin/categorias/:id
router.get('/categorias/:id', categoriasController.getCategoriasById);
// Get api/admin/categorias/:id/status
router.get('/categorias/:id/stats', categoriasController.getEstadisticasCategoria);
// POST api/admin/categorias
router.post('/categorias', categoriasController.crearCategoria);
// PUT api/admin/categorias/:id
router.put('/categorias/:id', categoriasController.updateCategoria);
// PATCH api/admin/categorias/:id/status
router.patch('/categorias/:id/status', categoriasController.toggleCategoria);
// DELETE api/admin/categorias/:id
router.delete('/categorias/:id', categoriasController.eliminarCategoria);

// Rutas de subcategorias
// Get api/admin/subcategorias
router.get('/subCategorias', subCategoriasController.getSubCategorias)
// Get api/admin/subcategorias/:id
router.get('/subCategorias/:id', subCategoriasController.getSubCategoriasById)
// Get api/admin/subcategorias/:id/stats
router.get('/subCategorias/:id/stats', subCategoriasController.getEstadisticasSubCategoria)

// POST api/admin/subcategorias
router.post('/subCategorias', subCategoriasController.crearSubCategoria)
// PUT api/admin/subcategorias/:id
router.put('/subCategorias/:id', subCategoriasController.actualizarSubCategoria)
// PATCH api/admin/subcategorias/:id/status
router.patch('/subCategorias/:id/status', subCategoriasController.toggleSubCategoria)
// DELETE api/admin/subcategorias/:id
router.delete('/subCategorias/:id', subCategoriasController.eliminarSubCategoria)