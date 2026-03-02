/**
 * CONTROLADOR DE CARRITO DE COMPRAS 
 * ==================================================================
 * Gestión del carrito
 * Requiere autenticación
 */

// IMPORTAR MODELOS
const Carrito = require('../models/carrito');
const Producto = require('../models/Producto');
const Categoria = require('../models/categoria');
const SubCategoria = require('../models/subCategoria');

/**
 * OBTENER EL CARRITO DEL USUARIO AUTENTICADO
 * =================================================================
 * Get /api/carrito
 * 
 * @param {Object} req Request Express
 * @param {Object} res Response Express
 */
const obtenerCarrito = async (req, res) => {
    try {
        const itemCarrito = await Carrito.findAll({
            where: { usuarioUd: req.usuario.id },
            include: [{
                model: Producto,
                as: 'producto',
                attributes: ['id', 'nombre', 'descripcion', 'precio', 'stock', 'imagen', 'activo'],
                include: [
                    {
                        model: Categoria,
                        as: 'categoria',
                        attributes: ['id', 'nombre'],
                    },
                    {
                        model: SubCategoria,
                        as: 'subCategoria',
                        attributes: ['id', 'nombre'],
                    },
                ],
                order: [['nombre', 'ASC']]
            }]
        });

        // ====================================== Calcular el total del carrito ====================================
        let totalCarrito = 0;
        itemCarrito.forEach(item => {
            total += parseFloat(item.precioUnitario) * item.cantidad;
        });

        // ========================================= Respuesta exitosa =============================================
        res.json[{
            success: true,
            data: {
                items: itemCarrito,
                cantidadTotal: itemCarrito.reduce((sum, item) => sum + item.cantidad, 0),
                totalCarrito: total.toFixed(2),
            }
        }];
    } catch (error) {
        console.error('Error en obtenerCarrito:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener el carrito',
            error: error.message
        });
    }
}

/**
 * AGREGAR PRODUCTO AL CARRITO
 * =================================================================
 * POST /api/carrito
 * 
 * @param {Object} req Request Express
 * @param {Object} res Response Express
 */
const agregarAlCarrito = async (res, req) => {
    try {
        const { productoId, cantidadNUm = 1 } = req.body;

        // ====================================== Validar que haya un producto ====================================
        if (!productoId) {
            return res.status(404).json({
                success: false,
                message: 'El producto es requerido.'
            });
        }

        // ====================================== Validar que haya un producto ====================================
        const producto = await Producto.findByPk(productoId);
        if (!producto) {
            return res.status(404).json({
                success: false,
                message: 'El producto no existe.'
            });
        }

        // ====================================== Validar que el producto esté activo ====================================
        if (!producto.activo) {
            return res.status(400).json({
                success: false,
                message: 'El producto no se encuentra disponible.'
            });
        }

        // ====================================== Validar que la cantidad sea válida ====================================
        if (cantidadNUm < 1) {
            return res.status(400).json({
                success: false,
                message: 'La cantidad debe ser mayor o igual a 1.'
            });
        }

        // ====================================== Validar que la cantidad no exceda el stock ====================================
        if (cantidadNUm > producto.stock) {
            return res.status(400).json({
                success: false,
                message: `Stock insuficiente. Solo hay ${producto.stock} unidades disponibles.`
            });
        }
        // ====================================== Validar que el producto existe en el carrito del usuario ====================================
        const itemCarrito = await Carrito.findOne({
            where: { usuarioId, productoId }
        });

        if (itemCarrito) {
            return res.status(400).json({
                success: false,
                message: 'El producto ya se encuentra en el carrito.'
            });
        }

        // ====================================== Agregar el producto al carrito ====================================
        const nuevoItemCarrito = await Carrito.create({
            usuarioId,
            productoId,
            cantidad,
            precioUnitario: producto.precio,
            subtotal: producto.precio * cantidad
        });

        itemExistente.cantidad = nuevaCantidad;
        await itemExistente.save();

        await itemExistente.reload({
            include: [
                {
                    model: Producto,
                    as: 'producto',
                    attributes: ['id', 'nombre', 'descripcion', 'precio', 'stock', 'imagen', 'activo'],
                }
            ]
        });

        res.json({
            success: true,
            message: 'Cantidad actualizada en el carrito.',
            data: itemExistente
        });
        // ========================================= Recarga con producto =============================================
        await nuevoItemCarrito.reload({
            include: [
                {
                    model: Producto,
                    as: 'producto',
                    attributes: ['id', 'nombre', 'descripcion', 'precio', 'stock', 'imagen', 'activo'],
                }
            ]
        })

        res.json({
            success: true,
            message: 'Producto agregado al carrito.',
            data: nuevoItemCarrito
        });

    } catch (error) {
        console.error('Error en agregarAlCarrito:', error);
        res.status(500).json({
            success: false,
            message: 'Error al agregar el producto al carrito',
            error: error.message
        });
    }
};

