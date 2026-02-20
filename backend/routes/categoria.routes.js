const express = require('express');
const router = express.Router();
const categoriaController = require('../controllers/categoria.controller');

// Rutas para categorias
router.get('/', categoriaController.getCategorias);
router.post('/', categoriaController.createCategoria);
router.get('/:id', categoriaController.getCategoriaById);
router.put('/:id', categoriaController.updateCategoria);
router.delete('/:id', categoriaController.deleteCategoria);

module.exports = router;