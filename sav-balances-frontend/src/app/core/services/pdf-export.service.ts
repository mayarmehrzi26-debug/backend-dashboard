// src/app/core/services/pdf-export.service.ts
import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

@Injectable({
  providedIn: 'root'
})
export class PdfExportService {

  constructor() { }

  /**
   * Exporte une section HTML en PDF avec support arabe
   */
  async exportHtmlToPdf(elementId: string, fileName: string = 'document.pdf'): Promise<void> {
    const element = document.getElementById(elementId);
    if (!element) {
      console.error(`Élément #${elementId} non trouvé`);
      return;
    }

    try {
      // Capture du contenu HTML
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        allowTaint: true,
        foreignObjectRendering: true
      });

      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      // Ajout de l'image
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(fileName);

    } catch (error) {
      console.error('Erreur lors de l\'export PDF:', error);
      throw error;
    }
  }

  /**
   * Génère un PDF de liste d'interventions
   */
  generateInterventionsListPDF(
    interventions: any[],
    title: string = 'Liste des interventions',
    columns: { key: string; label: string }[]
  ): jsPDF {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 15;
    let y = margin;

    // ===== POLICE ARABE =====
    // Note: jsPDF ne supporte pas nativement l'arabe sans police personnalisée
    // Utilisation de la police standard avec fallback
    
    // En-tête
    pdf.setFontSize(18);
    pdf.setTextColor(13, 62, 35);
    pdf.text(title, pageWidth / 2, y, { align: 'center' });
    y += 10;

    // Date
    pdf.setFontSize(10);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`Généré le : ${new Date().toLocaleString('fr-FR')}`, pageWidth / 2, y, { align: 'center' });
    y += 10;

    // Résumé
    const total = interventions.length;
    const totalMontant = interventions.reduce((sum, i) => sum + (i.montantTotal || 0), 0);
    const totalPaye = interventions.reduce((sum, i) => sum + (i.montantPaye || 0), 0);

    pdf.setFontSize(10);
    pdf.setTextColor(50, 50, 50);
    pdf.text(`Total: ${total} interventions | Montant: ${totalMontant} DT | Payé: ${totalPaye} DT`, margin, y);
    y += 8;

    // Ligne de séparation
    pdf.setDrawColor(13, 62, 35);
    pdf.line(margin, y, pageWidth - margin, y);
    y += 5;

    // ===== TABLEAU =====
    const colWidth = (pageWidth - 2 * margin) / columns.length;
    const rowHeight = 8;

    // En-tête du tableau
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(255, 255, 255);
    pdf.setFillColor(13, 62, 35);

    let x = margin;
    columns.forEach((col, index) => {
      const width = index === columns.length - 1 ? pageWidth - margin - x : colWidth;
      pdf.rect(x, y, width, rowHeight, 'FD');
      pdf.text(col.label, x + 2, y + 5);
      x += width;
    });
    y += rowHeight;

    // Données
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(0, 0, 0);

    interventions.forEach((item, index) => {
      // Vérifier si on doit passer à une nouvelle page
      if (y > pageHeight - 20) {
        pdf.addPage();
        y = margin + 5;
        
        // Ré-afficher l'en-tête
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(255, 255, 255);
        pdf.setFillColor(13, 62, 35);
        
        x = margin;
        columns.forEach((col, idx) => {
          const width = idx === columns.length - 1 ? pageWidth - margin - x : colWidth;
          pdf.rect(x, y, width, rowHeight, 'FD');
          pdf.text(col.label, x + 2, y + 5);
          x += width;
        });
        y += rowHeight;
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(0, 0, 0);
      }

      const bgColor = index % 2 === 0 ? [249, 249, 249] : [255, 255, 255];
      pdf.setFillColor(bgColor[0], bgColor[1], bgColor[2]);

      x = margin;
      columns.forEach((col, idx) => {
        const width = idx === columns.length - 1 ? pageWidth - margin - x : colWidth;
        let value = item[col.key] || '-';
        
        // Formatter les dates
        if (col.key === 'dateReclamation' || col.key === 'dateOrdre') {
          if (value && value !== '-') {
            value = new Date(value).toLocaleDateString('fr-FR');
          }
        }
        
        // Formatter les montants
        if (col.key === 'montantTotal' || col.key === 'montantPaye') {
          value = value !== '-' ? `${value} DT` : '-';
        }

        pdf.rect(x, y, width, rowHeight, 'F');
        pdf.text(String(value), x + 2, y + 5);
        x += width;
      });
      y += rowHeight;
    });

    // ===== FOOTER =====
    y = pageHeight - 10;
    pdf.setFontSize(7);
    pdf.setTextColor(150, 150, 150);
    pdf.text(`Document généré automatiquement - ${new Date().toLocaleString('fr-FR')}`, pageWidth / 2, y, { align: 'center' });

    return pdf;
  }

  /**
   * Télécharge le PDF généré
   */
  downloadPDF(pdf: jsPDF, fileName: string = 'document.pdf'): void {
    pdf.save(fileName);
  }

  /**
   * Ouvre le PDF dans un nouvel onglet
   */
  openPDFInNewTab(pdf: jsPDF, fileName: string = 'document.pdf'): void {
    const pdfBlob = pdf.output('blob');
    const url = URL.createObjectURL(pdfBlob);
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}