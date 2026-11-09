// DADOS DE DEMONSTRAÇÃO — pessoas, comunidades e números são fictícios.
import type { SocialState, User, Community, Post, Comment, Conversation, Message, AppNotification } from '@/types/social';
import { daysAgoIso } from '@/lib/utils';
import futebol from '@/assets/demo/futebol.svg';
import poker from '@/assets/demo/poker.svg';
import roleta from '@/assets/demo/roleta.svg';
import slots from '@/assets/demo/slots.svg';
import cassino from '@/assets/demo/cassino.svg';
import basquete from '@/assets/demo/basquete.svg';
import torneio from '@/assets/demo/torneio.svg';

export const SOCIAL_VERSION = 3;
export const ME = 'u_me';

const users: User[] = [
  {
    id: ME, name: 'Lucas Andrade', handle: 'lucas.andrade',
    bio: 'Futebol no fim de semana, poker com os amigos na quinta. Aqui pra trocar ideia e conhecer gente.',
    location: 'Belo Horizonte, MG', avatarColor: '#3B5BDB', coverColor: '#1E2A22',
    interests: ['esportes', 'poker'], joinedAt: daysAgoIso(120), followers: 184, following: 3,
  },
  {
    id: 'u_ana', name: 'Ana Paula Ribeiro', handle: 'anapoker',
    bio: 'Jogadora de torneios MTT nas horas vagas. Estudo de mãos, gestão de banca e muito café.',
    location: 'São Paulo, SP', avatarColor: '#C2255C', coverColor: '#2A1E24',
    interests: ['poker'], joinedAt: daysAgoIso(300), followers: 2310, following: 412,
  },
  {
    id: 'u_bruno', name: 'Bruno Teixeira', handle: 'brunotx',
    bio: 'Analiso jogos do Brasileirão com dados. Opinião não é palpite certo — é conversa.',
    location: 'Porto Alegre, RS', avatarColor: '#2B8A3E', coverColor: '#1C2A20',
    interests: ['esportes'], joinedAt: daysAgoIso(260), followers: 5120, following: 280,
  },
  {
    id: 'u_carla', name: 'Carla Nogueira', handle: 'carlaslots',
    bio: 'Curiosa por mecânicas de slots: RTP, volatilidade e temas. Jogo pouco, leio muito.',
    location: 'Recife, PE', avatarColor: '#9C36B5', coverColor: '#251E2A',
    interests: ['slots', 'cassino'], joinedAt: daysAgoIso(180), followers: 980, following: 150,
  },
  {
    id: 'u_diego', name: 'Diego Martins', handle: 'diegoroleta',
    bio: 'Roleta europeia > americana. Gosto de história dos cassinos e de matemática de mesa.',
    location: 'Curitiba, PR', avatarColor: '#E8590C', coverColor: '#2A221C',
    interests: ['roleta', 'cassino'], joinedAt: daysAgoIso(210), followers: 640, following: 98,
  },
  {
    id: 'u_fer', name: 'Fernanda Lima', handle: 'fe.lima',
    bio: 'NBA de madrugada, vôlei de dia. Fã de estatística avançada.',
    location: 'Rio de Janeiro, RJ', avatarColor: '#1098AD', coverColor: '#1C2629',
    interests: ['esportes'], joinedAt: daysAgoIso(150), followers: 1730, following: 320,
  },
  {
    id: 'u_gui', name: 'Guilherme Souza', handle: 'guiblackjack',
    bio: 'Blackjack, estratégia básica e boas histórias de mesa. Limite definido antes de sentar.',
    location: 'Salvador, BA', avatarColor: '#5C940D', coverColor: '#1F261B',
    interests: ['cassino', 'poker'], joinedAt: daysAgoIso(90), followers: 410, following: 77,
  },
  {
    id: 'u_ju', name: 'Juliana Castro', handle: 'jucastro',
    bio: 'Organizo um home game mensal. Pergunte sobre estrutura de blinds!',
    location: 'Florianópolis, SC', avatarColor: '#D6336C', coverColor: '#2A1E23',
    interests: ['poker'], joinedAt: daysAgoIso(75), followers: 520, following: 140,
  },
  {
    id: 'u_marcos', name: 'Marcos Vieira', handle: 'marcosv',
    bio: 'Tênis, futebol e qualquer final de campeonato. Torcedor sofredor.',
    location: 'Fortaleza, CE', avatarColor: '#F08C00', coverColor: '#2A251B',
    interests: ['esportes'], joinedAt: daysAgoIso(60), followers: 300, following: 210,
  },
  {
    id: 'u_pat', name: 'Patrícia Alves', handle: 'patialves',
    bio: 'Moderadora voluntária. Jogo responsável em primeiro lugar. Cassino ao vivo e boas conversas.',
    location: 'Goiânia, GO', avatarColor: '#7048E8', coverColor: '#211E2A',
    interests: ['cassino', 'roleta', 'slots'], joinedAt: daysAgoIso(330), followers: 3020, following: 500,
  },
  {
    id: 'u_rod', name: 'Rodrigo Pires', handle: 'rodpires',
    bio: 'Futebol europeu e Champions. Faço resumos táticos semanais.',
    location: 'Campinas, SP', avatarColor: '#0B7285', coverColor: '#1B2628',
    interests: ['esportes'], joinedAt: daysAgoIso(40), followers: 860, following: 190,
  },
];

