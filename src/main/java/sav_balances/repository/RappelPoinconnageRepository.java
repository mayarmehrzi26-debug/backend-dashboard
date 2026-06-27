package sav_balances.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import sav_balances.entity.RappelPoinconnage;

public interface RappelPoinconnageRepository extends JpaRepository<RappelPoinconnage, Long> {
    
    List<RappelPoinconnage> findBySociete(String societe);
    
    @Query("SELECT r FROM RappelPoinconnage r WHERE r.joursRestants <= :jours AND r.statut = 'ACTIF'")
    List<RappelPoinconnage> findRappelsImminents(@Param("jours") Integer jours);
    
    @Query("SELECT r FROM RappelPoinconnage r WHERE r.dateProchainPoinconnage < :now AND r.statut = 'ACTIF'")
    List<RappelPoinconnage> findRappelsExpires(@Param("now") LocalDateTime now);
    
    @Query("SELECT r FROM RappelPoinconnage r WHERE r.notifie = false AND r.joursRestants <= :jours")
    List<RappelPoinconnage> findRappelsANotifier(@Param("jours") Integer jours);
    
    @Query("SELECT r FROM RappelPoinconnage r WHERE r.statut = 'ACTIF' ORDER BY r.joursRestants ASC")
    List<RappelPoinconnage> findRappelsActifs();
    
    @Query("SELECT r FROM RappelPoinconnage r WHERE r.intervention.id = :interventionId")
    RappelPoinconnage findByInterventionId(@Param("interventionId") Long interventionId);
}