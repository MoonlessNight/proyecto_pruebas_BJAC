/**
 * MODELO PRODUCTO
 * Define la tabla producto en la base de datos
 * almacena los productos 
 */


// importar DataTypes de sequelize
const { DataTypes } = require("sequelize");

// importar instancia de sequelize
const { sequelize } = require("../config/dataBase");


/**
 * definir el modelo de producto
 */
const Producto = sequelize.define("Producto", {
    // Campos de la tabla 
    // id identificador unico (PRIMARY KEY)
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
      nombre:{
        type: DataTypes.STRING(200),
        allowNull: false,
            validate:{
                notEmpty : {
                    msg:"el nombre del producto no puede estar vacio"
                },
                len : {
                    args:[3,200],
                    msg:"el nombre del producto debe tener entre 3 y 200 caracteres"
                },
            }
    },
     /**
    /**
     * Descripcion detallada del poducto
     */
    descripcion:{
        type: DataTypes.TEXT,
        allowNull: true,
    },

    //precio del producto
    precio:{
        type: DataTypes.DECIMAL(10,2), // hasta 99.99,999.99
        allowNull: false,
        validate:{
            isDecimal: {
                msg:"el precio debe ser un numero decimal"
            },
            min:{
                args:[0],
                msg:"el precio no puede ser negativo"
            }
        }
    },

    /**
     * stock del producto cantidad disponible en invertario
     */
    stock: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate:{
            isInt: {
                msg:"el stock debe ser un numero entero"
            },
            min:{
                args:[0],
                msg:"el stock no puede ser negativo"
            }
        }
    },

/**
 * Imagene nombre del archivo de imagen
 * se guarda solo el nombre ejmplo: coca-cola-producto.jpg
 * laruta seria uploads/coca -cola-producto.jpg
 */
    imagen:{
        type: DataTypes.STRING(255),
        allowNull: true,// la imgaen puede ser opcional 
        validate:{
            is:{
                args: /\.(jpg|jpeg|png|gif)$/i,
                msg:"la imagen debe ser un archivo con extension jpg, jpeg, png o gif"
            }
        }
    },

        /**
     * categoria - ID de la categoria a la que pertenece (FOREIGN KEY)
     * Esta es la relacion con la tabla categoria 
     */
    subCategoriaId:{
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "subcategorias", // nombre de la tabla subcategoria
            key: "id"
        },

        onUpdate: "CASCADE",// si se actualiza el id, actualizar aca tambien
        onDelete: "CASCADE" ,// si se borra la categoria, borrar esta subcategoria
        validate : { 
            notNull : {
                msg:"el producto debe pertenecer a una subcategoria"
            }
        },

        activo:{
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true
        }   
    }
}, {
    /**
     * categoria - ID de la categoria a la que pertenece (FOREIGN KEY)
     * Esta es la relacion con la tabla categoria 
     */
    categoriaId:{
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "categorias", // nombre de la tabla categoria
            key: "id"
        },

        onUpdate: "CASCADE",// si se actualiza el id, actualizar aca tambien
        onDelete: "CASCADE" ,// si se borra la categoria, borrar esta subcategoria
        validate : { 
            notNull : {
                msg:"la subcategoria debe pertenecer a una categoria"
            }
        }

    },

        activo:{
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true
        }   
    }, {
  
    // opciones del modelo
    tableName: "productos", // nombre de la tabla en la base de datos
    timestamps: true, // agrega campos createdAt y updatedAt

    /***
     * indices compuestos para optimizar busquedas
     */
    indexes: [
        {
            //indice para buscar productos por subcategoria
            fields: ["subCategoriaId"]
        },
         {
            //indice para buscar productos por categoria
            fields: ["categoriaId"]
        },


        {
            //indice para buscar productos activos
            fields: ["activo"]
        },
       
        {
            //indice para buscar productos por nombre 
            fields: ["nombre"]
        },
    ],
    /**
     * Hooks acciones automaticas
     */
    hooks : {
        /**
         * beforeCreate-se ejecutan antes de crear una producto
         * valida que la subcategoria y que la categoria este activa
         */
        beforeCreate: async (Producto) => {
            const Categoria = require("./categoria");
            const Subcategoria = require("./subCategoria");

              //Buscar categoria padre 
            const categoria = await  Categoria.findByPk(Producto.categoriaID);
            if (!categoria){
                throw new Error ("la categoria seleccionada no existe");
            }
            if (!categoria.activo){ 
                throw new Error ("no se puede crear un producto en una categoria inactiva");
            }
           
            //Buscar subcategoria padre 
            const subcategoria = await Subcategoria.findByPk(Producto.subCategoriaId);
           
            if (!subcategoria){
                throw new Error ("la categoria seleccionada no existe");
            }

            if (!subcategoria.activo){ 
                throw new Error ("no se puede crear un producto en una subcategoria inactiva");
            }

            //validar que la subcategoria pertenezca a la categoria seleccionada
            if (subcategoria.categoriaId !== Producto.categoriaId){
                throw new Error ("la subcategoria seleccionada no pertenece a la categoria seleccionada");
            }
        },
        /**
         * beforeDestroy: se ejecuta antes de eliminar un producto
         * Elimina la imagen del servidor si existe 
         */
        beforeDestroy: async (Producto) => {
            if (Producto.imagen){
                const{deletefile} = require("../config/multer");
                //intenta eliminar la imagen del servidor
                const eliminado= await deletefile(Producto.imagen);
                if (eliminado){
                    console.log(`imagen eliminada : ${Producto.imagen} `);
                }
            }
        }  
    }

});

//METODOS DE INSTANCIA
/**
 * Metodo para obtener la url completa de la imagen del producto
 * 
 * @return {string|null} url completa de la imagen del producto
 * */
Producto.prototype.obtenerUrlImagen = function (){
    if (!this.imagen){
        return null;
    }
    const baseUrl = process.env.FRONTEND_URL || "http://localhost:5000";
    return `${baseUrl}/uploads/${this.imagen}`;
    
};

/**
 * metodo para verificar si hay stock disponible
 * @param {number} cantidad - cantidad a verificar
 * @return {boolean} - true si hay stock suficiente false si no
 */
Producto.prototype.haystock = function (cantidad = 1){
    return this.stock >= cantidad;
};


/**
 * Metofo para aumentar el stock
 * util al cancelar una venta o recibir inventario
 * @param {number} cantidad - cantidad a aumentar
 * @return {promise<producto>} producto actualizado
 */
Producto.prototype.aumentarStock = async function(cantidad){
    this.stock += cantidad;
    return await this.save();
}

/**
 * Metodo para reducir el stock
 * util para despues  de una venta 
 * @param { number } cantidad - cantidad a reducir
 * @return {promise<produto>} producto actualizado 
 */
Producto.prototype.reducirStock = async function(cantidad){
    if(this.haystock(cantidad)){
        throw new Error("stock insuficientes");
    }
    this.stock -= cantidad;
    return await this.save();
};

// exportar el modelo de producto
module.exports = Producto;