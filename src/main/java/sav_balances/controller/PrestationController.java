package sav_balances.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import sav_balances.entity.Prestation;
import sav_balances.service.PrestationService;

import java.util.List;

@RestController
@RequestMapping("/api/prestations")
@CrossOrigin(origins = "http://localhost:4200")
public class PrestationController {
    
    @Autowired
    private PrestationService prestationService;
    
    @GetMapping
    public List<Prestation> getAllPrestations() {
        return prestationService.getAllPrestations();
    }
    
    @GetMapping("/active")
    public List<Prestation> getActivePrestations() {
        return prestationService.getActivePrestations();
    }
    
    @GetMapping("/{id}")
    public Prestation getPrestationById(@PathVariable Long id) {
        return prestationService.getPrestationById(id);
    }
    
    @PostMapping
    public Prestation createPrestation(@RequestBody Prestation prestation) {
        return prestationService.createPrestation(prestation);
    }
    
    @PutMapping("/{id}")
    public Prestation updatePrestation(@PathVariable Long id, @RequestBody Prestation prestation) {
        return prestationService.updatePrestation(id, prestation);
    }
    
    @DeleteMapping("/{id}")
    public void deletePrestation(@PathVariable Long id) {
        prestationService.deletePrestation(id);
    }
}