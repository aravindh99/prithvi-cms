import sequelize from '../config/database.js';
import User from './User.js';
import Unit from './Unit.js';
import Product from './Product.js';
import Order from './Order.js';
import OrderDayBill from './OrderDayBill.js';
import OrderItem from './OrderItem.js';

// Define associations
Product.belongsTo(Unit, { foreignKey: 'unit_id', as: 'unit' });
Unit.hasMany(Product, { foreignKey: 'unit_id', as: 'products' });

User.belongsTo(Unit, { foreignKey: 'unit_id', as: 'unit' });
Unit.hasMany(User, { foreignKey: 'unit_id', as: 'users' });

Order.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Order.belongsTo(Unit, { foreignKey: 'unit_id', as: 'unit' });
Order.hasMany(OrderDayBill, { foreignKey: 'order_id', as: 'dayBills' });

OrderDayBill.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });
OrderDayBill.hasMany(OrderItem, { foreignKey: 'order_day_bill_id', as: 'items' });

OrderItem.belongsTo(OrderDayBill, { foreignKey: 'order_day_bill_id', as: 'dayBill' });
OrderItem.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

User.hasMany(Order, { foreignKey: 'user_id', as: 'orders' });

export {
  sequelize,
  User,
  Unit,
  Product,
  Order,
  OrderDayBill,
  OrderItem
};

