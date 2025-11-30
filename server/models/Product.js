import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name_en: {
    type: DataTypes.STRING,
    allowNull: false
  },
  name_ta: {
    type: DataTypes.STRING,
    allowNull: false
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  unit_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'units',
      key: 'id'
    }
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  image_path: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'products',
  timestamps: true
});

export default Product;

