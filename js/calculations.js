/**
 * Módulo de Cálculos Automáticos e Consolidação de Indicadores
 * Operação Penske | Mercedes-Benz
 */

const Calculator = (() => {
  function toInt(val) {
    const num = parseInt(val, 10);
    return isNaN(num) || num < 0 ? 0 : num;
  }

  function formatNumber(num) {
    return Number(num || 0).toLocaleString('pt-BR');
  }

  function formatPercent(num) {
    if (!isFinite(num) || isNaN(num)) return '0,00%';
    return num.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }) + '%';
  }

  function formatDateBR(isoDate) {
    if (!isoDate) return '';
    const [y, m, d] = isoDate.split('-');
    return `${d}/${m}/${y}`;
  }

  /**
   * Coleta e calcula todos os indicadores da tela em um objeto estruturado
   */
  function computeAll() {
    // 1. Identificação
    const identificacao = {
      dataOperacao: document.getElementById('data-operacao').value,
      dataFormatada: formatDateBR(document.getElementById('data-operacao').value),
      turno: document.getElementById('turno').value.trim(),
      unidade: document.getElementById('unidade').value.trim(),
      responsavel: document.getElementById('responsavel').value.trim(),
      empresaPrestadora: 'Penske',
      cliente: 'Mercedes-Benz',
      observacoes: document.getElementById('observacoes').value.trim()
    };

    // 2. Movimentação de Linhas
    const linhasInNac = toInt(document.getElementById('linhas-in-nacional').value);
    const linhasInImp = toInt(document.getElementById('linhas-in-importado').value);
    const totalLinhasIn = linhasInNac + linhasInImp;

    const linhasOutNac = toInt(document.getElementById('linhas-out-nacional').value);
    const linhasOutImp = toInt(document.getElementById('linhas-out-importado').value);
    const totalLinhasOut = linhasOutNac + linhasOutImp;

    const somaLinhas = totalLinhasIn + totalLinhasOut;
    const pctLinhasIn = somaLinhas > 0 ? (totalLinhasIn / somaLinhas) * 100 : 50;
    const pctLinhasOut = somaLinhas > 0 ? (totalLinhasOut / somaLinhas) * 100 : 50;

    // 3. Volume de Peças - Inbound
    const inLeveNac = toInt(document.getElementById('pecas-in-leve-nac').value);
    const inLeveImp = toInt(document.getElementById('pecas-in-leve-imp').value);
    const inLeveTot = inLeveNac + inLeveImp;

    const inMedioNac = toInt(document.getElementById('pecas-in-medio-nac').value);
    const inMedioImp = toInt(document.getElementById('pecas-in-medio-imp').value);
    const inMedioTot = inMedioNac + inMedioImp;

    const inPesadoNac = toInt(document.getElementById('pecas-in-pesado-nac').value);
    const inPesadoImp = toInt(document.getElementById('pecas-in-pesado-imp').value);
    const inPesadoTot = inPesadoNac + inPesadoImp;

    const totalPecasInNac = inLeveNac + inMedioNac + inPesadoNac;
    const totalPecasInImp = inLeveImp + inMedioImp + inPesadoImp;
    const totalPecasIn = totalPecasInNac + totalPecasInImp;

    // 3. Volume de Peças - Outbound
    const outLeveNac = toInt(document.getElementById('pecas-out-leve-nac').value);
    const outLeveImp = toInt(document.getElementById('pecas-out-leve-imp').value);
    const outLeveTot = outLeveNac + outLeveImp;

    const outMedioNac = toInt(document.getElementById('pecas-out-medio-nac').value);
    const outMedioImp = toInt(document.getElementById('pecas-out-medio-imp').value);
    const outMedioTot = outMedioNac + outMedioImp;

    const outPesadoNac = toInt(document.getElementById('pecas-out-pesado-nac').value);
    const outPesadoImp = toInt(document.getElementById('pecas-out-pesado-imp').value);
    const outPesadoTot = outPesadoNac + outPesadoImp;

    const totalPecasOutNac = outLeveNac + outMedioNac + outPesadoNac;
    const totalPecasOutImp = outLeveImp + outMedioImp + outPesadoImp;
    const totalPecasOut = totalPecasOutNac + totalPecasOutImp;

    // Totais consolidados de peças por origem e peso
    const totalGeralNacional = totalPecasInNac + totalPecasOutNac;
    const totalGeralImportado = totalPecasInImp + totalPecasOutImp;
    const totalGeralLeve = inLeveTot + outLeveTot;
    const totalGeralMedio = inMedioTot + outMedioTot;
    const totalGeralPesado = inPesadoTot + outPesadoTot;

    // 4. Gestão de Pessoas & Absenteísmo
    const areas = [];
    let totalFuncionarios = 0;
    let totalAusentes = 0;

    document.querySelectorAll('#pessoas-tbody tr').forEach((row) => {
      const nome = row.querySelector('.area-nome').value.trim() || 'Área sem nome';
      const func = toInt(row.querySelector('.area-func').value);
      const aus = toInt(row.querySelector('.area-aus').value);
      const absPct = func > 0 ? (aus / func) * 100 : 0;

      totalFuncionarios += func;
      totalAusentes += aus;

      areas.push({
        nome,
        funcionarios: func,
        ausentes: aus,
        absenteismoPct: Number(absPct.toFixed(2)),
        absenteismoFormatado: formatPercent(absPct)
      });
    });

    const absenteismoGeral = totalFuncionarios > 0
      ? (totalAusentes / totalFuncionarios) * 100
      : 0;

    // 5. Controle de Inventário
    const invMeta = toInt(document.getElementById('inv-meta').value);
    const invRealizado = toInt(document.getElementById('inv-realizado').value);
    const invPendente = Math.max(0, invMeta - invRealizado);
    const invPercentual = invMeta > 0 ? (invRealizado / invMeta) * 100 : 0;
    const metaAtingida = invMeta > 0 && invRealizado >= invMeta;

    return {
      identificacao,
      linhas: {
        inbound: { nacional: linhasInNac, importado: linhasInImp, total: totalLinhasIn },
        outbound: { nacional: linhasOutNac, importado: linhasOutImp, total: totalLinhasOut },
        pctInbound: pctLinhasIn,
        pctOutbound: pctLinhasOut,
        saldo: totalLinhasOut - totalLinhasIn
      },
      pecas: {
        inbound: {
          leve: { nacional: inLeveNac, importado: inLeveImp, total: inLeveTot },
          medio: { nacional: inMedioNac, importado: inMedioImp, total: inMedioTot },
          pesado: { nacional: inPesadoNac, importado: inPesadoImp, total: inPesadoTot },
          totalNacional: totalPecasInNac,
          totalImportado: totalPecasInImp,
          totalGeral: totalPecasIn
        },
        outbound: {
          leve: { nacional: outLeveNac, importado: outLeveImp, total: outLeveTot },
          medio: { nacional: outMedioNac, importado: outMedioImp, total: outMedioTot },
          pesado: { nacional: outPesadoNac, importado: outPesadoImp, total: outPesadoTot },
          totalNacional: totalPecasOutNac,
          totalImportado: totalPecasOutImp,
          totalGeral: totalPecasOut
        },
        consolidado: {
          nacional: totalGeralNacional,
          importado: totalGeralImportado,
          leve: totalGeralLeve,
          medio: totalGeralMedio,
          pesado: totalGeralPesado
        }
      },
      pessoas: {
        areas,
        totalFuncionarios,
        totalAusentes,
        absenteismoGeral: Number(absenteismoGeral.toFixed(2)),
        absenteismoGeralFormatado: formatPercent(absenteismoGeral)
      },
      inventario: {
        meta: invMeta,
        realizado: invRealizado,
        pendente: invPendente,
        percentual: Number(invPercentual.toFixed(2)),
        percentualFormatado: formatPercent(invPercentual),
        metaAtingida
      }
    };
  }

  return {
    toInt,
    formatNumber,
    formatPercent,
    formatDateBR,
    computeAll
  };
})();