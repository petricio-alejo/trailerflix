const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

// Tabla intermedia contenido_generos (PK compuesta)
const ContenidoGenero = sequelize.define('ContenidoGenero', {
  id_contenido: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false,
  },
  id_genero: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false,
  },
}, {
  tableName: 'contenido_generos',
  timestamps: false,
});

module.exports = ContenidoGenero;
