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
        const { direccionEnvio, telefono, metodoPago = 'efectivo', notasAdicionales } = req.body;

        // Validar campos obligatorios
        if (!direccionEnvio || !telefono) {
            await t.rollback();
            return res.status(400).json({
                success: false,
                message: 'La dirección de envío y el teléfono son obligatorios.'
            });
        }

        // Validar métodos de pago
        const metodosValidos = ['efectivo', 'tarjeta', 'transferencia'];
        if (!metodosValidos.includes(metodoPago)) {
            await t.rollback();
            return res.status(400).json({
                success: false,
                message: 'El método de pago no es válido, solo las opciones: ' + metodosValidos.join(', ') + ' son permitidas.'
            });
        }

        // Obtener items del carrito
        const carritoItems = await Carrito.findAll({
            where: { usuarioId: req.usuario.id },
            include: [{
                model: Producto,
                as: 'producto',
                attributes: ['id', 'nombre', 'descripcion', 'precio', 'stock', 'imagen', 'activo']
            }],
            transaction: t
        });

        if (!carritoItems || carritoItems.length === 0) {
            await t.rollback();
            return res.status(400).json({
                success: false,
                message: 'El carrito está vacío.'
            });
        }

        // Verificar stock y productos activos
        const erroresValidos = [];
        let totalPedido = 0;

        for (const item of carritoItems) {
            const producto = item.producto;

            if (!producto) {
                erroresValidos.push(`Producto no encontrado para el item.`);
                continue;
            }

            if (!producto.activo) {
                erroresValidos.push(`El producto ${producto.nombre} no está disponible.`);
                continue;
            }

            if (producto.stock < item.cantidad) {
                erroresValidos.push(`${producto.nombre}: stock insuficiente (disponible: ${producto.stock}, solicitado: ${item.cantidad})`);
                continue;
            }

            totalPedido += producto.precio * item.cantidad;
        }

        if (erroresValidos.length > 0) {
            await t.rollback();
            return res.status(400).json({
                success: false,
                message: 'Errores en el pedido',
                errors: erroresValidos
            });
        }

        // Crear pedido
        const pedido = await Pedidos.create({
            usuarioId: req.usuario.id,
            direccionEnvio,
            telefono,
            metodoPago,
            notasAdicionales,
            total: totalPedido,
            estado: 'pendiente'
        }, { transaction: t });

        // Crear detalle del pedido y actualizar stock
        for (const item of carritoItems) {
            await DetallePedido.create({
                pedidoId: pedido.id,
                productoId: item.productoId,
                cantidad: item.cantidad,
                precioUnitario: item.producto.precio,
                subtotal: (item.producto.precio * item.cantidad),
            }, { transaction: t });

            // Actualizar stock del producto
            const producto = item.producto;
            producto.stock -= item.cantidad;
            await producto.save({ transaction: t });
        }

        // Limpiar carrito
        await Carrito.destroy({ where: { usuarioId: req.usuario.id }, transaction: t });

        // Confirmar transacción
        await t.commit();

        // Cargar pedido con relaciones para la respuesta
        await pedido.reload({
            include: [
                {
                    model: Usuario,
                    as: 'usuario',
                    attributes: ['id', 'nombre', 'email']
                },
                {
                    model: DetallePedido,
                    as: 'detallesPedido',
                    include: [
                        {
                            model: Producto,
                            as: 'producto',
                            attributes: ['id', 'nombre', 'descripcion', 'precio', 'imagen']
                        }
                    ]
                }
            ]
        });

        res.status(201).json({
            success: true,
            message: 'Pedido creado exitosamente',
            data: { pedido }
        });

    } catch (error) {
        if (t && !t.finished) await t.rollback();
        console.error('Error al crear el pedido:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear el pedido',
            error: error.message
        });
    }
};

/**
 * OBTENER TODOS LOS PEDIDOS DE UN USUARIO
 * ======================================================
 * GET /api/cliente/pedidos
 */
