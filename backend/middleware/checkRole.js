/**
 * MIDDLEWARE DE VERFICIAR ROLES
 * =============================
 * Este middleware se encarga de verificar que el usuario tenga el rol requierdo 
 * Debe usar despues deñ middleware de autenticación
 */
const esAdministrador = (req, res, next) => {
    try {
        if (!req.usuario) {
            return res.status(401).json({ success: false, message: "Usuario no autenticado" });
        }
        if (req.usuario.rol !== "administrador") {  // ✅ corregido
            return res.status(403).json({ success: false, message: "Acceso denegado. Se requiere rol de administrador" });
        }
        next();
    } catch (error) {
        console.error("Error en el middleware de verificación de rol:", error);
        return res.status(500).json({ success: false, message: "Error interno del servidor" });
    }
};

/**
 * MIDDLEWARE PARA VERIFICAR SI EL USUARIO ES CLIENTE
 */
const esCliente = (req, res, next) => {
    try { 
        //Verficair que existe un req.usuario (viene de la autenticacion)
        if (!req.usuario){
            return res.status(401).json({
                success : false,
                message: "Usuario no autenticado"
            });
        }

        // Verficiar que el rol del usuario sea cliente
        if (req.usuario.rol !== "cliente"){
            return res.status(403).json({
                success : false,
                message: "Acceso denegado. Se requiere rol de cliente"
            });
        }

        // Si el usuario es cliente, continua
        next();

    } catch (error) {
        console.error("Error en el middleware de verificacion de rol:", error);
        return res.status(500).json({
            success : false,
            message: "Error interno del servidor"
        });
    }
}

/**
 * MIDDLEWARE felxible para verificar multiples roles
 * Permite verificar varios roles validos
 * util para cuando una ruta tien varios roles autorizados
 * 
 */
const tieneRol = (rolesPermitidos) => {
    return (req, res, next) => {
        try {
            if (!req.usuario) {
                return res.status(401).json({ success: false, message: "Usuario no autenticado" });
            }
            if (!rolesPermitidos.includes(req.usuario.rol)) {
                return res.status(403).json({
                    success: false,
                    message: `Acceso denegado. Se requiere uno de los roles: ${rolesPermitidos.join(", ")}`
                });
            }
            next();
        } catch (error) {
            console.error("Error en middleware tieneRol:", error);
            return res.status(500).json({ success: false, message: "Error interno del servidor" });
        }
    };
};

/**
 * Middleware para verificar que el usuario accede a sus propios datos
 * Verfica que el usuarioId en los parametros conciden con el usuario autenticado
 */
const esPropioUsuario = (req, res, next) => {
    try {
        //Verficair que existe un req.usuario (viene de la autenticacion)
        if (!req.usuario){
            return res.status(401).json({
                success : false,
                message: "Usuario no autenticado"
            });
        }

        // Verficiar que el usuarioId en los parametros conciden con el usuario autenticado
        if (req.usuario.id !== req.params.id){
            return res.status(403).json({
                success : false,
                message: "Acceso denegado. No tienes permiso para acceder a estos datos"
            });
        }

        // los administradores pueden acceder a datos de cualquier usuario
        if (req.usuario.rol === "administrador"){
                return next();
        }

        //Obtener el usuarioId de los parametros de la ruta
        const usuarioIdParam = req.params.usuarioId || req.params.id; // dependiendo de como se llame el parametro en la ruta

        if (parseInt(usuarioIdParam) !== req.usuario.id){
            return res.status(403).json({
                success : false,
                message: "Acceso denegado. No tienes permiso para acceder a estos datos"
            });
        }

        if (!["cliente", "administrador"].includes(req.usuario.rol)){
            return res.status(403).json({
                success : false,
                message: "Acceso denegado. Solo clientes y administradores pueden acceder a estos datos"
            });
        }

        // El usuario accede a sis propios datos, continua
        next();

    } catch (error) {
        console.error("Error en el middleware esPropioUsuario", error);
        return res.status(500).json({
            success : false,
            message: "Error interno del servidor"
        });
    }
};

const esAdminAuxiliar = (req, res, next) => {
    try {
        if (!req.usuario) {
            return res.status(401).json({ success: false, message: "Usuario no autenticado" });
        }
        const rolesPermitidos = ["administrador", "auxiliar"];
        if (!rolesPermitidos.includes(req.usuario.rol)) {
            return res.status(403).json({ success: false, message: "Acceso denegado. Se requiere rol de administrador o auxiliar" });
        }
        next();
    } catch (error) {
        console.error("Error en el middleware esAdminAuxiliar:", error);
        return res.status(500).json({ success: false, message: "Error interno del servidor" });
    }
};

module.exports = {
    esAdministrador,
    esCliente,
    tieneRol,
    esPropioUsuario,
    esAdminAuxiliar,
    
};
