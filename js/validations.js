/**
 * Módulo de Validações e Regras de Negócio
 * Operação Penske | Mercedes-Benz
 */

const Validator = (() => {
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  /**
   * Sanitiza inputs numéricos em tempo real (apenas inteiros >= 0)
   */
  function sanitizeIntegerInput(input) {
    let raw = input.value;
    if (raw === '') return;
    let parsed = parseInt(raw, 10);
    if (isNaN(parsed) || parsed < 0) {
      input.value = 0;
    } else {
      input.value = parsed;
    }
  }

  /**
   * Valida se ausentes <= funcionários em cada área
   */
  function validatePessoasRows() {
    let valid = true;
    const errorEl = document.getElementById('pessoas-error-msg');
    let messages = [];

    document.querySelectorAll('#pessoas-tbody tr').forEach((row, idx) => {
      const funcInput = row.querySelector('.area-func');
      const ausInput = row.querySelector('.area-aus');
      const nomeInput = row.querySelector('.area-nome');

      funcInput.classList.remove('input-error');
      ausInput.classList.remove('input-error');
      nomeInput.classList.remove('input-error');

      const func = parseInt(funcInput.value, 10) || 0;
      const aus = parseInt(ausInput.value, 10) || 0;
      const nome = nomeInput.value.trim();

      if (!nome) {
        nomeInput.classList.add('input-error');
        messages.push(`Informe o nome da área na linha ${idx + 1}.`);
        valid = false;
      }

      if (aus > func) {
        ausInput.classList.add('input-error');
        messages.push(`Na área "${nome || idx + 1}", o número de ausentes (${aus}) não pode ser superior ao total de funcionários (${func}).`);
        valid = false;
      }
    });

    if (!valid) {
      errorEl.textContent = messages[0];
      errorEl.classList.remove('hidden');
    } else {
      errorEl.textContent = '';
      errorEl.classList.add('hidden');
    }

    return { valid, messages };
  }

  /**
   * Valida lista de e-mails separados por vírgula
   */
  function parseAndValidateEmails(rawStr, required = false) {
    const cleaned = (rawStr || '').trim();
    if (!cleaned) {
      return {
        valid: !required,
        emails: [],
        error: required ? 'Informe pelo menos um e-mail destinatário da Mercedes-Benz.' : null
      };
    }

    const list = cleaned
      .split(',')
      .map((e) => e.trim())
      .filter((e) => e.length > 0);

    if (list.length === 0 && required) {
      return {
        valid: false,
        emails: [],
        error: 'Informe pelo menos um e-mail destinatário válido.'
      };
    }

    for (const email of list) {
      if (!EMAIL_REGEX.test(email)) {
        return {
          valid: false,
          emails: [],
          error: `E-mail inválido detectado: "${email}".`
        };
      }
    }

    return { valid: true, emails: list, error: null };
  }

  /**
   * Validação completa do formulário antes da revisão ou envio
   */
  function validateFullReport() {
    const errors = [];

    // Limpar marcações anteriores
    document.querySelectorAll('.input-error').forEach((el) => el.classList.remove('input-error'));

    // Campos obrigatórios de identificação
    const requiredFields = [
      { id: 'data-operacao', label: 'Data da Operação' },
      { id: 'turno', label: 'Turno' },
      { id: 'unidade', label: 'Unidade Operacional' },
      { id: 'responsavel', label: 'Responsável pelo Preenchimento' }
    ];

    requiredFields.forEach((f) => {
      const el = document.getElementById(f.id);
      if (!el.value || !el.value.trim()) {
        el.classList.add('input-error');
        errors.push(`O campo "${f.label}" é obrigatório.`);
      }
    });

    // Verificar números negativos ou inválidos em todo o formulário
    document.querySelectorAll('input[type="number"]').forEach((inp) => {
      if (inp.value === '' || Number(inp.value) < 0 || !Number.isInteger(Number(inp.value))) {
        inp.classList.add('input-error');
        errors.push('Todos os campos numéricos devem conter números inteiros iguais ou superiores a zero.');
      }
    });

    // Validar Gestão de Pessoas
    const pessoasCheck = validatePessoasRows();
    if (!pessoasCheck.valid) {
      errors.push(...pessoasCheck.messages);
    }

    // Validar E-mails Destinatários
    const paraInput = document.getElementById('email-para');
    const ccInput = document.getElementById('email-cc');
    const paraCheck = parseAndValidateEmails(paraInput.value, true);
    const ccCheck = parseAndValidateEmails(ccInput.value, false);

    if (!paraCheck.valid) {
      paraInput.classList.add('input-error');
      errors.push(paraCheck.error);
    }
    if (!ccCheck.valid) {
      ccInput.classList.add('input-error');
      errors.push(ccCheck.error);
    }

    // Remover duplicatas de mensagens
    const uniqueErrors = [...new Set(errors)];

    return {
      valid: uniqueErrors.length === 0,
      errors: uniqueErrors,
      recipients: {
        to: paraCheck.emails,
        cc: ccCheck.emails
      }
    };
  }

  return {
    sanitizeIntegerInput,
    validatePessoasRows,
    parseAndValidateEmails,
    validateFullReport
  };
})();