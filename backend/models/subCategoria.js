/*
MODELO DE SUBCATEGORIA
Define la tabla subcategoria en la base de datos
almacena las subcategorías de los productos
*/

// Importar DataTypes de Sequelize
const { DataTypes } = require('sequelize');

// Importar instancia de Sequelize
const { sequelize } = require('../config/dataBase.cjs');

/*
Define el modelo SubCategoria
*/
const SubCategoria = sequelize.define('SubCategoria', {
    // ========== CAMPOS DE LA TABLA ==========
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
            msg: "Ya existe una subcategoria con ese nombre"
        },
        validate: {
            notEmpty: {
                msg: "El nombre de la subcategoria no puede estar vacío"
            },
            len: {
                args: [2, 100],
                msg: "El nombre de la subcategoria debe tener entre 2 y 100 caracteres"
            }
        }
    },
    descripcion: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    categoriaId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'categorias',
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        validate: {
            notNull: {
                msg: "Debe seleccionar una categoría"
            }
        }
    },
    activo: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    }
}, {
    // ========== OPCIONES DEL MODELO ==========
    tableName: 'subcategorias',        // CORREGIDO: antes decía 'categorias'
    timestamps: true,
    underscored: true,                  // Usa snake_case en columnas automáticas (created_at, updated_at)

    indexes: [
        {
            // Índice para buscar subcategorías por categoría
            fields: ['categoria_id']
        },
        {
            // Índice compuesto: nombre único por categoría
            unique: true,
            fields: ['nombre', 'categoria_id'],
            name: 'nombre_categoria_unique'
        }
    ],

    // ========== HOOKS ==========
    hooks: {
        /**
         * beforeCreate - se ejecuta antes de crear una subcategoría
         * Verifica que la categoría padre exista y esté activa
         */
        beforeCreate: async (subCategoria) => {
            const Categoria = require('./categoria');
            const categoriaPadre = await Categoria.findByPk(subCategoria.categoriaId);
            if (!categoriaPadre) {
                throw new Error("La categoría seleccionada no existe");
            }
            if (!categoriaPadre.activo) {
                throw new Error("No se puede crear una subcategoría en una categoría inactiva");
            }
        },

        /**
         * afterUpdate - se ejecuta después de actualizar una subcategoría
         * Si se desactiva, desactiva todos sus productos
         */
        afterUpdate: async (subcategoria, options) => {
            if (subcategoria.changed('activo') && !subcategoria.activo) {
                console.log(`Desactivando subcategoría: ${subcategoria.nombre}`);
                const Producto = require('./producto');
                try {
                    const productos = await Producto.findAll({
                        where: { subCategoriaId: subcategoria.id }
                    });
                    for (const producto of productos) {
                        await producto.update(
                            { activo: false },
                            { transaction: options.transaction }
                        );
                        console.log(`Producto desactivado: ${producto.nombre}`);
                    }
                    console.log('Subcategoría y productos relacionados desactivados correctamente');
                } catch (error) {
                    console.error('Error al desactivar productos relacionados:', error.message);
                    throw error;
                }
            }
            // Si se activa, no se activan automáticamente los productos (decisión de negocio)
        }
    }
});

// ========== MÉTODOS DE INSTANCIA ==========

/**
 * Cuenta los productos de esta subcategoría
 * @returns {Promise<number>}
 */
SubCategoria.prototype.contarProductos = async function () {
    const Producto = require('./producto');
    return await Producto.count({ where: { subCategoriaId: this.id } });
};

/**
 * Obtiene la categoría padre
 * @returns {Promise<Categoria>}
 */
SubCategoria.prototype.obtenerCategoria = async function () {
    const Categoria = require('./categoria');
    return await Categoria.findByPk(this.categoriaId);
};

// Exportar el modelo
module.exports = SubCategoria;