/**
 * MODELO CARRITO
 * Define la tabla carrito en la base de datos
 * Almacena los productos que cada usuario ha agregado a su carrito de compras
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/dataBase.cjs');

const Carrito = sequelize.define('Carrito', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    // Clave foránea del usuario (unificada a usuarioId)
    usuarioId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'usuarios',
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        validate: {
            notNull: { msg: 'El carrito debe pertenecer a un usuario' }
        }
    },
    // Clave foránea del producto (unificada a productoId)
    productoId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'productos',
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        validate: {
            notNull: { msg: 'El carrito debe contener un producto' }
        }
    },
    cantidad: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        validate: {
            isInt: { msg: 'La cantidad debe ser un número entero' },
            min: {
                args: [1],
                msg: 'La cantidad debe ser al menos 1'
            }
        }
    },
    precioUnitario: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            isDecimal: { msg: 'El precio unitario debe ser un número decimal' },
            min: {
                args: [0],
                msg: 'El precio unitario no puede ser negativo'
            }
        }
    }
}, {
    tableName: 'carritos',
    timestamps: true,
    underscored: true, // Convierte createdAt → created_at, updatedAt → updated_at
    indexes: [
        {
            // Índice para búsquedas por usuario
            fields: ['usuario_id'] // Nota: en snake_case por underscored: true
        },
        {
            // Índice único: un usuario no puede tener el mismo producto duplicado
            unique: true,
            fields: ['usuario_id', 'producto_id'],
            name: 'usuario_producto_unico'
        }
    ],
    hooks: {
        beforeCreate: async (itemCarrito) => {
            const Producto = require('./producto');
            const producto = await Producto.findByPk(itemCarrito.productoId);
            if (!producto) {
                throw new Error('El producto seleccionado no existe.');
            }
            if (!producto.activo) {
                throw new Error('No se puede agregar un producto inactivo al carrito.');
            }
            // Usamos el método hayStock (definido en producto.js)
            if (!producto.hayStock(itemCarrito.cantidad)) {
                throw new Error(`Stock insuficiente. Solo hay ${producto.stock} unidades disponibles.`);
            }
            // Guardar el precio actual del producto
            itemCarrito.precioUnitario = producto.precio;
        },
        beforeUpdate: async (itemCarrito) => {
            if (itemCarrito.changed('cantidad')) {
                const Producto = require('./producto');
                const producto = await Producto.findByPk(itemCarrito.productoId);
                if (!producto) {
                    throw new Error('El producto asociado al item del carrito no existe.');
                }
                if (!producto.hayStock(itemCarrito.cantidad)) {
                    throw new Error(`Stock insuficiente. Solo hay ${producto.stock} unidades disponibles.`);
                }
            }
        }
    }
});

// Métodos de instancia
Carrito.prototype.calcularSubtotal = function () {
    return parseFloat(this.precioUnitario) * parseFloat(this.cantidad);
};

Carrito.prototype.actualizarCantidad = async function (nuevaCantidad) {
    const Producto = require('./producto');
    const producto = await Producto.findByPk(this.productoId);
    if (!producto.hayStock(nuevaCantidad)) {
        throw new Error(`Stock insuficiente. Solo hay ${producto.stock} unidades disponibles.`);
    }
    this.cantidad = nuevaCantidad;
    await this.save();
};

// Métodos estáticos
Carrito.obtenerCarritoUsuario = async function (usuarioId) {
    const Producto = require('./producto');
    return await Carrito.findAll({
        where: { usuarioId },
        include: [
            {
                model: Producto,
                as: 'producto'
            }
        ],
        order: [['createdAt', 'DESC']]
    });
};

Carrito.calcularTotalCarrito = async function (usuarioId) {
    const items = await this.findAll({ where: { usuarioId } });
    return items.reduce((total, item) => total + item.calcularSubtotal(), 0);
};

Carrito.vaciarCarrito = async function (usuarioId) {
    return await Carrito.destroy({ where: { usuarioId } });
};

module.exports = Carrito;