import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  unit_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'units',
      key: 'id'
    }
  },
  payment_mode: {
    type: DataTypes.ENUM('PENDING', 'UPI', 'CASH', 'FREE', 'GUEST'),
    allowNull: false,
    defaultValue: 'PENDING'
  },
  payment_status: {
    type: DataTypes.ENUM('PENDING', 'PAID', 'FAILED'),
    allowNull: false,
    defaultValue: 'PENDING'
  },
  total_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  razorpay_order_id: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'orders',
  timestamps: true
});

export default Order;

