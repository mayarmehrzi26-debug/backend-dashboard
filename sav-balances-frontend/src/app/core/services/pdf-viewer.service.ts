// src/app/core/services/pdf-viewer.service.ts
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PdfViewerService {

  constructor() {}

  /**
   * Ouvre un PDF dans un nouvel onglet pour visualisation avec bouton de téléchargement
   */
  openPdfInNewTab(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const newTab = window.open(url, '_blank');
    
    if (newTab) {
      // Attendre que la page soit chargée
      setTimeout(() => {
        try {
          // Ajouter un bouton de téléchargement dans la nouvelle fenêtre
          const downloadBtn = newTab.document.createElement('button');
          downloadBtn.textContent = '📥 Télécharger PDF';
          downloadBtn.style.cssText = `
            position: fixed;
            bottom: 30px;
            right: 30px;
            padding: 14px 28px;
            background: linear-gradient(135deg, #0a3a22 0%, #1a6d3f 100%);
            color: white;
            border: none;
            border-radius: 12px;
            cursor: pointer;
            font-size: 16px;
            font-weight: 600;
            z-index: 9999;
            box-shadow: 0 4px 20px rgba(26, 109, 63, 0.4);
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            gap: 10px;
            font-family: Arial, sans-serif;
          `;
          downloadBtn.onmouseover = () => {
            downloadBtn.style.background = 'linear-gradient(135deg, #1a6d3f 0%, #2a8a52 100%)';
            downloadBtn.style.transform = 'translateY(-2px)';
            downloadBtn.style.boxShadow = '0 6px 30px rgba(26, 109, 63, 0.5)';
          };
          downloadBtn.onmouseout = () => {
            downloadBtn.style.background = 'linear-gradient(135deg, #0a3a22 0%, #1a6d3f 100%)';
            downloadBtn.style.transform = 'translateY(0)';
            downloadBtn.style.boxShadow = '0 4px 20px rgba(26, 109, 63, 0.4)';
          };
          downloadBtn.onclick = () => {
            this.downloadPdf(blob, filename);
          };
          newTab.document.body.appendChild(downloadBtn);

          // Ajouter un bouton d'impression
          const printBtn = newTab.document.createElement('button');
          printBtn.textContent = '🖨️ Imprimer';
          printBtn.style.cssText = `
            position: fixed;
            bottom: 30px;
            left: 30px;
            padding: 14px 28px;
            background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
            color: white;
            border: none;
            border-radius: 12px;
            cursor: pointer;
            font-size: 16px;
            font-weight: 600;
            z-index: 9999;
            box-shadow: 0 4px 20px rgba(30, 60, 114, 0.4);
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            gap: 10px;
            font-family: Arial, sans-serif;
          `;
          printBtn.onmouseover = () => {
            printBtn.style.background = 'linear-gradient(135deg, #2a5298 0%, #3a6ab8 100%)';
            printBtn.style.transform = 'translateY(-2px)';
          };
          printBtn.onmouseout = () => {
            printBtn.style.background = 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)';
            printBtn.style.transform = 'translateY(0)';
          };
          printBtn.onclick = () => {
            newTab.print();
          };
          newTab.document.body.appendChild(printBtn);

          // Ajouter un message d'information
          const infoMsg = newTab.document.createElement('div');
          infoMsg.textContent = '📄 Visualisation du PDF';
          infoMsg.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0,0,0,0.7);
            color: white;
            padding: 8px 20px;
            border-radius: 20px;
            font-size: 14px;
            z-index: 9999;
            font-family: Arial, sans-serif;
            backdrop-filter: blur(10px);
          `;
          newTab.document.body.appendChild(infoMsg);
        } catch (e) {
          console.warn('Impossible d\'ajouter les boutons dans la nouvelle fenêtre');
        }
      }, 500);
    }
  }

  /**
   * Télécharge directement le PDF
   */
  downloadPdf(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  /**
   * Ouvre le PDF dans un iframe modal (alternative)
   */
  openPdfInModal(blob: Blob, filename: string = 'document.pdf'): void {
    const url = window.URL.createObjectURL(blob);
    
    // Créer la modal
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.85);
      z-index: 10000;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      animation: fadeIn 0.3s ease;
    `;

    // Barre d'outils
    const toolbar = document.createElement('div');
    toolbar.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 90%;
      max-width: 1100px;
      padding: 12px 20px;
      background: rgba(255,255,255,0.1);
      backdrop-filter: blur(10px);
      border-radius: 12px 12px 0 0;
      border-bottom: 1px solid rgba(255,255,255,0.1);
    `;

    // Titre
    const title = document.createElement('span');
    title.textContent = '📄 ' + filename;
    title.style.cssText = `
      color: white;
      font-size: 16px;
      font-weight: 600;
      font-family: Arial, sans-serif;
    `;
    toolbar.appendChild(title);

    // Groupe de boutons
    const btnGroup = document.createElement('div');
    btnGroup.style.cssText = `
      display: flex;
      gap: 10px;
    `;

    // Bouton Télécharger
    const downloadBtn = document.createElement('button');
    downloadBtn.innerHTML = '📥 Télécharger';
    downloadBtn.style.cssText = `
      padding: 8px 20px;
      background: linear-gradient(135deg, #0a3a22 0%, #1a6d3f 100%);
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
      transition: all 0.3s;
      font-family: Arial, sans-serif;
    `;
    downloadBtn.onmouseover = () => {
      downloadBtn.style.transform = 'scale(1.05)';
    };
    downloadBtn.onmouseout = () => {
      downloadBtn.style.transform = 'scale(1)';
    };
    downloadBtn.onclick = () => {
      this.downloadPdf(blob, filename);
    };
    btnGroup.appendChild(downloadBtn);

    // Bouton Imprimer
    const printBtn = document.createElement('button');
    printBtn.innerHTML = '🖨️ Imprimer';
    printBtn.style.cssText = `
      padding: 8px 20px;
      background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
      transition: all 0.3s;
      font-family: Arial, sans-serif;
    `;
    printBtn.onmouseover = () => {
      printBtn.style.transform = 'scale(1.05)';
    };
    printBtn.onmouseout = () => {
      printBtn.style.transform = 'scale(1)';
    };
    printBtn.onclick = () => {
      const iframe = modal.querySelector('iframe') as HTMLIFrameElement;
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.print();
      }
    };
    btnGroup.appendChild(printBtn);

    // Bouton Fermer
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '✕ Fermer';
    closeBtn.style.cssText = `
      padding: 8px 20px;
      background: #dc3545;
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
      transition: all 0.3s;
      font-family: Arial, sans-serif;
    `;
    closeBtn.onmouseover = () => {
      closeBtn.style.transform = 'scale(1.05)';
    };
    closeBtn.onmouseout = () => {
      closeBtn.style.transform = 'scale(1)';
    };
    closeBtn.onclick = () => {
      document.body.removeChild(modal);
      window.URL.revokeObjectURL(url);
    };
    btnGroup.appendChild(closeBtn);

    toolbar.appendChild(btnGroup);

    // Iframe pour le PDF
    const iframe = document.createElement('iframe');
    iframe.src = url;
    iframe.style.cssText = `
      width: 90%;
      max-width: 1100px;
      height: 80%;
      border: none;
      border-radius: 0 0 12px 12px;
      background: white;
    `;

    // Ajouter les styles d'animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; transform: scale(0.95); }
        to { opacity: 1; transform: scale(1); }
      }
    `;
    modal.appendChild(style);

    modal.appendChild(toolbar);
    modal.appendChild(iframe);
    document.body.appendChild(modal);

    // Fermer avec la touche Echap
    const escHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (document.body.contains(modal)) {
          document.body.removeChild(modal);
          window.URL.revokeObjectURL(url);
        }
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);

    // Fermer en cliquant sur le fond (hors iframe)
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
        window.URL.revokeObjectURL(url);
        document.removeEventListener('keydown', escHandler);
      }
    });
  }
}