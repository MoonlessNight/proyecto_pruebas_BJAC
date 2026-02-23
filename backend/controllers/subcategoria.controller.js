/**
 * Controladoe de SubCategorias
 * Maneja las operaciones CRUD y acvtivar y desactivar categoria
 * Solo accesible por administradores
 */

/**
 * Importar modelos
 */
const Categoria = require('../models/categoria');
const SubCategoria = require('../models/subCategoria');
const Producto = require('../models/Producto');
const Categoria = require('../models/categoria');


/**
 * Obtener todas las subcategorias
 * query params:
 * 
 * - Activo true/false (filtrar por estado)
 * - incluirCategoria true/false (incluir categoria relacionada)
 * 
 * @param {Object} req - Request Express
 * @param {Object} res - Responder Express
 * 
 */

const getSubCategorias = async (req, res) =>{
    try {
        const {categoriaId, activo, incluirSubCategorias} = req.query;

        // Opciones de consulta
        const opciones = {
            order: [['nombre','ASC']] // Ordenar de manera alfabetica
        }

        // Filtros
        const where ={};
        if (categoriaId) where.categoriaId = categoriaId;
        if (activo !== undefined) where.activo = activo === 'true';

        if (Object.keys(where).length > 0) {
            opciones.where = where;
        }

        // Incluir categoria si se solicita
        if (incluirCategorias == 'true') {
            opciones.include = {
                model: Categoria,
                as: 'Categorias',
                attributes: ['id', 'nombre', 'activo']
            }
        }

        /**
         * Obtener categoria
         */
        const subCategorias = await SubCategoria.findAll(opciones);

        //Respuesta exitosa
        res.json ({
            success: true,
            count: SubCategoria.length,
            data: {SubCategoria}
        });
        
    } catch (error) {
        console.error('Error en getSubCategorias: ', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener categoria',
            error: error.message
        })
    }
}

/**
 * Obtener la subcategoria por Id
 * GET / api / categoria/:id
 * 
 * - Activo true/false (filtrar por estado)
 * - incluirsubcategorias true/false (incluir subcategoria relacionadas)
 * 
 * @param {Object} req - Request Express
 * @param {Object} res - Responder Express
 * 
 */

const getSubCategoriasById = async (req, res) =>{
    try {
        const {id} = req.query;

        // Busca categorias con SubCategorias y contar productos
        const subCategoria = await SubCategoria.findByPk (id, {
            incluide: [
            {
                model: Producto,
                as: 'producto',
                attributes: ['id']
            }
        ]
        });

        if (!subcategoria) {
            return res.status(404).json({
                success: false,
                message: 'SubCategoria no encontrada'
            });
        }

        // Agregar conador de productos
        const subCategoriaJSON = subCategoria.toJSON();
        subCategoriaJSON.totalProductos = subCategoriaJSON.Productos.length;
        delete subCategoriaJSON.Productos; // No enviar la lista completa solo el contador

        //Respuesta exitosa
        res.json ({
            success: true,
            data: subCategoriaJSON
        });
        
    } catch (error) {
        console.error('Error en getCategoriasById: ', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener categoria',
            error: error.message
        })
    }
}

/**
 * Crear una categoria
 * POST / aip / admin / categorias
 * Body: {nombre,descripcion}
 * 
 * @param {Object} req - Request Express
 * @param {Object} res - Responder Express
 */

