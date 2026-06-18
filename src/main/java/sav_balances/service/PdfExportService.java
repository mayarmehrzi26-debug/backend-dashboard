package sav_balances.service;

import com.lowagie.text.*;
import com.lowagie.text.pdf.*;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.awt.Color;
import java.io.InputStream;

@Service
public class PdfExportService {

    // Couleurs harmonisées avec le logo (Vert S.B.N)
    private static final Color COLOR_PRIMARY = new Color(13, 62, 35);
    private static final Color COLOR_SECONDARY = new Color(26, 92, 56);
    private static final Color COLOR_BG_SECTION = new Color(235, 245, 238);

    // MÉTHODE MODIFIÉE - Ajout du paramètre reference
    public byte[] generateFormulairePdf(String numeroOrdre, String societe, String bascule,
                                         String reference,  // ← NOUVEAU PARAMÈTRE
                                         String responsable, String adresse, String telephone,
                                         String email, String reclamation, String technicien,
                                         String dateReclamation, String dateOrdre,
                                         String rapportIntervention) {
        
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4);
        document.setMargins(30, 30, 20, 20);  
        
        try {
            PdfWriter writer = PdfWriter.getInstance(document, baos);
            document.open();
            
            // Polices de l'en-tête ajustées
            Font companyFont = new Font(Font.HELVETICA, 14, Font.BOLD, COLOR_PRIMARY);
            Font detailsHeaderFont = new Font(Font.HELVETICA, 8, Font.NORMAL, Color.DARK_GRAY);
            
            Font subTitleFont = new Font(Font.HELVETICA, 14, Font.BOLD, COLOR_SECONDARY);
            Font labelFont = new Font(Font.HELVETICA, 10, Font.BOLD, COLOR_SECONDARY);
            Font valueFont = new Font(Font.HELVETICA, 10, Font.NORMAL);
            Font smallFont = new Font(Font.HELVETICA, 8, Font.NORMAL);
            Font referenceFont = new Font(Font.HELVETICA, 10, Font.ITALIC, new Color(80, 80, 80));
            
            // ==================== EN-TÊTE ====================
            PdfPTable headerTable = new PdfPTable(2);
            headerTable.setWidthPercentage(100);
            headerTable.setWidths(new float[]{75, 25});
            
            PdfPTable leftSubTable = new PdfPTable(2);
            leftSubTable.setWidthPercentage(100);
            leftSubTable.setWidths(new float[]{65, 35});
            
            PdfPCell textCompanyCell = new PdfPCell();
            textCompanyCell.setBorder(Rectangle.NO_BORDER);
            textCompanyCell.setVerticalAlignment(Element.ALIGN_BOTTOM);
            textCompanyCell.setPadding(0);
            
            Paragraph company = new Paragraph("STE BALANCE NAFIS", companyFont);
            company.setSpacingAfter(2);
            textCompanyCell.addElement(company);
            
            Paragraph companyDetails = new Paragraph(
                "Adresse : Route principale N°1 Cité Ettamir-Sousse\n" +
                "Tél : 54 75 30 23 / 26 75 30 23 | Email : contact@balancenafis.com", 
                detailsHeaderFont
            );
            companyDetails.setLeading(10f);
            textCompanyCell.addElement(companyDetails);
            
            leftSubTable.addCell(textCompanyCell);
            
            PdfPCell logoCell = new PdfPCell();
            logoCell.setBorder(Rectangle.NO_BORDER);
            logoCell.setHorizontalAlignment(Element.ALIGN_LEFT);
            logoCell.setVerticalAlignment(Element.ALIGN_BOTTOM);
            logoCell.setPaddingTop(0);
            logoCell.setPaddingBottom(0);
            logoCell.setPaddingLeft(5);
            
            try {
                InputStream logoStream = getClass().getResourceAsStream("/static/images/logo.png");
                if (logoStream != null) {
                    Image logo = Image.getInstance(logoStream.readAllBytes());
                    logo.scaleToFit(90, 55);
                    logo.setAlignment(Element.ALIGN_LEFT);
                    logoCell.addElement(logo);
                    logoStream.close();
                }
            } catch (Exception e) {
                System.err.println("Logo non trouvé: " + e.getMessage());
            }
            leftSubTable.addCell(logoCell);
            
            PdfPCell mainLeftCell = new PdfPCell(leftSubTable);
            mainLeftCell.setBorder(Rectangle.NO_BORDER);
            mainLeftCell.setVerticalAlignment(Element.ALIGN_BOTTOM);
            mainLeftCell.setPadding(0);
            headerTable.addCell(mainLeftCell);
            
            Paragraph dateInfo = new Paragraph(
                "Généré le : " + LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")),
                smallFont
            );
            PdfPCell dateCell = new PdfPCell(dateInfo);
            dateCell.setBorder(Rectangle.NO_BORDER);
            dateCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
            dateCell.setVerticalAlignment(Element.ALIGN_BOTTOM);
            dateCell.setPadding(0);
            headerTable.addCell(dateCell);
            
            document.add(headerTable);
            
            // ==================== TITRE ====================
            Paragraph title = new Paragraph("ORDRE D'INTERVENTION EXTERNE N° " + numeroOrdre, subTitleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingBefore(20);
            title.setSpacingAfter(12);
            document.add(title);
            
            // ==================== TABLEAU 2 COLONNES INFOS ====================
            PdfPTable mainTable = new PdfPTable(2);
            mainTable.setWidthPercentage(100);
            mainTable.setWidths(new float[]{50, 70});
            
            // INFORMATIONS CLIENT
            addSectionTitle(mainTable, "INFORMATIONS CLIENT", COLOR_PRIMARY, 2);
            addRow(mainTable, "Société :", getValue(societe), labelFont, valueFont);
            addRow(mainTable, "Responsable :", getValue(responsable), labelFont, valueFont);
            addRow(mainTable, "Adresse :", getValue(adresse), labelFont, valueFont);
            addRow(mainTable, "Téléphone :", getValue(telephone), labelFont, valueFont);
            addRow(mainTable, "Email :", getValue(email), labelFont, valueFont);
            
            // DETAILS INTERVENTION - AJOUT DE LA RÉFÉRENCE
            addSpacerRow(mainTable, 2, 4);
            addSectionTitle(mainTable, "DÉTAILS DE L'INTERVENTION", COLOR_PRIMARY, 2);
            addRow(mainTable, "Équipement / Bascule :", getValue(bascule), labelFont, valueFont);
            addRow(mainTable, "Référence :", getValue(reference), labelFont, referenceFont);  // ← AJOUT AVEC POLICE ITALIQUE
            addRow(mainTable, "Type de réclamation :", getValue(reclamation), labelFont, valueFont);
            addRow(mainTable, "Technicien :", getValue(technicien), labelFont, valueFont);
            addRow(mainTable, "Date réclamation :", formatDate(dateReclamation), labelFont, valueFont);
            addRow(mainTable, "Date intervention :", formatDate(dateOrdre), labelFont, valueFont);
            
            document.add(mainTable);
            
            // ==================== ZONE TECHNICIEN ====================
            Paragraph techZoneTitle = new Paragraph("INTERVENTION TECHNICIEN", subTitleFont);
            techZoneTitle.setSpacingBefore(15);
            techZoneTitle.setSpacingAfter(12);
            techZoneTitle.setAlignment(Element.ALIGN_CENTER);
            document.add(techZoneTitle);
            
            PdfPTable techZone = new PdfPTable(2);
            techZone.setWidthPercentage(100);
            techZone.setWidths(new float[]{65, 35});
            techZone.setSpacingAfter(15);
            
            // Partie GAUCHE - Rapport d'intervention
            PdfPCell techReportCell = new PdfPCell();
            techReportCell.setBorder(Rectangle.BOX);
            techReportCell.setBorderWidth(1.5f);
            techReportCell.setPadding(15);
            techReportCell.setMinimumHeight(180);
            
            Paragraph techReportTitle = new Paragraph("RAPPORT D'INTERVENTION", new Font(Font.HELVETICA, 12, Font.BOLD, COLOR_PRIMARY));
            techReportTitle.setSpacingAfter(10);
            techReportCell.addElement(techReportTitle);
            
            String rapport = rapportIntervention != null && !rapportIntervention.isEmpty() 
                            ? rapportIntervention : "Aucun rapport fourni";
            Paragraph rapportContent = new Paragraph(rapport, valueFont);
            rapportContent.setAlignment(Element.ALIGN_LEFT);
            rapportContent.setLeading(1.5f);
            rapportContent.setSpacingBefore(15);
            techReportCell.addElement(rapportContent);
            
            // Partie DROITE - Signature et cachet technicien
            PdfPCell techSignatureCell = new PdfPCell();
            techSignatureCell.setBorder(Rectangle.BOX);
            techSignatureCell.setBorderWidth(1.5f);
            techSignatureCell.setPadding(15);
            techSignatureCell.setBackgroundColor(new Color(250, 252, 250));
            
            Paragraph techSignatureTitle = new Paragraph("CACHET SOCIETE", new Font(Font.HELVETICA, 10, Font.BOLD, COLOR_PRIMARY));
            techSignatureTitle.setAlignment(Element.ALIGN_CENTER);
            techSignatureTitle.setSpacingAfter(10);
            techSignatureCell.addElement(techSignatureTitle);
            
            PdfPTable techSingleBox = new PdfPTable(1);
            techSingleBox.setWidthPercentage(100);
            PdfPCell techSingleCell = new PdfPCell();
            techSingleCell.setBorder(Rectangle.BOX);
            techSingleCell.setBorderWidth(1f);
            techSingleCell.setBorderColor(new Color(150, 165, 155));
            techSingleCell.setMinimumHeight(140);
            techSingleCell.setPadding(10);
            
            techSingleBox.addCell(techSingleCell);
            techSignatureCell.addElement(techSingleBox);
            
            techZone.addCell(techReportCell);
            techZone.addCell(techSignatureCell);
            document.add(techZone);
            
            // ==================== ZONE CLIENT ====================
            Paragraph clientZoneTitle = new Paragraph("VALIDATION CLIENT", subTitleFont);
            clientZoneTitle.setSpacingBefore(2);
            clientZoneTitle.setSpacingAfter(9);
            clientZoneTitle.setAlignment(Element.ALIGN_CENTER);
            document.add(clientZoneTitle);
            
            PdfPTable clientZone = new PdfPTable(2);
            clientZone.setWidthPercentage(100);
            clientZone.setWidths(new float[]{65, 35});
            clientZone.setSpacingAfter(9);
            
            // Partie GAUCHE - Notes
            PdfPCell clientNotesCell = new PdfPCell();
            clientNotesCell.setBorder(Rectangle.BOX);
            clientNotesCell.setBorderWidth(1.5f);
            clientNotesCell.setPadding(9);
            clientNotesCell.setMinimumHeight(110);
            
            Paragraph clientNotesTitle = new Paragraph("NOTES ET OBSERVATIONS DU CLIENT", new Font(Font.HELVETICA, 11, Font.BOLD, COLOR_PRIMARY));
            clientNotesTitle.setSpacingAfter(5);
            clientNotesCell.addElement(clientNotesTitle);
            
            for (int i = 0; i < 4; i++) {
                PdfPTable lineTable = new PdfPTable(1);
                lineTable.setWidthPercentage(100);
                
                PdfPCell lineCell = new PdfPCell(new Phrase(" "));
                lineCell.setBorder(Rectangle.BOTTOM);
                lineCell.setBorderWidthBottom(0.7f);
                lineCell.setBorderColorBottom(Color.GRAY);
                lineCell.setFixedHeight(22);
                lineCell.setPadding(0);
                
                lineTable.addCell(lineCell);
                clientNotesCell.addElement(lineTable);
            }
            
            // Partie DROITE - Signature client
            PdfPCell clientSignatureCell = new PdfPCell();
            clientSignatureCell.setBorder(Rectangle.BOX);
            clientSignatureCell.setBorderWidth(1.5f);
            clientSignatureCell.setPadding(11);
            clientSignatureCell.setBackgroundColor(new Color(250, 252, 250));
            
            Paragraph clientSignatureTitle = new Paragraph("CACHET ET SIGNATURE", new Font(Font.HELVETICA, 10, Font.BOLD, COLOR_PRIMARY));
            clientSignatureTitle.setAlignment(Element.ALIGN_CENTER);
            clientSignatureTitle.setSpacingAfter(8);
            clientSignatureCell.addElement(clientSignatureTitle);
            
            PdfPTable clientSingleBox = new PdfPTable(1);
            clientSingleBox.setWidthPercentage(100);
            PdfPCell clientSingleCell = new PdfPCell();
            clientSingleCell.setBorder(Rectangle.BOX);
            clientSingleCell.setBorderWidth(1f);
            clientSingleCell.setBorderColor(new Color(150, 165, 155));
            clientSingleCell.setMinimumHeight(80);
            clientSingleCell.setPadding(8);
            
            clientSingleBox.addCell(clientSingleCell);
            clientSignatureCell.addElement(clientSingleBox);
            
            clientZone.addCell(clientNotesCell);
            clientZone.addCell(clientSignatureCell);
            document.add(clientZone);
            
            // ==================== PIED DE PAGE ====================
            Paragraph footer = new Paragraph(
                "Ce document engage la responsabilité du société et du client.",
                new Font(Font.HELVETICA, 7, Font.ITALIC)
            );
            footer.setAlignment(Element.ALIGN_CENTER);
            footer.setSpacingBefore(5);
            document.add(footer);
            
            document.close();
            
        } catch (Exception e) {
            throw new RuntimeException("Erreur lors de la génération du PDF: " + e.getMessage(), e);
        }
        
        return baos.toByteArray();
    }
    
