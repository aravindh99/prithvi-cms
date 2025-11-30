import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Unit = sequelize.define('Unit', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  code: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  printer_ip: {
    type: DataTypes.STRING,
    allowNull: false
  },
  printer_port: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 9100
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  tableName: 'units',
  timestamps: true
});

export default Unit;

