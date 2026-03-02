/**
 * CONTROLADOR DE PEDIDOS
 * =================================================================
 * Gestión de pedidos
 * Requiere autenticación
 */

// IMPORTAR MODELOS
const Pedidos = require('../models/pedido');
const DetallePedido = require('../models/detallePedido');
const Producto = require('../models/Producto');
const Carrito = require('../models/carrito');
const Usuario = require('../models/usuario');

/**
 * CREAR PEDIDO DESDE EL CARRITO (CHECKOUT)
 * ======================================================
 * POST /api/cliente/pedidos
 */
const crearPedido = async (req, res) => {
    const { sequelize } = require('../config/dataBase');
    const t = await sequelize.transaction();

    try {
        const { dirreccionEnvio, telefono, metodoPago = 'efectivo', notasAdicionales } = req.body;
        if (!dirreccionEnvio || !telefono) {
            await t.rollback();
            return res.status(400).json({
                success: false,
                message: 'La dirección de envío y el teléfono son obligatorios.'
            });
        }
    } catch (error) {
        await t.rollback();
        console.error('Error en crearPedido:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear el pedido',
            error: error.message
        });
    }

    const carritoItems = await Carrito.findAll({
        where: { usuarioId: req.usuario.id },
        include: [{
            model: Producto,
            as: 'producto',
            attributes: ['id', 'nombre', 'descripcion', 'precio', 'stock', 'imagen', 'activo'],
            transaction: t
        }],
    });
    if (itemsCarrito.length === 0) {
        await t.rollback();
        return res.status(400).json({
            success: false,
            message: 'El carrito está vacío.'
        });
    }

    // ========================================= Validar metodos de pago ============================
    const metodosValidos = ['efectivo', 'tarjeta', 'transferencia'];
    if (!metodosValidos.includes(metodoPago)) {
        await t.rollback();
        return res.status(400).json({
            success: false,
            message: 'El método de pago no es válido, solo las opciones: ' + metodosValidos.join(', ') + ' son permitidas.'
        });
    }
};