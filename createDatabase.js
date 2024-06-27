const { Client } = require('pg');

const CREATE_DB = false;

class AppDatabase {
  DB_USER = "postgres";
  DB_PASSWORD = "postgres";
  DB_HOST = "localhost";
  DB_POSTGRES = "postgres";
  DB_APP = "vehicle_travel_request_db";

  constructor() { }

  // Function to create database
  async createDatabase() {
    const client = new Client({
      user: this.DB_USER,
      host: this.DB_HOST,
      database: this.DB_POSTGRES, // Connect to default database
      password: this.DB_PASSWORD,
      port: 5432,
    });

    try {
      await client.connect();

      // Create the new database
      await client.query(`CREATE DATABASE ${this.DB_APP};`);
      console.log('Database created.');

    } catch (err) {

      console.error('Error creating database:', err);
    } finally {
      await client.end();
    }
  }

  // Function to grant privileges
  async grantPrivileges() {
    const client = new Client({
      user: this.DB_USER,
      host: this.DB_HOST,
      database: this.DB_APP, // Connect to the new database
      password: this.DB_PASSWORD,
      port: 5432,
    });

    try {
      await client.connect();

      // Grant privileges
      await client.query(`GRANT ALL PRIVILEGES ON DATABASE ${this.DB_APP} TO postgres;`);
      console.log('Privileges granted.');

    } catch (err) {
      console.error('Error granting privileges:', err);
    } finally {
      await client.end();
    }
  }

  // Function to grant privileges
  async createTables() {
    const client = new Client({
      user: this.DB_USER,
      host: this.DB_HOST,
      database: this.DB_APP, // Connect to the new database
      password: this.DB_PASSWORD,
      port: 5432,
    });

    try {
      await client.connect();

      // Grant privileges
      await client.query(`

-- Create request_source Table
CREATE TABLE request_source (
    id SERIAL PRIMARY KEY,
    lpr_id VARCHAR(128) UNIQUE,
    lpr_name VARCHAR(255),
    cam_id VARCHAR(128) UNIQUE,
    cam_name VARCHAR(255)
);

-- Create travel_request Table
CREATE TABLE travel_request (
    id SERIAL PRIMARY KEY,
    request_source_id INTEGER,
    full_plate_number VARCHAR,
    action VARCHAR,
    vehicle_registration_type VARCHAR,
    vehicle_plate_number VARCHAR,
    provider_reference_number VARCHAR,
    has_towing_trailer BOOL,
    transaction_id VARCHAR,
    request_date DATE NOT NULL,
    request_time TIME NOT NULL,
    request_status VARCHAR,
    open_gate BOOL,
    FOREIGN KEY (request_source_id) REFERENCES request_source(id)
);

    `);
      console.log('Tables created.');

    } catch (err) {
      console.error('Error granting privileges:', err);
    } finally {
      await client.end();
    }
  }

  async dropTables() {
    const client = new Client({
      user: this.DB_USER,
      host: this.DB_HOST,
      database: this.DB_APP, // Connect to the new database
      password: this.DB_PASSWORD,
      port: 5432,
    });

    try {
      await client.connect();

    await client.query(`

-- Create travel_request Table
DROP TABLE travel_request;

    `);
    
      // Grant privileges
      await client.query(`

-- Create request_source Table
DROP TABLE request_source;

    `);

      console.log('Tables dropped.');

    } catch (err) {
      console.error('Error dropping tables:', err);
    } finally {
      await client.end();
    }
  }


}

if (CREATE_DB) {
  const appDb = new AppDatabase();
  // Create database
  // appDb.createDatabase(CREATE_DB)

  // Create Tables
  // appDb.createTables();

  // Drop tables
  // appDb.dropTables();
}

