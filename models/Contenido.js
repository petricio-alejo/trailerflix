const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

// Tabla contenido: cada película o serie del catálogo
const Contenido = sequelize.define('Contenido', {
  // OJO: en la tabla, id_contenido NO es AUTO_INCREMENT (la base no se puede modificar).
  // Por eso no lleva autoIncrement y el id nuevo se calcula en el POST (máximo + 1).
  id_contenido: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false,
  },
  titulo: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  id_categoria: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  sinopsis: {
    type: DataTypes.TEXT,
  },
  // NULL en las películas (en el JSON original figuraba "N/A")
  temporadas: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: null,
  },
  // NULL cuando el título no tiene trailer
  trailer: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: null,
  },
}, {
  tableName: 'contenido',
  timestamps: false,
});

module.exports = Contenido;
