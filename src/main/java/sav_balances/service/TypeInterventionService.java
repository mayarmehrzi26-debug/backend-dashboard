package sav_balances.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import sav_balances.entity.TypeIntervention;
import sav_balances.repository.TypeInterventionRepository;

import java.util.List;

@Service
public class TypeInterventionService {
    
    @Autowired
    private TypeInterventionRepository typeInterventionRepository;
    
    public List<TypeIntervention> getAllTypes() {
        return typeInterventionRepository.findAll();
    }
    
    public List<TypeIntervention> getActiveTypes() {
        return typeInterventionRepository.findByActifTrueOrderByOrdreAffichageAsc();
    }
    
    public TypeIntervention getTypeById(Long id) {
        return typeInterventionRepository.findById(id).orElse(null);
    }
    
    public TypeIntervention createType(TypeIntervention type) {
        return typeInterventionRepository.save(type);
    }
    
    public TypeIntervention updateType(Long id, TypeIntervention type) {
        type.setId(id);
        return typeInterventionRepository.save(type);
    }
    
    public void deleteType(Long id) {
        typeInterventionRepository.deleteById(id);
    }
    
    public void initDefaultTypes() {
        if (typeInterventionRepository.count() == 0) {
            List<TypeIntervention> defaultTypes = List.of(
                createTypeObj("INSTALLATION", "Installation", "Mise en service nouvelle balance", 150.0, null, 2, 1),
                createTypeObj("MAINTENANCE", "Maintenance préventive", "Contrôle périodique et entretien", 200.0, null, 3, 2),
                createTypeObj("REPARATION", "Réparation", "Réparation de panne", null, 45.0, 2, 3),
                createTypeObj("ETALONNAGE", "Étalonnage", "Calibration certifiée", 180.0, 40.0, 2, 4),
                createTypeObj("URGENCE", "Dépannage urgent", "Intervention rapide (hors heures)", null, 80.0, 2, 5),
                createTypeObj("MISE_A_JOUR", "Mise à jour logicielle", "Upgrade firmware/software", 80.0, 35.0, 2, 6),
                createTypeObj("AUDIT", "Audit / Inspection", "Contrôle qualité", 120.0, null, 3, 7),
                createTypeObj("DEMENAGEMENT", "Déménagement", "Dépose/repose de balance", 250.0, null, 4, 8),
                createTypeObj("DIAGNOSTIC", "Diagnostic", "Analyse de panne", 50.0, null, 1, 9)
            );
            typeInterventionRepository.saveAll(defaultTypes);
        }
    }
    
    private TypeIntervention createTypeObj(String code, String nom, String description, 
                                           Double prixForfait, Double prixHeure, 
                                           Integer duree, Integer ordre) {
        TypeIntervention type = new TypeIntervention();
        type.setCode(code);
        type.setNom(nom);
        type.setDescription(description);
        type.setPrixForfait(prixForfait);
        type.setPrixHeure(prixHeure);
        type.setDureeEstimeeHeures(duree);
        type.setOrdreAffichage(ordre);
        type.setActif(true);
        return type;
    }
}