/**
 * Backend Node.js + Express para Envio Real de Relatórios por E-mail (SMTP)
 * Operação Penske | Mercedes-Benz
 */

require('dotenv').config();
const express = require('express');
const path = require('path');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(express.json({ limit: '15mb' }));
app.use(express.static(path.join(__dirname, '..')));

// Controle simples anti-duplicidade em memória (janela de 60 segundos)
const recentSubmissions = new Map();

// Configuração do Transporter SMTP via variáveis de ambiente
function createTransporter() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error('Credenciais SMTP não configuradas no arquivo .env.');
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

function fmt(num) {
  return Number(num || 0).toLocaleString('pt-BR');
}

// Monta o corpo textual padronizado exigido
function buildEmailText(data) {
  const areasList = data.pessoas.areas
    .map((a) => `   • ${a.nome}: ${fmt(a.funcionarios)} funcionários | ${fmt(a.ausentes)} ausentes (${a.absenteismoFormatado})`)
    .join('\n');

  return `Prezados,

Segue o relatório diário dos indicadores operacionais da operação Penske na Mercedes-Benz.
O relatório contempla as informações de movimentação de linhas, volume de peças Inbound e Outbound, quadro de funcionários, absenteísmo por área e controle de inventário.

Identificação da Operação:
- Data: ${data.identificacao.dataFormatada} | Turno: ${data.identificacao.turno}
- Unidade Operacional: ${data.identificacao.unidade}
- Responsável Penske: ${data.identificacao.responsavel}
- Observações: ${data.identificacao.observacoes || 'Sem observações.'}

Resumo dos indicadores:
- Linhas recebidas (Inbound): ${fmt(data.linhas.inbound.total)} (Nacional: ${fmt(data.linhas.inbound.nacional)} | Importado: ${fmt(data.linhas.inbound.importado)})
- Linhas produzidas (Outbound): ${fmt(data.linhas.outbound.total)} (Nacional: ${fmt(data.linhas.outbound.nacional)} | Importado: ${fmt(data.linhas.outbound.importado)})
- Peças recebidas (Inbound): ${fmt(data.pecas.inbound.totalGeral)} (Leve: ${fmt(data.pecas.inbound.leve.total)} | Médio: ${fmt(data.pecas.inbound.medio.total)} | Pesado: ${fmt(data.pecas.inbound.pesado.total)})
- Peças produzidas/expedidas (Outbound): ${fmt(data.pecas.outbound.totalGeral)} (Leve: ${fmt(data.pecas.outbound.leve.total)} | Médio: ${fmt(data.pecas.outbound.medio.total)} | Pesado: ${fmt(data.pecas.outbound.pesado.total)})
- Volumes nacionais e importados:
   • Inbound -> Nacional: ${fmt(data.pecas.inbound.totalNacional)} | Importado: ${fmt(data.pecas.inbound.totalImportado)}
   • Outbound -> Nacional: ${fmt(data.pecas.outbound.totalNacional)} | Importado: ${fmt(data.pecas.outbound.totalImportado)}
- Quadro de funcionários e Absenteísmo Geral: ${fmt(data.pessoas.totalFuncionarios)} funcionários | ${fmt(data.pessoas.totalAusentes)} ausentes | Absenteísmo: ${data.pessoas.absenteismoGeralFormatado}
- Absenteísmo por área:
${areasList}
- Meta e realizado de inventário: Meta: ${fmt(data.inventario.meta)} | Realizado: ${fmt(data.inventario.realizado)} | Pendente: ${fmt(data.inventario.pendente)} (${data.inventario.percentualFormatado})

Atenciosamente,
Equipe Penske.`;
}

