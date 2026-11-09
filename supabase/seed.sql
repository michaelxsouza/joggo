-- Comunidades iniciais da Joggo
insert into public.communities (slug, name, category, description, rules) values
('bilhete-do-dia','Bilhete do Dia','esportes','Poste seu bilhete, marque green ou red e acompanhe quem mais acerta.', array['Poste só bilhetes com odd e mercado','Marque o resultado com honestidade','Proibido vender tips ou pedir Pix']),
('futebol-brasileiro','Futebol Brasileiro','esportes','Brasileirão, Copa do Brasil e Libertadores: análises e palpites.', array['Respeite todas as torcidas','Sem links de casas de aposta','Nada de promessa de ganho']),
('futebol-europeu','Champions e Europa','esportes','Champions League e as principais ligas europeias.', array['Respeite todas as torcidas','Sem links de casas de aposta']),
('nba-basquete','NBA e Basquete','esportes','Jogos, props e discussões sobre basquete.', array['Respeite todos','Sem links de casas de aposta']),
('poker','Poker','poker','Mãos, torneios e estratégia.', array['Sem venda de cursos ou cotas','Respeite todos']),
('cassino','Cassino e Roleta','cassino','Cassino ao vivo, roleta e slots — com jogo responsável.', array['Sem promessa de ganho ou "sinais" pagos','Jogue com responsabilidade']);
