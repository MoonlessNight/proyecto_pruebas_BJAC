/**
 * MODELO PEDIDO
 * Define la tabla pedido en la base de datos
 * almacena la información de los pedidos realizados por los usuarios
 */

const { DataTypes } = require("sequelize");
const { sequelize } = require('../config/dataBase.cjs');

const Pedido = sequelize.define("Pedido", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    usuarioId: {   // Cambiado a usuarioId (camelCase) para mantener consistencia
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "usuarios",
            key: "id"
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
        validate: {
            notNull: { msg: "El pedido debe pertenecer a un usuario" }
        }
    },
    total: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            isDecimal: { msg: "El total del pedido debe ser un numero decimal" },
            min: { args: [0], msg: "El total del pedido no puede ser negativo" }
        }
    },
    estado: {
        type: DataTypes.ENUM("pendiente", "pagado", "enviado", "entregado", "cancelado"),
        allowNull: false,
        defaultValue: "pendiente",
        validate: {
            isIn: {
                args: [["pendiente", "pagado", "enviado", "entregado", "cancelado"]],
                msg: "Estado invalido"
            }
        }
    },
    direccionEnvio: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
            notEmpty: { msg: "La dirección de envío es obligatoria" },
            len: { args: [10, 500], msg: "La dirección de envío debe tener entre 10 y 500 caracteres" }
        }
    },
    telefono: {
        type: DataTypes.STRING(20),
        allowNull: false,
        validate: {
            notEmpty: { msg: "El número de teléfono es obligatorio" }
        }
    },
    notas: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    fechaPago: {
        type: DataTypes.DATE,
        allowNull: true
    },
    fechaEnvio: {
        type: DataTypes.DATE,
        allowNull: true
    },
    fechaEntrega: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    tableName: "pedidos",
    timestamps: true,
    underscored: true, // Convierte createdAt → created_at, updatedAt → updated_at, y usuarioId → usuario_id
    indexes: [
        { fields: ["usuario_id"] },   // nombre en snake_case porque así se llama la columna en BD
        { fields: ["estado"] },
        { fields: ["created_at"] }     // created_at, no createdAt
    ],
    hooks: {
        afterUpdate: async (pedido) => {
            if (pedido.changed("estado") && pedido.estado === "pagado") {
                pedido.fechaPago = new Date();
                await pedido.save({ hooks: false });
            }
            if (pedido.changed("estado") && pedido.estado === "enviado") {
                pedido.fechaEnvio = new Date();
                await pedido.save({ hooks: false });
            }
            if (pedido.changed("estado") && pedido.estado === "entregado") {
                pedido.fechaEntrega = new Date();
                await pedido.save({ hooks: false });
            }
        },
        beforeDestroy: async (pedido) => {
            if (pedido.estado !== "pendiente") {
                throw new Error("No se puede eliminar un pedido que no esté pendiente. Use el estado 'cancelado' en su lugar.");
            }
        }
    }
});

// Métodos de instancia
Pedido.prototype.cambiarEstado = async function (nuevoEstado) {
    const estadosValidos = ["pendiente", "pagado", "enviado", "entregado", "cancelado"];
    if (!estadosValidos.includes(nuevoEstado)) {
        throw new Error("Estado inválido.");
    }
    this.estado = nuevoEstado;
    return await this.save();
};

Pedido.prototype.puedeSerCancelado = function () {
    return ["pendiente", "pagado"].includes(this.estado);
};

Pedido.prototype.cancelarPedido = async function () {
    if (!this.puedeSerCancelado()) {
        throw new Error("Este pedido no puede ser cancelado");
    }
    const DetallePedido = require("./detallePedido");
    const Producto = require("./producto");
    const detalles = await DetallePedido.findAll({ where: { pedidoId: this.id } });
    for (const detalle of detalles) {
        const producto = await Producto.findByPk(detalle.productoId);
        if (producto) {
            await producto.aumentarStock(detalle.cantidad);
            console.log(`Stock devuelto: ${detalle.cantidad} x ${producto.nombre}`);
        }
    }
    this.estado = "cancelado";
    return await this.save();
};

Pedido.prototype.obtenerDetalle = async function () {
    const DetallePedido = require("./detallePedido");
    const Producto = require("./producto");
    return await DetallePedido.findAll({
        where: { pedidoId: this.id },
        include: [{ model: Producto, as: "producto" }]
    });
};

// Métodos estáticos
Pedido.obtenerPorEstado = async function (estado) {
    const Usuario = require("./usuario");
    return await this.findAll({
        where: { estado },
        include: [{ model: Usuario, as: "usuario", attributes: ["id", "nombre", "email", "telefono"] }],
        order: [["createdAt", "DESC"]]
    });
};

Pedido.obtenerHistorialDelUsuario = async function (usuarioId) {
    return await this.findAll({
        where: { usuarioId },
        order: [["createdAt", "DESC"]]
    });
};

module.exports = Pedido;