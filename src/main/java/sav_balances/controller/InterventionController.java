package sav_balances.controller;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
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
        return service.updateWithPreservation(id, intervention);
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
    
    @GetMapping("/client/{societe}")
    public ResponseEntity<List<Intervention>> getInterventionsByClient(@PathVariable String societe) {
        List<Intervention> interventions = service.getInterventionsByClient(societe);
        return ResponseEntity.ok(interventions);
    }
   
    // ✅ Endpoint pour mettre à jour le prix estimé
    @PostMapping("/{id}/prix")
    public ResponseEntity<?> updatePrix(@PathVariable Long id, @RequestBody Double prixEstime) {
        try {
            if (prixEstime == null || prixEstime <= 0) {
                return ResponseEntity.badRequest().body("Le prix doit être supérieur à 0");
            }
            Intervention intervention = service.getById(id);
            if (intervention == null) {
                return ResponseEntity.notFound().build();
            }
            
            // Mettre à jour le prix
            intervention.setPrixEstime(prixEstime);
            intervention.setMontantTotal(prixEstime);
            intervention.setMontantPaye(0.0);
            intervention.setMontantRestant(prixEstime);
            intervention.setStatutIntervention(Intervention.StatutIntervention.CONFIRME);
            intervention.setStatutPaiement(Intervention.StatutPaiement.EN_ATTENTE);
            
            Intervention updated = service.save(intervention);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}