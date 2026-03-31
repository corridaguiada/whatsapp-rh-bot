const makeWASocket = require('@whiskeysockets/baileys').default;
const { useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');

// ============================================================
//  MENU E RESPOSTAS DE RH
// ============================================================

const MENU = `👋 Olá! Bem-vindo ao *RH da Empresa*.

Como posso te ajudar? Digite o *número* da sua dúvida:

1️⃣ Férias e folgas
2️⃣ Holerite e pagamento
3️⃣ Plano de saúde
4️⃣ Vale-transporte
5️⃣ Banco de horas
6️⃣ Rescisão e aviso prévio
7️⃣ Ponto eletrônico

Digite *0* a qualquer momento para voltar ao menu.`;

const RESPOSTAS = {
  '1': `🏖️ *Férias e Folgas*

As férias são concedidas após 12 meses de trabalho (período aquisitivo). Você tem direito a 30 dias corridos.

📌 As férias podem ser divididas em até 3 períodos, sendo que um deles não pode ser inferior a 14 dias.

Para agendar suas férias, fale com seu gestor com pelo menos *30 dias de antecedência*.

_Digite 0 para voltar ao menu._`,

  '2': `💰 *Holerite e Pagamento*

O pagamento é realizado todo dia *5* de cada mês. Se cair em fim de semana ou feriado, será antecipado para o dia útil anterior.

📌 Seu holerite fica disponível no portal RH Online até o dia 3 do mês seguinte.

Em caso de dúvidas, entre em contato: rh@empresa.com.br

_Digite 0 para voltar ao menu._`,

  '3': `🏥 *Plano de Saúde*

A empresa oferece plano de saúde com coparticipação. A mensalidade é descontada em folha.

📌 Dependentes podem ser incluídos em até *30 dias* após contratação ou nascimento/casamento.

Para dúvidas sobre cobertura, ligue: *0800 000 0000*

_Digite 0 para voltar ao menu._`,

  '4': `🚌 *Vale-Transporte*

O vale-transporte é creditado no último dia útil do mês para uso no mês seguinte.

📌 O desconto em folha é de *6%* do salário bruto ou o valor total do benefício, o que for menor.

Para alterar sua linha, envie solicitação ao RH até o dia *20* do mês.

_Digite 0 para voltar ao menu._`,

  '5': `⏱️ *Banco de Horas*

As horas extras são registradas no banco de horas e podem ser compensadas em folgas.

📌 O prazo para compensação é de *6 meses* a partir do registro.

Consulte seu saldo no ponto eletrônico ou solicite ao RH.

_Digite 0 para voltar ao menu._`,

  '6': `📋 *Rescisão e Aviso Prévio*

O aviso prévio é de *30 dias*, podendo ser trabalhado ou indenizado.

📌 Direitos em demissão sem justa causa: saldo de salário, férias proporcionais + 1/3, 13º proporcional, FGTS + multa de 40% e seguro-desemprego.

Para iniciar o processo: rh@empresa.com.br

_Digite 0 para voltar ao menu._`,

  '7': `🕐 *Ponto Eletrônico*

O registro de ponto deve ser feito no início e fim de cada turno e no intervalo de almoço.

📌 Esqueceu de bater o ponto? Solicite a correção ao seu gestor em até *48 horas*.

Login: seu CPF | Senha inicial: sua matrícula.

_Digite 0 para voltar ao menu._`,
};

// ============================================================
//  LÓGICA DO BOT
// ============================================================

const AUTH_FOLDER = 'auth_info';
const abreMenu = ['oi', 'olá', 'ola', 'oi!', 'olá!', 'menu', 'ajuda', 'help', '0', 'inicio', 'início'];

// Apaga sessão antiga para forçar novo QR code
function limparSessao() {
  if (fs.existsSync(AUTH_FOLDER)) {
    fs.rmSync(AUTH_FOLDER, { recursive: true, force: true });
    console.log('🗑️ Sessão antiga removida. Gerando novo QR code...\n');
  }
}

async function conectar(primeiraVez = false) {
  if (primeiraVez) limparSessao();

  const { state, saveCreds } = await useMultiFileAuthState(AUTH_FOLDER);

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    logger: require('pino')({ level: 'silent' }),
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log('\n======================================================');
      console.log('📱 ESCANEIE O QR CODE ABAIXO COM SEU WHATSAPP:');
      console.log('======================================================\n');
      qrcode.generate(qr, { small: true });
      console.log('\n======================================================\n');
    }

    if (connection === 'close') {
      const statusCode = new Boom(lastDisconnect?.error)?.output?.statusCode;
      const loggedOut = statusCode === DisconnectReason.loggedOut;

      if (loggedOut) {
        console.log('🔄 Sessão encerrada. Gerando novo QR code...');
        conectar(true);
      } else {
        console.log('🔄 Conexão perdida. Reconectando...');
        conectar(false);
      }
    }

    if (connection === 'open') {
      console.log('\n✅ Bot conectado e rodando 24/7!\n');
    }
  });

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message || msg.key.fromMe) return;
    if (msg.key.remoteJid.includes('@g.us')) return;

    const texto = (
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      ''
    ).trim().toLowerCase();

    const jid = msg.key.remoteJid;

    if (abreMenu.includes(texto)) {
      await sock.sendMessage(jid, { text: MENU });
      return;
    }

    if (RESPOSTAS[texto]) {
      await sock.sendMessage(jid, { text: RESPOSTAS[texto] });
      return;
    }

    await sock.sendMessage(jid, {
      text: 'Não entendi sua mensagem. 😅\n\nDigite *oi* para ver o menu de opções do RH.'
    });
  });
}

// Inicia sempre limpando sessão antiga
conectar(true);
