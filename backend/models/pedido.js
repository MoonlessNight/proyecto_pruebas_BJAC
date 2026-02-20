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
        allowNull:false,                                                                                                                                                                                                                                                   
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

    // fecha de pago
    fechaPago: {
        type: DataTypes.DATE,
        allowNull: true
    },

    // fecha de envio
    fechaEnvio: {
        type: DataTypes.DATE,
        allowNull: true
    },

    // fecha de entrega
    fechaEntrega: {
        type: DataTypes.DATE,
        allowNull: true
    },

    // Opciones del modelo

    tablaName: "pedido",
    timestamps: true,
    // Indice para mejorar las busquedas
    indexes: [
    {
        fields: ["usuarioID"]
    },
    {
        fields: ["estado"]
    },
    {
        fields: ["createdAt"]
    }

],

/**
 * Hooks acciones automaticas
 */

/**
 * afterUpdate: se ejecuta después de actualizar un pedido
 * actualiza las fechas según el estado
 */

afterUpdate: async(Pedido) => {
    // Si este estado cambia a pago, se guarda la fecha del pago
    if (Pedido.changed("estado") && Pedido.estado == "pagado") {
        Pedido.fechaPago = new Date();
        await Pedido.save({hooks: false}); // Guardar sin ejecutar más hooks
    }

    // Si el estado cambio a enviado guarda la fecha del envio
        if (Pedido.changed("estado") && Pedido.estado == "enviado"){
            Pedido.fechaEnvio = new Date();
            await Pedido.save({hooks: false})
        }
    
        // Si el estado cambio a entregado guarda la fecha de entrega
        if (Pedido.changed("estado") && Pedido.estado == "entregado"){
            Pedido.fechaEntrega = new Date();
            await Pedido.save({hooks: false})
        }
    },

/**
 * afterUpdate: se ejecuta después de actualizar un pedido
 * actualiza las fechas según el estado
 */

beforeDestroy: async(Pedido) => {
    // Si este estado cambia a pago, se guarda la fecha del pago
    if (Pedido.changed("estado") && Pedido.estado == "pagado") {
        throw new Error("No se puede eliminar pedidos, use el estado cancelado en su lugar")
    }
},},

);

/**
 * METODOS DE INSTANCIAS
 * 
 * @param {string} nuevoEstado - nuevo estado del pedido
 * @returns {number} - subtotal (precio * cantidad)
 */

Pedido.prototype.cambiarEstado = async function (nuevoEstado) {
    const estadosValidos = ["pendiente", "pagado", "enviado", "cancelado"];

    if(!estadosValidos.includes(nuevoEstado)) {
        throw new Error ("Estado invalido.")
    }

    this.estado = nuevoEstado;
    return await this.save();
};

/**
 * Metodo para verificar si el pedido puede ser cancelado
 * solo se puede cancelar si el estado esta en pendiente o pagado
 * 
 * @returns {boolean} - True si se puede cancelar, false no se puede cancelar
 */

Pedido.prototype.puedeSerCancelado = function(){
    return ["pendiente" , "pagado"].includes(this.estado);
};

/**
 * Metodo para cancelar pedido
 * 
 * @returns {Promise<Pedido>} pedido cancelado
 */
Pedido.prototype.cancelarPedido =  async function(){
    if (!this.puedeSerCancelado()) {
        throw new Error("Este pedido no puede ser cancelado");
    }

    // Importar modelos
    const DetallePedido = require("./detallePedido");
    const Producto = require("./Producto");

    // Obtener  detalles del pedido
    const detalles = await DetallePedido.findAll ({
        where: {PedidoId:this.id}
    });

    // Devolver el stock de cada producto
    for (const detalle of detalles) {
        const producto  = await Producto.findByPk(detalle.productoId);
        if (producto) {
            await producto.aumentarStock(detalle.cantidad);
            console.log(`Stock devuelto: ${detalle.cantidad} x ${producto.nombre}`)
        }
    }

    // Cambiar estado a cancelado
    this.estado = "cancelado";
    return await this.save();
};

/**
 * Metodo para obtener detalle del pedido con productos
 * 
 * @returns {Promise<Array} - Detalle del pedido
 */
Pedido.prototype.obtenerDetalle = async function() {
    const DetallePedido = require("./detallePedido")
    const Producto = require("./Producto")

    return await DetallePedido.findAll({
        where: {pedidoId: this.id},
        include: [
            {
                model: Producto,
                as: "producto"
            }
        ]
    });
},

/**
 * Metodo para obtener pedidos por estado
 * 
 * @param {string} estado - estado del pedido
 * @returns {promises<number>} - pedido filtrados
 */

Pedido.obtenerPorEstado = async function (estado){
    const Usuario = require ("./usuario");
    return await this.findAll ({
        where: {estado},
        include: [
            {
                model: Usuario,
                as: "usuario",
                atributes:["id", "nombre" ,"email" ,"email" ,"telefono" ]
            }
        ],
        order: [["createdAt","DESC"]]
    });
};

/**
 * Metodo para obtener historial de pedidos de un usuario
 * 
 * @param {number} usuarioId - id del usuario
 * @returns {Promise<Array>} - pedidos del usuario
 */
Pedido.obtenerHistorialDelUsuario = async function (usuarioId) {
    return await this.findAll ({
        where: {usuarioId},
        order:  [["createdAt","DESC"]]
    })
};

/**
 * Expotar Modelo
 */

module.exports = Pedido;
