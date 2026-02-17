/*
MODELO USUARIO
Define la tabla categroia en la base de datos
alamacena las categorías principales de los productos
*/

// Importar DataTypes de sequelize
const { DataTypes } = require('sequelize');

// Importar instancias de sequelize
const bcrypt = require('bcrypt');

// Importar instancias de sequelize
const { sequelize } = requiere('../config/dataBase');

/*
Define el modelo Usuario
*/
const Usuario = sequelize.define('Usuario', {
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
        type: DataTypes.STRING(100), // Tipo de dato cadena de texto
        allowNull: false, // No permite valores nulos
            validate: {
                notEmpty: {
                    msg: "El nombre no puede estar vacio"  
                },
                len: {
                    args: [2, 100],
                    msg: "El nombre del usuario debe tener entre 2 y 100 caracteres" 
                }
            }
    }, 
    email: {
        type: DataTypes.STRING, // Tipo de dato cadena de texto
        allowNull: false, // No permite valores nulos
            validate: {
                isEmail: {
                    msg: "Debe ser un email valido"  
                },
                notEmpty: {
                    msg: "El email no puede estar vacio" 
                }
            }
    },
    password: {
        type: DataTypes.STRING(255), // Tipo de dato cadena de texto
        allowNull: false, // No permite valores nulos
            validate: {
                isEmail: {
                    msg: "La contraseña no puede estar vacio"  
                },
                notEmpty: {
                    msg: "La contraseña debe tener entre 6 y 255 caracteres" 
                }
            }
    },

    // Rol del usuario (cliente, auxiliar o administrador)
    rol : {
        type: DataTypes.ENUM("cliente", "auxiliar","administrador"),
        allowNull: false,
        validate: {
            isIn: {
                args: [["cliente", "auxiliar", "administrador"]],
                msg: "El rol debe ser cliente, auxiliar o administrador."
            }
        }
    },

    // telefono del usuario (opcional)
    telefono : {
        type: DataTypes.INTEGER(20),
        allowNull: true,
        validate: {
            is: {
                args: /^(0-9+)\-\s()*$/,
                msg: "El telefono solo puede contener numeros y caractere validos."
            }
        }
    },

    /*
    Descripción de la categoría
    */
    direccion: {
        type: DataTypes.TEXT, // Tipo de dato texto largo
        allowNull: true, // Permite valores nulos
    },

    /*
    Activo - Estado del usuario
    */
     activo: {
        type: DataTypes.BOOLEAN, // Tipo de dato booleano
        allowNull: false, // No permite valores nulos
        defaultValue: true // Valor por defecto es true (activo)
    },
    // Opciones del modelo
    tableName: 'usuarios', // Nombre de la tabla en la base de datos
    timestamps: true, // Agrega campos createdAt y updatedAt
    underscored: true, // Usa snake_case para los nombres de columnas

    /* 
    Scopes consultas predefinidas
    */

    defaultScopes: {
    /**
     * Por defecto excluir el password de todas las consultas
     */
        attributes: {exclude: ["password"]}
    },
    scopes: {
        // scope para incluir el password cuando sea necesario. Ej: login
        withPassword: {
            attributes: {} // Incluir todos los atributos
        }
    },

    /**
     * Hooks funciones que se ejecutan en momentos especificos
     */
    hooks: {
        /**
         * beforeCreate se ejecuta antes de crear un nuevo usuario
         * Encripta la contraseña antes de guardarla en la Base de Datos
         */
        beforeCreate: async (usuario) => {
            if (usuario.password){
                // Genera un salt (semilla aleatoria) con factor de costo de 10
                const salt = await bcrypt.genSalt(10);
                // Incriptar la contraseña con salt
                usuario.password = await bcrypt.hash(usuario.password, salt);
            }
        },
        /**
         * beforeUpdate se ejecuta antes de actualizar un usuario
         * Encripta la contraseña si fue modificada
         */
        beforeUpdate: async (usuario) => {
            // Verfica si la contraseña fue modificada
            if (password.changed('password')){
                const  salt = await bcrypt.getSalt(10);
                usuario.password = await bcrypt.hash(usuario.password , salt);
            }
        }
    }
}); 

/*
MÉTODO DE INSTANCIAS
*/

/** 
 * Método para comparar contraseñas
 * Compara una contraseña en texto plano con el hash guardado
 * 
 * @param {string} passwordIngresado - Contrase en texto plano
 * @returns {Promise<boolean>} - true si coincide, false si no
*/

Usuario.prototype.compararPassword = async function(passwordIngresado) {
    return await bcrypt.compare(passwordIngresado, this.password);
};

/**
 * Método para obtener datos publicos del usuario (sin contraseña)
 * 
 * @returns {object}  Objetos con datos publicos del usuarrio
 */

Usuariio.prototype.toJSON = function() {
    const valores = Object.assign({}, this.get());

    // Eliminar la contraseña del objeto
    delete valores.password;   
    return valores;                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            
};

// Exportar el modelo 
module.exports = Categoria;