const communities: Community[] = [
  {
    id: 'c_fut', slug: 'futebol-brasileiro', name: 'Futebol Brasileiro', category: 'esportes',
    description: 'Brasileirão, Copa do Brasil e estaduais. Análises, escalações e resenha da rodada.',
    cover: futebol, baseMembers: 12840, memberIds: ['u_bruno', 'u_marcos', 'u_rod', 'u_fer'],
    rules: ['Respeite todas as torcidas.', 'Sem promessas de lucro ou "palpite garantido".', 'Proibido pedir ou oferecer dinheiro.', 'Spoilers de jogos ao vivo só no tópico do jogo.'],
    createdAt: daysAgoIso(400),
  },
  {
    id: 'c_mtt', slug: 'poker-torneios', name: 'Poker: Torneios MTT', category: 'poker',
    description: 'Estudo de mãos, estruturas de torneio, ICM e relatos de mesa final.',
    cover: torneio, baseMembers: 7420, memberIds: ['u_ana', 'u_ju', 'u_gui'],
    rules: ['Poste mãos com contexto (stacks, posição, blinds).', 'Critique a jogada, não a pessoa.', 'Sem venda de cotas, coaching pago ou divulgação de links.'],
    createdAt: daysAgoIso(380),
  },
  {
    id: 'c_rol', slug: 'roleta', name: 'Roleta: Mesas e Histórias', category: 'roleta',
    description: 'Variações de roleta, curiosidades e matemática da mesa. Sem "sistemas infalíveis".',
    cover: roleta, baseMembers: 3150, memberIds: ['u_diego', 'u_pat'],
    rules: ['Nenhum sistema garante resultado — posts assim serão removidos.', 'Seja gentil com quem está começando.', 'Jogue com responsabilidade.'],
    createdAt: daysAgoIso(300),
  },
  {
    id: 'c_slots', slug: 'slots', name: 'Slots: Lançamentos e Mecânicas', category: 'slots',
    description: 'Temas, RTP, volatilidade e novidades de provedores. Conversa, não promessa.',
    cover: slots, baseMembers: 5480, memberIds: ['u_carla', 'u_pat'],
    rules: ['Informe a fonte de dados de RTP.', 'Proibido divulgar links de afiliado.', 'Jogue com responsabilidade.'],
    createdAt: daysAgoIso(280),
  },
  {
    id: 'c_live', slug: 'cassino-ao-vivo', name: 'Cassino ao Vivo', category: 'cassino',
    description: 'Game shows, mesas ao vivo e experiências com crupiês. Relatos e dúvidas.',
    cover: cassino, baseMembers: 4210, memberIds: ['u_pat', 'u_gui', 'u_carla'],
    rules: ['Somente maiores de 18 anos.', 'Sem prints com dados pessoais.', 'Respeite os moderadores.'],
    createdAt: daysAgoIso(260),
  },
  {
    id: 'c_nba', slug: 'nba-basquete', name: 'NBA e Basquete', category: 'esportes',
    description: 'NBA, NBB e basquete universitário. Estatística, trocas e madrugadas acordadas.',
    cover: basquete, baseMembers: 6090, memberIds: ['u_fer', 'u_rod'],
    rules: ['Respeite opiniões diferentes.', 'Sem promessas de lucro.', 'Fontes para rumores de troca.'],
    createdAt: daysAgoIso(240),
  },
  {
    id: 'c_bj', slug: 'blackjack-clube', name: 'Blackjack Clube', category: 'cassino',
    description: 'Estratégia básica, variações de regras e histórias de mesa.',
    cover: cassino, baseMembers: 1980, memberIds: ['u_gui'],
    rules: ['Contagem de cartas: debate teórico apenas.', 'Seja respeitoso.', 'Jogue com responsabilidade.'],
    createdAt: daysAgoIso(150),
  },
  {
    id: 'c_home', slug: 'home-game-brasil', name: 'Home Game Brasil', category: 'poker',
    description: 'Organização de jogos entre amigos: fichas, blinds, mesas e boas regras de convivência.',
    cover: poker, baseMembers: 2640, memberIds: ['u_ju', 'u_ana', ME],
    rules: ['Encontros presenciais são de responsabilidade dos participantes.', 'Não compartilhe endereço publicamente.', 'Sem cobrança de taxas via plataforma.'],
    createdAt: daysAgoIso(120),
  },
];

