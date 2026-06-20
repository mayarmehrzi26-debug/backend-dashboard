-- ============================================================
-- SCRIPT COMPLET DE MISE À JOUR DE LA BASE DE DONNÉES
-- ============================================================

-- 1. Supprimer la table users si elle existe
DROP TABLE IF EXISTS users;

-- 2. Créer la table users
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

-- 3. Insérer un utilisateur par défaut (password: admin123)
INSERT INTO users (username, password, email, role, full_name, enabled, created_at) 
VALUES ('admin', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EHs', 'admin@example.com', 'ADMIN', 'Administrateur', TRUE, NOW());

-- 4. Insérer un technicien par défaut
INSERT INTO users (username, password, email, role, full_name, enabled, created_at) 
VALUES ('technicien', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EHs', 'tech@example.com', 'TECHNICIEN', 'Technicien Principal', TRUE, NOW());

-- ============================================================
-- AJOUT DES COLONNES POUR LE PROCESSUS INTERNE
-- ============================================================

-- 5. Ajouter les colonnes pour le processus interne
ALTER TABLE intervention 
ADD COLUMN IF NOT EXISTS statut_intervention VARCHAR(50) DEFAULT 'EN_ATTENTE',
ADD COLUMN IF NOT EXISTS prix_propose DOUBLE,
ADD COLUMN IF NOT EXISTS date_diagnostic DATETIME,
ADD COLUMN IF NOT EXISTS date_recuperation DATETIME,
ADD COLUMN IF NOT EXISTS technicien VARCHAR(255),
ADD COLUMN IF NOT EXISTS reference VARCHAR(255),
ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'INTERNE';

-- 6. Ajouter les colonnes paiement
ALTER TABLE intervention 
ADD COLUMN IF NOT EXISTS montant_total DOUBLE DEFAULT 0,
ADD COLUMN IF NOT EXISTS montant_paye DOUBLE DEFAULT 0,
ADD COLUMN IF NOT EXISTS montant_restant DOUBLE DEFAULT 0,
ADD COLUMN IF NOT EXISTS statut_paiement VARCHAR(50) DEFAULT 'EN_ATTENTE',
ADD COLUMN IF NOT EXISTS date_echeance DATETIME;

-- ============================================================
-- CRÉATION DE LA TABLE TRANSACTION
-- ============================================================

-- 7. Créer la table transaction
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

-- ============================================================
-- CRÉATION DES INDEX
-- ============================================================

-- 8. Créer les index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_statut_intervention ON intervention(statut_intervention);
CREATE INDEX IF NOT EXISTS idx_statut_paiement ON intervention(statut_paiement);
CREATE INDEX IF NOT EXISTS idx_type ON intervention(type);
CREATE INDEX IF NOT EXISTS idx_technicien ON intervention(technicien);
CREATE INDEX IF NOT EXISTS idx_transaction_intervention ON transaction(intervention_id);

-- ============================================================
-- MISE À JOUR DES INTERVENTIONS EXISTANTES
-- ============================================================

-- 9. Mettre à jour les interventions existantes
UPDATE intervention 
SET 
    montant_total = COALESCE(prix_estime, prix_reel, 0),
    montant_paye = 0,
    montant_restant = COALESCE(prix_estime, prix_reel, 0),
    statut_paiement = CASE 
        WHEN COALESCE(prix_estime, prix_reel, 0) = 0 THEN 'PAYE'
        ELSE 'EN_ATTENTE'
    END,
    statut_intervention = 'EN_ATTENTE',
    type = 'INTERNE'
WHERE montant_total IS NULL OR montant_total = 0;

-- 10. Mettre à jour les interventions avec type null
UPDATE intervention 
SET type = 'INTERNE' 
WHERE type IS NULL;

-- ============================================================
-- VÉRIFICATION
-- ============================================================

-- 11. Vérifier la structure de la table
DESCRIBE intervention;

-- 12. Vérifier les colonnes ajoutées
SELECT 
    COLUMN_NAME, 
    DATA_TYPE, 
    IS_NULLABLE, 
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'intervention' 
AND COLUMN_NAME IN (
    'statut_intervention', 
    'prix_propose', 
    'date_diagnostic', 
    'date_recuperation',
    'technicien',
    'reference',
    'type',
    'montant_total',
    'montant_paye',
    'montant_restant',
    'statut_paiement',
    'date_echeance'
);

-- 13. Compter les interventions par statut
SELECT 
    statut_intervention, 
    COUNT(*) as nombre 
FROM intervention 
GROUP BY statut_intervention;

-- 14. Voir les 5 dernières interventions
SELECT 
    id, 
    numero_ordre, 
    societe, 
    bascule,
    reference,
    statut_intervention,
    statut_paiement,
    montant_total,
    montant_paye,
    date_recuperation
FROM intervention 
ORDER BY id DESC 
LIMIT 5;