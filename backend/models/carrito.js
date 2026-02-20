/**
 * MODElo carrito 
 * Define la tabla carrito en la base de datos
 * almacena los productos que cada usuario ha agregado a su carrito de compras
 * 
 * 
 */


// importar DataTypes de sequelize
const { DataTypes } = require("sequelize");

// importar instancia de sequelize
const { sequelize } = require("../config/dataBase");

/**
 * definir el modelo de carrito
 */
const Carrito = sequelize.define("Carrito", {
    // Campos de la tabla 
    // id identificador unico (PRIMARY KEY)
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    /**
     * usuarioID es el id del usuario al que pertenece este carrito
     */
    usuarioID:{
        type: DataTypes.INTEGER,
        allowNull: false,
        references:{
            model:"usuarios",
            key:"id"
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE", // si se elimina el usuari0 se elimina su carrito  
        validate:{
            notNull:{
                msg:"el carrito debe pertenecer a un usuario"
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
        onDelete: "CASCADE", // si se elimina el producto se elimina del carrito
        validate:{
            notNull:{
                msg:"el carrito debe pertenecer a un producto"
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
 * se guardan para mantener el precio aunque el producto cambie de precio 
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
}, {
    // opciones del modelo

    tableName: "carritos",
    timestamps: true,
    //indices para mejorar las busquedas por usuarioID y productoID
    indexes:[
        {
            //indice para buscar carrito por usuario
            fields:["usuarioID"]
        },
        {
        //Indice compuesto: un usuario no puede tener el mismo producto duplicado
        unique:true,
        fields:["usuarioID","productoID"],
        name:"usuario_producto_unico"
        }
    ],
     
        /**
     * Hooks acciones automaticas
     */
    hooks : {
        /**
         * beforeCreate-se ejecutan antes de crear un item en el carrito
         * verifica que esta activado y tenga stock suficiente
         */
        beforeCreate: async (itemCarrito) => {
            const Producto = require("./Producto");

            //Buscar el producto
            const producto = await Producto.findByPk(itemCarrito.productoID);
            if (!producto){
                throw new Error ("El producto seleccionado no existe.");
            }
            if (!producto.activo){ 
                throw new Error ("No se puede agregar un producto inactivo al carrito.");
            }
            if (!producto.haystock(itemCarrito.cantidad)){
                throw new Error (`Stock insuficiente. Solo por hoy ${producto.stock} unidades disponibles.`);
            }

            // Guardar el precio actual del producto
            itemCarrito.precioUnitario = producto.precio;
        },

        /**
         * beforeUpdate - Se ejecuta antes de actualizar un item en el carrito
         * valida que haya stack suficiente si se aumenta la cantidad
         */
        beforeUpdate: async (itemCarrito) => {
            // verificar si se actualiza la cantidad
            if (itemCarrito.changed("cantidad")) {
                const Producto = require("./Producto");
                const producto = await Producto.findByPk(itemCarrito.productoID);
                if (!producto) {
                    throw new Error("El producto asociado al item del carrito no existe.");
                }
                if (!producto.hayStock(itemCarrito.cantidad)) {
                    throw new Error(`Stock insuficiente. Solo hay ${producto.stock} unidades disponibles.`);
                }
            }
        },
    },
},
);

//METODOS DE INSTANCIA
/**
 * Metodo para calcular el subtotal de este item
 * 
 * @return {number} subtotal (cantidad * precioUnitario)
 * */
Carrito.prototype.calcularSubtotal = function() {
    return parseFloat(this.precioUnitario) * parseFloat(this.cantidad);
};

/**
 * Método para actualizar la cantidad
 * 
 * @param {number} nuevaCantidad - Nueva cantidad
 * @return {Promise} - Item actualizado
 */
Carrito.prototype.actualizarCantidad = async function(nuevaCantidad) {
    const Producto = require("./Producto");
    
    const producto = await Producto.findByPk(this.productoID);

    if (!producto.hayStock(nuevaCantidad)) {
        throw new Error(`Stock insuficiente. Solo hay ${producto.stock} unidades disponibles.`);
    }

    this.cantidad = nuevaCantidad;
    await this.save();
};

/**
 * METODO ESTATICOS (DE CLASE)
 */

/**
 * Método para obtener el carrito completo de un usuario
 * incluye información de los productos
 * 
 * @param {number} usuarioID - ID del usuario
 * @return {Promise<Array>} - Lista de items del carrito con productoa
 */

Carrito.obtenerCarritoUsuario = async function(usuarioID) {
    const Producto = require("./Producto");

    return await Carrito.findAll({
        where: { usuarioID },
        include: [
            {
                model: Producto,
                as: "producto"
            }
        ],
        order: [["createdAt", "DESC"]]
    });
};

/**
 * Método para calcular el total del carrito de un usuario
 * 
 * @param {number} usuarioID - ID del usuario
 * @return {Promise<number>} - Total del carrito
 */
Carrito.calcularTotalCarrito = async function(usuarioID) {
    const items = await this.findAll({ where: { usuarioID } });

    let total = 0;
    for (const item of items) {
        total += item.calcularSubtotal();
    }

    return total;
};

/**
 * Metodo para vaciar el carrito de un usuario
 * Util después de realizar de pedido
 * 
 * @param {number} usuarioID - ID del usuario
 * @return {Promise<number>} - Numero de items eliminados
 */
Carrito.vaciarCarrito = async function(usuarioID) {
    return await Carrito.destroy({ where: { usuarioID } });
};


/**
 * Expotar Modelo
 */

module.exports = Carrito;