const posts: Post[] = [
  { id: 'p1', authorId: 'u_bruno', communityId: 'c_fut', category: 'esportes', image: futebol, baseLikes: 214,
    text: 'Fiz um levantamento rápido: nas últimas 10 rodadas, os times que pressionam alto sofreram mais gols em contra-ataque no segundo tempo. Cansaço ou ajuste do adversário? Quero ouvir vocês.',
    createdAt: daysAgoIso(0, 1, 12) },
  { id: 'p2', authorId: 'u_ana', communityId: 'c_mtt', category: 'poker', image: poker, baseLikes: 132,
    text: 'Mão para discussão: 35 BBs, cutoff, abro com A♥K♠ e o big blind faz 3-bet para 9x. Shove ou call? Eu dei call e me arrependi no flop 9-8-7 de duas cores. Como vocês jogariam?',
    createdAt: daysAgoIso(0, 2, 40) },
  { id: 'p3', authorId: 'u_carla', communityId: 'c_slots', category: 'slots', image: slots, baseLikes: 88,
    text: 'Dúvida honesta pra galera: vocês olham volatilidade antes de experimentar um slot novo? Eu prefiro as de volatilidade baixa só pela duração da sessão — o valor é o entretenimento, não o resultado.',
    createdAt: daysAgoIso(0, 4) },
  { id: 'p4', authorId: 'u_fer', communityId: 'c_nba', category: 'esportes', image: basquete, baseLikes: 301,
    text: 'Que jogo foi esse ontem! Prorrogação dupla e o armador reserva decidindo. Alguém mais ficou acordado até as 3h? 😅',
    createdAt: daysAgoIso(0, 6) },
  { id: 'p5', authorId: 'u_diego', communityId: 'c_rol', category: 'roleta', image: roleta, baseLikes: 57,
    text: 'Curiosidade: a roleta europeia tem um único zero, a americana tem zero e duplo zero. Essa diferença muda a vantagem da casa de ~2,7% para ~5,26%. Sempre vale saber em que mesa você está.',
    createdAt: daysAgoIso(0, 9) },
  { id: 'p6', authorId: 'u_pat', category: 'cassino', baseLikes: 412,
    text: 'Lembrete de domingo 💚 Antes de qualquer sessão: defina tempo e limite, faça pausas e nunca tente "recuperar". Se o jogo deixou de ser diversão, converse com alguém e procure ajuda. A comunidade está aqui pra isso também.',
    createdAt: daysAgoIso(0, 12) },
  { id: 'p7', authorId: 'u_ju', communityId: 'c_home', category: 'poker', baseLikes: 76,
    text: 'Estrutura que estou testando no home game: fichas iniciais de 10k, níveis de 20 min, blinds 50/100 → 75/150 → 100/200 com ante a partir do 4º nível. Termina em ~4h com 9 pessoas. Sugestões?',
    createdAt: daysAgoIso(1, 2) },
  { id: 'p8', authorId: 'u_rod', category: 'esportes', baseLikes: 145,
    text: 'Resumo tático da Champions: o 3-2-5 na saída de bola virou padrão entre os quatro primeiros colocados de cada grupo. Vou postar o fio completo amanhã com os mapas de calor.',
    createdAt: daysAgoIso(1, 5) },
  { id: 'p9', authorId: 'u_gui', communityId: 'c_bj', category: 'cassino', image: cassino, baseLikes: 64,
    text: 'Pergunta pra quem joga blackjack: vocês preferem mesas com dealer parando no soft 17? Na prática percebo pouca diferença, mas a matemática diz que é melhor para o jogador.',
    createdAt: daysAgoIso(1, 8) },
  { id: 'p10', authorId: 'u_marcos', category: 'esportes', baseLikes: 39,
    text: 'Final de ATP 250 neste domingo e eu aqui torcendo pelo saque-e-voleio voltar à moda. Alguém mais sente falta?',
    createdAt: daysAgoIso(1, 11) },
  { id: 'p11', authorId: ME, communityId: 'c_home', category: 'poker', baseLikes: 18,
    text: 'Primeira vez organizando um home game aqui em BH. Comprei um kit de fichas e já percebi que vou precisar de mais fichas de valor baixo. Dicas de distribuição?',
    createdAt: daysAgoIso(2, 1) },
  { id: 'p12', authorId: 'u_ana', category: 'poker', image: torneio, baseLikes: 260,
    text: 'Cheguei na mesa final de um torneio online de domingo! Terminei em 6º. O que mais me ajudou foi revisar spots de ICM durante a semana. Obrigada a quem comentou minhas mãos aqui 🙏',
    createdAt: daysAgoIso(2, 6) },
  { id: 'p13', authorId: 'u_carla', category: 'slots', baseLikes: 41,
    text: 'Lançamentos com tema de mitologia nórdica estão em alta. Gosto da arte, mas os bônus estão cada vez mais parecidos. Qual foi a última mecânica que achou realmente nova?',
    createdAt: daysAgoIso(3, 2) },
  { id: 'p14', authorId: 'u_pat', communityId: 'c_live', category: 'cassino', baseLikes: 95,
    text: 'Para quem está chegando agora no cassino ao vivo: leia as regras da mesa antes, confira limites mínimos e máximos e lembre que o chat da mesa é público. Educação com os crupiês, sempre!',
    createdAt: daysAgoIso(3, 7) },
  { id: 'p15', authorId: 'u_bruno', category: 'esportes', baseLikes: 178,
    text: 'Enquete de opinião (sem palpite!): quem vocês acham que tem o elenco mais equilibrado para o returno? Respondam nos comentários com argumento.',
    createdAt: daysAgoIso(4, 3) },
  { id: 'p16', authorId: 'u_diego', category: 'roleta', baseLikes: 33,
    text: 'Visitei um cassino em Montevidéu nas férias e a roleta francesa com "la partage" foi uma experiência à parte. Alguém já jogou essa variação?',
    createdAt: daysAgoIso(5, 4) },
  { id: 'p17', authorId: 'u_fer', category: 'esportes', baseLikes: 120,
    text: 'Estatística que gosto: true shooting % conta muito mais sobre eficiência do que pontos por jogo. Vou montar um comparativo dos armadores da temporada.',
    createdAt: daysAgoIso(6, 1) },
  { id: 'p18', authorId: 'u_gui', category: 'poker', baseLikes: 22,
    text: 'Alguém indica livros de poker em português para iniciantes? Quero entender ranges de abertura sem decorar tabela.',
    createdAt: daysAgoIso(7, 2) },
];

