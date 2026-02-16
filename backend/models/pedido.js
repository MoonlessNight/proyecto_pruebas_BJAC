/**
 * MODELO PEDIDO
 * Define la tabla pedido en la base de datos
 * almacena la información de los pedidos realizados por los usuarios
 */

// importar DataTypes de sequelize
const { DataTypes } = require("sequelize");

// importar instancia de sequelize
const { sequelize } = require("../config/dataBase");

/**
 * Definir el modelo de pedido
 */
const Pedido = sequelize.define("Pedido", {
    // Campos de la tabla
    // id identificador unico (PRIMARY KEY)
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    /**
     * usuarioID es el id usario que realizó el pedido (FOREIGN KEY)
     */
    usuarioID: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "usuarios",
            key: "id"
        },
        onUpdate: "CASCADE",
        onDelete: "ResTRICT", // No se puede eliminar un usuario con pedidos realizados
        validate: {
            notNull: {
                msg: "El pedido debe pertenecer a un usuario"
            }
        }
    },

    // Monto total del pedido
    total: {
        type: DataTypes.DECIMAL(10, 2), // hasta 99.99,999.99
        allowNull: false,
        validate: {
            isDecimal: {
                msg: "El total del pedido debe ser un numero decimal"
            },
            min: {
                args: [0],
                msg: "El total del pedido no puede ser negativo"
            }
        }
    },

    /**
     * Estado - Estado actual del pedido
     * Valores posibles:
     * - "pendiente" - Pedido creado, esperando pago
     * - "pagado" - Pedido pagado, en progreso
     * - "enviado" - Pedido enviado al cliente
     * - "entregado" - Pedido entregado al cliente
     * - "cancelado" - Pedido cancelado por el cliente o el sistema
     */
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
    // Dirección de envío del pedido
    direccionEnvio: {
        type: DataTypes.TEXT,
        allowNull: false,
            validate: {
                notEmpty: {
                    msg: "La dirección de envío es obligatoria"
                },
                len: {
                    args: [10, 500],
                    msg: "La dirección de envío debe tener entre 10 y 500 caracteres"
                }
            }
    },
    // Número de teléfono para el pedido
    telefono: {
        type: DataTypes.STRING(20),
        allowNull: false,
        validate: {
            notEmpty: {
                msg: "El número de teléfono es obligatorio"
            }
        }
    },

    // notas adicionales del pedido (opcional)
    notas: {
        type: DataTypes.TEXT,
        allowNull: true,
    }, 

});