package sav_balances.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import sav_balances.entity.Prestation;
import java.util.List;
import java.util.Optional;

@Repository
public interface PrestationRepository extends JpaRepository<Prestation, Long> {
    Optional<Prestation> findByCode(String code);
    List<Prestation> findByActifTrueOrderByOrdreAffichageAsc();
    List<Prestation> findByNomContaining(String nom);
}