    // ==================== UTILITAIRES ====================
    
    private void addSectionTitle(PdfPTable table, String title, Color color, int colspan) {
        Font titleFont = new Font(Font.HELVETICA, 12, Font.BOLD, color);
        Paragraph p = new Paragraph(title, titleFont);
        PdfPCell cell = new PdfPCell(p);
        cell.setBorder(Rectangle.NO_BORDER);
        cell.setColspan(colspan);
        cell.setBackgroundColor(COLOR_BG_SECTION);
        
        cell.setPadding(5);
        cell.setPaddingTop(2); 
        cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        
        table.addCell(cell);
    }
    
    private void addRow(PdfPTable table, String label, String value, Font labelFont, Font valueFont) {
        PdfPCell labelCell = new PdfPCell(new Paragraph(label, labelFont));
        labelCell.setBorder(Rectangle.NO_BORDER);
        labelCell.setPadding(3);
        labelCell.setPaddingTop(0); 
        labelCell.setVerticalAlignment(Element.ALIGN_BASELINE);
        
        PdfPCell valueCell = new PdfPCell(new Paragraph(value, valueFont));
        valueCell.setBorder(Rectangle.NO_BORDER);
        valueCell.setPadding(3);
        valueCell.setPaddingTop(0); 
        valueCell.setBorder(Rectangle.BOTTOM);
        valueCell.setBorderWidthBottom(0.5f);
        valueCell.setVerticalAlignment(Element.ALIGN_BASELINE);
        
        table.addCell(labelCell);
        table.addCell(valueCell);
    }
    
    private void addSpacerRow(PdfPTable table, int colspan, int height) {
        PdfPCell cell = new PdfPCell();
        cell.setBorder(Rectangle.NO_BORDER);
        cell.setColspan(colspan);
        cell.setFixedHeight(height);
        table.addCell(cell);
    }
    
    private String getValue(String value) {
        return value != null && !value.isEmpty() ? value : "—";
    }
    
    private String formatDate(String dateStr) {
        if (dateStr == null || dateStr.isEmpty()) return "—";
        try {
            LocalDateTime date = LocalDateTime.parse(dateStr);
            return date.format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"));
        } catch (Exception e) {
            return dateStr;
        }
    } 
}