-- Supprimer la table users si elle existe
DROP TABLE IF EXISTS users;

-- Créer la table users
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100),
    role VARCHAR(20),
    full_name VARCHAR(100),
    enabled BOOLEAN DEFAULT TRUE,
    last_login DATETIME,
    created_at DATETIME
);

-- Insérer un utilisateur par défaut (password: admin123)
-- Pour générer le mot de passe hashé: BCryptPasswordEncoder encode "admin123"
INSERT INTO users (username, password, email, role, full_name, enabled, created_at) 
VALUES ('admin', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EHs', 'admin@example.com', 'ADMIN', 'Administrateur', TRUE, NOW());

-- Insérer un technicien par défaut
INSERT INTO users (username, password, email, role, full_name, enabled, created_at) 
VALUES ('technicien', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EHs', 'tech@example.com', 'TECHNICIEN', 'Technicien Principal', TRUE, NOW());
-- Ajouter les colonnes paiement
ALTER TABLE intervention ADD COLUMN IF NOT EXISTS montant_total DOUBLE DEFAULT 0;
ALTER TABLE intervention ADD COLUMN IF NOT EXISTS montant_paye DOUBLE DEFAULT 0;
ALTER TABLE intervention ADD COLUMN IF NOT EXISTS montant_restant DOUBLE DEFAULT 0;
ALTER TABLE intervention ADD COLUMN IF NOT EXISTS statut_paiement VARCHAR(50) DEFAULT 'EN_ATTENTE';
ALTER TABLE intervention ADD COLUMN IF NOT EXISTS date_echeance DATETIME;

-- Créer la table transaction
CREATE TABLE IF NOT EXISTS transaction (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    intervention_id BIGINT NOT NULL,
    montant DOUBLE NOT NULL,
    date_transaction DATETIME NOT NULL,
    methode VARCHAR(50) NOT NULL,
    reference VARCHAR(255),
    notes TEXT,
    statut VARCHAR(50) NOT NULL,
    FOREIGN KEY (intervention_id) REFERENCES intervention(id)
);

-- Mettre à jour les interventions existantes
UPDATE intervention SET 
    montant_total = COALESCE(prix_estime, prix_reel, 0),
    montant_paye = 0,
    montant_restant = COALESCE(prix_estime, prix_reel, 0),
    statut_paiement = CASE 
        WHEN COALESCE(prix_estime, prix_reel, 0) = 0 THEN 'PAYE'
        ELSE 'EN_ATTENTE'
    END
WHERE montant_total IS NULL OR montant_total = 0;