// Monta HTML corporativo responsivo para o corpo do e-mail
function buildEmailHTML(data) {
  const areasRows = data.pessoas.areas
    .map(
      (a) => `<tr>
        <td style="padding:6px 10px;border:1px solid #cbd5e1;">${a.nome}</td>
        <td style="padding:6px 10px;border:1px solid #cbd5e1;text-align:right;">${fmt(a.funcionarios)}</td>
        <td style="padding:6px 10px;border:1px solid #cbd5e1;text-align:right;">${fmt(a.ausentes)}</td>
        <td style="padding:6px 10px;border:1px solid #cbd5e1;text-align:right;font-weight:bold;">${a.absenteismoFormatado}</td>
      </tr>`
    )
    .join('');

  return `
  <div style="font-family:Arial,sans-serif;color:#0f172a;max-width:720px;margin:0 auto;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
    <div style="background:#0a192f;color:#ffffff;padding:18px 22px;">
      <h2 style="margin:0;font-size:18px;">RELATÓRIO DIÁRIO DE OPERAÇÕES</h2>
      <p style="margin:4px 0 0;color:#93c5fd;font-size:13px;">Penske Logistics | Mercedes-Benz — ${data.identificacao.dataFormatada} (${data.identificacao.turno})</p>
    </div>
    <div style="padding:20px;">
      <p>Prezados,</p>
      <p>Segue o relatório diário dos indicadores operacionais da operação <strong>Penske</strong> na <strong>Mercedes-Benz</strong>.</p>
      
      <table style="width:100%;border-collapse:collapse;margin:14px 0;font-size:13px;">
        <tr><td style="padding:6px;background:#f1f5f9;font-weight:bold;width:35%;">Unidade Operacional</td><td style="padding:6px;border:1px solid #e2e8f0;">${data.identificacao.unidade}</td></tr>
        <tr><td style="padding:6px;background:#f1f5f9;font-weight:bold;">Responsável Penske</td><td style="padding:6px;border:1px solid #e2e8f0;">${data.identificacao.responsavel}</td></tr>
        <tr><td style="padding:6px;background:#f1f5f9;font-weight:bold;">Observações</td><td style="padding:6px;border:1px solid #e2e8f0;">${data.identificacao.observacoes || 'Sem observações.'}</td></tr>
      </table>

      <h3 style="color:#1d3557;font-size:15px;border-bottom:2px solid #e2e8f0;padding-bottom:4px;">Resumo Consolidado</h3>
      <table style="width:100%;border-collapse:collapse;margin-bottom:16px;font-size:13px;">
        <thead>
          <tr style="background:#1d3557;color:#ffffff;">
            <th style="padding:8px;text-align:left;">Indicador</th>
            <th style="padding:8px;text-align:right;">Nacional</th>
            <th style="padding:8px;text-align:right;">Importado</th>
            <th style="padding:8px;text-align:right;">Total</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding:6px 8px;border:1px solid #cbd5e1;">Linhas Recebidas (Inbound)</td>
            <td style="padding:6px 8px;border:1px solid #cbd5e1;text-align:right;">${fmt(data.linhas.inbound.nacional)}</td>
            <td style="padding:6px 8px;border:1px solid #cbd5e1;text-align:right;">${fmt(data.linhas.inbound.importado)}</td>
            <td style="padding:6px 8px;border:1px solid #cbd5e1;text-align:right;font-weight:bold;">${fmt(data.linhas.inbound.total)}</td>
          </tr>
          <tr>
            <td style="padding:6px 8px;border:1px solid #cbd5e1;">Linhas Produzidas (Outbound)</td>
            <td style="padding:6px 8px;border:1px solid #cbd5e1;text-align:right;">${fmt(data.linhas.outbound.nacional)}</td>
            <td style="padding:6px 8px;border:1px solid #cbd5e1;text-align:right;">${fmt(data.linhas.outbound.importado)}</td>
            <td style="padding:6px 8px;border:1px solid #cbd5e1;text-align:right;font-weight:bold;">${fmt(data.linhas.outbound.total)}</td>
          </tr>
          <tr>
            <td style="padding:6px 8px;border:1px solid #cbd5e1;">Peças Recebidas (Inbound)</td>
            <td style="padding:6px 8px;border:1px solid #cbd5e1;text-align:right;">${fmt(data.pecas.inbound.totalNacional)}</td>
            <td style="padding:6px 8px;border:1px solid #cbd5e1;text-align:right;">${fmt(data.pecas.inbound.totalImportado)}</td>
            <td style="padding:6px 8px;border:1px solid #cbd5e1;text-align:right;font-weight:bold;">${fmt(data.pecas.inbound.totalGeral)}</td>
          </tr>
          <tr>
            <td style="padding:6px 8px;border:1px solid #cbd5e1;">Peças Expedidas (Outbound)</td>
            <td style="padding:6px 8px;border:1px solid #cbd5e1;text-align:right;">${fmt(data.pecas.outbound.totalNacional)}</td>
            <td style="padding:6px 8px;border:1px solid #cbd5e1;text-align:right;">${fmt(data.pecas.outbound.totalImportado)}</td>
            <td style="padding:6px 8px;border:1px solid #cbd5e1;text-align:right;font-weight:bold;">${fmt(data.pecas.outbound.totalGeral)}</td>
          </tr>
        </tbody>
      </table>

      <h3 style="color:#1d3557;font-size:15px;border-bottom:2px solid #e2e8f0;padding-bottom:4px;">Gestão de Pessoas e Absenteísmo</h3>
      <table style="width:100%;border-collapse:collapse;margin-bottom:16px;font-size:13px;">
        <thead>
          <tr style="background:#1d3557;color:#ffffff;">
            <th style="padding:8px;text-align:left;">Área</th>
            <th style="padding:8px;text-align:right;">Funcionários</th>
            <th style="padding:8px;text-align:right;">Ausentes</th>
            <th style="padding:8px;text-align:right;">Absenteísmo</th>
          </tr>
        </thead>
        <tbody>
          ${areasRows}
          <tr style="background:#e0f2fe;font-weight:bold;">
            <td style="padding:6px 10px;border:1px solid #cbd5e1;">TOTAL GERAL</td>
            <td style="padding:6px 10px;border:1px solid #cbd5e1;text-align:right;">${fmt(data.pessoas.totalFuncionarios)}</td>
            <td style="padding:6px 10px;border:1px solid #cbd5e1;text-align:right;">${fmt(data.pessoas.totalAusentes)}</td>
            <td style="padding:6px 10px;border:1px solid #cbd5e1;text-align:right;">${data.pessoas.absenteismoGeralFormatado}</td>
          </tr>
        </tbody>
      </table>

      <h3 style="color:#1d3557;font-size:15px;border-bottom:2px solid #e2e8f0;padding-bottom:4px;">Controle de Inventário</h3>
      <p style="font-size:13px;">
        <strong>Meta:</strong> ${fmt(data.inventario.meta)} | 
        <strong>Realizado:</strong> ${fmt(data.inventario.realizado)} | 
        <strong>Pendente:</strong> ${fmt(data.inventario.pendente)} | 
        <strong>Atingimento:</strong> ${data.inventario.percentualFormatado}
      </p>

      <p style="margin-top:20px;">Atenciosamente,<br><strong>Equipe Penske.</strong></p>
    </div>
  </div>`;
}

