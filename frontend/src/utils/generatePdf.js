export const generateForensicPdf = (data) => {
  const report = data || {
    caseId: 'SIH-2026-CR-99412',
    inputAddress: '0x388C818CA8B9251b393131C08a736A67ccB19297',
    timestamp: new Date().toUTCString(),
    vaspName: 'Binance VASP / Enforcement Team',
    confidenceScore: '94.8%',
    complianceSection: 'Section 94 Bharatiya Nagarik Suraksha Sanhita (BNSS), 2023',
    transactions: [
      { hash: '0x8f4c...3e1a', hop: 1, time: '2026-08-31 14:22:10', amount: '250.0 ETH' },
      { hash: '0x1b2d...9f4c', hop: 2, time: '2026-08-31 14:25:04', amount: '249.5 WETH' },
      { hash: '0x7e3a...1b8c', hop: 3, time: '2026-08-31 14:30:15', amount: '450,000 USDT' }
    ]
  };

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Forensic Report - ${report.caseId}</title>
        <style>
          body { font-family: Arial, sans-serif; color: #111; padding: 40px; margin: 0; background: #fff; }
          .header { text-align: center; border: 2px solid #0f172a; padding: 15px; background: #f1f5f9; margin-bottom: 20px; }
          .header h2 { margin: 0; font-size: 16px; color: #0f172a; letter-spacing: 0.5px; }
          .legal { font-size: 11px; color: #b91c1c; font-weight: bold; margin-bottom: 20px; border-left: 4px solid #b91c1c; padding-left: 10px; }
          .section-title { font-size: 13px; font-weight: bold; color: #0f172a; margin-top: 25px; margin-bottom: 8px; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border: 1px solid #cbd5e1; padding: 8px 12px; font-size: 12px; text-align: left; }
          th { background: #0f172a; color: #fff; }
          .meta-table td { border: none; padding: 6px 0; }
          .meta-label { font-weight: bold; width: 180px; color: #334155; }
          .footer-sign { margin-top: 50px; float: right; text-align: center; width: 220px; font-size: 11px; }
          .footer-sign .line { border-top: 1px solid #000; margin-top: 40px; padding-top: 4px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>CRIMINAL JUSTICE & FINANCIAL FORENSICS DIVISION</h2>
          <p style="margin: 5px 0 0; font-size: 12px; color: #475569;">NOTICE OF DIGITAL ASSET TRACKING & FREEZE REQUEST</p>
        </div>

        <div class="legal">
          LEGAL MANDATE: Issued under ${report.complianceSection}. Non-compliance or failure to preserve ledger evidence constitutes an offense under relevant penal statutes.
        </div>

        <div class="section-title">1. INVESTIGATION METADATA & WALLET ARTIFACTS</div>
        <table class="meta-table">
          <tr><td class="meta-label">Case Reference ID:</td><td><code>${report.caseId}</code></td></tr>
          <tr><td class="meta-label">Target Wallet Address:</td><td><code>${report.inputAddress}</code></td></tr>
          <tr><td class="meta-label">Report Timestamp:</td><td>${report.timestamp}</td></tr>
          <tr><td class="meta-label">Identified VASP Name:</td><td style="color: #0284c7; font-weight: bold;">${report.vaspName}</td></tr>
          <tr><td class="meta-label">Confidence Score:</td><td style="color: #16a34a; font-weight: bold;">${report.confidenceScore}</td></tr>
        </table>

        <div class="section-title">2. ON-CHAIN TRANSACTION EVIDENCE TABLE</div>
        <table>
          <thead>
            <tr>
              <th>TX HASH</th>
              <th style="text-align: center;">HOP</th>
              <th>TIMESTAMP</th>
              <th>VALUE / ASSET</th>
            </tr>
          </thead>
          <tbody>
            ${report.transactions.map(tx => `
              <tr>
                <td><code>${tx.hash}</code></td>
                <td style="text-align: center;">${tx.hop}</td>
                <td>${tx.time}</td>
                <td><strong>${tx.amount}</strong></td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer-sign">
          <div>AUTHORIZED INVESTIGATING OFFICER</div>
          <div class="line">Cyber Crime Special Cell</div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
    </html>
  `;

  // Create a safe data blob and force download/print via a temporary object link
  const blob = new Blob([htmlContent], { type: 'text/html' });
  const blobUrl = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = blobUrl;
  link.target = '_blank';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};