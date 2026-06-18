package sav_balances.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import sav_balances.entity.Intervention;

public interface InterventionRepository extends JpaRepository<Intervention, Long> {
    
    List<Intervention> findByTechnicien(String technicien);
    
    List<Intervention> findByDateReclamationBetween(LocalDateTime debut, LocalDateTime fin);
    
    List<Intervention> findBySocieteContaining(String societe);
    
    @Query("SELECT i FROM Intervention i WHERE i.numeroOrdre = :numeroOrdre")
    Intervention findByNumeroOrdre(@Param("numeroOrdre") String numeroOrdre);
    
    @Query("SELECT i FROM Intervention i ORDER BY i.dateOrdre DESC")
    List<Intervention> findLastInterventions();
    
    List<Intervention> findByPrestationId(Long prestationId);
    
    List<Intervention> findByType(String type);
    
    // ========== MÉTHODES POUR LES PAIEMENTS ==========
    
    // Rechercher par statut de paiement
    List<Intervention> findByStatutPaiement(Intervention.StatutPaiement statutPaiement);
    
    // Rechercher les interventions avec échéance dépassée
    @Query("SELECT i FROM Intervention i WHERE i.dateEcheance < :now AND i.statutPaiement != 'PAYE'")
    List<Intervention> findByDateEcheanceBeforeAndStatutPaiementNotPaye(@Param("now") LocalDateTime now);
    
    // Calculer le total payé pour une intervention
    @Query("SELECT COALESCE(SUM(t.montant), 0) FROM Transaction t WHERE t.intervention.id = :interventionId AND t.statut = 'VALIDE'")
    Double sumMontantPayeByIntervention(@Param("interventionId") Long interventionId);
    
    // Rechercher les interventions avec un montant restant > 0
    @Query("SELECT i FROM Intervention i WHERE i.montantRestant > 0")
    List<Intervention> findInterventionsWithRestant();
}