/**
 * MODELO DETALLE PEDIDO
 * Define la tabla "DetallePedido" en la base de datos
 * Almacena los productos incluidos en cada pedido
 * Relación muchos a muchos entre Pedido y Producto
 */

// importar DataTypes de sequelize
const { DataTypes } = require("sequelize");

// importar instancia de sequelize
const { sequelize } = require("../config/dataBase");

/**
 * Definir el modelo de DetallePedido
 */
const DetallePedido = sequelize.define("DetallePedido", {
    // Campos de la tabla 
    // id identificador unico (PRIMARY KEY)
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },

    /**
     * pedidoId - ID del pedido al que pertenece este detalle (FOREIGN KEY) 
     */
    pedidoId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "pedidos",
            key: "id"
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE", // si se elimina el pedido se eliminan sus detalles
        validate: {
            notNull: {
                msg: "Debe especificar un pedido"
            }
        }
    },

    /**
     * productoID - ID del producto en el pedido
     */
    productoID: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "productos",
            key: "id"
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT", // No se puede eliminar un producto con un pedido
        validate: {
            notNull: {
                msg: "Debe especificar un producto"
            }
        }
    },

    // cantidad de este producto en el pedido 
    cantidad: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        validate: {
            isInt: {
                msg: "la cantidad debe ser un numero entero"
            },
            min: {
                args: [1],
                msg: "la cantidad debe ser al menos 1"
            }
        }
    },

    /**
     * Precio Unitario del producto al momento de agregarlo al pedido
     * se guarda para mantener el precio historico aunque el producto cambie después
     */
    precioUnitario: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            isDecimal: {
                msg: "el precio unitario debe ser un numero decimal"
            },
            min: {
                args: [0],
                msg: "el precio unitario no puede ser negativo"
            }
        }
    },

    /**
     * SubTotal de este item (cantidad * precioUnitario)
     * se calcula automaticamente antes de guardar el detalle del pedido
     */
    subtotal: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            isDecimal: {
                msg: "el subtotal debe ser un número decimal válido"
            },
            min: {
                args: [0],
                msg: "el subtotal no puede ser negativo"
            }
        }
    }

}, {
    // opciones del modelo
    tableName: "detalles_pedido", // Cambiado de "carritos" a un nombre más apropiado
    timestamps: true,
    
    // indices para mejorar las busquedas
    indexes: [
        {
            // indice para buscar detalles por pedido
            fields: ["pedidoId"]
        },
        {
            // indice para buscar detalles por producto
            fields: ["productoID"],
        }
    ],

    /**
     * Hooks acciones automaticas
     */
    hooks: {
        /**
         * beforeCreate - Se ejecuta antes de crear un detalle de pedido
         * calcula el subtotal automaticamente
         */
        beforeCreate: (detalle) => {
            // Calcular el subtotal precioUnitario * cantidad
            detalle.subtotal = parseFloat(detalle.precioUnitario) * parseFloat(detalle.cantidad);
        },

        /**
         * beforeUpdate - Se ejecuta antes de actualizar el detalle del pedido
         * Recalcula el subtotal si se actualiza la cantidad o precio
         */
        beforeUpdate: (detalle) => {
            // verificar si se actualiza la cantidad o precio unitario
            if (detalle.changed("precioUnitario") || detalle.changed("cantidad")) {
                detalle.subtotal = parseFloat(detalle.precioUnitario) * parseFloat(detalle.cantidad);
            }
        }
    }
});

// MÉTODOS DE INSTANCIA

/**
 * Metodo para obtener información completa del producto
 * 
 * @return {number} subtotal (cantidad * precioUnitario)
 */
DetallePedido.prototype.calcularSubtotal = async function() {
    return parseFloat(this.precioUnitario) * this.cantidad;
};

// MÉTODOS DE CLASE (ESTÁTICOS)

/**
 * Método para crear detalles del pedido desde el carrito
 * convierte los items del carrito en detalles del pedido
 * 
 * @param {number} pedidoID - ID del pedido
 * @param {array} itemsCarrito - items del carrito
 * @returns {Promise<Array>} - Detalles del pedido creados
 */
DetallePedido.crearDesdeCarrito = async function(pedidoID, itemsCarrito) {
    const detalles = [];
    
    for (const item of itemsCarrito) {
        const detalle = await DetallePedido.create({
            pedidoId: pedidoID,
            productoID: item.productoID,
            cantidad: item.cantidad,
            precioUnitario: item.precioUnitario
        });
        detalles.push(detalle);
    }
    
    return detalles;
};

/**
 * Metodo para calcular el total del pedido desde sus detalles
 * 
 * @param {number} pedidoID - ID del pedido
 * @return {Promise<number>} - Total calculado
 */
DetallePedido.calcularTotalPedido = async function(pedidoID) {
    const detalles = await this.findAll({ where: { pedidoId: pedidoID } });

    let total = 0;
    for (const detalle of detalles) {
        total += parseFloat(detalle.subtotal);
    }

    return total;
};

/**
 * Metodo para obtener resumen de productos más vendidos
 * 
 * @param {number} limite - Número máximo de productos a retornar
 * @return {Promise<Array>} - Lista de productos más vendidos
 */
DetallePedido.obtenerMasVendidos = async function(limite = 10) {
    return await this.findAll({
        attributes: [
            "productoID",
            [sequelize.fn("SUM", sequelize.col("cantidad")), "totalVendido"]
        ],
        group: ["productoID"],
        order: [[sequelize.fn("SUM", sequelize.col("cantidad")), "DESC"]],
        limit: limite
    });
};

/**
 * Metodo para vaciar los detalles de un pedido
 * útil si se necesita cancelar un pedido
 * 
 * @param {number} pedidoID - ID del pedido
 * @return {Promise<number>} - Numero de items eliminados
 */
DetallePedido.vaciarDetallesPedido = async function(pedidoID) {
    return await DetallePedido.destroy({ where: { pedidoId: pedidoID } });
};

/**
 * Exportar Modelo
 */
module.exports = DetallePedido;