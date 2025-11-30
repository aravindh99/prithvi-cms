import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const OrderDayBill = sequelize.define('OrderDayBill', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  order_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'orders',
      key: 'id'
    }
  },
  bill_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  is_printed: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  printed_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  printer_ip_snapshot: {
    type: DataTypes.STRING,
    allowNull: true
  },
  printer_port_snapshot: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  tableName: 'order_day_bills',
  timestamps: true
});

export default OrderDayBill;

