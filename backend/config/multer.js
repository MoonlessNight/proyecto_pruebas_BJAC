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