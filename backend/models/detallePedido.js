/**
 * MODElO DETALLE PEDIDO
 * Define la tabla "DetallePedido" en la base de datos
 * Almacena los productos incluidosem cada pedido
 * Realación muchos a muchos entre Pedido y Producto
 */


// importar DataTypes de sequelize
const { DataTypes } = require("sequelize");

// importar instancia de sequelize
const { sequelize } = require("../config/dataBase");

/**
 * Definir  el modelo de DetallePedido
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
     * producto ID del producto en el carrito
     */
    productoID:{
        type: DataTypes.INTEGER,
        allowNull: false,
        references:{
            model:"productos",
            key:"id"
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT", // No se puede eliminar un producto con un pedido
        validate:{
            notNull:{
                msg:"Debe especificar un producto"
            }
        }
    },

    //cantidad de este producto en el carrito 
    cantidad:{
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        validate:{
            isInt:{
                msg:"la cantidad debe ser un numero entero"

            },
            min:{
                args:[1],
                msg:"la cantidad debe ser al menos 1"
            }
    }
},

/**
 * Precio Unitario del producto al momento de agregarlo al carrito 
 * se guardan para mantener el precio historico aunque el producto cambie después
 */
precioUnitario:{
    type: DataTypes.DECIMAL(10,2),
    allowNull: false,
    validate:{
        isDecimal:{
            msg:"el precio unitario debe ser un numero decimal"
        },
        min:{
            args:[0],
            msg:"el precio unitario no puede ser negativo"
          }
      }
    },
    

/**
 * SubTotal de este itrem (cantidad * precioUnitario)
 * se calcula automaticamente antes de guardar el detalle del pedido
 */
subtotal: {
    type: DataTypes.DECIMAL(10,2),
    allowNull: false,
    validate:{
        isDecimal:{
            msg:"el subtotal debe ser un número decimal válido"
        },
        min:{
            args:[0],
            msg:"el subtotal no puede ser negativo"
            }
        }
    },

}, {
    // opciones del modelo

    tableName: "carritos",
    timestamps: true,
    //indices para mejorar las busquedas por usuarioID y productoID
    indexes:[
        {
            //indice para buscar carrito por usuario
            fields:["pedidoId"]
        },
        {
            //Indice compuesto: un usuario no puede tener el mismo producto duplicado
            fields:["productoID"],
        }
    ],
     
        /**
         * Hooks acciones automaticas
         */
        hooks : {
        /**
         * beforeCreate-se ejecutan antes de crear un detalle de pedido
         * calcula el subtotal automaticamente
         */
        beforeCreate: (dettalle) => {
            //Calcular el subtotal precioUnitario * cantidad
            dettalle.subtotal = parseFloat(dettalle.precioUnitario) * parseFloat(dettalle.cantidad);
        },

        /**
         * beforeUpdate - Se ejecuta antes de actualizar el detalle del pedido
         * Recalcula el subtotal si se actualiza la cantidad o precio
         */
        beforeUpdate: async (itemCarrito) => {
            // verificar si se actualiza la cantidad
            if (itemCarrito.changed("precioUnitario") || detalle.changed("cantidad")) {
                detalle.subtotal = parseFloat(detalle.precioUnitario) * parseFloat(detalle.cantidad);
            }
        }
    }
});                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         

//METODOS DE INSTANCIA}

/**
 * Metodo para obtener información completa del producto
 * 
 * @return {number} subtotal (cantidad * precioUnitario)
 * */
DettallePedido.prototype.calcularSubtotal = async function() {
    return parseFloat(this.precioUnitario) * this.cantidad;
};

/**
 * Método para crear un detalles del pedido desde el carrito
 * convierte en los items del carrito en detalles del pedido
 * 
 * @param {number} pedidoID - ID del pedido
 * @return {array} itemsCarrito - items del carrito
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
};
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
 * @param {number} limite  - ID del usuario
 * @return {Promise<Array>} - Numero de items eliminados
 */
DetallePedido.obtenerMasVendidos = async function(limite = 10) {
    const {sequelize} = require("../config/dataBase");

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
 * Metodo para vaciar el carrito de un usuario
 * util después de realizar de pedido
 * 
 * @param {number} usuarioID - ID del usuario
 * @return {Promise<number>} - Numero de items eliminados
 */
DetallePedido.vaciarCarrito = async function(usuarioID) {
    return await DetallePedido.destroy({ where: { usuarioID } });
};


/**
 * Expotar Modelo
 */

module.exports = DetallePedido;


