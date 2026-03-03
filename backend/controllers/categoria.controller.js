/**
 * Controladoe de Categorias
 * Maneja las operaciones CRUD y acvtivar y desactivar categoria
 * Solo accesible por administradores
 */

/**
 * Importar modelos
 */
const Categoria = require('../models/categoria');
const SubCategoria = require('../models/subCategoria');
const Producto = require('../models/Producto');

/**
 * Obtener todas las categorias
 * query params:
 * 
 * - Activo true/false (filtrar por estado)
 * - incluirsubcategorias true/false (incluir subcategoria relacionadas)
 * 
 * @param {Object} req - Request Express
 * @param {Object} res - Responder Express
 * 
 */

const getCategorias = async (req, res) =>{
    try {
        const {activo, incluirSubCategorias} = req.query;

        // Opciones de consulta
        const opciones = {
            order: [['nombre','ASC']] // Ordenar de manera alfabetica
        }

        // Filtra por estado especifico
        if (activo !== undefined) {
            opciones.include = { activo: activo == 'true'}
        }

        if (incluirSubCategorias == 'true') {
            opciones.include = {
                model: SubCategoria,
                as: 'SubCategorias',
                attributes: ['id', 'nombre', 'activo']
            }
        }

        /**
         * Obtener categoria
         */
        const categorias = await Categoria.findAll(opciones);

        //Respuesta exitosa
        res.json ({
            success: true,
            count: Categoria.length,
            data: {Categoria}
        });
        
    } catch (error) {
        console.error('Error en getCategorias: ', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener categoria',
            error: error.message
        })
    }
}

/**
 * Obtener la categoria por Id
 * GET / api / categoria/:id
 * 
 * - Activo true/false (filtrar por estado)
 * - incluirsubcategorias true/false (incluir subcategoria relacionadas)
 * 
 * @param {Object} req - Request Express
 * @param {Object} res - Responder Express
 * 
 */

const getCategoriasById = async (req, res) =>{
    try {
        const {id} = req.query;

        // Busca categorias con SubCategorias y contar productos
        const categoria = await Categoria.findByPk (id, {
            incluide: [{
                model: SubCategoria,
                as: 'subcategoria',
                attributes: ['id', 'nombre', 'descripcion', 'activo']
            },
            {
                model: Producto,
                as: 'producto',
                attributes: ['id']
            }
        ]
        });

        if (!categoria) {
            return res.status(404).json({
                success: false,
                message: 'Categoria no encontrada'
            });
        }

        // Agregar conador de productos
        const categoriaJSON = categoria.toJSON();
        categoriaJSON.totalProductos = categoriaJSON.Productos.length;
        delete categoriaJSON.Productos; // No enviar la lista completa solo el contador

        //Respuesta exitosa
        res.json ({
            success: true,
            data: categoriaJSON
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

const crearCategoria = async (req, res) => {
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
        const categoriaExistente = await Categoria.findOne({where : {nombre}});

        if (categoriaExistente) {
            return res.status(400).json({
                success: false,
                message: `Ya existe una categoria con ese nombre "${nombre}"`,
            });
        }
        
        // Crear categoria
        const nuevaCategoria = await Categoria.create ({
            nombre,
            descripcion: descripcion || null, // Si no se propociona la descripcion se establece como nulll
            activo: true
        });

        // Respuesta exitosa
        res.status(201).json({
            success: true,
            message: 'Categoria creada exitosamente.',
            data: {
                categoria: nuevaCategoria
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
        message: 'Error al crear la categoria',
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
    const updateCategoria = async (req,res) => {
        try {
            const {id} = req.params;
            const {nombre, descripcion} = req.body;

            // Buscar categoria 
            const categori = await Categoria.findByPk(id);

            if (!categoria) ({
                success: false,
                message: 'Categoria no encontrada'
            });

            // Validación 1 si se cambia el nombre verificar no existe
            if (nombre && nombre !== categoria.nombre) {
                const categoriaConMismoNombre = await Categoria.findOne({where: {nombre}});

                if (categoriaConMismoNombre) {
                    return res.status(400).json ({
                        success: false,
                        message: `Ya existe una categoria con el mismo nombre "$(nombre)"`,
                    })
                }

            // Actualizar campos
            if (nombre!==undefined) Categoria.nombre = nombre;
            if (descripcion!==undefined) Categoria.descripcion = descripcion;
            if (activo!==undefined) Categoria.activo = activo;

            // Respuesta exitosa 
            res.json ({
                success: true,
                message: 'Categoria actualizada exitosamente',
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
const toggleCategoria = async (req,res) => {
    try {
        const {id} = req.params;

        // Buscar Categoria
        const categoria = await Categoria.findByPk(id);

        if (!categoria) {
            return res.status(400).json({
                success: false,
                message: 'Categoria no encontrada'
            });
        }

        //ALternar estado activo
        const nuevoEstado = !categoria.activo;
        categoria.activo = nuevoEstado;

        // Guardar cambios
        await categoria.save();

        // Contar cuantos registros se afectaron
        const subcategoriasAfectadas = await SubCategoria.count({where: {categoriaId : id}})
        
        // Contar cuantos registros se afectaron
        const productosAfectados = await Producto.count({where: {categoriaId : id}})

        // Respuesta exitosa
        res.json({
            success: true,
            message: 'Estado de categoria actualizado',
            data: {
                categoria,
                subcategoriasAfectadas,
                productosAfectados
            }
        });

        } catch (error) {
            console.error('Error en toggleCategoria: ', error);
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
    const eliminarCategoria = async (req, res) => {
        try {
            const {id} = req.params;
            // Buscar categoria
            const categoria = await Categoria.findByPk(id);
            if (!categoria) {
                return res.status(404).json({
                    success: false,
                    message: "Categoria no encontrada"
                })
            }
    
            // Validación verificar que no tenga subcategorias
            const subcategoria = await SubCategoria.count ({
                where: {categoriaId: id}
            });
    
            if (subcategoria > 0 ) {
                return res.status(400).json ({
                    success: false,
                    message: `No se puede eliminar la categoria porque tiene ${subcategoria} Sub-Categorias asociadas. Usa PATCH /api/admin/categorias/:id para desactivar en lugar de eliminar`
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
            await categoria.destroy();
    
            // Respuesta exitosa
            res.json({
                success: true,
                message: 'Categoria eliminada exitosamente'
            });
    
        } catch (error) {
            console.error('Error en eliminarCategoria: ', error);
            res.status(500).json({
                success: false,
                message: 'Error al eliminar categoria',
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
    const getEstadisticasCategoria = async (req,res) => {
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
