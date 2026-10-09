-- The Days We Felt Alive: 1990–2014 retro catalog
-- Htut Kaung San / b67103023
-- MySQL 8.4; select the target database before importing.
-- Safe to repeat: preserves existing customers, rentals, prices and stock.
SET NAMES utf8mb4;

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
  catalog_key VARCHAR(64) NULL UNIQUE,
  original_title VARCHAR(150) NULL,
  release_year SMALLINT UNSIGNED NULL,
  language ENUM('Thai','English') NULL,
  genre VARCHAR(100) NULL,
  description VARCHAR(1000) NULL,
  featured_tracks VARCHAR(500) NULL,
  image_url VARCHAR(255) NULL,
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

SET @retro_ddl = IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='media' AND column_name='catalog_key')=0, 'ALTER TABLE media ADD COLUMN catalog_key VARCHAR(64) NULL UNIQUE', 'SELECT 1');
PREPARE retro_stmt FROM @retro_ddl;
EXECUTE retro_stmt;
DEALLOCATE PREPARE retro_stmt;
SET @retro_ddl = IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='media' AND column_name='original_title')=0, 'ALTER TABLE media ADD COLUMN original_title VARCHAR(150) NULL', 'SELECT 1');
PREPARE retro_stmt FROM @retro_ddl;
EXECUTE retro_stmt;
DEALLOCATE PREPARE retro_stmt;
SET @retro_ddl = IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='media' AND column_name='release_year')=0, 'ALTER TABLE media ADD COLUMN release_year SMALLINT UNSIGNED NULL', 'SELECT 1');
PREPARE retro_stmt FROM @retro_ddl;
EXECUTE retro_stmt;
DEALLOCATE PREPARE retro_stmt;
SET @retro_ddl = IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='media' AND column_name='language')=0, 'ALTER TABLE media ADD COLUMN language ENUM(''Thai'',''English'') NULL', 'SELECT 1');
PREPARE retro_stmt FROM @retro_ddl;
EXECUTE retro_stmt;
DEALLOCATE PREPARE retro_stmt;
SET @retro_ddl = IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='media' AND column_name='genre')=0, 'ALTER TABLE media ADD COLUMN genre VARCHAR(100) NULL', 'SELECT 1');
PREPARE retro_stmt FROM @retro_ddl;
EXECUTE retro_stmt;
DEALLOCATE PREPARE retro_stmt;
SET @retro_ddl = IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='media' AND column_name='description')=0, 'ALTER TABLE media ADD COLUMN description VARCHAR(1000) NULL', 'SELECT 1');
PREPARE retro_stmt FROM @retro_ddl;
EXECUTE retro_stmt;
DEALLOCATE PREPARE retro_stmt;
SET @retro_ddl = IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='media' AND column_name='featured_tracks')=0, 'ALTER TABLE media ADD COLUMN featured_tracks VARCHAR(500) NULL', 'SELECT 1');
PREPARE retro_stmt FROM @retro_ddl;
EXECUTE retro_stmt;
DEALLOCATE PREPARE retro_stmt;
SET @retro_ddl = IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='media' AND column_name='image_url')=0, 'ALTER TABLE media ADD COLUMN image_url VARCHAR(255) NULL', 'SELECT 1');
PREPARE retro_stmt FROM @retro_ddl;
EXECUTE retro_stmt;
DEALLOCATE PREPARE retro_stmt;

START TRANSACTION;

-- Boomerang (1990)
INSERT INTO media (catalog_key, title, creator, category, format, total_copies, daily_fee, daily_late_fee, original_title, release_year, language, genre, description, featured_tracks, image_url)
SELECT 'boomerang', 'Boomerang', 'Bird Thongchai', 'music', 'CD', 3, 15, 5, 'บูมเมอแรง', 1990, 'Thai', 'Pop', 'Bright Thai pop with playful hooks and the unmistakable voice of Bird Thongchai.', 'บูมเมอแรง · คู่กัด · หมอกหรือควัน', '/images/retro/boomerang.png'
WHERE NOT EXISTS (SELECT 1 FROM media WHERE catalog_key='boomerang' OR (title='Boomerang' AND creator='Bird Thongchai' AND format='CD'));

-- Moderndog (1994)
INSERT INTO media (catalog_key, title, creator, category, format, total_copies, daily_fee, daily_late_fee, original_title, release_year, language, genre, description, featured_tracks, image_url)
SELECT 'moderndog', 'Moderndog', 'Moderndog', 'music', 'CD', 3, 15, 5, 'เสริมสุขภาพ', 1994, 'Thai', 'Alternative rock', 'A landmark Thai alternative album, bringing restless guitars and a new sound to the 1990s.', 'บุษบา · บางสิ่ง · หมดเวลา', '/images/retro/moderndog.png'
WHERE NOT EXISTS (SELECT 1 FROM media WHERE catalog_key='moderndog' OR (title='Moderndog' AND creator='Moderndog' AND format='CD'));

