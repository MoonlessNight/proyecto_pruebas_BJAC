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
router.get('/categorias', categoriasController.obtenerCategoria);
// Get api/admin/categorias/:id
router.get('/categorias/:id', categoriasController.obtenerCategoriaById);
// Get api/admin/categorias/:id/status
router.get('/categorias/:id/stats', categoriasController.obtenerEstadisticasCategoria);
// POST api/admin/categorias
router.post('/categorias', categoriasController.crearCategoria);
// PUT api/admin/categorias/:id
router.put('/categorias/:id', categoriasController.actualizarCategoria);
// PATCH api/admin/categorias/:id/status
router.patch('/categorias/:id/status', categoriasController.alterarCategoria);
// DELETE api/admin/categorias/:id
router.delete('/categorias/:id', categoriasController.eliminarCategoria);

// Rutas de subcategorias
// Get api/admin/subcategorias
router.get('/subCategorias', subCategoriasController.obtenerSubCategoria)
// Get api/admin/subcategorias/:id
router.get('/subCategorias/:id', subCategoriasController.obtenerSubCategoriaById)
// Get api/admin/subcategorias/:id/stats
router.get('/subCategorias/:id/stats', subCategoriasController.obtenerEstadisticasSubCategoria)
// POST api/admin/subcategorias
router.post('/subCategorias', subCategoriasController.crearSubCategoria)
// PUT api/admin/subcategorias/:id
router.put('/subCategorias/:id', subCategoriasController.actualizarSubCategoria)
// PATCH api/admin/subcategorias/:id/status
router.patch('/subCategorias/:id/status', subCategoriasController.alterarSubCategoria)
// DELETE api/admin/subcategorias/:id
router.delete('/subCategorias/:id', subCategoriasController.eliminarSubCategoria)

// Rutas de productos
// Get api/admin/productos
router.get('/productos', productosController.obtenerProductos)
// Get api/admin/productos
router.get('/productos/:id', productosController.obtenerProductosById)
// POST api/admin/productos
router.post('/productos', upload.single('imagen'), productosController.crearProducto)
// PUT api/admin/productos
router.put('/productos/:id', upload.single('imagen'), productosController.actualizarProducto)
// PATCH api/admin/productos
router.patch('/productos/:id/status', productosController.alterarProducto)
// DELETE api/admin/productos
router.delete('/productos/:id', productosController.eliminarProducto)
// PATCH api/admin/productos/:id/stock
router.patch('/productos/:id/stock', productosController.actualizarStock)

// Rutas de pedidos
// Get api/admin/pedidos
router.get('/pedidos', pedidosController.obtenerPedidos);
// Get api/admin/pedidos/:id
router.get('/pedidos/:id', pedidosController.obtenerPedidoPorId);
// POST api/admin/pedidos
router.post('/pedidos', pedidosController.crearPedido);


module.exports = router;