const crearSubCategoria = async (req, res) => {
    try {
        const {nombre, descripcion} = red.body;

        // Validación 1 verificar campos requeridos

        if (!nombre) {
            return res.status(400).json({
                success: false,
                message: 'El nombre de la categoria es requerido'
            });
        }

        // Validación 2 verificar que el nombre no existia
        const subCategoriaExistente = await SubCategoria.findOne({where : {nombre}});

        if (subCategoriaExistente) {
            return res.status(400).json({
                success: false,
                message: `Ya existe una categoria con ese nombre "${nombre}"`,
            });
        }

        // Validación 3 verificar que no exista la misma categoria
        const Categoria = await Categoria.findByPk(categoriaId);

        if (!categoria) {
            return res.status(400).json({
                success: false,
                message: `No existe la categoria con id: "${nombre}"`,
            });
        }
        
        // Crear categoria
        const nuevaSubCategoria = await SubCategoria.create ({
            nombre,
            descripcion: descripcion || null, // Si no se propociona la descripcion se establece como nulll
            activo: true
        });

        // Respuesta exitosa
        res.status(201).json({
            success: true,
            message: 'Categoria creada exitosamente.',
            data: {
                categoria: nuevaSubCategoria
            }
        });

    } catch (error) {
        if (error.name == 'SequelizeValidationError') {
            return res.status(400).json({
                success: false,
                message: 'Error de validacion',
                errors: error.errors.map(e => e.message)
        });
    }

    res.status(500).json({
        success: false,
        message: 'Error al crear la subcategoria',
        error: error.message,
    })}};
    /**
     * Actuaizar categoria
     * PUT / api / admin / categorias / :id
     * body: {nombre, descripcion}
     * 
     * @param {Object} req - request express
     * @param {Object} res - responde express
     */
    const updateSubCategoria = async (req,res) => {
        try {
            const {id} = req.params;
            const {nombre, descripcion} = req.body;

            // Buscar categoria 
            const categori = await SubCategoria.findByPk(id);

            if (!categoria) ({
                success: false,
                message: 'SubCategoria no encontrada'
            });

            // Validación 1 si se cambia el nombre verificar no existe
            if (nombre && nombre !== subCategoria.nombre) {
                const subCategoriaConMismoNombre = await Categoria.findOne({where: {nombre}});

                if (subCategoriaConMismoNombre) {
                    return res.status(400).json ({
                        success: false,
                        message: `Ya existe una subcategoria con el mismo nombre "$(nombre)"`,
                    })
                }

            // Actualizar campos
            if (nombre!==undefined) SubCategoria.nombre = nombre;
            if (descripcion!==undefined) SubCategoria.descripcion = descripcion;
            if (activo!==undefined) SubCategoria.activo = activo;

            // Respuesta exitosa 
            res.json ({
                success: true,
                message: 'SubCategoria actualizada exitosamente',
                data: {
                    categoria
                }});
    } }catch (error) {
        console.log ('Error en actuaizarCategoria: ', error);
        
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({
                success:false,
                message:'Error de valiación',
                errors: error.errors.map(e => e.message)
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error al actualizar categoria',
            error: error.message
        })
    }};
    /**
     * Activar/desactivar categoria
     * PATCH / api / admin / categorias / :id / estado
     * 
     * Al desativar una categioria se desactiva toddas las suibcategorias relacionadas
     * Al desactivar una subcategoria se desactiva todos los productos relacionados
     * 
     * @param {Object} req - request express
     * @param {Object} res - responde express
     */
