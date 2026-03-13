/**
 * MODELO PRODUCTO
 * =====================================================
 * Define la tabla producto en la base de datos
 * almacena los productos 
 */

// ========================================= IMPORTAR LOS DATATYPES DE Sequelize==================================== 
const { DataTypes } = require("sequelize");

// ================================================ IMPORTAR INSTANCIAS DE Sequelize
const { sequelize } = require('../config/dataBase.cjs');

/**
 * DEFINIR EL MODELO DEL PRODUCTO
 * =====================================================
 */
const Producto = sequelize.define("Producto", {
    // ============================= CAMPOS DE LA TABLA ======================== 
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    nombre: {
        type: DataTypes.STRING(200),
        allowNull: false,
        validate: {
            notEmpty: { msg: "El nombre del producto no puede estar vacío." },
            len: {
                args: [3, 200],
                msg: "El nombre del producto debe tener entre 3 a 200 caracteres."
            }
        }
    },
    descripcion: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    precio: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            isDecimal: { msg: "El precio debe ser un número decimal." },
            min: {
                args: [0],
                msg: "El precio no puede ser negativo."
            }
        }
    },
    stock: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
            isInt: { msg: "El stock debe ser un número entero." },
            min: {
                args: [0],
                msg: "El stock no puede ser negativo."
            }
        }
    },
    imagen: {
        type: DataTypes.STRING(255),
        allowNull: true,
        validate: {
            is: {
                args: /\.(jpg|jpeg|png|gif)$/i,
                msg: "La imagen debe ser un archivo con extensión jpg, jpeg, png o gif."
            }
        }
    },
    // Claves foráneas
    categoriaId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "categorias",
            key: "id"
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        validate: {
            notNull: { msg: "El producto debe pertenecer a una categoría" }
        }
    },
    subCategoriaId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "subcategorias",
            key: "id"
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        validate: {
            notNull: { msg: "El producto debe pertenecer a una subcategoría" }
        }
    },
    activo: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    }
}, {
    // ========== OPCIONES DEL MODELO ==========
    tableName: "productos",
    timestamps: true,
    underscored: true,  // para created_at, updated_at

    indexes: [
        { fields: ['sub_categoria_id'] },
        { fields: ['categoria_id'] },
        { fields: ['activo'] },
        { fields: ['nombre'] }
    ],

    hooks: {
        /**
         * beforeCreate - se ejecuta antes de crear un producto
         * Valida que la categoría y subcategoría existan y estén activas,
         * y que la subcategoría pertenezca a la categoría.
         */
        beforeCreate: async (producto) => {
            const Categoria = require("./categoria");
            const Subcategoria = require("./subCategoria");

            // Validar categoría
            const categoria = await Categoria.findByPk(producto.categoriaId);
            if (!categoria) {
                throw new Error("La categoría seleccionada no existe");
            }
            if (!categoria.activo) {
                throw new Error("No se puede crear un producto en una categoría inactiva");
            }

            // Validar subcategoría
            const subcategoria = await Subcategoria.findByPk(producto.subCategoriaId);
            if (!subcategoria) {
                throw new Error("La subcategoría seleccionada no existe");
            }
            if (!subcategoria.activo) {
                throw new Error("No se puede crear un producto en una subcategoría inactiva");
            }

            // Validar que la subcategoría pertenezca a la categoría indicada
            if (subcategoria.categoriaId !== producto.categoriaId) {
                throw new Error("La subcategoría seleccionada no pertenece a la categoría seleccionada");
            }
        },

        /**
         * beforeDestroy - se ejecuta antes de eliminar un producto
         * Elimina la imagen del servidor si existe
         */
        beforeDestroy: async (producto) => {
            if (producto.imagen) {
                const { deletefile } = require("../config/multer");
                const eliminado = await deletefile(producto.imagen);
                if (eliminado) {
                    console.log(`Imagen eliminada: ${producto.imagen}`);
                }
            }
        }
    }
});

// ========== MÉTODOS DE INSTANCIA ==========

/**
 * Obtiene la URL completa de la imagen del producto
 * @returns {string|null} URL completa o null si no hay imagen
 */
Producto.prototype.obtenerUrlImagen = function () {
    if (!this.imagen) return null;
    const baseUrl = process.env.FRONTEND_URL || "http://localhost:5000";
    return `${baseUrl}/uploads/${this.imagen}`;
};

/**
 * Verifica si hay stock suficiente
 * @param {number} cantidad - Cantidad a verificar (por defecto 1)
 * @returns {boolean} true si hay stock suficiente
 */
Producto.prototype.hayStock = function (cantidad = 1) {
    return this.stock >= cantidad;
};

/**
 * Aumenta el stock del producto
 * @param {number} cantidad - Cantidad a aumentar
 * @returns {Promise<Producto>} Producto actualizado
 */
Producto.prototype.aumentarStock = async function (cantidad) {
    this.stock += cantidad;
    return await this.save();
};

/**
 * Reduce el stock del producto (después de una venta)
 * @param {number} cantidad - Cantidad a reducir
 * @returns {Promise<Producto>} Producto actualizado
 * @throws {Error} si no hay stock suficiente
 */
Producto.prototype.reducirStock = async function (cantidad) {
    if (!this.hayStock(cantidad)) {
        throw new Error("Stock insuficiente");
    }
    this.stock -= cantidad;
    return await this.save();
};

// Exportar el modelo
module.exports = Producto;