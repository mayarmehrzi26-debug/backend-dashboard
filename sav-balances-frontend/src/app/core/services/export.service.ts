import { Injectable } from '@angular/core';
import { saveAs } from 'file-saver';

@Injectable({
  providedIn: 'root'
})
export class ExportService {

  constructor() { }

  /**
   * Exporte des données en CSV avec tous les détails
   */
  exportToCSV(data: any[], filename: string, columns?: { key: string, label: string }[]): void {
    if (!data || data.length === 0) {
      alert('Aucune donnée à exporter');
      return;
    }

    const headers = columns || Object.keys(data[0]).map(key => ({ key, label: key }));
    
    let csv = headers.map(h => `"${h.label}"`).join(';') + '\n';
    
    data.forEach(row => {
      const line = headers.map(h => {
        let value = row[h.key];
        if (value === null || value === undefined) value = '';
        if (typeof value === 'string' && value.includes('"')) {
          value = value.replace(/"/g, '""');
        }
        if (typeof value === 'string' && (value.includes(';') || value.includes('\n') || value.includes('"'))) {
          value = `"${value}"`;
        }
        return value;
      }).join(';');
      csv += line + '\n';
    });

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    saveAs(blob, `${filename}.csv`);
  }

  /**
   * Exporte un rapport PDF (via impression HTML)
   */
  exportToPDF(data: any[], title: string, filename: string): void {
    if (!data || data.length === 0) {
      alert('Aucune donnée à exporter');
      return;
    }

    const printWindow = window.open('', '_blank', 'width=1200,height=800');
    if (!printWindow) {
      alert('Veuillez autoriser les popups pour exporter en PDF');
      return;
    }

    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; background: white; }
          .container { max-width: 1200px; margin: 0 auto; }
          h1 { color: #0d3e23; text-align: center; border-bottom: 3px solid #0d3e23; padding-bottom: 15px; }
          .header { text-align: center; margin-bottom: 20px; }
          .header .date { color: #666; font-size: 14px; }
          .summary { display: flex; justify-content: space-around; background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
          .summary-item { text-align: center; }
          .summary-item .label { display: block; font-size: 12px; color: #666; }
          .summary-item .value { font-size: 20px; font-weight: bold; color: #0d3e23; }
          .client-card { border: 1px solid #e9ecef; border-radius: 8px; margin-bottom: 20px; overflow: hidden; page-break-inside: avoid; }
          .client-header { background: #0d3e23; color: white; padding: 12px 20px; display: flex; justify-content: space-between; align-items: center; }
          .client-header h3 { margin: 0; font-size: 16px; }
          .client-header .badge { background: #28a745; color: white; padding: 2px 10px; border-radius: 12px; font-size: 12px; }
          .client-body { padding: 15px 20px; }
          .info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; margin-bottom: 15px; }
          .info-item { background: #f8f9fa; padding: 8px 12px; border-radius: 4px; }
          .info-item .label { font-weight: bold; color: #0d3e23; font-size: 11px; display: block; text-transform: uppercase; }
          .info-item .value { font-size: 14px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
          th { background: #e8f5e9; color: #0d3e23; padding: 8px 10px; text-align: left; border-bottom: 2px solid #0d3e23; }
          td { padding: 6px 10px; border-bottom: 1px solid #eee; }
          tr:nth-child(even) { background: #f9f9f9; }
          .badge-status { padding: 2px 10px; border-radius: 12px; font-size: 10px; display: inline-block; }
          .badge-success { background: #d4edda; color: #155724; }
          .badge-warning { background: #fff3cd; color: #856404; }
          .badge-danger { background: #f8d7da; color: #721c24; }
          .badge-secondary { background: #e9ecef; color: #495057; }
          .badge-info { background: #d1ecf1; color: #0c5460; }
          .badge-primary { background: #cce5ff; color: #004085; }
          .badge-dark { background: #343a40; color: white; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .footer { margin-top: 30px; color: #666; font-size: 12px; text-align: center; border-top: 1px solid #ddd; padding-top: 15px; }
          .no-interventions { color: #6c757d; font-style: italic; padding: 10px; text-align: center; }
          .stars { color: #ffc107; }
          @media print { body { padding: 10px; } .client-card { page-break-inside: avoid; } }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📋 ${title}</h1>
            <p class="date">Généré le : ${new Date().toLocaleString('fr-FR')}</p>
          </div>

          <div class="summary">
            <div class="summary-item">
              <span class="label">Total Clients</span>
              <span class="value">${data.length}</span>
            </div>
            <div class="summary-item">
              <span class="label">Total Interventions</span>
              <span class="value">${data.reduce((sum, item) => sum + (item.interventions?.length || 0), 0)}</span>
            </div>
            <div class="summary-item">
              <span class="label">Montant Total</span>
              <span class="value">${data.reduce((sum, item) => sum + item.interventions?.reduce((s: number, i: any) => s + (i.montantTotal || 0), 0) || 0, 0)} DT</span>
            </div>
          </div>
    `;

    data.forEach((client: any) => {
      const interventions = client.interventions || [];
      const nbInterventions = interventions.length;

      html += `
        <div class="client-card">
          <div class="client-header">
            <h3>🏢 ${client.societe || 'Client sans nom'}</h3>
            <span class="badge">${nbInterventions} intervention${nbInterventions > 1 ? 's' : ''}</span>
          </div>
          <div class="client-body">
            <div class="info-grid">
              <div class="info-item"><span class="label">Responsable</span><span class="value">${client.responsable || '-'}</span></div>
              <div class="info-item"><span class="label">Téléphone</span><span class="value">${client.telephone || '-'}</span></div>
              <div class="info-item"><span class="label">Email</span><span class="value">${client.email || '-'}</span></div>
              <div class="info-item"><span class="label">Adresse</span><span class="value">${client.adresse || '-'}</span></div>
              <div class="info-item"><span class="label">Comportement</span><span class="value">${client.comportement || 'Non évalué'}</span></div>
              <div class="info-item"><span class="label">Note</span><span class="value">${client.note ? '★'.repeat(Math.floor(client.note)) + '☆'.repeat(5 - Math.floor(client.note)) + ' (' + client.note + '/5)' : 'Non noté'}</span></div>
              <div class="info-item"><span class="label">Statut Paiement</span><span class="value">${client.statutPaiement || 'Non renseigné'}</span></div>
              <div class="info-item"><span class="label">Tags</span><span class="value">${client.negociateur ? '🏷️ Négociateur ' : ''}${client.clientFidele ? '❤️ Fidèle' : ''}${!client.negociateur && !client.clientFidele ? 'Aucun' : ''}</span></div>
              <div class="info-item"><span class="label">Avertissements</span><span class="value">${client.nombreAvertissements || 0}</span></div>
            </div>
      `;

      if (interventions.length > 0) {
        html += `
          <table>
            <thead>
              <tr>
                <th>N° Ordre</th>
                <th>Type</th>
                <th>Équipement</th>
                <th>Réclamation</th>
                <th>Statut</th>
                <th class="text-right">Montant</th>
                <th class="text-right">Payé</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
        `;

        interventions.forEach((interv: any) => {
          const statutClass = this.getStatutClass(interv.statutIntervention);
          const statutLabel = this.getStatutLabel(interv.statutIntervention);
          const paiementClass = this.getPaiementClass(interv.statutPaiement);
          const paiementLabel = this.getPaiementLabel(interv.statutPaiement);

          html += `
            <tr>
              <td><strong>${interv.numeroOrdre || '-'}</strong></td>
              <td><span class="badge-status ${interv.type === 'INTERNE' ? 'badge-primary' : 'badge-info'}">${interv.type === 'INTERNE' ? '🏠 Interne' : '🌍 Externe'}</span></td>
              <td>${interv.bascule || '-'}</td>
              <td>${interv.reclamation || '-'}</td>
              <td><span class="badge-status ${statutClass}">${statutLabel}</span></td>
              <td class="text-right">${interv.montantTotal || 0} DT</td>
              <td class="text-right">${interv.montantPaye || 0} DT</td>
              <td>${interv.dateReclamation ? new Date(interv.dateReclamation).toLocaleDateString('fr-FR') : '-'}</td>
            </tr>
          `;
        });

        html += `
            </tbody>
          </table>
        `;
      } else {
        html += `<div class="no-interventions">Aucune intervention pour ce client</div>`;
      }

      html += `
          </div>
        </div>
      `;
    });

    html += `
          <div class="footer">
            Rapport généré automatiquement - ${new Date().toLocaleString('fr-FR')}
            <br>${data.length} client(s) - ${data.reduce((sum, item) => sum + (item.interventions?.length || 0), 0)} intervention(s)
          </div>
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 500);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  }

  // ========== MÉTHODES UTILITAIRES ==========

  private getStatutLabel(statut?: string): string {
    const labels: {[key: string]: string} = {
      'EN_ATTENTE': '🔵 En attente',
      'CONFIRME': '🟡 En cours',
      'ANNULE': '🔴 Annulé',
      'TERMINE': '🟢 Terminé'
    };
    return labels[statut || ''] || statut || 'Non défini';
  }

  private getStatutClass(statut?: string): string {
    const classes: {[key: string]: string} = {
      'EN_ATTENTE': 'badge-secondary',
      'CONFIRME': 'badge-warning',
      'ANNULE': 'badge-danger',
      'TERMINE': 'badge-success'
    };
    return classes[statut || ''] || 'badge-secondary';
  }

  private getPaiementLabel(statut?: string): string {
    const labels: {[key: string]: string} = {
      'EN_ATTENTE': '⏳ En attente',
      'PARTIEL': '🟡 Partiel',
      'PAYE': '✅ Payé',
      'EN_RETARD': '🔴 En retard',
      'ANNULE': '❌ Annulé'
    };
    return labels[statut || ''] || statut || '-';
  }

  private getPaiementClass(statut?: string): string {
    const classes: {[key: string]: string} = {
      'EN_ATTENTE': 'badge-secondary',
      'PARTIEL': 'badge-warning',
      'PAYE': 'badge-success',
      'EN_RETARD': 'badge-danger',
      'ANNULE': 'badge-dark'
    };
    return classes[statut || ''] || 'badge-secondary';
  }
}