const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

// Tabla categorias: "Serie" o "Película"
const Categoria = sequelize.define('Categoria', {
  id_categoria: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  tableName: 'categorias',
  timestamps: false,
  // Nombres en español para las asociaciones (ej: contenido.Categoria)
  name: { singular: 'Categoria', plural: 'Categorias' },
});

module.exports = Categoria;
