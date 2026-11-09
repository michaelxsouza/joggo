# Joggo — protótipo v0.1

**Seu jogo. Sua comunidade.** Rede social para maiores de 18 anos que gostam de apostas esportivas, poker, roleta, slots e cassino. A Joggo **não** oferece apostas, depósitos, saques ou carteira.

> Protótipo com dados demonstrativos e persistência local (localStorage). Não há login real, backend, cobrança ou veiculação real de anúncios.

## Como executar

Requisitos: Node.js 18+.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # gera dist/ (site estático)
npm run preview    # serve o build
npm run typecheck  # checagem de tipos
```

Build em arquivo único (útil para compartilhar uma prévia): `npx vite build -c vite.preview.config.ts` → `dist-single/index.html`.

O app usa `HashRouter`, então funciona em qualquer hospedagem estática (Netlify, Vercel, S3) sem regras de rota.

## Stack

React 18 · TypeScript · Tailwind CSS 3 · Lucide · React Router 6 · Vite 5.

## Estrutura

```
src/
  types/            social.ts e ads.ts (domínios separados)
  data/seed/        dados de demonstração (social e anúncios separados)
  lib/              store persistente (localStorage protegido), utilitários, hooks
  services/
    contracts.ts      interfaces para integrações futuras (pagamento, medição, aprovação, entrega)
    socialService.ts  publicações, curtidas, comentários, comunidades, perfil, mensagens, notificações, bloqueio/denúncia
    adsService.ts     campanhas, entrega, medição simulada, revisão, administração
  components/
    ui/               Button, Modal (foco preso, Esc), Toast, Tabs, Chip, Menu, Toggle, Field…
    layout/           AppShell (3 colunas), Sidebar, RightRail, MobileHeader, BottomNav
    posts/ communities/ profile/ social/ moderation/ ads/ brand/
  pages/            Feed, Explorar, Comunidades, Perfil, Mensagens, Notificações, Configurações, Regras, Post
  pages/ads/        Painel do anunciante, editor de campanha, relatório, painel administrativo
```

A UI nunca acessa o localStorage diretamente: tudo passa por `services/*`. Para ligar um backend, substitua as implementações locais mantendo as mesmas funções/contratos.

## O que funciona localmente

- Feed com abas **Para você / Seguindo** e filtros por categoria; criar publicação (texto + imagem com pré-visualização); curtir, comentar, salvar, compartilhar link (cópia com confirmação), ocultar, denunciar, bloquear.
- Explorar: busca de pessoas, publicações e comunidades, filtros e estado vazio.
- Comunidades: entrar/sair, página com capa, regras, membros e publicações.
- Perfis: seguir, mensagem, abas de publicações e **salvos (só para o próprio usuário)**, edição de perfil com validação.
- Mensagens: lista, busca, chat com horário (identificado como demonstração).
- Notificações: lidas/não lidas e "marcar todas como lidas".
- Configurações: perfil, preferências de notificação, bloqueados, denúncias enviadas, regras, restaurar dados.
- Telas de **Entrar** (`/entrar`), **Criar conta** (`/criar-conta`, com data de nascimento 18+ e força da senha), recuperação de senha e Termos/Privacidade (`/termos`, rascunho). As rotas do app exigem sessão; "Sair da conta" fica na barra lateral e em Configurações.
  - **Modo demonstração:** qualquer e-mail/senha válidos entram no perfil de exemplo; a senha nunca é salva. "Continuar com Google" simula o login (OAuth depende de integração). Implemente `AuthProvider` em `src/services/authService.ts` com Supabase Auth para produção.
- Confirmação de idade 18+ (autodeclaração) e avisos de jogo responsável.

### Publicidade (simulada)
- Formatos: patrocinado no feed (desktop), card no feed do celular, banner lateral, anúncio temático em comunidades. Máximo de **1 anúncio a cada 6 publicações**; sem pop-ups ou áudio.
- Usuário: ocultar, denunciar e "Por que estou vendo este anúncio?". Segmentação apenas por categoria de interesse/posicionamento — nunca por perdas, depósitos ou sinais de vulnerabilidade.
- Anunciante (`/anunciar`): visão geral, criação/edição com prévia desktop/celular, posicionamentos, categorias, orçamento e datas, status (rascunho → em análise → aprovada → ativa → pausada/encerrada, ou rejeitada com motivo e reenvio), relatório com impressões, cliques, CTR e gasto **simulados**. O orçamento é limite rígido da simulação.
- Admin (`/admin`): fila de revisão com checklist (revisão específica para anúncios de apostas: elegibilidade do anunciante, público 18+, regras do território), pausar campanhas, anunciantes, espaços e preços (período/CPM/CPC), frequência, relatórios por campanha e posicionamento, denúncias.

## O que depende de backend

| Área | Necessário |
|---|---|
| Contas | Autenticação real, verificação de idade, sessões, papéis (usuário/anunciante/admin) |
| Social | API e banco para posts, comentários, follows, comunidades; upload de imagens em storage |
| Mensagens | Entrega em tempo real (WebSocket), notificações push |
| Moderação | Fila de denúncias, ações de moderadores, bloqueio sincronizado |
| Anúncios | `AdMeasurement` com eventos server-side e antifraude; `AdReviewQueue` com auditoria; `PaymentGateway` (pré-autorização e faturamento); verificação documental de anunciantes de apostas e regras por território |
| Admin | Controle de acesso — hoje o painel é aberto por ser demonstração |

## Marca

Logo e ícone em `src/assets/brand/`. O componente `Logo` preserva a proporção do arquivo e, se a imagem falhar, mostra "Joggo" em texto. Para trocar, substitua `joggo-logo.png` (ou passe `src`).
