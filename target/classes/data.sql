-- ============================================================
-- SCRIPT COMPLET DE MISE À JOUR DE LA BASE DE DONNÉES - CORRIGÉ
-- ============================================================

-- ============================================================
-- 1. GESTION DE LA TABLE USERS
-- ============================================================

-- Supprimer la table users si elle existe (avec vérification)
DROP TABLE IF EXISTS users;

-- Créer la table users
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100),
    role VARCHAR(20) DEFAULT 'USER',
    full_name VARCHAR(100),
    enabled BOOLEAN DEFAULT TRUE,
    last_login DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insérer un utilisateur ADMIN (password: admin123)
INSERT IGNORE INTO users (username, password, email, role, full_name, enabled, created_at) 
VALUES ('admin', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EHs', 'admin@sav-balances.com', 'ADMIN', 'Administrateur', TRUE, NOW());

-- Insérer un utilisateur USER (password: user123)
INSERT IGNORE INTO users (username, password, email, role, full_name, enabled, created_at) 
VALUES ('user', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EHs', 'user@sav-balances.com', 'USER', 'Utilisateur Standard', TRUE, NOW());

-- ============================================================
-- 2. AJOUT DES COLONNES POUR LE PROCESSUS INTERNE
-- ============================================================

-- Vérifier et ajouter les colonnes si elles n'existent pas
-- Pour MySQL, on utilise des procédures stockées ou on vérifie avec INFORMATION_SCHEMA

-- Ajouter les colonnes pour le processus interne
ALTER TABLE intervention 
ADD COLUMN IF NOT EXISTS statut_intervention VARCHAR(50) DEFAULT 'EN_ATTENTE';

ALTER TABLE intervention 
ADD COLUMN IF NOT EXISTS prix_propose DOUBLE;

ALTER TABLE intervention 
ADD COLUMN IF NOT EXISTS date_diagnostic DATETIME;

ALTER TABLE intervention 
ADD COLUMN IF NOT EXISTS date_recuperation DATETIME;

ALTER TABLE intervention 
ADD COLUMN IF NOT EXISTS technicien VARCHAR(255);

ALTER TABLE intervention 
ADD COLUMN IF NOT EXISTS reference_equipement VARCHAR(255);

ALTER TABLE intervention 
ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'INTERNE';

-- Ajouter les colonnes paiement
ALTER TABLE intervention 
ADD COLUMN IF NOT EXISTS montant_total DOUBLE DEFAULT 0;

ALTER TABLE intervention 
ADD COLUMN IF NOT EXISTS montant_paye DOUBLE DEFAULT 0;

ALTER TABLE intervention 
ADD COLUMN IF NOT EXISTS montant_restant DOUBLE DEFAULT 0;

ALTER TABLE intervention 
ADD COLUMN IF NOT EXISTS statut_paiement VARCHAR(50) DEFAULT 'EN_ATTENTE';

ALTER TABLE intervention 
ADD COLUMN IF NOT EXISTS date_echeance DATETIME;

-- ============================================================
-- 3. CRÉATION DE LA TABLE TRANSACTION
-- ============================================================

-- Créer la table transaction
CREATE TABLE IF NOT EXISTS transaction (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    intervention_id BIGINT NOT NULL,
    montant DOUBLE NOT NULL,
    date_transaction DATETIME NOT NULL,
    methode VARCHAR(50) NOT NULL,
    reference VARCHAR(255),
    notes TEXT,
    statut VARCHAR(50) NOT NULL DEFAULT 'VALIDE',
    remise DOUBLE DEFAULT 0,
    remise_pourcentage DOUBLE DEFAULT 0,
    promo_code VARCHAR(50),
    FOREIGN KEY (intervention_id) REFERENCES intervention(id) ON DELETE CASCADE
);

-- ============================================================
-- 4. CRÉATION DES INDEX
-- ============================================================

CREATE INDEX idx_statut_intervention ON intervention(statut_intervention);
CREATE INDEX idx_statut_paiement ON intervention(statut_paiement);
CREATE INDEX idx_type ON intervention(type);
CREATE INDEX idx_technicien ON intervention(technicien);
CREATE INDEX idx_transaction_intervention ON transaction(intervention_id);
CREATE INDEX idx_transaction_statut ON transaction(statut);

-- ============================================================
-- 5. MISE À JOUR DES INTERVENTIONS EXISTANTES
-- ============================================================

-- Mettre à jour les interventions sans type
UPDATE intervention 
SET type = 'INTERNE' 
WHERE type IS NULL OR type = '';

-- Mettre à jour les montants
UPDATE intervention 
SET 
    montant_total = COALESCE(prix_estime, prix_reel, 0),
    montant_restant = COALESCE(prix_estime, prix_reel, 0),
    montant_paye = COALESCE(montant_paye, 0)
WHERE montant_total IS NULL OR montant_total = 0;

-- ============================================================
-- 6. CORRECTION DES STATUTS (LOGIQUE UNIFIÉE)
-- ============================================================

-- 6.1. Interventions ANNULEES - garder ANNULE
-- (ne rien faire, elles restent ANNULE)

-- 6.2. Interventions payées (montantTotal > 0 ET montantPaye >= montantTotal) → TERMINE
UPDATE intervention 
SET statut_intervention = 'TERMINE' 
WHERE montant_total > 0 
AND montant_paye >= montant_total 
AND (statut_intervention IS NULL OR statut_intervention != 'ANNULE');

-- 6.3. Interventions avec date définie et non payées → CONFIRME
UPDATE intervention 
SET statut_intervention = 'CONFIRME' 
WHERE date_ordre IS NOT NULL 
AND (statut_intervention IS NULL OR (statut_intervention != 'ANNULE' AND statut_intervention != 'TERMINE'));

-- 6.4. Interventions sans date et non payées → EN_ATTENTE
UPDATE intervention 
SET statut_intervention = 'EN_ATTENTE' 
WHERE date_ordre IS NULL 
AND (statut_intervention IS NULL OR (statut_intervention != 'ANNULE' AND statut_intervention != 'TERMINE'));

-- 6.5. Mettre à jour le statut de paiement
UPDATE intervention 
SET statut_paiement = 'PAYE' 
WHERE montant_total > 0 AND montant_paye >= montant_total;

UPDATE intervention 
SET statut_paiement = 'PARTIEL' 
WHERE montant_total > 0 AND montant_paye > 0 AND montant_paye < montant_total;

UPDATE intervention 
SET statut_paiement = 'EN_ATTENTE' 
WHERE montant_total = 0 OR (montant_total > 0 AND montant_paye = 0);

-- ============================================================
-- 7. VÉRIFICATIONS
-- ============================================================

-- 7.1. Vérifier la structure de la table intervention
DESCRIBE intervention;

-- 7.2. Vérifier les colonnes ajoutées
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
    'reference_equipement',
    'type',
    'montant_total',
    'montant_paye',
    'montant_restant',
    'statut_paiement',
    'date_echeance'
);

-- 7.3. Compter les interventions par statut
SELECT 
    statut_intervention, 
    COUNT(*) as nombre,
    SUM(montant_total) as total_montant
FROM intervention 
GROUP BY statut_intervention
ORDER BY statut_intervention;

-- 7.4. Compter les interventions par statut de paiement
SELECT 
    statut_paiement, 
    COUNT(*) as nombre,
    SUM(montant_total) as total_montant,
    SUM(montant_paye) as total_paye
FROM intervention 
GROUP BY statut_paiement
ORDER BY statut_paiement;

-- 7.5. Voir les 10 dernières interventions avec leurs statuts
SELECT 
    id, 
    numero_ordre, 
    societe, 
    bascule,
    type,
    statut_intervention,
    statut_paiement,
    montant_total,
    montant_paye,
    montant_restant,
    date_ordre,
    date_recuperation,
    technicien
FROM intervention 
ORDER BY id DESC 
LIMIT 10;

-- 7.6. Vérifier la cohérence des statuts
SELECT 
    id,
    numero_ordre,
    statut_intervention,
    montant_total,
    montant_paye,
    date_ordre,
    CASE 
        WHEN statut_intervention = 'ANNULE' THEN '✅ OK (ANNULE)'
        WHEN montant_total > 0 AND montant_paye >= montant_total THEN '⚠️ Devrait être TERMINE'
        WHEN date_ordre IS NOT NULL THEN '⚠️ Devrait être CONFIRME'
        WHEN statut_intervention = 'EN_ATTENTE' THEN '✅ OK (EN_ATTENTE)'
        ELSE '⚠️ Statut incohérent'
    END as verification
FROM intervention
WHERE statut_intervention != 'ANNULE'
ORDER BY id;

-- ============================================================
-- 8. RÉSUMÉ FINAL
-- ============================================================

SELECT '=== RÉSUMÉ DE LA MISE À JOUR ===' as info;

SELECT 
    'Interventions totales' as type,
    COUNT(*) as nombre
FROM intervention
UNION ALL
SELECT 
    'Interventions ANNULEES' as type,
    COUNT(*) as nombre
FROM intervention WHERE statut_intervention = 'ANNULE'
UNION ALL
SELECT 
    'Interventions TERMINEES' as type,
    COUNT(*) as nombre
FROM intervention WHERE statut_intervention = 'TERMINE'
UNION ALL
SELECT 
    'Interventions CONFIRMEES' as type,
    COUNT(*) as nombre
FROM intervention WHERE statut_intervention = 'CONFIRME'
UNION ALL
SELECT 
    'Interventions EN_ATTENTE' as type,
    COUNT(*) as nombre
FROM intervention WHERE statut_intervention = 'EN_ATTENTE'
UNION ALL
SELECT 
    'Interventions payées' as type,
    COUNT(*) as nombre
FROM intervention WHERE statut_paiement = 'PAYE'
UNION ALL
SELECT 
    'Interventions partiellement payées' as type,
    COUNT(*) as nombre
FROM intervention WHERE statut_paiement = 'PARTIEL';

ALTER TABLE users ADD COLUMN IF NOT EXISTS telephone VARCHAR(20);

-- Ajouter des téléphones aux techniciens existants
UPDATE users SET telephone = '+216 46 595 5556' WHERE role = 'TECHNICIEN' AND username = 'mohamed ';


ALTER TABLE intervention ADD COLUMN IF NOT EXISTS type_notification VARCHAR(20) DEFAULT 'PLATEFORME';
-- ============================================================
-- 9. SCRIPT DE ROLLBACK (en cas de problème)
-- ============================================================

-- Pour annuler les modifications si nécessaire :
-- UPDATE intervention SET statut_intervention = 'EN_ATTENTE' WHERE statut_intervention = 'TERMINE';
-- UPDATE intervention SET statut_intervention = 'EN_ATTENTE' WHERE statut_intervention = 'CONFIRME';