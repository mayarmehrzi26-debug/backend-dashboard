package sav_balances.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import sav_balances.entity.Intervention;
import sav_balances.service.InterventionService;

@RestController
@RequestMapping("/api/interventions")
@CrossOrigin(origins = "http://localhost:4200")
public class InterventionController {

    @Autowired
    private InterventionService service;

    @PostMapping
    public Intervention create(@RequestBody Intervention i) {
        if (i.getType() == null || i.getType().isEmpty()) {
            i.setType("INTERNE");
        }
        return service.save(i);
    }

    @GetMapping
    public List<Intervention> getAll() {
        return service.getAll();
    }
    
    @GetMapping("/{id}")
    public Intervention getById(@PathVariable Long id) {
        return service.getById(id);
    }
    
    @PutMapping("/{id}")
    public Intervention update(@PathVariable Long id, @RequestBody Intervention intervention) {
        intervention.setId(id);
        
        // Conserver les données existantes
        Intervention existing = service.getById(id);
        if (existing != null) {
            if (intervention.getType() == null || intervention.getType().isEmpty()) {
                intervention.setType(existing.getType());
            }
            if (intervention.getDateReclamation() == null) {
                intervention.setDateReclamation(existing.getDateReclamation());
            }
            if (intervention.getNumeroOrdre() == null || intervention.getNumeroOrdre().isEmpty()) {
                intervention.setNumeroOrdre(existing.getNumeroOrdre());
            }
            if (intervention.getStatutIntervention() == null) {
                intervention.setStatutIntervention(existing.getStatutIntervention());
            }
            if (intervention.getMontantTotal() == null) {
                intervention.setMontantTotal(existing.getMontantTotal());
            }
            if (intervention.getMontantPaye() == null) {
                intervention.setMontantPaye(existing.getMontantPaye());
            }
            if (intervention.getMontantRestant() == null) {
                intervention.setMontantRestant(existing.getMontantRestant());
            }
            if (intervention.getStatutPaiement() == null) {
                intervention.setStatutPaiement(existing.getStatutPaiement());
            }
            if (intervention.getReference() == null || intervention.getReference().isEmpty()) {
                intervention.setReference(existing.getReference());
            }
            if (intervention.getBascule() == null || intervention.getBascule().isEmpty()) {
                intervention.setBascule(existing.getBascule());
            }
            if (intervention.getReclamation() == null || intervention.getReclamation().isEmpty()) {
                intervention.setReclamation(existing.getReclamation());
            }
            if (intervention.getTechnicien() == null || intervention.getTechnicien().isEmpty()) {
                intervention.setTechnicien(existing.getTechnicien());
            }
            if (intervention.getSociete() == null || intervention.getSociete().isEmpty()) {
                intervention.setSociete(existing.getSociete());
            }
            if (intervention.getPrixPropose() == null) {
                intervention.setPrixPropose(existing.getPrixPropose());
            }
            if (intervention.getDateDiagnostic() == null) {
                intervention.setDateDiagnostic(existing.getDateDiagnostic());
            }
            if (intervention.getDateRecuperation() == null) {
                intervention.setDateRecuperation(existing.getDateRecuperation());
            }
        }
        
        return service.save(intervention);
    }
    
    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.deleteById(id);
    }
    
    @GetMapping("/type/{type}")
    public List<Intervention> getByType(@PathVariable String type) {
        return service.getByType(type);
    }
    @PostMapping("/{id}/refresh")
    public Intervention refreshIntervention(@PathVariable Long id) {
        return service.refreshMontants(id);
    }
}