/*
MODELO USUARIO
Define la tabla usuario en la base de datos
Almacena los usuarios del sistema
*/

// Importaciones correctas
const { DataTypes } = require('sequelize');        // 'sequelize' en minúsculas
const bcrypt = require('bcrypt');
const { sequelize } = require('../config/dataBase.cjs'); // instancia de conexión

/*
Definición del modelo Usuario
*/
const Usuario = sequelize.define('Usuario', {
    // Campos de la tabla
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    nombre: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'El nombre no puede estar vacío' },
            len: {
                args: [2, 100],
                msg: 'El nombre debe tener entre 2 y 100 caracteres'
            }
        }
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true, // El email debe ser único
        validate: {
            isEmail: { msg: 'Debe ser un email válido' },
            notEmpty: { msg: 'El email no puede estar vacío' }
        }
    },
    password: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'La contraseña no puede estar vacía' },
            len: {
                args: [6, 255],
                msg: 'La contraseña debe tener entre 6 y 255 caracteres'
            }
        }
    },
    rol: {
        type: DataTypes.ENUM('cliente', 'auxiliar', 'administrador'),
        allowNull: false,
        defaultValue: 'cliente',
        validate: {
            isIn: {
                args: [['cliente', 'auxiliar', 'administrador']],
                msg: 'El rol debe ser cliente, auxiliar o administrador'
            }
        }
    },
    telefono: {
        type: DataTypes.STRING(20), // Cambiado a STRING para admitir formatos
        allowNull: true,
        validate: {
            is: {
                args: /^[0-9+\-\s()]*$/,
                msg: 'El teléfono solo puede contener números, espacios, +, -, paréntesis'
            }
        }
    },
    direccion: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    activo: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    }
}, {
    // Opciones del modelo
    tableName: 'usuarios',
    timestamps: true,
    underscored: true, // snake_case para columnas (created_at, updated_at)

    // Scope por defecto: excluir password
    defaultScope: {
        attributes: { exclude: ['password'] }
    },
    // Scopes adicionales
    scopes: {
        withPassword: {
            attributes: {} // Incluye todos los campos (incluyendo password)
        }
    },

    // Hooks (ciclo de vida)
    hooks: {
        beforeCreate: async (usuario) => {
            if (usuario.password) {
                const salt = await bcrypt.genSalt(10);
                usuario.password = await bcrypt.hash(usuario.password, salt);
            }
        },
        beforeUpdate: async (usuario) => {
            // Solo encriptar si la contraseña fue modificada
            if (usuario.changed('password')) {
                const salt = await bcrypt.genSalt(10);
                usuario.password = await bcrypt.hash(usuario.password, salt);
            }
        }
    }
});

/*
Métodos de instancia
*/

/**
 * Compara una contraseña en texto plano con el hash guardado.
 * @param {string} passwordIngresado - Contraseña a comparar
 * @returns {Promise<boolean>} true si coinciden
 */
Usuario.prototype.compararPassword = async function(passwordIngresado) {
    return await bcrypt.compare(passwordIngresado, this.password);
};

/**
 * Sobrescribe toJSON para devolver el objeto sin la contraseña.
 * @returns {Object} Datos públicos del usuario
 */
Usuario.prototype.toJSON = function() {
    const valores = { ...this.get() };
    delete valores.password;
    return valores;
};

// Exportar modelo
module.exports = Usuario;