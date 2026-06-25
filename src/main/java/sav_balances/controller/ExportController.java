package sav_balances.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import sav_balances.entity.Intervention;
import sav_balances.service.InterventionService;
import sav_balances.service.PdfExportService;
import sav_balances.service.PdfExportInterneService;

@RestController
@RequestMapping("/api/export")
@CrossOrigin(origins = "http://localhost:4200")
public class ExportController {

    @Autowired
    private InterventionService interventionService;
    
    @Autowired
    private PdfExportService pdfExportService;
    
    @Autowired
    private PdfExportInterneService pdfExportInterneService;

    // Export PDF Externe
    @GetMapping("/formulaire/{interventionId}/pdf")
    public ResponseEntity<ByteArrayResource> exportFormulairePdf(@PathVariable Long interventionId) {
        try {
            Intervention intervention = interventionService.getById(interventionId);
            if (intervention == null) {
                return ResponseEntity.notFound().build();
            }
            
            byte[] pdfBytes = pdfExportService.generateFormulairePdf(
                intervention.getNumeroOrdre(),
                intervention.getSociete(),
                intervention.getBascule(),
                intervention.getReference() != null ? intervention.getReference() : "",
                intervention.getResponsable(),
                intervention.getAdresse(),
                intervention.getTelephone(),
                intervention.getEmail(),
                intervention.getReclamation(),
                intervention.getTechnicien(),
                intervention.getDateReclamation() != null ? intervention.getDateReclamation().toString() : "",
                intervention.getDateOrdre() != null ? intervention.getDateOrdre().toString() : "",
                intervention.getRapportIntervention()
            );
            
            ByteArrayResource resource = new ByteArrayResource(pdfBytes);
            
            return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, 
                    "attachment; filename=formulaire_intervention_" + interventionId + ".pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .contentLength(pdfBytes.length)
                .body(resource);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }
    
    // Export TXT
    @GetMapping("/formulaire/{interventionId}/txt")
    public ResponseEntity<ByteArrayResource> exportFormulaireTxt(@PathVariable Long interventionId) {
        try {
            Intervention intervention = interventionService.getById(interventionId);
            if (intervention == null) {
                return ResponseEntity.notFound().build();
            }
            
            String content = generateTxtContent(intervention);
            ByteArrayResource resource = new ByteArrayResource(content.getBytes());
            
            return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, 
                    "attachment; filename=formulaire_intervention_" + interventionId + ".txt")
                .contentType(MediaType.TEXT_PLAIN)
                .body(resource);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
    
 // Export PDF Interne - Bon de Reçue (2 parties)
    @GetMapping("/interne/{interventionId}/pdf")
    public ResponseEntity<ByteArrayResource> exportFormulaireInternePdf(@PathVariable Long interventionId) {
        try {
            Intervention intervention = interventionService.getById(interventionId);
            if (intervention == null) {
                return ResponseEntity.notFound().build();
            }
            
            byte[] pdfBytes = pdfExportInterneService.generateFormulaireInternePdf(
                intervention.getNumeroOrdre(),
                intervention.getSociete(),
                intervention.getBascule(),
                intervention.getReference() != null ? intervention.getReference() : "",
                intervention.getDateReclamation() != null ? intervention.getDateReclamation().toString() : "",  // ✅ Date réclamation
                intervention.getDateOrdre() != null ? intervention.getDateOrdre().toString() : "",             // ✅ Date intervention
                intervention.getReclamation(),
                intervention.getRapportIntervention()
            );
            
            ByteArrayResource resource = new ByteArrayResource(pdfBytes);
            
            return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, 
                    "attachment; filename=bon_reçue_interne_" + interventionId + ".pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(resource);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    // Bon de récupération
    @GetMapping("/interne/{interventionId}/recuperation")
    public ResponseEntity<ByteArrayResource> exportBonRecuperationPdf(@PathVariable Long interventionId) {
        try {
            Intervention intervention = interventionService.getById(interventionId);
            if (intervention == null) {
                return ResponseEntity.notFound().build();
            }
            
            byte[] pdfBytes = pdfExportInterneService.generateBonRecuperationPdf(
                intervention.getNumeroOrdre(),
                intervention.getSociete(),
                intervention.getBascule(),
                intervention.getReference() != null ? intervention.getReference() : "",
                intervention.getMontantTotal() != null ? intervention.getMontantTotal() : 0.0,
                intervention.getDateReclamation() != null ? intervention.getDateReclamation().toString() : "",  // ✅ Date réclamation
                intervention.getDateOrdre() != null ? intervention.getDateOrdre().toString() : "",             // ✅ Date intervention
                java.time.LocalDateTime.now().toString(),
                intervention.getReclamation() != null ? intervention.getReclamation() : ""
            );
            
            ByteArrayResource resource = new ByteArrayResource(pdfBytes);
            
            return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, 
                    "attachment; filename=bon_recuperation_" + interventionId + ".pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(resource);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }
    private String generateTxtContent(Intervention i) {
        StringBuilder sb = new StringBuilder();
        sb.append("STE BALANCE NAFIS\n\n");
        sb.append("Ordre d'intervention N : ").append(i.getNumeroOrdre()).append("\n\n");
        sb.append("FORMULAIRE\n\n");
        sb.append("SOCIÉTÉ : ").append(i.getSociete()).append("\n");
        sb.append("BASQUE : ").append(i.getBascule()).append("\n");
        sb.append("RÉFÉRENCE : ").append(i.getReference() != null ? i.getReference() : "").append("\n");
        sb.append("NOM RESPONSABLE : ").append(i.getResponsable()).append("\n");
        sb.append("ADRESSE : ").append(i.getAdresse()).append("\n");
        sb.append("TÉLÉPHONE : ").append(i.getTelephone()).append("\n");
        sb.append("EMAIL : ").append(i.getEmail()).append("\n");
        sb.append("DATE DE RÉCLAMATION : ").append(i.getDateReclamation()).append("\n");
        sb.append("RÉCLAMATION : ").append(i.getReclamation()).append("\n");
        sb.append("NOM TECHNIQUE : ").append(i.getTechnicien()).append("\n");
        sb.append("DATE DE COURRIE : ").append(i.getDateOrdre()).append("\n\n");
        sb.append("RELEVE DE L'INTERVENTION\n\n");
        sb.append("Cochez Soinier\n\n");
        sb.append("ZONE A REMPLIR PAR LE CLIENT :\n\n");
        sb.append("Voir et/ou remplir pour information\n\n");
        sb.append("Cachet et signature\n\n");
        return sb.toString();
    }
}