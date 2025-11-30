import sequelize from '../config/database.js';
import { User, Unit } from '../models/index.js';
import dotenv from 'dotenv';

dotenv.config();

const seedAdmin = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established.');

    // Sync all models
    await sequelize.sync({ alter: true });
    console.log('Database synced.');

    // Create admin user if it doesn't exist
    const [admin, created] = await User.findOrCreate({
      where: { username: 'admin' },
      defaults: {
        username: 'prithvi',
        password_hash: 'prithvi123', // Will be hashed by hook
        role: 'admin'
      }
    });

    if (created) {
      console.log('Admin user created: username=prithvi, password=prithvi123');
    } else {
      console.log('Admin user already exists.');
    }

    // Create sample unit if none exists
    const unitCount = await Unit.count();
    if (unitCount === 0) {
      await Unit.create({
        name: 'Unit 1',
        code: 'UNIT1',
        printer_ip: '192.168.1.120',
        printer_port: 9100,
        is_active: true
      });
      console.log('Sample unit created: Unit 1');
    }

    console.log('Seeding completed!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedAdmin();

