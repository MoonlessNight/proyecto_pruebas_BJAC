/**
 * MODELO DETALLE PEDIDO
 * Define la tabla "detalles_pedido" en la base de datos
 * Almacena los productos incluidos en cada pedido
 */

const { DataTypes } = require("sequelize");
const { sequelize } = require('../config/dataBase.cjs');

const DetallePedido = sequelize.define("DetallePedido", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    pedidoId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "pedidos",
            key: "id"
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        validate: {
            notNull: { msg: "Debe especificar un pedido" }
        }
    },
    productoId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "productos",
            key: "id"
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
        validate: {
            notNull: { msg: "Debe especificar un producto" }
        }
    },
    cantidad: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        validate: {
            isInt: { msg: "La cantidad debe ser un número entero" },
            min: { args: [1], msg: "La cantidad debe ser al menos 1" }
        }
    },
    precioUnitario: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            isDecimal: { msg: "El precio unitario debe ser un número decimal" },
            min: { args: [0], msg: "El precio unitario no puede ser negativo" }
        }
    },
    subtotal: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            isDecimal: { msg: "El subtotal debe ser un número decimal" },
            min: { args: [0], msg: "El subtotal no puede ser negativo" }
        }
    }
}, {
    tableName: "detalles_pedido",
    timestamps: true,
    underscored: true,  // Convierte createdAt → created_at, etc.

    indexes: [
        {
            // Índice para búsquedas por pedido (usar nombre de columna en BD)
            fields: ["pedido_id"]
        },
        {
            // Índice para búsquedas por producto
            fields: ["producto_id"]
        },
        {
            // Índice único compuesto para evitar duplicados en un mismo pedido
            unique: true,
            fields: ["pedido_id", "producto_id"],
            name: "pedido_producto_unico"
        }
    ],

    hooks: {
        beforeCreate: (detalle) => {
            detalle.subtotal = parseFloat(detalle.precioUnitario) * detalle.cantidad;
        },
        beforeUpdate: (detalle) => {
            if (detalle.changed("precioUnitario") || detalle.changed("cantidad")) {
                detalle.subtotal = parseFloat(detalle.precioUnitario) * detalle.cantidad;
            }
        }
    }
});

// Métodos de instancia
DetallePedido.prototype.calcularSubtotal = function() {
    return parseFloat(this.precioUnitario) * this.cantidad;
};

// Métodos estáticos
DetallePedido.crearDesdeCarrito = async function(pedidoId, itemsCarrito) {
    const detalles = [];
    for (const item of itemsCarrito) {
        const detalle = await DetallePedido.create({
            pedidoId,
            productoId: item.productoId,
            cantidad: item.cantidad,
            precioUnitario: item.precioUnitario
        });
        detalles.push(detalle);
    }
    return detalles;
};

DetallePedido.calcularTotalPedido = async function(pedidoId) {
    const detalles = await this.findAll({ where: { pedidoId } });
    return detalles.reduce((total, d) => total + parseFloat(d.subtotal), 0);
};

// Nota: el método obtenerMasVendidos requiere acceso a Sequelize para funciones de agregación,
// pero podemos dejarlo para después o implementarlo correctamente.
// Por ahora lo omitimos o lo dejamos comentado.

module.exports = DetallePedido;