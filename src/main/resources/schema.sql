-- =====================================================
-- SCHEMA SQL - Samsung Merchandising API
-- Drop and recreate all tables
-- =====================================================

-- Drop tables in correct order (visits first due to FK)
DROP TABLE IF EXISTS visits CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS stores CASCADE;
DROP TABLE IF EXISTS products CASCADE;

-- Create stores table
CREATE TABLE stores (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL,
    city VARCHAR(50) NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    address VARCHAR(255)
);

-- Create users table
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('PROMOTER', 'SFOS', 'SUPERVISOR')),
    status VARCHAR(20) NOT NULL CHECK (status IN ('ACTIVE', 'INACTIVE')),
    region VARCHAR(100),
    manager_id BIGINT REFERENCES users(id)
);

-- Create visits table
CREATE TABLE visits (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    store_id BIGINT NOT NULL REFERENCES stores(id),
    visit_date TIMESTAMP NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('PLANNED', 'COMPLETED', 'VALIDATED', 'REJECTED')),
    sales_amount DOUBLE PRECISION,
    shelf_share DOUBLE PRECISION,
    interaction_count INTEGER,
    comment VARCHAR(500)
);

-- Create products table
CREATE TABLE products (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description VARCHAR(1000),
    sku VARCHAR(50) NOT NULL UNIQUE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('WHITE_GOODS', 'BROWN_GOODS')),
    sub_category VARCHAR(100),
    price DOUBLE PRECISION,
    image_url VARCHAR(500),
    stock INTEGER DEFAULT 0
);