const comments: Comment[] = [
  { id: 'cm1', postId: 'p1', authorId: 'u_rod', text: 'Acho que é ajuste do adversário. Os técnicos estão abrindo mão da posse no 2º tempo de propósito.', createdAt: daysAgoIso(0, 0, 50) },
  { id: 'cm2', postId: 'p1', authorId: 'u_marcos', text: 'Calendário também pesa demais, quarta e domingo sem parar.', createdAt: daysAgoIso(0, 0, 30) },
  { id: 'cm3', postId: 'p2', authorId: 'u_ju', text: 'Com 35bb eu acho o shove bem padrão contra 3-bet do BB. O call te deixa em spot ruim fora de posição... ops, você estava em posição. Ainda assim, shove.', createdAt: daysAgoIso(0, 2) },
  { id: 'cm4', postId: 'p2', authorId: 'u_gui', text: 'Depende muito da leitura do vilão. Se ele 3-beta largo, o call é ok.', createdAt: daysAgoIso(0, 1, 40) },
  { id: 'cm5', postId: 'p3', authorId: 'u_pat', text: 'Mesma coisa! Volatilidade baixa + limite de tempo = sessão tranquila.', createdAt: daysAgoIso(0, 3) },
  { id: 'cm6', postId: 'p4', authorId: ME, text: 'Fiquei! Valeu cada minuto de sono perdido.', createdAt: daysAgoIso(0, 5) },
  { id: 'cm7', postId: 'p5', authorId: 'u_carla', text: 'Não sabia que a diferença era tão grande. Valeu pela explicação!', createdAt: daysAgoIso(0, 8) },
  { id: 'cm8', postId: 'p6', authorId: 'u_ana', text: 'Sempre importante lembrar. Obrigada, Pati.', createdAt: daysAgoIso(0, 11) },
  { id: 'cm9', postId: 'p7', authorId: 'u_ana', text: 'Eu colocaria ante um nível antes. Fica mais dinâmico no meio do torneio.', createdAt: daysAgoIso(1, 1) },
  { id: 'cm10', postId: 'p11', authorId: 'u_ju', text: 'Para 9 pessoas com 10k: 8 fichas de 25, 8 de 100, 6 de 500 e 4 de 1000 por jogador. Funciona bem!', createdAt: daysAgoIso(1, 20) },
  { id: 'cm11', postId: 'p12', authorId: 'u_ju', text: 'Parabéns!! Merecido demais.', createdAt: daysAgoIso(2, 4) },
  { id: 'cm12', postId: 'p18', authorId: 'u_ana', text: 'Te mando algumas indicações por mensagem!', createdAt: daysAgoIso(6, 22) },
];

