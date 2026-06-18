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
        return service.save(intervention);
    }
    
    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.deleteById(id);
    }
    
    // NOUVEAU : Récupérer par type
    @GetMapping("/type/{type}")
    public List<Intervention> getByType(@PathVariable String type) {
        return service.getByType(type);
    }
}