-- LO-Society (1996)
INSERT INTO media (catalog_key, title, creator, category, format, total_copies, daily_fee, daily_late_fee, original_title, release_year, language, genre, description, featured_tracks, image_url)
SELECT 'lo-society', 'LO-Society', 'LOSO', 'music', 'CD', 3, 15, 5, 'โลโซไซตี้', 1996, 'Thai', 'Rock', 'Straightforward Thai rock: memorable riffs, friendship and everyday feelings.', 'ไม่ต้องห่วงฉัน · เราและนาย · ฉันหรือเธอ (ที่เปลี่ยนไป)', '/images/retro/lo-society.png'
WHERE NOT EXISTS (SELECT 1 FROM media WHERE catalog_key='lo-society' OR (title='LO-Society' AND creator='LOSO' AND format='CD'));

-- Believe (2005)
INSERT INTO media (catalog_key, title, creator, category, format, total_copies, daily_fee, daily_late_fee, original_title, release_year, language, genre, description, featured_tracks, image_url)
SELECT 'believe', 'Believe', 'Bodyslam', 'music', 'CD', 3, 15, 5, NULL, 2005, 'Thai', 'Rock', 'Anthemic Thai rock about belief, persistence and the people who keep us going.', 'ความเชื่อ · ขอบฟ้า · คนที่ถูกรัก', '/images/retro/believe.png'
WHERE NOT EXISTS (SELECT 1 FROM media WHERE catalog_key='believe' OR (title='Believe' AND creator='Bodyslam' AND format='CD'));

-- Dangerous (1991)
INSERT INTO media (catalog_key, title, creator, category, format, total_copies, daily_fee, daily_late_fee, original_title, release_year, language, genre, description, featured_tracks, image_url)
SELECT 'dangerous', 'Dangerous', 'Michael Jackson', 'music', 'CD', 3, 15, 5, NULL, 1991, 'English', 'Pop / R&B', 'Dance grooves and sweeping pop ballads from Michael Jackson’s early-1990s era.', 'Black or White · Remember the Time · Heal the World', '/images/retro/dangerous.jpg'
WHERE NOT EXISTS (SELECT 1 FROM media WHERE catalog_key='dangerous' OR (title='Dangerous' AND creator='Michael Jackson' AND format='CD'));