const conversations: Conversation[] = [
  { id: 'cv1', participantId: 'u_ju', updatedAt: daysAgoIso(0, 0, 25), unread: 2 },
  { id: 'cv2', participantId: 'u_bruno', updatedAt: daysAgoIso(0, 3), unread: 0 },
  { id: 'cv3', participantId: 'u_ana', updatedAt: daysAgoIso(1, 4), unread: 0 },
  { id: 'cv4', participantId: 'u_pat', updatedAt: daysAgoIso(4, 2), unread: 0 },
];

const messages: Message[] = [
  { id: 'm1', conversationId: 'cv1', authorId: ME, text: 'Oi Ju! Vi sua estrutura de blinds, posso usar no meu home game?', createdAt: daysAgoIso(0, 1, 10) },
  { id: 'm2', conversationId: 'cv1', authorId: 'u_ju', text: 'Claro! Só ajusta o tempo de nível se tiver menos gente.', createdAt: daysAgoIso(0, 0, 40) },
  { id: 'm3', conversationId: 'cv1', authorId: 'u_ju', text: 'Se quiser, te mando a planilha de distribuição de fichas.', createdAt: daysAgoIso(0, 0, 25) },
  { id: 'm4', conversationId: 'cv2', authorId: 'u_bruno', text: 'Valeu por compartilhar o post da rodada!', createdAt: daysAgoIso(0, 3, 30) },
  { id: 'm5', conversationId: 'cv2', authorId: ME, text: 'Imagina, análise muito boa. Vai fazer live no clássico?', createdAt: daysAgoIso(0, 3, 10) },
  { id: 'm6', conversationId: 'cv2', authorId: 'u_bruno', text: 'Vou sim, domingo depois do jogo.', createdAt: daysAgoIso(0, 3) },
  { id: 'm7', conversationId: 'cv3', authorId: 'u_ana', text: 'Oi Lucas, bem-vindo à comunidade de torneios!', createdAt: daysAgoIso(1, 5) },
  { id: 'm8', conversationId: 'cv3', authorId: ME, text: 'Obrigado! Aprendendo muito com os posts de mãos.', createdAt: daysAgoIso(1, 4) },
  { id: 'm9', conversationId: 'cv4', authorId: 'u_pat', text: 'Oi! Sou moderadora do Cassino ao Vivo. Qualquer dúvida sobre as regras, é só chamar.', createdAt: daysAgoIso(4, 2) },
];

