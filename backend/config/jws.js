/*
* CONFIGURACION DE JWT
* ============================
* Este archivo contiene funcionaes para generar y verificar tokems JWT
* Los JWT se usan para autenticar usuarios sin necesidad de sesiones como también de encriptar la contrañse a un token único
*/

// ============================ Importar jsonwebtoken para manejar los tokens ============================
const jwt = require('jsonwebtoken');

// ============================ Importar dotenv para acceder a las variables de entorno ============================ 
require('dotenv').config();

/**
 * Generar un tokem JWT para un usuario
 * =============================================
 * @param {Object} payload - Datos que se incluira en el token: id, email, rol
 * @return {string} - Token JWT generado
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
        throw new Error("No se pudo generar el token de autenticación.");
    }};

/**
 * Verificar si un token es valido
 * =============================================
 * @param {String} authHeadr - Token JWT a verificar
 * @return {Object} - Datos decodificados del token si es valido
 * @throws {Error} - Si el token no es valido o ha expirado
 */
const verifyToken = (token) => {
    try {
        // jws.verify() - Verificair la firma del token y lo decodificado
        // Parametros:
        // 1. token: el token JWT a verificar
        // 2. secret: la misma clave secreta usada para firmarlo
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return decoded;
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            throw new Error ('El token ha expirado.');
        } else if (error.name === 'JsonWebTokenError') {
            throw new Error('Token no valido.')
        } else {
            throw new Error('Error al verificar el token.');
        }}};

/**
 * Extraer el token del Header autgorization
 * ==========================================
 * El toekn viene en formato 'Bearer <token>'
 * @param {string} authHeader - Valor del header authorization
 * @returns {string|null} - Token estraidos o null si no existe
 */
const extractToken = (authHeader) => {
    //  ======================================== verificar que el header existe y empieze con 'Bearer'  ========================================
    if (authHeader && authHeader.startsWith('Bearer')) {
        
        //  ======================================== Extraer solo el token (quitar 'Bearer' del header)  ========================================   
        return authHeader.substring(7); // 7 es la longitud de "Bearer"
    }
    return null;
};

// ============================ Exportar las funciones ============================
module.exports = {
    generateToken,
    verifyToken,
    extractToken
}