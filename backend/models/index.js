/**
 * Asociaciones entre modulos
 * este archivo define todas las relaciones entre modelos de Sequelize
 * deja ejecutar después de importar los modelos
 */

// Importar todos los modelos
const Usuario = require('./usuario');
const Categoria = require('./categoria');
const Carrito = require('./carrito');
const SubCategoria = require('./subCategoria');
const Producto = require('./producto');
const DetallePedido = require('./detallePedido');
const Pedido = require('./pedido');


/**
 * Definir asociaciones
 * Tipos de relaciones Sequelize:
 * 
 * hasOne - 1:1
 * belongsTo - 1:1 (lado opuesto)
 * hasMany - 1:N
 * belongsToMany - N:M 
 */

/**
 * Categoria - SubCategoria
 * Una categoria tiene muchas subcategorias
 * Una subcategoria pertenece a una categoria
 */
Categoria.hasMany(SubCategoria, {
    foreignKey: 'categoriaId',
    as: 'subcategorias',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
});

SubCategoria.belongsTo(Categoria, {
    foreignKey: 'categoriaId',
    as: 'categoria',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
});

/**
 * Categoria - Producto
 * Una categoria tiene muchos productos
 * un producto pertenece a una categoria
 */
Categoria.hasMany(Producto, {
    foreignKey: 'categoriaId',
    as: 'productos',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
});

Producto.belongsTo(Categoria, {
    foreignKey: 'categoriaId',
    as: 'categoria',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
});

/**
 * SubCategoria - Producto
 * Una subcategoria tiene muchos productos
 * un producto pertenece a una subcategoria
 */
SubCategoria.hasMany(Producto, {
    foreignKey: 'subCategoriaId',
    as: 'productos',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
});

Producto.belongsTo(SubCategoria, {
    foreignKey: 'subCategoriaId',
    as: 'subcategoria', // ⚠️ CORREGIDO: Cambiado de 'categoria' a 'subcategoria'
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
});

/**
 * Usuario - Carrito
 * Un usuario tiene muchos carritos
 * Un carrito pertenece a un usuario
 */
Usuario.hasMany(Carrito, {
    foreignKey: 'usuarioId',
    as: 'carritos',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
});

Carrito.belongsTo(Usuario, {
    foreignKey: 'usuarioId',
    as: 'usuario',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
});

/**
 * ⚠️ CORRECCIÓN: Carrito - Producto
 * Esta relación debe ser a través de una tabla intermedia (CarritoProducto)
 * ya que un carrito puede tener múltiples productos y un producto puede estar en múltiples carritos
 */

// Necesitarías crear este modelo intermedio

Carrito.belongsToMany(Producto, {
    through: 'carrito_productos',
    foreignKey: 'carritoId',
    otherKey: 'productoId',
    as: 'productos',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
});

Producto.belongsToMany(Carrito, {
    through: 'carrito_productos',
    foreignKey: 'productoId',
    otherKey: 'carritoId',
    as: 'carritos',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
});

/**
 * Usuario - Pedido
 * Un usuario tiene muchos pedidos
 * Un pedido pertenece a un usuario
 */
Usuario.hasMany(Pedido, {
    foreignKey: 'usuarioId',
    as: 'pedidos',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
});

Pedido.belongsTo(Usuario, {
    foreignKey: 'usuarioId',
    as: 'usuario',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
});

/**
 * Pedido - DetallePedido
 * Un Pedido tiene muchos detalles de pedido
 * Un DetallePedido pertenece a un Pedido
 */
Pedido.hasMany(DetallePedido, {
    foreignKey: 'pedidoId',
    as: 'detallesPedido',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
});

DetallePedido.belongsTo(Pedido, {
    foreignKey: 'pedidoId',
    as: 'pedido',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
});

/**
 * Producto - DetallePedido
 * Un Producto puede estar en muchos detallesPedido
 * Un DetallePedido pertenece a un Producto
 */
Producto.hasMany(DetallePedido, {
    foreignKey: 'productoId',
    as: 'detallesPedido',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
});

DetallePedido.belongsTo(Producto, {
    foreignKey: 'productoId',
    as: 'producto',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
});

/**
 * Relaciones muchos a muchos
 * Pedido y Producto tienen una relación de muchos a muchos a través de DetallePedido
 */
Pedido.belongsToMany(Producto, {
    through: DetallePedido,
    foreignKey: 'pedidoId',
    otherKey: 'productoId',
    as: 'productos',
});

Producto.belongsToMany(Pedido, {
    through: DetallePedido,
    foreignKey: 'productoId',
    otherKey: 'pedidoId',
    as: 'pedidos',
});

/**
 * ✅ CORRECCIÓN PRINCIPAL: Exportar todos los modelos
 * para poder usarlos en otras partes de la aplicación
 */
module.exports = {
    Usuario,
    Categoria,
    Carrito,
    SubCategoria,
    Producto,
    DetallePedido,
    Pedido,
    // Si creas el modelo intermedio:
    // CarritoProducto
};

