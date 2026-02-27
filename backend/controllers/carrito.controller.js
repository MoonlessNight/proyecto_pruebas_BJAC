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
    }
}