/**
 * ACTUALIZAR LA CANTIDAD DE UN PRODUCTO EN EL CARRITO
 * =================================================================
 * PUT /api/carrito/:id
 * 
 * @param {Object} req Request Express
 * @param {Object} res Response Express
 */
const actualizarItemCarrito = async (req, res) => {
    try {
        const { id } = req.params;
        const { cantidad } = req.body;

        // ====================================== Validar que haya un producto ====================================
        const itemCarrito = await Carrito.findByPk(id);
        if (!itemCarrito) {
            return res.status(404).json({
                success: false,
                message: 'El producto no existe en el carrito.'
            });
        }

        // ====================================== Validar que la cantidad sea válida ====================================
        const cantidadNUm = parseInt(cantidad);
        if (cantidadNUm < 1) {
            return res.status(400).json({
                success: false,
                message: 'La cantidad debe ser mayor o igual a 1.'
            });
        }

        // ========================================= Buscar el item del carrito ========================================= 
        const item = await Carrito.findOne({
            where: {
                id,
                usuarioId: req.usuario.id
            },
            include: [
                {
                    model: Producto,
                    as: 'producto',
                    attributes: ['id', 'nombre', 'descripcion', 'precio', 'stock', 'imagen', 'activo'],
                }
            ]
        });

        // ====================================== Validar que la cantidad no exceda el stock ====================================
        const producto = await Producto.findByPk(item.productoId);
        if (!producto) {
            return res.status(404).json({
                success: false,
                message: 'El producto no existe.'
            });
        }

        // ====================================== Validar que el producto esté activo ====================================
        if (!producto.activo) {
            return res.status(400).json({
                success: false,
                message: 'El producto no se encuentra disponible.'
            });
        }

        // ====================================== Actualizar la cantidad del producto en el carrito ====================================
        item.cantidad = cantidad;
        item.subtotal = producto.precio * cantidad;
        await item.save();

        // ========================================= Recarga con producto =============================================
        await item.reload({
            include: [
                {
                    model: Producto,
                    as: 'producto',
                    attributes: ['id', 'nombre', 'descripcion', 'precio', 'stock', 'imagen', 'activo'],
                }
            ]
        })

        res.json({
            success: true,
            message: 'Cantidad actualizada en el carrito.',
            data: item
        });
    } catch (error) {
        console.error('Error en actualizarItemCarrito:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar el producto en el carrito',
            error: error.message
        });
    }
};

/**
 * ELIMINAR ITEM DEL CARRITO
 * =================================================================
 * DELETE /api/carrito/:id
 * 
 * @param {Object} req Request Express
 * @param {Object} res Response Express
 */
const eliminarItemCarrito = async (req, res) => {
    try {
        const { id } = req.params;

        // ====================================== Validar que haya un producto ====================================
        const itemCarrito = await Carrito.findByPk(id);
        if (!itemCarrito) {
            return res.status(404).json({
                success: false,
                message: 'El producto no existe en el carrito.'
            });
        }

        // ====================================== Eliminar el producto del carrito ====================================
        await itemCarrito.destroy();

        res.json({
            success: true,
            message: 'Producto eliminado del carrito.',
            data: itemCarrito
        });
    } catch (error) {
        console.error('Error en eliminarItemCarrito:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar el producto del carrito',
            error: error.message
        });
    }
};

/**
 * VACIAR EL CARRITO
 * =================================================================
 * DELETE /api/carrito
 * 
 * @param {Object} req Request Express
 * @param {Object} res Response Express
 */
const vaciarCarrito = async (req, res) => {
    try {

        // ====================================== Eliminar todos los items del usuario ====================================
        const numEliminados = await Carrito.destroy({
            where: {
                usuarioId: req.usuario.id
            }
        });

        res.json({
            success: true,
            message: 'Carrito vaciado correctamente.',
            data: numEliminados
        });
    } catch (error) {
        console.error('Error en vaciarCarrito:', error);
        res.status(500).json({
            success: false,
            message: 'Error al vaciar el carrito',
            error: error.message
        });
    }
};

//========================================== Expotar modulos ====================================

module.exports = {
    obtenerCarrito,
    agregarAlCarrito,
    actualizarItemCarrito,
    eliminarItemCarrito,
    vaciarCarrito
};
