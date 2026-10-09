CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin','customer') NOT NULL DEFAULT 'customer',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS media (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(150) NOT NULL,
  creator VARCHAR(150) NOT NULL,
  category ENUM('music','movie') NOT NULL,
  format ENUM('CD','DVD') NOT NULL,
  total_copies INT UNSIGNED NOT NULL,
  daily_fee DECIMAL(10,2) NOT NULL,
  daily_late_fee DECIMAL(10,2) NOT NULL,
  archived BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (total_copies >= 1),
  CHECK (daily_fee >= 0 AND daily_late_fee >= 0)
);
CREATE TABLE IF NOT EXISTS rentals (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  customer_id INT UNSIGNED NOT NULL,
  media_id INT UNSIGNED NOT NULL,
  request_key CHAR(36) NOT NULL,
  rental_days TINYINT UNSIGNED NOT NULL,
  rented_on DATE NOT NULL,
  due_on DATE NOT NULL,
  returned_on DATE NULL,
  daily_fee DECIMAL(10,2) NOT NULL,
  daily_late_fee DECIMAL(10,2) NOT NULL,
  rental_fee DECIMAL(10,2) NOT NULL,
  late_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY rental_request (customer_id, request_key),
  INDEX media_active (media_id, returned_on),
  FOREIGN KEY (customer_id) REFERENCES users(id),
  FOREIGN KEY (media_id) REFERENCES media(id),
  CHECK (rental_days BETWEEN 1 AND 30)
);