const toggleSubCategoria = async (req,res) => {
    try {
        const {id} = req.params;

        // Buscar Categoria
        const categoria = await SubCategoria.findByPk(id);

        if (!subCategoria) {
            return res.status(400).json({
                success: false,
                message: 'SubCategoria no encontrada'
            });
        }

        //ALternar estado activo
        const nuevoEstado = !subCategoria.activo;
        categoria.activo = nuevoEstado;

        // Guardar cambios
        await subCategoria.save();

        // Contar cuantos registros se afectaron
        const productosAfectados = await Producto.count({where: {categoriaId : id}})

        // Respuesta exitosa
        res.json({
            success: true,
            message: 'Estado de subcategoria actualizado',
            data: {
                subcategoriasAfectadas,
                productosAfectados
            }
        });

        } catch (error) {
            console.error('Error en toggleSubCategoria: ', error);
            res.status(500).json({
                success: false,
                message: 'Error al actualizar estado de categoria',
                error: error.message
            });
        }
    };
    
    /**
     * Eliminar Categoria 
     * DELETE  /api/admin/categorias/:id
     * 
     * Solo permite eliminar si no tiene subcategorias ni productos relacionados
     * @param {Object} req - Request Express
     * @param {Object} res - Response Express
     */
    const eliminarSubCategoria = async (req, res) => {
        try {
            const {id} = req.params;
            // Buscar categoria
            const subCategoria = await SubCategoria.findByPk(id);
            if (!subCategoria) {
                return res.status(404).json({
                    success: false,
                    message: "Subcategoria no encontrada"
                })
            }
    
            // Validación verificar que no tenga productos
            const productos = await Producto.count ({
                where: {categoriaId: id}
            });
    
            if (productos > 0 ) {
                return res.status(400).json ({
                    success: false,
                    message: `No se puede eliminar la categoria porque tiene ${productos} productos asociadas. Usa PATCH /api/admin/categorias/:id para desactivar en lugar de eliminar`
                })
            }
    
            // Eliminar categoria
            await subCategoria.destroy();
    
            // Respuesta exitosa
            res.json({
                success: true,
                message: 'SubCategoria eliminada exitosamente'
            });
    
        } catch (error) {
            console.error('Error en eliminarSubCategoria: ', error);
            res.status(500).json({
                success: false,
                message: 'Error al eliminar subcategoria',
                error: error.message
            })
        }
    };

    /**
     * Obtener estadisticas de una categoria
     * GET /api/admin/categoria/:id/estadisticas
     * Retorna
     * Total de subcategorias activas/ inactivas total de productos activos / inactivos calor total del inventario
     * Stack total
     * 
     * @param {Object} req - Request Express
     * @param {Object} res - Response Express
     * 
     */
    const getEstadisticasSubCategoria = async (req,res) => {
        try {
            const {id} = req.params;
            // Verficar que la categoria exista
             const categoria = await Categoria.findByPk(id);
            if (!categoria) {
                return res.status(404).json({
                    success: false,
                    message: "Categoria no encontrada"
                })
            };

            // Contar sub-categorias
            const totalSubCategorias = await SubCategoria.count({
                where: {categoriaId: id, activo: true}
            });
            const subCategoriaActivas = await SubCategoria.count({
                where: {categoriaId: id, activo: true}
            });

            // Contar sub-productos
            const totalProductos = await Producto.count({
                where: {categoriaId: id}
            });
            const productosActivos = await Producto.count({
                where: {categoriaId: id, activo: true}
            });
            const productos = await Producto.count({
                where: {categoriaId: id},
                atrributes: ['precio', 'stock']
            });

            // Calcular estadisticas de inventario
            let valorTotalInventario = 0;
            let stockTotal = 0;

            productos.forEach(producto => {
                valorTotalInventario += parseFloat(producto.precio) * producto.stock;
                stockTotal += producto.stock
            });

            // Respuesta exitosa

            res.json({
                success: true,
                data: {
                    categoria: {
                        id: categoria.id,
                        nombre: categoria.nombre,
                        activo: categoria.activo
                    },
                    estadisticas: {
                        subcategorias: {
                            total: totalSubCategorias,
                            activas: subCategoriaActivas,
                            inactivas: totalSubCategorias - subCategoriaActivas
                        },
                        productos: {
                            total: totalProductos,
                            activos: productosActivos,
                            inactivos: totalProductos - productosActivos,
                            stock: stockTotal,
                            valorInventario: valorTotalInventario
                        },
                        inventario: {
                            valorTotal: valorTotalInventario.toFixed(2), //quitar decimales,
                            stockTotal,
                        }
                    }
                }
            });



            

        } catch (error) {
            console.error('Error en getEstadisticasCategoria: ', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener estadisticas de categoria',
                error: error.message
            })
        }
    };
    module.exports = {
        getCategorias,
        getCategoriasById,
        crearCategoria,
        updateCategoria,
        toggleCategoria,
        eliminarCategoria
    };