// Rota Principal de Envio de E-mail
app.post('/api/send-report', async (req, res) => {
  try {
    const { recipients, reportData, attachments } = req.body;

    if (!recipients || !Array.isArray(recipients.to) || recipients.to.length === 0) {
      return res.status(400).json({ success: false, message: 'Destinatários inválidos ou não informados.' });
    }

    if (!reportData || !reportData.identificacao) {
      return res.status(400).json({ success: false, message: 'Dados do relatório ausentes.' });
    }

    // Prevenção de envio duplicado acidental (mesma data + turno + destinatários em < 60s)
    const submissionKey = `${reportData.identificacao.dataOperacao}_${reportData.identificacao.turno}_${recipients.to.join(',')}`;
    const lastTimestamp = recentSubmissions.get(submissionKey);
    if (lastTimestamp && Date.now() - lastTimestamp < 60000) {
      return res.status(429).json({
        success: false,
        message: 'Este relatório já foi enviado há menos de 1 minuto. Aguarde para evitar duplicidade.'
      });
    }

    const transporter = createTransporter();

    const mailAttachments = [];
    const dateSlug = reportData.identificacao.dataOperacao || 'operacao';

    if (attachments && attachments.pdfBase64) {
      mailAttachments.push({
        filename: `Relatorio_Operacoes_Penske_MB_${dateSlug}.pdf`,
        content: Buffer.from(attachments.pdfBase64, 'base64'),
        contentType: 'application/pdf'
      });
    }

    if (attachments && attachments.csvBase64) {
      mailAttachments.push({
        filename: `Indicadores_Penske_MB_${dateSlug}.csv`,
        content: Buffer.from(attachments.csvBase64, 'base64'),
        contentType: 'text/csv'
      });
    }

    const subject = `Relatório Diário de Operações | Penske - Mercedes-Benz | ${reportData.identificacao.dataFormatada}`;

    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: recipients.to.join(', '),
      cc: recipients.cc && recipients.cc.length > 0 ? recipients.cc.join(', ') : undefined,
      subject,
      text: buildEmailText(reportData),
      html: buildEmailHTML(reportData),
      attachments: mailAttachments
    });

    recentSubmissions.set(submissionKey, Date.now());
    const sentAt = new Date().toLocaleString('pt-BR');

    return res.status(200).json({
      success: true,
      messageId: info.messageId,
      sentAt
    });
  } catch (error) {
    console.error('[ERRO ENVIO E-MAIL]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Erro interno ao processar o envio do e-mail.'
    });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor Penske | Mercedes-Benz ativo em http://localhost:${PORT}`);
});