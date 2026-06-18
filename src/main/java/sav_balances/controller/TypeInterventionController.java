package sav_balances.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import sav_balances.entity.TypeIntervention;
import sav_balances.service.TypeInterventionService;

import java.util.List;

@RestController
@RequestMapping("/api/types-intervention")
@CrossOrigin(origins = "http://localhost:4200")
public class TypeInterventionController {
    
    @Autowired
    private TypeInterventionService typeService;
    
    @GetMapping
    public List<TypeIntervention> getAllTypes() {
        return typeService.getAllTypes();
    }
    
    @GetMapping("/active")
    public List<TypeIntervention> getActiveTypes() {
        return typeService.getActiveTypes();
    }
    
    @GetMapping("/{id}")
    public TypeIntervention getTypeById(@PathVariable Long id) {
        return typeService.getTypeById(id);
    }
    
    @PostMapping
    public TypeIntervention createType(@RequestBody TypeIntervention type) {
        return typeService.createType(type);
    }
    
    @PutMapping("/{id}")
    public TypeIntervention updateType(@PathVariable Long id, @RequestBody TypeIntervention type) {
        return typeService.updateType(id, type);
    }
    
    @DeleteMapping("/{id}")
    public void deleteType(@PathVariable Long id) {
        typeService.deleteType(id);
    }
}