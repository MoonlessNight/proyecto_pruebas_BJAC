/*
CONFIGURACION DE JWT
Este archivo contiene funcionaes para generar y verificar tokems JWT
Los JWT se usan para autenticar usuarios sin necesidad de sesiones
 */

// Importar jsonwebtoken para manejar los tokens
const jwt = require('jsonwebtoken');

// Importar dotenv para acceder a las variables de entorno
require('dotenv').config();

/*
Generar un tokem JWT para un usuario

@param {Object} payload - Datos que se incluira en el token (id, email, rol)

@return {String} - Token JWT generado
*/

const generateToken = (payload) => {
    try {
        //jwt.sign() crea y firma un token
        // Parametros:
        // 1. payload: datos a incluir en token
        // 2. secret: clave secreta para firmar (desde .env)
        // 3. options: opciones adicionales como tiempo de expiración
        const token = jwt.sign(
            payload, // Datos de usuario
            process.env.JWT_SECRET, // Clave secreta desde .env
            { expiresIn: process.env.JWT_EXPIRES_IN} // Tiempo de expiración
        );
        return token;
    } catch (error) {
        console.error("Error al generar el token JWT:", error.message);
        throw new Error("No se pudo generar el token de autenticación");
    }
};

/*
Verificar si un token es valido

@param {String} authHeadr - Token JWT a verificar

@return {Object} - Datos decodificados del token si es valido

@throws {Error} - Si el token no es valido o ha expirado
*/

const extractTokenData = (authHeadr) => {
    // verificar que el header exista y empiece con "Bearer "
    if (authHeadr && authHeadr.startsWith('Bearer '))
        //Extraeer solo el toekn (quitar "Bearer"
        return
    }