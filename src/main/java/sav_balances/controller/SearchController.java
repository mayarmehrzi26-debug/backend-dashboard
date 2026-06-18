package sav_balances.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import sav_balances.entity.Intervention;
import sav_balances.repository.InterventionRepository;
import sav_balances.service.InterventionService;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/search")
public class SearchController {

    @Autowired
    private InterventionRepository interventionRepository;
    
    @Autowired
    private InterventionService interventionService;

    @GetMapping("/interventions/technicien/{technicien}")
    public List<Intervention> findByTechnicien(@PathVariable String technicien) {
        return interventionRepository.findByTechnicien(technicien);
    }
    
    @GetMapping("/interventions/date")
    public List<Intervention> findByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime debut,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fin) {
        return interventionRepository.findByDateReclamationBetween(debut, fin);
    }
    
    @GetMapping("/interventions/societe/{societe}")
    public List<Intervention> findBySociete(@PathVariable String societe) {
        return interventionRepository.findBySocieteContaining(societe);
    }
    
    @GetMapping("/interventions/numero/{numeroOrdre}")
    public Intervention findByNumeroOrdre(@PathVariable String numeroOrdre) {
        return interventionRepository.findByNumeroOrdre(numeroOrdre);
    }
    
    @GetMapping("/interventions/last")
    public List<Intervention> getLastInterventions() {
        return interventionRepository.findLastInterventions();
    }
}