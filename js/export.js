/**
 * Módulo de Exportação (PDF e Excel/CSV)
 * Operação Penske | Mercedes-Benz
 */

const Exporter = (() => {
  /**
   * Gera o documento jsPDF estruturado
   */
  function buildPDFDocument(data) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const fmt = Calculator.formatNumber;

    // Cabeçalho Corporativo
    doc.setFillColor(10, 25, 47);
    doc.rect(0, 0, 210, 28, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(15);
    doc.setFont('helvetica', 'bold');
    doc.text('RELATÓRIO DIÁRIO DE OPERAÇÕES', 14, 12);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(147, 197, 253);
    doc.text(`PENSKE LOGISTICS  |  CLIENTE: MERCEDES-BENZ  |  DATA: ${data.identificacao.dataFormatada}`, 14, 20);

    // Bloco 1: Identificação
    doc.autoTable({
      startY: 33,
      head: [['Identificação da Operação', 'Detalhes']],
      body: [
        ['Data da Operação', `${data.identificacao.dataFormatada} (${data.identificacao.turno})`],
        ['Unidade Operacional', data.identificacao.unidade],
        ['Responsável Penske', data.identificacao.responsavel],
        ['Observações Gerais', data.identificacao.observacoes || 'Sem observações registradas.']
      ],
      theme: 'grid',
      headStyles: { fillColor: [29, 53, 87], fontSize: 9.5 },
      styles: { fontSize: 8.5, cellPadding: 2.5 }
    });

    // Bloco 2: Movimentação de Linhas
    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 5,
      head: [['Movimentação de Linhas', 'Nacional', 'Importado', 'Total']],
      body: [
        ['Linhas Recebidas (INBOUND)', fmt(data.linhas.inbound.nacional), fmt(data.linhas.inbound.importado), fmt(data.linhas.inbound.total)],
        ['Linhas Produzidas (OUTBOUND)', fmt(data.linhas.outbound.nacional), fmt(data.linhas.outbound.importado), fmt(data.linhas.outbound.total)]
      ],
      theme: 'grid',
      headStyles: { fillColor: [29, 53, 87], fontSize: 9.5 },
      styles: { fontSize: 8.5, cellPadding: 2.5 }
    });

    // Bloco 3: Volume de Peças (Inbound e Outbound)
    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 5,
      head: [['Volume de Peças (Inbound vs Outbound)', 'Nacional', 'Importado', 'Total']],
      body: [
        ['INBOUND - Leve', fmt(data.pecas.inbound.leve.nacional), fmt(data.pecas.inbound.leve.importado), fmt(data.pecas.inbound.leve.total)],
        ['INBOUND - Médio', fmt(data.pecas.inbound.medio.nacional), fmt(data.pecas.inbound.medio.importado), fmt(data.pecas.inbound.medio.total)],
        ['INBOUND - Pesado', fmt(data.pecas.inbound.pesado.nacional), fmt(data.pecas.inbound.pesado.importado), fmt(data.pecas.inbound.pesado.total)],
        [{ content: 'TOTAL PEÇAS INBOUND', styles: { fontStyle: 'bold', fillColor: [224, 242, 254] } },
         { content: fmt(data.pecas.inbound.totalNacional), styles: { fontStyle: 'bold', fillColor: [224, 242, 254] } },
         { content: fmt(data.pecas.inbound.totalImportado), styles: { fontStyle: 'bold', fillColor: [224, 242, 254] } },
         { content: fmt(data.pecas.inbound.totalGeral), styles: { fontStyle: 'bold', fillColor: [224, 242, 254] } }],
        ['OUTBOUND - Leve', fmt(data.pecas.outbound.leve.nacional), fmt(data.pecas.outbound.leve.importado), fmt(data.pecas.outbound.leve.total)],
        ['OUTBOUND - Médio', fmt(data.pecas.outbound.medio.nacional), fmt(data.pecas.outbound.medio.importado), fmt(data.pecas.outbound.medio.total)],
        ['OUTBOUND - Pesado', fmt(data.pecas.outbound.pesado.nacional), fmt(data.pecas.outbound.pesado.importado), fmt(data.pecas.outbound.pesado.total)],
        [{ content: 'TOTAL PEÇAS OUTBOUND', styles: { fontStyle: 'bold', fillColor: [224, 242, 254] } },
         { content: fmt(data.pecas.outbound.totalNacional), styles: { fontStyle: 'bold', fillColor: [224, 242, 254] } },
         { content: fmt(data.pecas.outbound.totalImportado), styles: { fontStyle: 'bold', fillColor: [224, 242, 254] } },
         { content: fmt(data.pecas.outbound.totalGeral), styles: { fontStyle: 'bold', fillColor: [224, 242, 254] } }]
      ],
      theme: 'grid',
      headStyles: { fillColor: [29, 53, 87], fontSize: 9.5 },
      styles: { fontSize: 8.5, cellPadding: 2.3 }
    });

    // Bloco 4: Gestão de Pessoas
    const pessoasRows = data.pessoas.areas.map((a) => [
      a.nome,
      fmt(a.funcionarios),
      fmt(a.ausentes),
      a.absenteismoFormatado
    ]);
    pessoasRows.push([
      { content: 'TOTAL GERAL', styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } },
      { content: fmt(data.pessoas.totalFuncionarios), styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } },
      { content: fmt(data.pessoas.totalAusentes), styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } },
      { content: data.pessoas.absenteismoGeralFormatado, styles: { fontStyle: 'bold', fillColor: [224, 242, 254] } }
    ]);

    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 5,
      head: [['Gestão de Pessoas - Área', 'Funcionários', 'Ausentes', 'Absenteísmo (%)']],
      body: pessoasRows,
      theme: 'grid',
      headStyles: { fillColor: [29, 53, 87], fontSize: 9.5 },
      styles: { fontSize: 8.5, cellPadding: 2.3 }
    });

    // Bloco 5: Inventário
    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 5,
      head: [['Controle de Inventário', 'Meta', 'Realizado', 'Pendente', '% Realização']],
      body: [[
        data.inventario.metaAtingida ? 'Meta Atingida' : 'Em Andamento',
        fmt(data.inventario.meta),
        fmt(data.inventario.realizado),
        fmt(data.inventario.pendente),
        data.inventario.percentualFormatado
      ]],
      theme: 'grid',
      headStyles: { fillColor: [29, 53, 87], fontSize: 9.5 },
      styles: { fontSize: 8.5, cellPadding: 2.5 }
    });

    // Rodapé
    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text(`Documento gerado automaticamente em ${new Date().toLocaleString('pt-BR')} — Penske | Mercedes-Benz`, 14, pageHeight - 8);

    return doc;
  }

  /**
   * Download direto do PDF pelo usuário
   */
  function downloadPDF(data) {
    const doc = buildPDFDocument(data);
    const filename = `Relatorio_Operacoes_Penske_MB_${data.identificacao.dataOperacao || 'sem_data'}.pdf`;
    doc.save(filename);
  }

  /**
   * Retorna PDF em Base64 para anexo no e-mail via backend
   */
  function getPDFBase64(data) {
    const doc = buildPDFDocument(data);
    const dataUri = doc.output('datauristring');
    return dataUri.split(',')[1];
  }

  /**
   * Monta matriz tabular padronizada para Excel e CSV
   */
  function buildTabularRows(data) {
    const rows = [
      ['RELATÓRIO DIÁRIO DE OPERAÇÕES — PENSKE | MERCEDES-BENZ'],
      ['Data da Operação', data.identificacao.dataFormatada],
      ['Turno', data.identificacao.turno],
      ['Unidade Operacional', data.identificacao.unidade],
      ['Responsável', data.identificacao.responsavel],
      ['Empresa Prestadora', 'Penske'],
      ['Cliente', 'Mercedes-Benz'],
      ['Observações', data.identificacao.observacoes],
      [],
      ['MOVIMENTAÇÃO DE LINHAS', 'Nacional', 'Importado', 'Total'],
      ['Linhas Recebidas (Inbound)', data.linhas.inbound.nacional, data.linhas.inbound.importado, data.linhas.inbound.total],
      ['Linhas Produzidas (Outbound)', data.linhas.outbound.nacional, data.linhas.outbound.importado, data.linhas.outbound.total],
      [],
      ['VOLUME DE PEÇAS - INBOUND', 'Nacional', 'Importado', 'Total'],
      ['Leve', data.pecas.inbound.leve.nacional, data.pecas.inbound.leve.importado, data.pecas.inbound.leve.total],
      ['Médio', data.pecas.inbound.medio.nacional, data.pecas.inbound.medio.importado, data.pecas.inbound.medio.total],
      ['Pesado', data.pecas.inbound.pesado.nacional, data.pecas.inbound.pesado.importado, data.pecas.inbound.pesado.total],
      ['Total Inbound', data.pecas.inbound.totalNacional, data.pecas.inbound.totalImportado, data.pecas.inbound.totalGeral],
      [],
      ['VOLUME DE PEÇAS - OUTBOUND', 'Nacional', 'Importado', 'Total'],
      ['Leve', data.pecas.outbound.leve.nacional, data.pecas.outbound.leve.importado, data.pecas.outbound.leve.total],
      ['Médio', data.pecas.outbound.medio.nacional, data.pecas.outbound.medio.importado, data.pecas.outbound.medio.total],
      ['Pesado', data.pecas.outbound.pesado.nacional, data.pecas.outbound.pesado.importado, data.pecas.outbound.pesado.total],
      ['Total Outbound', data.pecas.outbound.totalNacional, data.pecas.outbound.totalImportado, data.pecas.outbound.totalGeral],
      [],
      ['GESTÃO DE PESSOAS', 'Funcionários', 'Ausentes', 'Absenteísmo (%)'],
      ...data.pessoas.areas.map((a) => [a.nome, a.funcionarios, a.ausentes, a.absenteismoFormatado]),
      ['Total Geral', data.pessoas.totalFuncionarios, data.pessoas.totalAusentes, data.pessoas.absenteismoGeralFormatado],
      [],
      ['CONTROLE DE INVENTÁRIO', 'Meta', 'Realizado', 'Pendente', 'Realização (%)'],
      ['Contagem Diária', data.inventario.meta, data.inventario.realizado, data.inventario.pendente, data.inventario.percentualFormatado]
    ];
    return rows;
  }

  /**
   * Download de Planilha Excel (.xlsx)
   */
  function downloadExcel(data) {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(buildTabularRows(data));
    ws['!cols'] = [{ wch: 32 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 18 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Indicadores_Operacionais');
    const filename = `Indicadores_Penske_MB_${data.identificacao.dataOperacao || 'sem_data'}.xlsx`;
    XLSX.writeFile(wb, filename);
  }

  /**
   * Gera string CSV em Base64 (UTF-8 com BOM) para anexo no e-mail
   */
  function getCSVBase64(data) {
    const ws = XLSX.utils.aoa_to_sheet(buildTabularRows(data));
    const csvContent = '\uFEFF' + XLSX.utils.sheet_to_csv(ws, { FS: ';' });
    return btoa(unescape(encodeURIComponent(csvContent)));
  }

  return {
    downloadPDF,
    getPDFBase64,
    downloadExcel,
    getCSVBase64
  };
})();