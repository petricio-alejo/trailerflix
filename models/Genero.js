const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

// Tabla generos
const Genero = sequelize.define('Genero', {
  id_genero: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  tableName: 'generos',
  timestamps: false,
  // Nombres en español para las asociaciones (ej: contenido.Generos)
  name: { singular: 'Genero', plural: 'Generos' },
});

module.exports = Genero;