-- (What's the Story) Morning Glory? (1995)
INSERT INTO media (catalog_key, title, creator, category, format, total_copies, daily_fee, daily_late_fee, original_title, release_year, language, genre, description, featured_tracks, image_url)
SELECT 'morning-glory', '(What''s the Story) Morning Glory?', 'Oasis', 'music', 'CD', 3, 15, 5, NULL, 1995, 'English', 'Britpop', 'Big guitars and sing-along choruses that became defining sounds of 1990s Britpop.', 'Wonderwall · Don''t Look Back in Anger · Champagne Supernova', '/images/retro/morning-glory.jpg'
WHERE NOT EXISTS (SELECT 1 FROM media WHERE catalog_key='morning-glory' OR (title='(What''s the Story) Morning Glory?' AND creator='Oasis' AND format='CD'));

-- Hybrid Theory (2000)
INSERT INTO media (catalog_key, title, creator, category, format, total_copies, daily_fee, daily_late_fee, original_title, release_year, language, genre, description, featured_tracks, image_url)
SELECT 'hybrid-theory', 'Hybrid Theory', 'Linkin Park', 'music', 'CD', 3, 15, 5, NULL, 2000, 'English', 'Alternative metal', 'An energetic blend of guitar, rap and electronics, full of turn-of-the-millennium emotion.', 'In the End · Crawling · One Step Closer', '/images/retro/hybrid-theory.jpg'
WHERE NOT EXISTS (SELECT 1 FROM media WHERE catalog_key='hybrid-theory' OR (title='Hybrid Theory' AND creator='Linkin Park' AND format='CD'));

-- 21 (2011)
INSERT INTO media (catalog_key, title, creator, category, format, total_copies, daily_fee, daily_late_fee, original_title, release_year, language, genre, description, featured_tracks, image_url)
SELECT 'adele-21', '21', 'Adele', 'music', 'CD', 3, 15, 5, NULL, 2011, 'English', 'Pop / Soul', 'Powerful vocals and heartfelt songs about heartbreak, memory and moving forward.', 'Rolling in the Deep · Someone Like You · Set Fire to the Rain', '/images/retro/adele-21.jpg'
WHERE NOT EXISTS (SELECT 1 FROM media WHERE catalog_key='adele-21' OR (title='21' AND creator='Adele' AND format='CD'));

-- Nang Nak (1999)
INSERT INTO media (catalog_key, title, creator, category, format, total_copies, daily_fee, daily_late_fee, original_title, release_year, language, genre, description, featured_tracks, image_url)
SELECT 'nang-nak', 'Nang Nak', 'Nonzee Nimibutr', 'movie', 'DVD', 3, 25, 10, 'นางนาก', 1999, 'Thai', 'Horror / Romance', 'A village love story meets the enduring Thai legend of Mae Nak.', NULL, '/images/retro/nang-nak.png'
WHERE NOT EXISTS (SELECT 1 FROM media WHERE catalog_key='nang-nak' OR (title='Nang Nak' AND creator='Nonzee Nimibutr' AND format='DVD'));

-- Ong-Bak (2003)
INSERT INTO media (catalog_key, title, creator, category, format, total_copies, daily_fee, daily_late_fee, original_title, release_year, language, genre, description, featured_tracks, image_url)
SELECT 'ong-bak', 'Ong-Bak', 'Prachya Pinkaew', 'movie', 'DVD', 3, 25, 10, 'องค์บาก', 2003, 'Thai', 'Action / Martial arts', 'A young martial artist travels to Bangkok to recover a treasured village relic.', NULL, '/images/retro/ong-bak.png'
WHERE NOT EXISTS (SELECT 1 FROM media WHERE catalog_key='ong-bak' OR (title='Ong-Bak' AND creator='Prachya Pinkaew' AND format='DVD'));

-- The Love of Siam (2007)
INSERT INTO media (catalog_key, title, creator, category, format, total_copies, daily_fee, daily_late_fee, original_title, release_year, language, genre, description, featured_tracks, image_url)
SELECT 'love-of-siam', 'The Love of Siam', 'Chookiat Sakveerakul', 'movie', 'DVD', 3, 25, 10, 'รักแห่งสยาม', 2007, 'Thai', 'Romance / Drama', 'Music and a reunion between childhood friends open a tender story of love and family.', NULL, '/images/retro/love-of-siam.png'
WHERE NOT EXISTS (SELECT 1 FROM media WHERE catalog_key='love-of-siam' OR (title='The Love of Siam' AND creator='Chookiat Sakveerakul' AND format='DVD'));

-- Pee Mak (2013)
INSERT INTO media (catalog_key, title, creator, category, format, total_copies, daily_fee, daily_late_fee, original_title, release_year, language, genre, description, featured_tracks, image_url)
SELECT 'pee-mak', 'Pee Mak', 'Banjong Pisanthanakun', 'movie', 'DVD', 3, 25, 10, 'พี่มาก..พระโขนง', 2013, 'Thai', 'Horror / Comedy', 'Friendship, comedy and a ghostly romance give the Mae Nak legend a playful twist.', NULL, '/images/retro/pee-mak.png'
WHERE NOT EXISTS (SELECT 1 FROM media WHERE catalog_key='pee-mak' OR (title='Pee Mak' AND creator='Banjong Pisanthanakun' AND format='DVD'));

-- Titanic (1997)
INSERT INTO media (catalog_key, title, creator, category, format, total_copies, daily_fee, daily_late_fee, original_title, release_year, language, genre, description, featured_tracks, image_url)
SELECT 'titanic', 'Titanic', 'James Cameron', 'movie', 'DVD', 3, 25, 10, NULL, 1997, 'English', 'Romance / Drama', 'Two young passengers form an unlikely connection aboard the ill-fated ocean liner.', NULL, '/images/retro/titanic.png'
WHERE NOT EXISTS (SELECT 1 FROM media WHERE catalog_key='titanic' OR (title='Titanic' AND creator='James Cameron' AND format='DVD'));

-- The Matrix (1999)
INSERT INTO media (catalog_key, title, creator, category, format, total_copies, daily_fee, daily_late_fee, original_title, release_year, language, genre, description, featured_tracks, image_url)
SELECT 'the-matrix', 'The Matrix', 'The Wachowskis', 'movie', 'DVD', 3, 25, 10, NULL, 1999, 'English', 'Science fiction / Action', 'A computer programmer discovers that his familiar world hides an extraordinary secret.', NULL, '/images/retro/the-matrix.png'
WHERE NOT EXISTS (SELECT 1 FROM media WHERE catalog_key='the-matrix' OR (title='The Matrix' AND creator='The Wachowskis' AND format='DVD'));

-- The Dark Knight (2008)
INSERT INTO media (catalog_key, title, creator, category, format, total_copies, daily_fee, daily_late_fee, original_title, release_year, language, genre, description, featured_tracks, image_url)
SELECT 'the-dark-knight', 'The Dark Knight', 'Christopher Nolan', 'movie', 'DVD', 3, 25, 10, NULL, 2008, 'English', 'Crime / Superhero', 'Gotham’s fight against organized crime is shaken by a criminal who thrives on chaos.', NULL, '/images/retro/the-dark-knight.jpg'
WHERE NOT EXISTS (SELECT 1 FROM media WHERE catalog_key='the-dark-knight' OR (title='The Dark Knight' AND creator='Christopher Nolan' AND format='DVD'));

-- Interstellar (2014)
INSERT INTO media (catalog_key, title, creator, category, format, total_copies, daily_fee, daily_late_fee, original_title, release_year, language, genre, description, featured_tracks, image_url)
SELECT 'interstellar', 'Interstellar', 'Christopher Nolan', 'movie', 'DVD', 3, 25, 10, NULL, 2014, 'English', 'Science fiction / Drama', 'A journey beyond Earth becomes a story about survival, time and the bonds of family.', NULL, '/images/retro/interstellar.jpg'
WHERE NOT EXISTS (SELECT 1 FROM media WHERE catalog_key='interstellar' OR (title='Interstellar' AND creator='Christopher Nolan' AND format='DVD'));

COMMIT;
