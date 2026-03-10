/**
 * RUTAS DEL CLIENTE
 * Agrupar todas las rutas del cliente
 */

const express = require('express');
const router = express.Router();

// Importar el middleware de autenticación
const { verificarToken } = require('../middleware/auth');
// Importar el middleware de verificación de rol
const { esCliente } = require('../middleware/checkRole');

// Importar configiración de multer para la subida de imagenes
const {upload} = require('../config/multer');

// importar controladores
const carritoController = require('../controllers/carrito.controller');
const catalogoController = require('../controllers/catalago.controller');
const pedidoController = require('../controllers/pedido.controller');
const { vaciarCarrito } = require('../models/detallePedido');
const { obtenerCategoria } = require('../controllers/categoria.controller');


// Restricciones de accesos a las rutas de cliente
router.use(verificarToken, esCliente);

// Rutas del carrito
// Get api/cliente/carrito
router.get('/carrito', carritoController.obtenerCarrito);
// POST api/cliente/carrito
router.post('/carrito', carritoController.agregarAlCarrito);
// DELETE api/cliente/carrito/:id
router.delete('/carrito/:id', carritoController.eliminarItemCarrito);
// PATCH api/cliente/carrito/:id
router.patch('/carrito/:id', carritoController.actualizarItemCarrito);
// delete api/cliente/carrito/vaciar
router.delete('/carrito/vaciar', carritoController.vaciarCarrito);


// Rutas del catalago
// Get api/cliente/producto
router.get('/catalogo', catalogoController.obtenerProductos);
// Get api/cliente/catalogo/:id
router.get('/catalogo/:id', catalogoController.obtenerProductosById);
// Get api/cliente/categoria
router.get('/categorias', catalogoController.obtenerCategorias);
// Get api/cliente/subcategoria
router.get('/subcategorias', catalogoController.obtenerSubCategorias);
// Get api/cliente/productos destacados
router.get('/productosDestacados', catalogoController.obtenerProductosDestacados);

// Rutas del pedido
// Get api/cliente/pedido
router.get('/pedidos', pedidoController.obtenerPedidos);
// Get api/cliente/pedido/:id
router.get('/pedidos/:id', pedidoController.obtenerPedidoPorId);
// POST api/cliente/pedido/crear
router.post('/pedidos', pedidoController.crearPedido);
// PUT api/cliente/pedido/:id/cancelar
router.put('/pedidos/:id', pedidoController.cancelarPedido);


// Rutas del pedido

module.exports = router;
