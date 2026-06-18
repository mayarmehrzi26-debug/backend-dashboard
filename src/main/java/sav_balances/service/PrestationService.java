package sav_balances.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import sav_balances.entity.Prestation;
import sav_balances.repository.PrestationRepository;

import java.util.List;

@Service
public class PrestationService {
    
    @Autowired
    private PrestationRepository prestationRepository;
    
    public List<Prestation> getAllPrestations() {
        return prestationRepository.findAll();
    }
    
    public List<Prestation> getActivePrestations() {
        return prestationRepository.findByActifTrueOrderByOrdreAffichageAsc();
    }
    
    public Prestation getPrestationById(Long id) {
        return prestationRepository.findById(id).orElse(null);
    }
    
    public Prestation getPrestationByCode(String code) {
        return prestationRepository.findByCode(code).orElse(null);
    }
    
    public Prestation createPrestation(Prestation prestation) {
        if (prestation.getCode() == null) {
            prestation.setCode(prestation.getNom().toUpperCase().replace(" ", "_").replace("é", "E").replace("è", "E"));
        }
        return prestationRepository.save(prestation);
    }
    
    public Prestation updatePrestation(Long id, Prestation prestation) {
        prestation.setId(id);
        return prestationRepository.save(prestation);
    }
    
    public void deletePrestation(Long id) {
        prestationRepository.deleteById(id);
    }
    
    public void initDefaultPrestations() {
        if (prestationRepository.count() == 0) {
            List<Prestation> defaultPrestations = List.of(
                new Prestation("INSTALLATION", "Installation", "Mise en service d'une nouvelle balance", 150.0, null, 2, 1),
                new Prestation("MAINTENANCE", "Maintenance préventive", "Contrôle périodique et entretien", 200.0, null, 3, 2),
                new Prestation("DEPANNAGE", "Dépannage", "Intervention pour panne et réparation", null, 80.0, 2, 3),
                new Prestation("ETALONNAGE", "Étalonnage", "Calibration certifiée", 180.0, 40.0, 2, 4),
                new Prestation("POINCONNAGE", "Poinçonnage périodique", "Vérification et marquage réglementaire", 200.0, null, 2, 5),
                new Prestation("URGENCE", "Intervention urgente", "Dépannage rapide (hors heures)", null, 120.0, 2, 6),
                new Prestation("MISE_A_JOUR", "Mise à jour logicielle", "Upgrade firmware ou logiciel", 80.0, 35.0, 2, 7),
                new Prestation("AUDIT", "Audit / Inspection", "Contrôle qualité et conformité", 120.0, null, 3, 8),
                new Prestation("DEMENAGEMENT", "Déménagement", "Dépose et repose de balance", 250.0, null, 4, 9),
                new Prestation("DIAGNOSTIC", "Diagnostic", "Analyse de panne sans réparation", 50.0, null, 1, 10)
            );
            prestationRepository.saveAll(defaultPrestations);
        }
    }
}