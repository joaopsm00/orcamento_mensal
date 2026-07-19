# Orçamento — app com login e banco de dados (100% grátis)

Este projeto tem: tela de login/cadastro com senha, e todos os dados
salvos num banco de dados de verdade (Postgres via Supabase). Cada
pessoa que criar uma conta só vê os próprios dados.

Stack usada (planos gratuitos, sem cartão de crédito):
- **Supabase** — banco de dados + autenticação
- **Vercel** — hospedagem do site (link público)

---

## Passo 1 — Criar o banco de dados (Supabase)

1. Crie uma conta grátis em **https://supabase.com** (dá pra entrar com GitHub).
2. Clique em **New project**. Dê um nome (ex: `orcamento`) e uma senha
   pro banco (guarde essa senha, mas você não vai precisar dela no dia a dia).
3. Espere uns 2 minutos o projeto ser criado.
4. No menu lateral, abra **SQL Editor** → **New query**.
5. Abra o arquivo `supabase_schema.sql` (está junto com este projeto),
   copie todo o conteúdo, cole no editor e clique em **Run**.
   Isso cria as tabelas e já configura a segurança (cada usuário só
   acessa os próprios dados).
6. No menu lateral, vá em **Project Settings → API**. Copie dois valores:
   - **Project URL**
   - **anon public key**

## Passo 2 — Configurar o projeto localmente

1. Extraia esses arquivos numa pasta no seu computador.
2. Renomeie o arquivo `.env.example` para `.env`.
3. Abra o `.env` e cole os dois valores do Supabase:
   ```
   VITE_SUPABASE_URL=https://seu-projeto.supabase.co
   VITE_SUPABASE_ANON_KEY=sua-chave-aqui
   ```
4. Instale o Node.js (https://nodejs.org) se ainda não tiver.
5. Abra um terminal na pasta do projeto e rode:
   ```
   npm install
   npm run dev
   ```
6. Acesse **http://localhost:5173** — crie uma conta e teste tudo antes de publicar.

   Por padrão o Supabase pede confirmação por e-mail ao criar conta.
   Pra testar rápido sem configurar e-mail, você pode desativar isso em
   **Authentication → Providers → Email → Confirm email** (desligue a opção).

## Passo 3 — Publicar de graça (Vercel)

1. Crie uma conta grátis em **https://vercel.com** (dá pra entrar com GitHub).
2. Suba esta pasta pra um repositório no GitHub (crie um repositório novo
   e faça o upload dos arquivos, ou use `git push` se souber Git).
3. Na Vercel, clique em **Add New → Project**, escolha o repositório.
4. Antes de publicar, clique em **Environment Variables** e adicione as
   mesmas duas variáveis do `.env`:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Clique em **Deploy**. Em ~1 minuto você recebe um link público
   (tipo `orcamento-jp.vercel.app`) que qualquer pessoa pode acessar
   pra criar conta e usar.

---

## O que já está pronto

- Login e cadastro com e-mail/senha (Supabase Auth)
- Receita, Despesa Fixa e Despesa Variável — por mês, reseta a cada mês
- Investimentos com rentabilidade (% ao mês ou ao ano) — acumulado, não reseta
- Reserva de emergência com meta e aportes — acumulado, não reseta
- Cada pessoa só vê seus próprios dados (isolado por conta)
- Mobile-first com carrossel de páginas; desktop com abas estáticas

## Limites do plano grátis (mais que suficiente pra uso pessoal)

- Supabase grátis: até 500MB de banco, 50.000 usuários ativos/mês
- Vercel grátis: 100GB de tráfego/mês

Se algum dia isso crescer muito, os dois têm planos pagos — mas pra uso
pessoal ou familiar, o grátis nunca vai apertar.
