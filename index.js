const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

// ============================================================
//  MENU E RESPOSTAS DE RH — edite aqui as suas perguntas!
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

Em caso de dúvidas sobre descontos ou valores, entre em contato com o RH pelo e-mail: rh@empresa.com.br

_Digite 0 para voltar ao menu._`,

  '3': `🏥 *Plano de Saúde*

A empresa oferece plano de saúde com coparticipação. A mensalidade é descontada em folha.

📌 Dependentes podem ser incluídos mediante solicitação ao RH em até *30 dias* após a contratação ou nascimento/casamento.

Para segunda via do cartão ou dúvidas sobre cobertura, acesse o site da operadora ou ligue: *0800 000 0000*

_Digite 0 para voltar ao menu._`,

  '4': `🚌 *Vale-Transporte*

O vale-transporte é creditado no último dia útil do mês para uso no mês seguinte.

📌 O desconto em folha é de *6%* do salário bruto ou o valor total do benefício, o que for menor.

Para alterar sua linha de transporte ou valor, envie a solicitação ao RH até o dia *20* do mês atual.

_Digite 0 para voltar ao menu._`,

  '5': `⏱️ *Banco de Horas*

As horas extras realizadas são registradas no banco de horas e podem ser compensadas em folgas.

📌 O prazo para compensação é de *6 meses* a partir do registro da hora extra.

Consulte seu saldo de banco de horas no ponto eletrônico ou solicite ao RH.

_Digite 0 para voltar ao menu._`,

  '6': `📋 *Rescisão e Aviso Prévio*

O aviso prévio é de *30 dias*, podendo ser trabalhado ou indenizado.

📌 Em caso de demissão sem justa causa, você tem direito a: saldo de salário, férias proporcionais + 1/3, 13º proporcional, FGTS + multa de 40% e seguro-desemprego (se elegível).

Para iniciar o processo, agende uma reunião com o RH pelo e-mail: rh@empresa.com.br

_Digite 0 para voltar ao menu._`,

  '7': `🕐 *Ponto Eletrônico*

O registro de ponto deve ser feito no início e fim de cada turno, e também no intervalo de almoço.

📌 Esqueceu de bater o ponto? Solicite a correção ao seu gestor em até *48 horas*.

Para acesso ao sistema de ponto, use seu CPF como login e sua matrícula como senha inicial.

_Digite 0 para voltar ao menu._`,
};

// ============================================================
//  CONFIGURAÇÃO DO BOT — não precisa mexer aqui
// ============================================================

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-gpu'
    ],
  }
});

// Mostra o QR code no terminal para você escanear
client.on('qr', (qr) => {
  console.log('\n📱 Escaneie o QR code abaixo com seu WhatsApp:\n');
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  console.log('\n✅ Bot conectado e rodando! Pode enviar uma mensagem para testar.\n');
});

client.on('message', async (msg) => {
  // Ignora mensagens de grupos
  if (msg.from.includes('@g.us')) return;

  const texto = msg.body.trim().toLowerCase();

  // Palavras que abrem o menu
  const abreMenu = ['oi', 'olá', 'ola', 'oi!', 'olá!', 'menu', 'ajuda', 'help', '0', 'inicio', 'início'];

  if (abreMenu.includes(texto)) {
    await msg.reply(MENU);
    return;
  }

  // Verifica se digitou um número do menu
  if (RESPOSTAS[texto]) {
    await msg.reply(RESPOSTAS[texto]);
    return;
  }

  // Resposta padrão para mensagens não reconhecidas
  await msg.reply(`Não entendi sua mensagem. 😅\n\nDigite *oi* para ver o menu de opções do RH.`);
});

client.initialize();
