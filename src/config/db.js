const { Sequelize } = require('sequelize');
require('dotenv').config();

const dialectOptions = {};
if (process.env.DB_SSL === 'true') {
  dialectOptions.ssl = {
    rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
  };
}

let sequelize;
if (process.env.DATABASE_URL) {
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'mysql',
    logging: false,
    dialectOptions,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  });
} else {
  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASS,
    {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      dialect: 'mysql',
      logging: false,
      dialectOptions,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    }
  );
}

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ MySQL Connection has been established successfully.');
    
    // Sync models - creates tables if they don't exist
    // In production, use migrations instead of alter: true
    await sequelize.sync();
    console.log('✅ MySQL Models synced successfully.');
  } catch (error) {
    console.error('❌ Unable to connect to the MySQL database:', error);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
