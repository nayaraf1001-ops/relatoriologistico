/**
 * Controlador Principal da Interface, Gráficos e Integração API
 * Operação Penske | Mercedes-Benz
 */

document.addEventListener('DOMContentLoaded', () => {
  lucide.createIcons();

  const STORAGE_KEY = 'penske_mb_relatorio_rascunho_v1';
  const charts = {};
  let isSending = false;

  // Inicializar data atual
  function setDefaultDate() {
    const today = new Date();
    const offset = today.getTimezoneOffset();
    const localDate = new Date(today.getTime() - offset * 60 * 1000);
    document.getElementById('data-operacao').value = localDate.toISOString().split('T')[0];
  }

  // Sistema de Toast Feedback
  function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 4500);
  }

  // Gestão Dinâmica de Áreas (Gestão de Pessoas)
  function addPessoaRow(nome = '', funcionarios = 0, ausentes = 0) {
    const tbody = document.getElementById('pessoas-tbody');
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><input type="text" class="area-nome" value="${nome}" placeholder="Nome da área operacional" required></td>
      <td><input type="number" class="table-input area-func int-only" min="0" step="1" value="${funcionarios}" required></td>
      <td><input type="number" class="table-input area-aus int-only" min="0" step="1" value="${ausentes}" required></td>
      <td class="auto-cell area-pct">0,00%</td>
      <td style="text-align:center;">
        <button type="button" class="btn-icon-del" title="Excluir área">
          <i data-lucide="trash-2"></i>
        </button>
      </td>
    `;
    tbody.appendChild(tr);
    lucide.createIcons();

    tr.querySelector('.btn-icon-del').addEventListener('click', () => {
      if (tbody.children.length <= 1) {
        showToast('É necessário manter pelo menos uma área operacional.', 'warning');
        return;
      }
      tr.remove();
      refreshAll();
    });

    tr.querySelectorAll('input').forEach((inp) => {
      inp.addEventListener('input', () => {
        if (inp.classList.contains('int-only')) {
          Validator.sanitizeIntegerInput(inp);
        }
        refreshAll();
      });
    });
  }

  // Inicializar 3 áreas padrão
  function initDefaultAreas() {
    const tbody = document.getElementById('pessoas-tbody');
    tbody.innerHTML = '';
    addPessoaRow('Recebimento (Inbound)', 0, 0);
    addPessoaRow('Separação / Abastecimento (Outbound)', 0, 0);
    addPessoaRow('Inventário & Qualidade', 0, 0);
  }

  // Inicializar Gráficos Chart.js
  function initCharts() {
    const navy = '#1d3557';
    const sky = '#0284c7';
    const slate = '#94a3b8';
    const green = '#15803d';

    const commonOpts = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } } }
    };

    charts.linhas = new Chart(document.getElementById('chart-linhas'), {
      type: 'bar',
      data: {
        labels: ['Linhas'],
        datasets: [
          { label: 'Recebidas (Inbound)', data: [0], backgroundColor: sky },
          { label: 'Produzidas (Outbound)', data: [0], backgroundColor: navy }
        ]
      },
      options: commonOpts
    });

    charts.pecasIO = new Chart(document.getElementById('chart-pecas-io'), {
      type: 'bar',
      data: {
        labels: ['Volume de Peças'],
        datasets: [
          { label: 'Inbound', data: [0], backgroundColor: sky },
          { label: 'Outbound', data: [0], backgroundColor: navy }
        ]
      },
      options: commonOpts
    });

    charts.origem = new Chart(document.getElementById('chart-origem'), {
      type: 'doughnut',
      data: {
        labels: ['Nacional', 'Importado'],
        datasets: [{ data: [0, 0], backgroundColor: [navy, sky] }]
      },
      options: commonOpts
    });

    charts.peso = new Chart(document.getElementById('chart-peso'), {
      type: 'bar',
      data: {
        labels: ['Leve', 'Médio', 'Pesado'],
        datasets: [
          { label: 'Inbound', data: [0, 0, 0], backgroundColor: sky },
          { label: 'Outbound', data: [0, 0, 0], backgroundColor: navy }
        ]
      },
      options: commonOpts
    });

    charts.absenteismo = new Chart(document.getElementById('chart-absenteismo'), {
      type: 'bar',
      data: {
        labels: [],
        datasets: [{ label: 'Absenteísmo (%)', data: [], backgroundColor: '#0369a1' }]
      },
      options: {
        ...commonOpts,
        scales: { y: { beginAtZero: true, max: 100 } }
      }
    });

    charts.inventario = new Chart(document.getElementById('chart-inventario'), {
      type: 'bar',
      data: {
        labels: ['Contagem Diária'],
        datasets: [
          { label: 'Meta', data: [0], backgroundColor: slate },
          { label: 'Realizado', data: [0], backgroundColor: green }
        ]
      },
      options: commonOpts
    });
  }

  // Atualiza toda a UI, cálculos e gráficos em tempo real
  function refreshAll() {
    Validator.validatePessoasRows();
    const data = Calculator.computeAll();
    const fmt = Calculator.formatNumber;

    // 2. Linhas
    document.getElementById('total-linhas-in').textContent = fmt(data.linhas.inbound.total);
    document.getElementById('total-linhas-out').textContent = fmt(data.linhas.outbound.total);
    document.getElementById('pct-linhas-in').textContent = `${data.linhas.pctInbound.toFixed(1)}%`;
    document.getElementById('pct-linhas-out').textContent = `${data.linhas.pctOutbound.toFixed(1)}%`;
    document.getElementById('bar-linhas-in').style.width = `${data.linhas.pctInbound}%`;
    document.getElementById('bar-linhas-out').style.width = `${data.linhas.pctOutbound}%`;
    document.getElementById('diff-linhas-texto').textContent = `Saldo Outbound - Inbound: ${fmt(data.linhas.saldo)} linhas`;

    // 3. Peças Inbound
    document.getElementById('total-pecas-in-leve').textContent = fmt(data.pecas.inbound.leve.total);
    document.getElementById('total-pecas-in-medio').textContent = fmt(data.pecas.inbound.medio.total);
    document.getElementById('total-pecas-in-pesado').textContent = fmt(data.pecas.inbound.pesado.total);
    document.getElementById('total-pecas-in-nac').textContent = fmt(data.pecas.inbound.totalNacional);
    document.getElementById('total-pecas-in-imp').textContent = fmt(data.pecas.inbound.totalImportado);
    document.getElementById('total-pecas-in-geral').textContent = fmt(data.pecas.inbound.totalGeral);

    // 3. Peças Outbound
    document.getElementById('total-pecas-out-leve').textContent = fmt(data.pecas.outbound.leve.total);
    document.getElementById('total-pecas-out-medio').textContent = fmt(data.pecas.outbound.medio.total);
    document.getElementById('total-pecas-out-pesado').textContent = fmt(data.pecas.outbound.pesado.total);
    document.getElementById('total-pecas-out-nac').textContent = fmt(data.pecas.outbound.totalNacional);
    document.getElementById('total-pecas-out-imp').textContent = fmt(data.pecas.outbound.totalImportado);
    document.getElementById('total-pecas-out-geral').textContent = fmt(data.pecas.outbound.totalGeral);

    // 4. Gestão de Pessoas (atualiza células individuais e totais)
    const rows = document.querySelectorAll('#pessoas-tbody tr');
    data.pessoas.areas.forEach((area, i) => {
      if (rows[i]) {
        rows[i].querySelector('.area-pct').textContent = area.absenteismoFormatado;
      }
    });
    document.getElementById('total-funcionarios').textContent = fmt(data.pessoas.totalFuncionarios);
    document.getElementById('total-ausentes').textContent = fmt(data.pessoas.totalAusentes);
    document.getElementById('total-absenteismo').textContent = data.pessoas.absenteismoGeralFormatado;

    // 5. Inventário
    document.getElementById('inv-pendente').textContent = fmt(data.inventario.pendente);
    document.getElementById('inv-percentual').textContent = data.inventario.percentualFormatado;
    document.getElementById('inv-progress-label').textContent = `${fmt(data.inventario.realizado)} / ${fmt(data.inventario.meta)} itens`;

    const barWidth = Math.min(100, data.inventario.percentual);
    const barEl = document.getElementById('inv-progress-bar');
    const badgeEl = document.getElementById('badge-meta-status');
    barEl.style.width = `${barWidth}%`;

    if (data.inventario.meta === 0) {
      barEl.classList.remove('goal-met');
      badgeEl.className = 'badge-neutral';
      badgeEl.textContent = 'Aguardando meta';
    } else if (data.inventario.metaAtingida) {
      barEl.classList.add('goal-met');
      badgeEl.className = 'badge-success';
      badgeEl.textContent = 'META ATINGIDA';
    } else {
      barEl.classList.remove('goal-met');
      badgeEl.className = 'badge-warning';
      badgeEl.textContent = `Pendente: ${fmt(data.inventario.pendente)}`;
    }

    // 6. KPI Cards Consolidados
    document.getElementById('kpi-linhas-in').textContent = fmt(data.linhas.inbound.total);
    document.getElementById('kpi-linhas-out').textContent = fmt(data.linhas.outbound.total);
    document.getElementById('kpi-pecas-in').textContent = fmt(data.pecas.inbound.totalGeral);
    document.getElementById('kpi-pecas-out').textContent = fmt(data.pecas.outbound.totalGeral);
    document.getElementById('kpi-funcionarios').textContent = fmt(data.pessoas.totalFuncionarios);
    document.getElementById('kpi-ausentes').textContent = fmt(data.pessoas.totalAusentes);
    document.getElementById('kpi-absenteismo').textContent = data.pessoas.absenteismoGeralFormatado;
    document.getElementById('kpi-inv-meta').textContent = fmt(data.inventario.meta);
    document.getElementById('kpi-inv-realizado').textContent = fmt(data.inventario.realizado);
    document.getElementById('kpi-inv-pct').textContent = data.inventario.percentualFormatado;

    // 7. Atualizar Gráficos
    charts.linhas.data.datasets[0].data = [data.linhas.inbound.total];
    charts.linhas.data.datasets[1].data = [data.linhas.outbound.total];
    charts.linhas.update('none');

    charts.pecasIO.data.datasets[0].data = [data.pecas.inbound.totalGeral];
    charts.pecasIO.data.datasets[1].data = [data.pecas.outbound.totalGeral];
    charts.pecasIO.update('none');

    charts.origem.data.datasets[0].data = [data.pecas.consolidado.nacional, data.pecas.consolidado.importado];
    charts.origem.update('none');

    charts.peso.data.datasets[0].data = [
      data.pecas.inbound.leve.total,
      data.pecas.inbound.medio.total,
      data.pecas.inbound.pesado.total
    ];
    charts.peso.data.datasets[1].data = [
      data.pecas.outbound.leve.total,
      data.pecas.outbound.medio.total,
      data.pecas.outbound.pesado.total
    ];
    charts.peso.update('none');

    charts.absenteismo.data.labels = data.pessoas.areas.map((a) => a.nome);
    charts.absenteismo.data.datasets[0].data = data.pessoas.areas.map((a) => a.absenteismoPct);
    charts.absenteismo.update('none');

    charts.inventario.data.datasets[0].data = [data.inventario.meta];
    charts.inventario.data.datasets[1].data = [data.inventario.realizado];
    charts.inventario.update('none');
  }

  // Salvar Rascunho no LocalStorage
  function saveDraft() {
    const data = Calculator.computeAll();
    const draftPayload = {
      ...data,
      emailPara: document.getElementById('email-para').value,
      emailCc: document.getElementById('email-cc').value,
      savedAt: new Date().toLocaleTimeString('pt-BR')
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draftPayload));
    document.getElementById('draft-status').textContent = `Rascunho salvo às ${draftPayload.savedAt}`;
    showToast('Rascunho salvo localmente com sucesso!', 'success');
  }

  // Restaurar Rascunho
  function loadDraft() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const d = JSON.parse(raw);
      if (d.identificacao.dataOperacao) document.getElementById('data-operacao').value = d.identificacao.dataOperacao;
      document.getElementById('turno').value = d.identificacao.turno || '';
      document.getElementById('unidade').value = d.identificacao.unidade || '';
      document.getElementById('responsavel').value = d.identificacao.responsavel || '';
      document.getElementById('observacoes').value = d.identificacao.observacoes || '';

      document.getElementById('linhas-in-nacional').value = d.linhas.inbound.nacional;
      document.getElementById('linhas-in-importado').value = d.linhas.inbound.importado;
      document.getElementById('linhas-out-nacional').value = d.linhas.outbound.nacional;
      document.getElementById('linhas-out-importado').value = d.linhas.outbound.importado;

      document.getElementById('pecas-in-leve-nac').value = d.pecas.inbound.leve.nacional;
      document.getElementById('pecas-in-leve-imp').value = d.pecas.inbound.leve.importado;
      document.getElementById('pecas-in-medio-nac').value = d.pecas.inbound.medio.nacional;
      document.getElementById('pecas-in-medio-imp').value = d.pecas.inbound.medio.importado;
      document.getElementById('pecas-in-pesado-nac').value = d.pecas.inbound.pesado.nacional;
      document.getElementById('pecas-in-pesado-imp').value = d.pecas.inbound.pesado.importado;

      document.getElementById('pecas-out-leve-nac').value = d.pecas.outbound.leve.nacional;
      document.getElementById('pecas-out-leve-imp').value = d.pecas.outbound.leve.importado;
      document.getElementById('pecas-out-medio-nac').value = d.pecas.outbound.medio.nacional;
      document.getElementById('pecas-out-medio-imp').value = d.pecas.outbound.medio.importado;
      document.getElementById('pecas-out-pesado-nac').value = d.pecas.outbound.pesado.nacional;
      document.getElementById('pecas-out-pesado-imp').value = d.pecas.outbound.pesado.importado;

      if (d.pessoas && d.pessoas.areas && d.pessoas.areas.length > 0) {
        const tbody = document.getElementById('pessoas-tbody');
        tbody.innerHTML = '';
        d.pessoas.areas.forEach((a) => addPessoaRow(a.nome, a.funcionarios, a.ausentes));
      }

      document.getElementById('inv-meta').value = d.inventario.meta;
      document.getElementById('inv-realizado').value = d.inventario.realizado;
      document.getElementById('email-para').value = d.emailPara || '';
      document.getElementById('email-cc').value = d.emailCc || '';

      document.getElementById('draft-status').textContent = `Rascunho restaurado (${d.savedAt})`;
    } catch (e) {
      console.error('Erro ao restaurar rascunho:', e);
    }
  }

  // Preencher Dados Demonstrativos Claramente Identificados
  function fillDemoData() {
    setDefaultDate();
    document.getElementById('turno').value = '1º Turno';
    document.getElementById('unidade').value = '[DEMO] Planta São Bernardo do Campo';
    document.getElementById('responsavel').value = '[DEMO] Analista Operacional Penske';
    document.getElementById('observacoes').value = '[DADOS DEMONSTRATIVOS] Operação regular sem intercorrências críticas.';

    document.getElementById('linhas-in-nacional').value = 145;
    document.getElementById('linhas-in-importado').value = 68;
    document.getElementById('linhas-out-nacional').value = 162;
    document.getElementById('linhas-out-importado').value = 74;

    document.getElementById('pecas-in-leve-nac').value = 1240;
    document.getElementById('pecas-in-leve-imp').value = 530;
    document.getElementById('pecas-in-medio-nac').value = 680;
    document.getElementById('pecas-in-medio-imp').value = 290;
    document.getElementById('pecas-in-pesado-nac').value = 210;
    document.getElementById('pecas-in-pesado-imp').value = 95;

    document.getElementById('pecas-out-leve-nac').value = 1390;
    document.getElementById('pecas-out-leve-imp').value = 610;
    document.getElementById('pecas-out-medio-nac').value = 720;
    document.getElementById('pecas-out-medio-imp').value = 315;
    document.getElementById('pecas-out-pesado-nac').value = 235;
    document.getElementById('pecas-out-pesado-imp').value = 110;

    const tbody = document.getElementById('pessoas-tbody');
    tbody.innerHTML = '';
    addPessoaRow('Recebimento (Inbound)', 28, 1);
    addPessoaRow('Separação & Sequenciamento (Outbound)', 45, 2);
    addPessoaRow('Inventário & Controle', 12, 0);

    document.getElementById('inv-meta').value = 350;
    document.getElementById('inv-realizado').value = 350;

    refreshAll();
    showToast('Dados demonstrativos preenchidos para visualização.', 'info');
  }

  // Abre Modal de Revisão Consolidada
  function openReviewModal() {
    const validation = Validator.validateFullReport();
    if (!validation.valid) {
      showToast(validation.errors[0], 'error');
      const firstErrorEl = document.querySelector('.input-error');
      if (firstErrorEl) firstErrorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    const data = Calculator.computeAll();
    const fmt = Calculator.formatNumber;
    const modalBody = document.getElementById('modal-revisao-conteudo');

    const areasHtml = data.pessoas.areas
      .map((a) => `<li><strong>${a.nome}:</strong> ${fmt(a.funcionarios)} func. | ${fmt(a.ausentes)} ausentes (${a.absenteismoFormatado})</li>`)
      .join('');

    modalBody.innerHTML = `
      <div class="review-block">
        <h4>1. Destinatários e Identificação</h4>
        <div class="review-grid">
          <div><strong>Para:</strong> ${validation.recipients.to.join(', ')}</div>
          <div><strong>CC:</strong> ${validation.recipients.cc.join(', ') || 'Nenhum'}</div>
          <div><strong>Data / Turno:</strong> ${data.identificacao.dataFormatada} — ${data.identificacao.turno}</div>
          <div><strong>Unidade:</strong> ${data.identificacao.unidade}</div>
          <div><strong>Responsável Penske:</strong> ${data.identificacao.responsavel}</div>
          <div><strong>Anexos:</strong> ${document.getElementById('anexar-pdf').checked ? 'PDF ' : ''}${document.getElementById('anexar-csv').checked ? 'CSV' : ''}</div>
        </div>
      </div>

      <div class="review-block">
        <h4>2. Movimentação de Linhas & Volume de Peças</h4>
        <div class="review-grid">
          <div><strong>Linhas Recebidas (Inbound):</strong> ${fmt(data.linhas.inbound.total)} (Nac: ${fmt(data.linhas.inbound.nacional)} | Imp: ${fmt(data.linhas.inbound.importado)})</div>
          <div><strong>Linhas Produzidas (Outbound):</strong> ${fmt(data.linhas.outbound.total)} (Nac: ${fmt(data.linhas.outbound.nacional)} | Imp: ${fmt(data.linhas.outbound.importado)})</div>
          <div><strong>Peças Recebidas (Inbound):</strong> ${fmt(data.pecas.inbound.totalGeral)} (Nac: ${fmt(data.pecas.inbound.totalNacional)} | Imp: ${fmt(data.pecas.inbound.totalImportado)})</div>
          <div><strong>Peças Expedidas (Outbound):</strong> ${fmt(data.pecas.outbound.totalGeral)} (Nac: ${fmt(data.pecas.outbound.totalNacional)} | Imp: ${fmt(data.pecas.outbound.totalImportado)})</div>
        </div>
      </div>

      <div class="review-block">
        <h4>3. Gestão de Pessoas & Inventário</h4>
        <div class="review-grid">
          <div><strong>Quadro Total:</strong> ${fmt(data.pessoas.totalFuncionarios)} funcionários | ${fmt(data.pessoas.totalAusentes)} ausentes</div>
          <div><strong>Absenteísmo Geral:</strong> ${data.pessoas.absenteismoGeralFormatado}</div>
          <div><strong>Inventário (Meta x Realizado):</strong> ${fmt(data.inventario.realizado)} / ${fmt(data.inventario.meta)} (${data.inventario.percentualFormatado})</div>
          <div><strong>Status Inventário:</strong> ${data.inventario.metaAtingida ? 'Meta Atingida' : `Pendente (${fmt(data.inventario.pendente)})`}</div>
        </div>
        <ul style="margin-top:8px; padding-left:18px; font-size:12.5px;">${areasHtml}</ul>
      </div>
    `;

    document.getElementById('modal-revisao').classList.remove('hidden');
  }

  // Envio Real para o Backend Node.js / Express
  async function sendReportToServer() {
    if (isSending) return;

    const validation = Validator.validateFullReport();
    if (!validation.valid) {
      showToast(validation.errors[0], 'error');
      return;
    }

    const confirmBtn = document.getElementById('btn-confirmar-envio');
    const mainBtn = document.getElementById('btn-enviar-mb');

    isSending = true;
    confirmBtn.disabled = true;
    mainBtn.disabled = true;
    confirmBtn.textContent = 'Enviando relatório...';

    try {
      const data = Calculator.computeAll();
      const includePdf = document.getElementById('anexar-pdf').checked;
      const includeCsv = document.getElementById('anexar-csv').checked;

      const payload = {
        recipients: validation.recipients,
        reportData: data,
        attachments: {
          pdfBase64: includePdf ? Exporter.getPDFBase64(data) : null,
          csvBase64: includeCsv ? Exporter.getCSVBase64(data) : null
        }
      };

      const response = await fetch('/api/send-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Falha ao enviar o relatório pelo servidor.');
      }

      document.getElementById('modal-revisao').classList.add('hidden');
      const sentBox = document.getElementById('ultimo-envio-box');
      sentBox.textContent = `Relatório enviado com sucesso para Mercedes-Benz em ${result.sentAt} (ID: ${result.messageId}).`;
      sentBox.classList.remove('hidden');

      showToast('E-mail enviado e confirmado pelo servidor com sucesso!', 'success');
    } catch (error) {
      console.error('Erro no envio:', error);
      // Mantém os dados preenchidos intactos
      showToast(`Erro no envio: ${error.message}`, 'error');
    } finally {
      isSending = false;
      confirmBtn.disabled = false;
      mainBtn.disabled = false;
      confirmBtn.innerHTML = '<i data-lucide="check-circle"></i> Confirmar e Enviar E-mail Agora';
      lucide.createIcons();
    }
  }

  // Vincular Eventos
  document.querySelectorAll('.calc-trigger').forEach((input) => {
    input.addEventListener('input', () => {
      if (input.classList.contains('int-only')) {
        Validator.sanitizeIntegerInput(input);
      }
      refreshAll();
    });
  });

  document.getElementById('btn-add-area').addEventListener('click', () => {
    addPessoaRow('', 0, 0);
    refreshAll();
  });

  document.getElementById('btn-rascunho').addEventListener('click', saveDraft);
  document.getElementById('btn-demo').addEventListener('click', fillDemoData);

  document.getElementById('btn-novo').addEventListener('click', () => {
    if (confirm('Deseja limpar todos os campos para iniciar um novo relatório? Dados não enviados serão descartados.')) {
      document.getElementById('operacoes-form').reset();
      localStorage.removeItem(STORAGE_KEY);
      setDefaultDate();
      initDefaultAreas();
      document.getElementById('draft-status').textContent = 'Novo relatório';
      document.getElementById('ultimo-envio-box').classList.add('hidden');
      refreshAll();
      showToast('Formulário reiniciado.', 'info');
    }
  });

  document.getElementById('btn-export-pdf').addEventListener('click', () => {
    const data = Calculator.computeAll();
    Exporter.downloadPDF(data);
    showToast('Relatório PDF gerado com sucesso!', 'success');
  });

  document.getElementById('btn-export-excel').addEventListener('click', () => {
    const data = Calculator.computeAll();
    Exporter.downloadExcel(data);
    showToast('Planilha Excel (.xlsx) exportada com sucesso!', 'success');
  });

  document.getElementById('btn-revisar').addEventListener('click', openReviewModal);
  document.getElementById('btn-revisar-top').addEventListener('click', openReviewModal);
  document.getElementById('btn-enviar-mb').addEventListener('click', openReviewModal);

  document.getElementById('btn-fechar-modal').addEventListener('click', () => {
    document.getElementById('modal-revisao').classList.add('hidden');
  });
  document.getElementById('btn-cancelar-envio').addEventListener('click', () => {
    document.getElementById('modal-revisao').classList.add('hidden');
  });
  document.getElementById('btn-confirmar-envio').addEventListener('click', sendReportToServer);

  // Inicialização
  setDefaultDate();
  initDefaultAreas();
  initCharts();
  loadDraft();
  refreshAll();
});