const obtenerPedidos = async (req, res) => {
    try {
        const { estado, pagina = 1, limite = 10 } = req.query;

        //Filtros
        const where = { usuarioId: req.usuario.id };
        if (estado) where.estado = estado;

        // Paginacion
        const offset = (parseInt(pagina) - 1) * parseInt(limite);

        // Calcular pedidos
        const { count, rows: pedidos } = await Pedidos.findAndCountAll({
            where,
            limit: parseInt(limite),
            offset,
            order: [['createdAt', 'DESC']],
            include: [
                {
                    model: DetallePedido,
                    as: 'detallesPedido',
                    attributes: ['id', 'cantidad', 'precioUnitario', 'subtotal'],
                    include: [
                        {
                            model: Producto,
                            as: 'producto',
                            attributes: ['id', 'nombre', 'descripcion', 'precio', 'imagen']
                        }
                    ]
                }
            ],
            limite: parseInt(limite),
            offset,
            order: [['createdAt', 'DESC']],
        })

        res.json({
            success: true,
            message: 'Pedidos obtenidos exitosamente',
            data: {
                pedidos,
                pagination: {
                    pagina,
                    limite,
                    total: count,
                    totalPages: Math.ceil(count / parseInt(limite))
                }
            }
        })
    } catch (error) {
        console.error('Error al obtener los pedidos:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener los pedidos',
            error: error.message
        });
    }
};


/**
 * OBTENER PEDIDO ESPECIFICO POR ID
 * =============================================
 * GET / api/cliente/pedidos/:id
 * Solo puede ver sus pedidos admin todos
 */
const obtenerPedidoPorId = async (res, res) => {
    try {
        const { id } = req.params;

        // Construir filtros (cliente solo ve sus pedidos, admin ve todos)
        const where = { id };
        if (req.usuario.rol === 'administrador') {
            where.usuarioId = req.usuario.id;
        }

        // Buscar pedido
        const pedido = await Pedidos.findOne({
            where,
            include: [
                {
                    model: Usuario,
                    as: 'usuario',
                    attributes: ['id', 'nombre', 'email'],
                    include: [
                        {
                            model: DetallePedido,
                            as: 'detalles',
                            include: [
                                {
                                    model: Producto,
                                    as: 'producto',
                                    attributes: ['id', 'nombre', 'descripcion', 'imagen'],
                                },
                            ]
                        },
                        {
                            model: Categoria,
                            as: 'categoria',
                            attributes: ['id', 'nombre']
                        },
                        {
                            model: SubCategoria,
                            as: 'subcategoria',
                            attributes: ['id', 'nombre']
                        }]
                },]
        });

        if (!pedido) {
            return res.status(404).json({
                success: false,
            });
        }

        res.json({
            success: true,
            data: { pedido }
        })
    } catch (error) {
        console.error('Error al obtener el pedido:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener el pedido',
            error: error.message
        });
    }
};

/**
 * CANCELAR PEDIDO
 * =============================================
 * PUT / api/cliente/pedidos/:id/cancelar
 * Solo puede cancelar si el estado es pendiente
 * devuelve el stock a los productos
 */
const cancelarPedido = async (req, res) => {
    const { sequelize } = require("../config/dataBase");
    const t = await sequelize.transaction();
    try {
        const { id } = req.params;

        // Buscar pedido solo los propios pedidos
        const pedido = await Pedido.findOne({
            where: {
                id,
                usuarioId: req.usuario.id
            },
            include: [{
                model: DetallePedido,
                as: 'detalles',
                include: [{
                    model: Producto,
                    as: 'producto',
                    transaction: t
                }]
            }],
            transaction: t
        });

        if (!pedido) {
            await t.rollback();
            return res.status(404).json({
                success: false,
                message: 'Pedido no encontrado'
            });
        }

        // Solo se puede cacncelar si esta en pendiente
        if (pedido.estado !== 'pendiente') {
            await t.rollback();
            return res.status(400).json({
                success: false,
                message: `No se puede cancelar un pedido en estado: ${pedido.estado}'`
            });
        }

        // Devolver stock de los productos
        for (const detalle of pedido.detalles) {
            const producto = detalle.producto;
            producto.stock += detalle.cantidad;
            await producto.save({ transaction: t });
        }

        //Actualizar estado del pedido
        pedido.estado = 'cancelado';
        await pedido.save({ transaction: t });

        await t.commit();

        // Respuesta exitosa
        res.json({
            success: true,
            message: 'Pedido cancelado exitosamente'
        })
    } catch (error) {
        await t.rollback();
        console.error('Error al cancelar el pedido:', error);
        res.status(500).json({
            success: false,
            message: 'Error al cancelar el pedido',
            error: error.message
        });
    }
}