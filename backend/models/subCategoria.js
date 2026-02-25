/*
MODELO DE SUBCATEGORIA
Define la tabla subcategoria en la base de datos
alamacena las subcategorías de los productos
*/

// Importar DataTypes de sequelize
const { DataTypes } = require('sequelize');

// Importar instancias de sequelize
const { sequelize } = require('../config/dataBase');

/*
Define el modelo SubCategoria 
*/
const SubCategoria = sequelize.define('SubCategoria', {
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
            msg: "Ya existe una subcategoria con ese nombre" // Mensaje de error si el nombre no es unico
        },
        validate: {
            notEmpty: {
                msg: "El nombre de la subcategoria no puede estar vacio"
            },
            len: {
                args: [2, 100],
                msg: "El nombre de la subcategoria debe tener entre 2 y 100 caracteres"
            }
        }
    },
    /*
    Descripción de la subcategoría
    */
    descripcion: {
        type: DataTypes.TEXT, // Tipo de dato texto largo
        allowNull: true, // Permite valores nulos
    },

    /**
     * categoriaId - ID de la categoría a la que pertenece (FOREIGN KEY) 
     * Esta es la relación con la tabla categoria
     */
    categoriaId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'categorias',              // Nombre de la tabla referenciada
            key: 'id'                         // Columna referenciada
        },
        onUpdate: 'CASCADE',                  // Si se actualiza el ID de la categoría, se actualiza en esta tabla
        onDelete: 'CASCADE',                  // Si se elimina la categoría, se eliminan las subcategorías relacionadas
        validate: {
            notNull: {
                msg: "Debe seleccionar una categoría" // Mensaje de error si no se proporciona un categoriaId
            }
        }
    },

    /**
     * Activo estado de la subcategoría
     * Si es false, los productos de esta subcategoría se ocultan
     */
    activo: {
        type: DataTypes.BOOLEAN, // Tipo de dato booleano
        allowNull: false, // No permite valores nulos
        defaultValue: true // Valor por defecto es true (activo)
    },
    // Opciones del modelo
    tableName: 'categorias', // Nombre de la tabla en la base de datos
    timestamps: true, // Agrega campos createdAt y updatedAt



    indexes: [
        {
            // Indicar para buscar subcategorias por categoria
            fields: ['categoriaId']
        },
        {
            // Indice compuesto: nombre unico por categoria
            // Permite que dos vategorias diferentes tengan subcategorias con el mismo nombre
            unique: true,
            fields: ['nombre', 'categoriaId'],
            name: 'nombre_categoria_unique' // Nombre del indice
        },
    ],
    /* 
    Hooks Acciones automaticas 
    */

    hooks: {
        /**
         * beforeCreate: se ejecuta antes de crear una subcategoría 
         * verifica que la categoría a la que pertenece esta activa
         */
        beforeCreate: async (subCategoria) => {
            const Categoria = require('./categoria');

            // Buscar la categoria padre
            const categoriaEncontrada = await Categoria.findByPk(subCategoria.categoriaId);
            if (!categoriaEncontrada || !categoriaEncontrada.activo) {
                throw new Error("La categoría selecionada no existe");
            }

            if (!categoriaEncontrada.activo) {
                throw new Error("No se puede crear una subcategoría en una categoría inactiva");
            }
        },

        /**
         * afterUpdate: se ejecuta despues de actualizar una subcategoría
         * Si se desactiva una subcategoría, se desactivan todas sus productos
         */
        afterUpdate: async (subcategoria, options) => {
            // Verfica si el campo activo se cambio
            if (subcategoria.changed('activo') && !subcategoria.activo) {
                console.log(`Desactivando subcategoría: ${subcategoria.nombre}`);

                // Importar models (aquí para evitar dependencias circulares
                const Producto = require('./Producto');

                try {
                    // Desactivar todas los productos de esta subcategoría
                    const productos = await Producto.findAll({ where: { subCategoriaId: subcategoria.id } });

                    for (const producto of productos) {
                        await producto.update({ activo: false }, { transaction: options.transaction });
                        console.log(`Producto desactivado: ${producto.nombre}`);
                    }

                    console.log(`Subcategoría y productos relacionados han sido desactivados correctamente`);

                } catch (error) {
                    console.error(`Error al desactiva productos relacionados:`, error.message);
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
 * Método pra contar productos de esta subcategoría
 * @param {Promise<number>} - Número de productos
*/

SubCategoria.prototype.contarSubcategorias = async function () {
    const Producto = require('./Producto');
    return await Producto.count({ where: { subCategoriaId: this.id } });
};

/**
 * Método para obtener la categoria padre
 * @returns {Promise<Categoria>} - Categoria padre
 */

SubCategoria.prototype.obtenerCategoria = async function () {
    const Categoria = require('./categoria');
    return await Categoria.findByPk(this.categoriaId);
};

// Exportar el modelo 
module.exports = SubCategoria;



