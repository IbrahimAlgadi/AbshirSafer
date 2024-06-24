const { Client } = require('pg');

// Function to create database
async function createDatabase() {
  const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'postgres', // Connect to default database
    password: 'postgres',
    port: 5432,
  });

  try {
    await client.connect();

    // Create the new database
    await client.query('CREATE DATABASE kashif_db;');
    console.log('Database created.');

  } catch (err) {
    console.error('Error creating database:', err);
  } finally {
    await client.end();
  }
}

// Function to grant privileges
async function grantPrivileges() {
  const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'kashif_db', // Connect to the new database
    password: 'postgres',
    port: 5432,
  });

  try {
    await client.connect();

    // Grant privileges
    await client.query('GRANT ALL PRIVILEGES ON DATABASE kashif_db TO postgres;');
    console.log('Privileges granted.');

  } catch (err) {
    console.error('Error granting privileges:', err);
  } finally {
    await client.end();
  }
}

// Function to grant privileges
async function createTables() {
  const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'kashif_db', // Connect to the new database
    password: 'postgres',
    port: 5432,
  });

  try {
    await client.connect();

    // Grant privileges
    await client.query(`
-- Create vehicle table
CREATE TABLE vehicle (
    id SERIAL PRIMARY KEY,
    transaction_id VARCHAR NOT NULL,
    code VARCHAR NOT NULL,
    message VARCHAR NOT NULL,
    vehicle_primary_color VARCHAR NOT NULL,
    vehicle_secondary_color VARCHAR,
    vehicle_maker VARCHAR NOT NULL,
    vehicle_model VARCHAR,
    vehicle_manufacture_year VARCHAR NOT NULL,
    vehicle_wanted_status_code VARCHAR NOT NULL,
    plate_number VARCHAR NOT NULL,
    plate_type VARCHAR NOT NULL,
    lpr_id VARCHAR NOT NULL,
    camera_id VARCHAR NOT NULL,
    date DATE NOT NULL,
    time TIME NOT NULL
);

-- Create vehicle_legal_status table
CREATE TABLE vehicle_legal_status (
    id SERIAL PRIMARY KEY,
    vehicle_id INTEGER NOT NULL,
    vehicle_legal_status_code VARCHAR NOT NULL,
    vehicle_legal_status_ar VARCHAR NOT NULL,
    vehicle_legal_status_en VARCHAR NOT NULL,
    FOREIGN KEY (vehicle_id) REFERENCES vehicle(id)
);

    `);
    console.log('Tables created.');

  } catch (err) {
    console.error('Error granting privileges:', err);
  } finally {
    await client.end();
  }
}

// Execute the functions
createDatabase()
  .then(grantPrivileges)
  .then(createTables)
  .catch(err => console.error('Error in database setup:', err));

