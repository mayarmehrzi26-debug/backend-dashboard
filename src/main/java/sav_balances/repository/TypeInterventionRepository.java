package sav_balances.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import sav_balances.entity.TypeIntervention;
import java.util.List;
import java.util.Optional;

@Repository
public interface TypeInterventionRepository extends JpaRepository<TypeIntervention, Long> {
    Optional<TypeIntervention> findByCode(String code);
    List<TypeIntervention> findByActifTrueOrderByOrdreAffichageAsc();
}