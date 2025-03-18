CREATE TABLE IF NOT EXISTS share_codes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(12) NOT NULL UNIQUE,
  correction_id INT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NULL,
  is_active BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (correction_id) REFERENCES corrections(id) ON DELETE CASCADE,
  INDEX (code),
  INDEX (correction_id)
);
