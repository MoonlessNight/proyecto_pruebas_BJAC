/*
MODE, K CATEGORIA
Define la tabla categroia en la base de datos
alamacena las categorías principales de los productos
*/

// Importar DataTypes de sequelize
const { DataTypes } = require('sequelize');

// Importar instancias de sequelize
const { sequelize } = require('../config/dataBase');
const { type } = require('os');
const { argv } = require('process');
const { table } = require('console');

/*
Define el modelo Categoria 
*/
const Categoria = sequelize.define('Categoria', {
    /*
    CAMPOS DE LA TABLA
    */

    /*
    id - Identificador unico (PRIMARY KEY)
    */

    id: {
        type: DataTypes.INTEGER, // Tipo de dato entero
        primaryKey: true, // Clave primaria
        autoIncrement: true, // Auto incrementa con cada nuevo registro
        allowNull: false // No permite valores nulos
    },

    nombre: {
        type: DataTypes.STRING, // Tipo de dato cadena de texto
        allowNull: false, // No permite valores nulos
        unique: {
            msg: "Ya existe una categoria con ese nombre" // Mensaje de error si el nombre no es unico
        },
            validate: {
                notEmpty: {
                    msg: "El nombre de la categoria no puede estar vacio"  
                },
                len: {
                    args: [2, 100],
                    msg: "El nombre de la categoria debe tener entre 2 y 100 caracteres" 
                }
            }
    }, 
        /*
        Descripción de la categoría
        */
        descripcion: {
        type: DataTypes.TEXT, // Tipo de dato texto largo
        allowNull: true, // Permite valores nulos
        defaultValue: null // Valor por defecto es null
    },
    /*
    Activo - Estado de la categoría
    Si es false, la categoría y todos sus subcategorias y productos se ocultan 
    */
     activo: {
        type: DataTypes.BOOLEAN, // Tipo de dato booleano
        allowNull: false, // No permite valores nulos
        defaultValue: true // Valor por defecto es true (activo)
    },
    // Opciones del modelo
    tableName: 'categorias', // Nombre de la tabla en la base de datos
    timestamps: true, // Agrega campos createdAt y updatedAt
    underscored: true, // Usa snake_case para los nombres de columnas

    /* 
    Hooks Acciones automaticas 
    */

    hooks: {
        /*
        afterUpdate: se ejecuta despues de actualizar una categoria
        Si se desactiva una categoria, se desactivan todas sus subcategorias y productos relacionados
         */
        afterUpdate: async (categoria, options) => {
            // Verfica si el campo activo se cambio
            if (categoria.changed('activo') && categoria.activo === false) {
                console.log(`Desactivando categoría: ${categoria.nombre}`);
                
                // Importar models (aquí para evitar dependencias circulares
                const Subcategoria = require('./subCategoria');
                const Producto = require('./producto');

                try {
                    // PASO 1: Desactivar todas las subcategorias de esta categoría
                    const subcategorias = await Subcategoria.findAll({ where: { categoriaId: categoria.id } });

                    for (const subCategoria of subcategorias) {
                        await subCategoria.update({ activo: false }, { transaction: options.transaction});
                        console.log(`Subcategoría desactivada: ${subCategoria.nombre}`);
                    }

                    // PASO 2: Desactivar todas los productos de esta categoría 

                    const productos = await Producto.findAll({ where: { categoriaId: categoria.id } });
                    
                    for (const producto of productos) {
                        await producto.update({ activo: false }, { transaction: options.transaction });
                        console.log(`Producto desactivado: ${producto.nombre}`);
                    }
                    console.log(`Categoría y sus elementos relacionados han sido desactivados correctamente`);

                } catch (error) {
                    console.error(`Error al desactivar categoría y sus elementos relacionados:`, error.message);
                    throw error; // Re-lanzar el error
                }
            }
        // Si se ACTIVA una categoria, NO se activa automáticamente sus subcategorias y productos
        // El adminitrador debe activar manualmente si lo desea
        }
    }   

});
/*
MÉTODO DE INSTANCIAS
*/

/** 
 * Método pra contar subcategorias de esta categoría
 * @param {Promise<number>} - Número de subcategorias
*/

Categoria.prototype.contarSubcategorias = async function() {
    const SubCategoria = require('./subCategoria');
    return await SubCategoria.count({ where: { categoriaId: this.id } });
};

/**
 * Método para contar productos de esta categoría
 * @returns {Promise<number>} - Número de productos
 */

Categoria.prototype.contarProductos = async function() {
    const Producto = require('./producto');
    return await Producto.count({ where: { categoriaId: this.id } });
};

// Exportar el modelo 
module.exports = Categoria;



