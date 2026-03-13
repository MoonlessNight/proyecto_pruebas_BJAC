/*
MODELO CATEGORIA
Define la tabla categoria en la base de datos
almacena las categorías principales de los productos
*/

// Importar DataTypes de Sequelize
const { DataTypes } = require('sequelize');

// Importar instancias de Sequelize
const { sequelize } = require('../config/dataBase.cjs');

/*
Define el modelo Categoria 
*/
const Categoria = sequelize.define('Categoria', {
    /*
    CAMPOS DE LA TABLA
    */
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    nombre: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: {
            msg: "Ya existe una categoria con ese nombre"
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
    descripcion: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: null
    },
    activo: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    }
}, {
    // Opciones del modelo
    tableName: 'categorias',
    timestamps: true,
    underscored: true,

    /* 
    Hooks Acciones automaticas 
    */
    hooks: {
        afterUpdate: async (categoria, options) => {
            if (categoria.changed('activo') && categoria.activo === false) {
                console.log(`Desactivando categoría: ${categoria.nombre}`);
                
                const Subcategoria = require('./subCategoria');
                const Producto = require('./producto');

                try {
                    const subcategorias = await Subcategoria.findAll({ where: { categoriaId: categoria.id } });
                    for (const subCategoria of subcategorias) {
                        await subCategoria.update({ activo: false }, { transaction: options.transaction});
                        console.log(`Subcategoría desactivada: ${subCategoria.nombre}`);
                    }

                    const productos = await Producto.findAll({ where: { categoriaId: categoria.id } });
                    for (const producto of productos) {
                        await producto.update({ activo: false }, { transaction: options.transaction });
                        console.log(`Producto desactivado: ${producto.nombre}`);
                    }
                    console.log(`Categoría y sus elementos relacionados han sido desactivados correctamente`);
                } catch (error) {
                    console.error(`Error al desactivar categoría y sus elementos relacionados:`, error.message);
                    throw error;
                }
            }
        }
    }
});

/*
MÉTODOS DE INSTANCIAS
*/
Categoria.prototype.contarSubcategorias = async function() {
    const SubCategoria = require('./subCategoria');
    return await SubCategoria.count({ where: { categoriaId: this.id } });
};

Categoria.prototype.contarProductos = async function() {
    const Producto = require('./producto');
    return await Producto.count({ where: { categoriaId: this.id } });
};

module.exports = Categoria;