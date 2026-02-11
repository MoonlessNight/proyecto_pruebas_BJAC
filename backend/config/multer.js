/*
Configuracion de subida de archivos

Multear es un middleware para menejar la subida de archivos en 
Este archivo configura como y donde se guardan las imagenes
*/

// Importar multer para manejar archivos 
const multer = require('multer');

// Importar path trabajar con rutas de archivos
const path = require('path');

// Importar fs para verficar /crear directorios
const fs = require('fs');
const { error } = require('console');

// Importar dotenv para variables de entorno
require('dotenv').config();

// Obtener la ruta donde se guardan los archivos
const uploadPath = process.env.UPLOAD_PATH || './uploads';

// Verificar si la carpeta uploads existe, si no, crearla
if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
    console.log(`Carpeta ${uploadPath}: creada`);
}

/* 
Configuracion de almacenamiento de multer
Define donde y como se guardan los archivos
*/

const storage = multer.diskStorage({
    /*
    Destination: define la carpeta destino donde se guardan el archivo
    @param {Object} req - Objeto de petición HTTP
    @param {Object} file - Archivo que esta subiendo.
    @param {Funtion} cb - Callback que se llama con (error, destination)
    */
    destination: function(req, file, cb) {
        // cb(null, ruta) -> sin error, ruta = carpeta destino
        cb(null, uploadPath);
    },

    /*
    filename: define el nombre con el que se guarda el archivo
    formato: timestamp-nombreoriginal.ext

    @param {Object} req - Objeto de petición HTTP
    @param {Object} file - Archivo que esta subiendo.
    @param {Funtion} cb - Callback que se llama con (error, filename)
    */


    filename: function(req, file, cb) {
        // Generar nombre unico usando timestamp + nombre original
        // Date.now() genera un timestamp unico
        // path.extname() extrae la extension del archivo (.jpg, .png, etc)

        const uniqueSuffix = Date.now() + '-' + file.originalname;
        cb(null, uniqueName);
    }
});

/*
Filtro para validar el tipo de archivo solo permite imagenes: jpg, jpeg, png, gif

@param {Object} req - Objeto de petición HTTP
@param {Object} file - Archivo que esta subiendo.
@param {Funtion} cb - Callback que se llama con (error, acceptFile)
*/

const fileFilter = function(req, file, cb) {
    // Tipos Mine permitidfos para imagenes
    const  alllowedTypes = ['imagen/jpg','image/jpeg', 'image/png', 'image/gif'];
    
    // Verificar si el tipo de archivo esta en la lista de permitidos
    if (alllowedTypes.includes(file.mimetype)) {
        // cd(nulll, true) -> rechaza el archivo
        cb(null, true);
    } else {
        // cb(new Error('Tipo de archivo no permitido'), false) -> rechaza el archivo con error
        cb(new Error('Solo se permite imagenes (jpg, jpeg, png, gif)'), false);
    };
};

/*
Configurar multer con las opciones definidas
*/

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        // Limire de tamañao del archivos de bytes
        // Por defecto 5MB (5*1024 = 5242880 bytes)
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5242880
    }
});

/*
Funcion para eliminar un archivo del servidor
Útil cuando se actualiza o elimina un producto 

@param {string} filePath - Nombre del archivo a eliminar
@param {boolean} -  true si se elimino, flase si hubo error
*/

const deleteFile = (filePath) => {
    try {
        // Construir la ruta completa del archivo
        const filePath = path.join(uploadPath, filename);

        // Verificar si el archivo existe
        if (fs.existsSync(filePath)) {
            // Eliminar el archivo
            fs.unlinkSync(filePath);
            console.log(`Archivo eliminado: ${filePath}`);
            return true;
        }else {
            console.log(`Archivo no encontrado: ${filePath}`);
            return false;
        } 
    } catch (error) {
        console.error(`Error al eliminar el archivo:`, error.message);
        return false;
    }
};

// Expotar configuracion de multer y función de eliminación
module.exports = {
    upload,            //Middleware de multer para uusar la ruta
    deleteFile         //Funcion para eliminar archivos 
};
