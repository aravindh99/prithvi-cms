import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import bcrypt from 'bcrypt';

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  password_hash: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('admin', 'user'),
    allowNull: false,
    defaultValue: 'user'
  },
  unit_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'units',
      key: 'id'
    }
  }
}, {
  tableName: 'users',
  timestamps: true,
  hooks: {
    beforeCreate: async (user) => {
      if (user.password_hash && !user.password_hash.startsWith('$2')) {
        user.password_hash = await bcrypt.hash(user.password_hash, 10);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password_hash') && !user.password_hash.startsWith('$2')) {
        user.password_hash = await bcrypt.hash(user.password_hash, 10);
      }
    }
  }
});

User.prototype.comparePassword = async function(password) {
  return bcrypt.compare(password, this.password_hash);
};

export default User;

