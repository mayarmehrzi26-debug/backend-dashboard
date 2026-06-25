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
    private static final Color COLOR_LIGHT_BG = new Color(250, 252, 250);

    // Classe interne pour les lignes pointillées
    private static class DashedLineCellEvent implements PdfPCellEvent {
        @Override
        public void cellLayout(PdfPCell cell, Rectangle position, PdfContentByte[] canvases) {
            PdfContentByte cb = (canvases.length > 2) ? canvases[2] : canvases[canvases.length - 1];
            
            cb.saveState();
            cb.setColorStroke(Color.GRAY);
            cb.setLineWidth(0.5f);
            cb.setLineDash(3f, 4f, 0f);
            
            cb.moveTo(position.getLeft() + 5, position.getBottom() + 5);
            cb.lineTo(position.getRight() - 5, position.getBottom() + 5);
            cb.stroke();
            cb.restoreState();
        }
    }

    public byte[] generateFormulairePdf(String numeroOrdre, String societe, String bascule,
                                         String reference,
                                         String responsable, String adresse, String telephone,
                                         String email, String reclamation, String technicien,
                                         String dateReclamation, String dateOrdre,
                                         String rapportIntervention) {
        
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        
        Document document = new Document(PageSize.A4);
        // Marges de 25pt sur les côtés et 20pt en haut/bas pour maximiser l'espace de page
        document.setMargins(25, 25, 20, 20);  
        
        try {
            PdfWriter writer = PdfWriter.getInstance(document, baos);
            document.open();
            
            Font companyFont = new Font(Font.HELVETICA, 13, Font.BOLD, COLOR_PRIMARY);
            Font detailsHeaderFont = new Font(Font.HELVETICA, 8, Font.NORMAL, Color.DARK_GRAY);
            Font subTitleFont = new Font(Font.HELVETICA, 13, Font.BOLD, COLOR_SECONDARY);
            Font labelFont = new Font(Font.HELVETICA, 9, Font.BOLD, COLOR_SECONDARY);
            Font valueFont = new Font(Font.HELVETICA, 9, Font.NORMAL);
            Font smallFont = new Font(Font.HELVETICA, 7, Font.NORMAL);
            Font referenceFont = new Font(Font.HELVETICA, 9, Font.ITALIC, new Color(80, 80, 80));
            
            // ==================== EN-TÊTE ====================
            PdfPTable headerTable = new PdfPTable(2);
            headerTable.setWidthPercentage(100);
            headerTable.setWidths(new float[]{75, 25});
            headerTable.setSpacingAfter(0f);
            
            PdfPTable leftSubTable = new PdfPTable(2);
            leftSubTable.setWidthPercentage(100);
            leftSubTable.setWidths(new float[]{65, 35});
            
            PdfPCell textCompanyCell = new PdfPCell();
            textCompanyCell.setBorder(Rectangle.NO_BORDER);
            textCompanyCell.setVerticalAlignment(Element.ALIGN_BOTTOM);
            textCompanyCell.setPadding(0);
            
            Paragraph company = new Paragraph("STE BALANCE NAFIS", companyFont);
            company.setSpacingAfter(1);
            textCompanyCell.addElement(company);
            
            Paragraph companyDetails = new Paragraph(
                "Adresse : Route principale N°1 Cité Ettamir-Sousse\n" +
                "Tél : 54 75 30 23 / 26 75 30 23 | Email : contact@balancenafis.com", 
                detailsHeaderFont
            );
            companyDetails.setLeading(9f);
            textCompanyCell.addElement(companyDetails);
            
            leftSubTable.addCell(textCompanyCell);
            
            PdfPCell logoCell = new PdfPCell();
            logoCell.setBorder(Rectangle.NO_BORDER);
            logoCell.setHorizontalAlignment(Element.ALIGN_LEFT);
            logoCell.setVerticalAlignment(Element.ALIGN_BOTTOM);
            logoCell.setPadding(0);
            logoCell.setPaddingLeft(5);
            
            try {
                InputStream logoStream = getClass().getResourceAsStream("/static/images/logo.png");
                if (logoStream != null) {
                    Image logo = Image.getInstance(logoStream.readAllBytes());
                    logo.scaleToFit(85, 45);
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
            title.setSpacingBefore(6); 
            title.setSpacingAfter(6);  
            document.add(title);
            
            // ==================== TABLEAU INFOS CLIENT ====================
            PdfPTable mainTable = new PdfPTable(2);
            mainTable.setWidthPercentage(100);
            mainTable.setWidths(new float[]{45, 75});
            
            addSectionTitle(mainTable, "INFORMATIONS CLIENT", COLOR_PRIMARY, 2);
            addRow(mainTable, "Société :", getValue(societe), labelFont, valueFont);
            addRow(mainTable, "Responsable :", getValue(responsable), labelFont, valueFont);
            addRow(mainTable, "Adresse :", getValue(adresse), labelFont, valueFont);
            addRow(mainTable, "Téléphone :", getValue(telephone), labelFont, valueFont);
            addRow(mainTable, "Email :", getValue(email), labelFont, valueFont);
            
            addSpacerRow(mainTable, 2, 3); 
            addSectionTitle(mainTable, "DÉTAILS DE L'INTERVENTION", COLOR_PRIMARY, 2);
            addRow(mainTable, "Équipement / Bascule :", getValue(bascule), labelFont, valueFont);
            addRow(mainTable, "N° de série :", getValue(reference), labelFont, referenceFont);
            addRow(mainTable, "Type de réclamation :", getValue(reclamation), labelFont, valueFont);
            addRow(mainTable, "Technicien :", getValue(technicien), labelFont, valueFont);
            addRow(mainTable, "Date réclamation :", formatDate(dateReclamation), labelFont, valueFont);
            addRow(mainTable, "Date intervention :", formatDate(dateOrdre), labelFont, valueFont);
            
            document.add(mainTable);
            
            // ==================== ZONE INTERVENTION TECHNICIEN ====================
            Paragraph techZoneTitle = new Paragraph("INTERVENTION TECHNICIEN", subTitleFont);
            techZoneTitle.setSpacingBefore(10);
            techZoneTitle.setSpacingAfter(6);
            techZoneTitle.setAlignment(Element.ALIGN_CENTER);
            document.add(techZoneTitle);
            
            PdfPTable rapportTable = new PdfPTable(1);
            rapportTable.setWidthPercentage(100);
            rapportTable.setSpacingAfter(10);
            
            PdfPCell rapportCell = new PdfPCell();
            rapportCell.setBorder(Rectangle.BOX);
            rapportCell.setBorderWidth(1.2f);
            rapportCell.setPadding(0);
            rapportCell.setMinimumHeight(260); // AGRANDI : Passage de 240 à 260 pour donner plus de corps au bloc
            
            PdfPTable innerContainer = new PdfPTable(1);
            innerContainer.setWidthPercentage(100);
            
            PdfPCell topPaddingCell = new PdfPCell();
            topPaddingCell.setBorder(Rectangle.NO_BORDER);
            topPaddingCell.setPadding(12);
            
            Paragraph rapportTitle = new Paragraph("RAPPORT D'INTERVENTION", new Font(Font.HELVETICA, 11, Font.BOLD, COLOR_PRIMARY));
            rapportTitle.setSpacingAfter(8);
            topPaddingCell.addElement(rapportTitle);
            
            DashedLineCellEvent dashedEvent = new DashedLineCellEvent();
            
            // AGRANDI : 6 lignes supérieures pleine largeur (au lieu de 5)
            for (int i = 0; i < 6; i++) {
                PdfPTable lineTable = new PdfPTable(1);
                lineTable.setWidthPercentage(100);
                PdfPCell lineCell = new PdfPCell(new Phrase(" "));
                lineCell.setBorder(Rectangle.NO_BORDER);
                lineCell.setCellEvent(dashedEvent);
                lineCell.setFixedHeight(22);
                lineCell.setPadding(0);
                lineTable.addCell(lineCell);
                topPaddingCell.addElement(lineTable);
            }
            innerContainer.addCell(topPaddingCell);
            rapportCell.addElement(innerContainer);
            
            // Zone Basse : lignes coupées à gauche + grand cachet attaché à droite
            PdfPTable bottomSectionTable = new PdfPTable(2);
            bottomSectionTable.setWidthPercentage(100);
            bottomSectionTable.setWidths(new float[]{55, 45}); // Case cachet élargie à 45% pour être plus à l'aise
            
            PdfPCell shortLinesCell = new PdfPCell();
            shortLinesCell.setBorder(Rectangle.NO_BORDER);
            shortLinesCell.setPaddingLeft(12);
            shortLinesCell.setPaddingRight(10);
            shortLinesCell.setPaddingBottom(0);
            
            // 3 lignes coupées à gauche
            for (int i = 0; i < 3; i++) {
                PdfPTable lineTable = new PdfPTable(1);
                lineTable.setWidthPercentage(100);
                PdfPCell lineCell = new PdfPCell(new Phrase(" "));
                lineCell.setBorder(Rectangle.NO_BORDER);
                lineCell.setCellEvent(dashedEvent);
                lineCell.setFixedHeight(22);
                lineCell.setPadding(0);
                lineTable.addCell(lineCell);
                shortLinesCell.addElement(lineTable);
            }
            bottomSectionTable.addCell(shortLinesCell);
            
            PdfPCell cachetZoneCell = new PdfPCell();
            cachetZoneCell.setBorder(Rectangle.LEFT | Rectangle.TOP);
            cachetZoneCell.setBorderWidthLeft(1f);
            cachetZoneCell.setBorderWidthTop(1f);
            cachetZoneCell.setBorderColor(new Color(150, 165, 155));
            cachetZoneCell.setBackgroundColor(COLOR_LIGHT_BG);
            cachetZoneCell.setPadding(10);
            cachetZoneCell.setVerticalAlignment(Element.ALIGN_TOP);
            
            Paragraph cachetLabel = new Paragraph("CACHET SOCIETE", new Font(Font.HELVETICA, 9, Font.BOLD, COLOR_SECONDARY));
            cachetLabel.setAlignment(Element.ALIGN_CENTER);
            cachetZoneCell.addElement(cachetLabel);
            
            bottomSectionTable.addCell(cachetZoneCell);
            rapportCell.addElement(bottomSectionTable);
            rapportTable.addCell(rapportCell);
            document.add(rapportTable);
            
            // ==================== ZONE CLIENT AGRANDIE ====================
            Paragraph clientZoneTitle = new Paragraph("VALIDATION CLIENT", subTitleFont);
            clientZoneTitle.setSpacingBefore(8);
            clientZoneTitle.setSpacingAfter(6);
            clientZoneTitle.setAlignment(Element.ALIGN_CENTER);
            document.add(clientZoneTitle);
            
            PdfPTable clientZone = new PdfPTable(2);
            clientZone.setWidthPercentage(100);
            clientZone.setWidths(new float[]{65, 35});
            clientZone.setSpacingAfter(6);
            
            // Partie GAUCHE - Notes (AGRANDI : passage à 105pt de hauteur minimale)
            PdfPCell clientNotesCell = new PdfPCell();
            clientNotesCell.setBorder(Rectangle.BOX);
            clientNotesCell.setBorderWidth(1.2f);
            clientNotesCell.setPadding(10);
            clientNotesCell.setMinimumHeight(105);
            
            Paragraph clientNotesTitle = new Paragraph("NOTES ET OBSERVATIONS DU CLIENT", new Font(Font.HELVETICA, 10, Font.BOLD, COLOR_PRIMARY));
            clientNotesTitle.setSpacingAfter(5);
            clientNotesCell.addElement(clientNotesTitle);
            
            // 3 lignes de pointillés confortables
            for (int i = 0; i < 3; i++) {
                PdfPTable lineTable = new PdfPTable(1);
                lineTable.setWidthPercentage(100);
                PdfPCell lineCell = new PdfPCell(new Phrase(" "));
                lineCell.setBorder(Rectangle.NO_BORDER);
                lineCell.setCellEvent(dashedEvent);
                lineCell.setFixedHeight(22);
                lineCell.setPadding(0);
                lineTable.addCell(lineCell);
                clientNotesCell.addElement(lineTable);
            }
            
            // Partie DROITE - Signature / Cachet client
            PdfPCell clientSignatureCell = new PdfPCell();
            clientSignatureCell.setBorder(Rectangle.BOX);
            clientSignatureCell.setBorderWidth(1.2f);
            clientSignatureCell.setPadding(10);
            clientSignatureCell.setBackgroundColor(COLOR_LIGHT_BG);
            
            Paragraph clientSignatureTitle = new Paragraph("CACHET ET SIGNATURE", new Font(Font.HELVETICA, 9, Font.BOLD, COLOR_PRIMARY));
            clientSignatureTitle.setAlignment(Element.ALIGN_CENTER);
            clientSignatureTitle.setSpacingAfter(6);
            clientSignatureCell.addElement(clientSignatureTitle);
            
            PdfPTable clientSingleBox = new PdfPTable(1);
            clientSingleBox.setWidthPercentage(100);
            PdfPCell clientSingleCell = new PdfPCell();
            clientSingleCell.setBorder(Rectangle.BOX);
            clientSingleCell.setBorderWidth(1f);
            clientSingleCell.setBorderColor(new Color(150, 165, 155));
            clientSingleCell.setMinimumHeight(72); // Données de hauteur augmentées pour la signature
            clientSingleCell.setPadding(4);
            
            clientSingleBox.addCell(clientSingleCell);
            clientSignatureCell.addElement(clientSingleBox);
            
            clientZone.addCell(clientNotesCell);
            clientZone.addCell(clientSignatureCell);
            document.add(clientZone);
            
            // ==================== PIED DE PAGE ====================
            Paragraph footer = new Paragraph(
                "Ce document engage la responsabilité de la société et du client.",
                new Font(Font.HELVETICA, 7, Font.ITALIC)
            );
            footer.setAlignment(Element.ALIGN_CENTER);
            footer.setSpacingBefore(4);
            document.add(footer);
            
            document.close();
            
        } catch (Exception e) {
            throw new RuntimeException("Erreur lors de la génération du PDF: " + e.getMessage(), e);
        }
        
        return baos.toByteArray();
    }
    
    // ==================== UTILITAIRES ====================
    
    private void addSectionTitle(PdfPTable table, String title, Color color, int colspan) {
        Font titleFont = new Font(Font.HELVETICA, 11, Font.BOLD, color);
        Paragraph p = new Paragraph(title, titleFont);
        PdfPCell cell = new PdfPCell(p);
        cell.setBorder(Rectangle.NO_BORDER);
        cell.setColspan(colspan);
        cell.setBackgroundColor(COLOR_BG_SECTION);
        cell.setPadding(4);
        cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        table.addCell(cell);
    }
    
    private void addRow(PdfPTable table, String label, String value, Font labelFont, Font valueFont) {
        PdfPCell labelCell = new PdfPCell(new Paragraph(label, labelFont));
        labelCell.setBorder(Rectangle.NO_BORDER);
        labelCell.setPadding(2);
        labelCell.setVerticalAlignment(Element.ALIGN_BASELINE);
        
        PdfPCell valueCell = new PdfPCell(new Paragraph(value, valueFont));
        valueCell.setBorder(Rectangle.NO_BORDER);
        valueCell.setPadding(2);
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