const notifications: AppNotification[] = [
  { id: 'n1', type: 'like', actorId: 'u_ju', postId: 'p11', text: 'curtiu sua publicação sobre home game.', createdAt: daysAgoIso(0, 0, 20), read: false },
  { id: 'n2', type: 'comment', actorId: 'u_ju', postId: 'p11', text: 'comentou: "Para 9 pessoas com 10k: 8 fichas de 25..."', createdAt: daysAgoIso(0, 1), read: false },
  { id: 'n3', type: 'follow', actorId: 'u_fer', text: 'começou a seguir você.', createdAt: daysAgoIso(0, 3), read: false },
  { id: 'n4', type: 'like', actorId: 'u_ana', postId: 'p11', text: 'curtiu sua publicação sobre home game.', createdAt: daysAgoIso(0, 6), read: true },
  { id: 'n5', type: 'community', communityId: 'c_mtt', text: 'Nova discussão em Poker: Torneios MTT que pode te interessar.', createdAt: daysAgoIso(1, 0), read: true },
  { id: 'n6', type: 'follow', actorId: 'u_marcos', text: 'começou a seguir você.', createdAt: daysAgoIso(1, 6), read: true },
  { id: 'n7', type: 'comment', actorId: 'u_ana', postId: 'p18', text: 'respondeu em uma publicação que você comentou.', createdAt: daysAgoIso(2, 2), read: true },
  { id: 'n8', type: 'system', text: 'Bem-vindo à Joggo! Leia as regras da comunidade e configure suas preferências.', createdAt: daysAgoIso(3, 0), read: true },
];

export function seedSocial(): SocialState {
  return {
    version: SOCIAL_VERSION,
    currentUserId: ME,
    users,
    posts,
    comments,
    communities,
    likedPostIds: ['p4', 'p6'],
    savedPostIds: ['p2'],
    hiddenPostIds: [],
    followingIds: ['u_ana', 'u_bruno', 'u_ju'],
    joinedCommunityIds: ['c_home', 'c_mtt', 'c_fut'],
    blockedUserIds: [],
    reports: [],
    conversations,
    messages,
    notifications,
    notificationPrefs: { likes: true, comments: true, follows: true, messages: true, communities: true, emailDigest: false },
  };
}
