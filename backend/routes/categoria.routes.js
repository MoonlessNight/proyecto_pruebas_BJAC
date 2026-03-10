const express = require('express');
const router = express.Router();
const categoriaController = require('../controllers/categoria.controller');

// Rutas para categorias
router.get('/', categoriaController.obtenerCategoria);
router.post('/', categoriaController.crearCategoria);
router.get('/:id', categoriaController.obtenerCategoriaById);
router.put('/:id', categoriaController.actualizarCategoria);
router.delete('/:id', categoriaController.eliminarCategoria);


module.exports = router;