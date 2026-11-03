# Todo Pix Tem CPF — site com Mercado Pago

## O que tem aqui
- `public/index.html`: o site da série.
- `public/admin.html`: seu painel (abra `seusite.netlify.app/admin.html`) com a lista de quem pagou cada parte e a legenda pronta.
- `netlify/functions/`: o servidor que fala com o Mercado Pago.
  - `pix`: cria o Pix de R$ 9,90 com QR Code.
  - `status`: o site pergunta a cada 4 segundos se o Pix foi pago.
  - `webhook`: o Mercado Pago avisa quando o pagamento cai.
  - `public`: ranking do quadro e contas vendidas na parte.
  - `admin`: lista de pagantes, protegida por senha.
- Os pagamentos ficam guardados no próprio Netlify (Netlify Blobs). Nada de cartão ou dado bancário passa pelo site.

## Passo a passo (uma vez só)

### 1. Mercado Pago
1. Na sua conta do Mercado Pago, cadastre uma **chave Pix** (sem chave Pix a conta não recebe Pix pela API).
2. Entre em **mercadopago.com.br/developers** → **Suas integrações** → **Criar aplicação** (tipo: pagamentos online / Checkout API).
3. Em **Credenciais de produção**, copie o **Access Token** (começa com `APP_USR-`). Ele é secreto: não mande em público.

### 2. GitHub
1. Crie uma conta em github.com e um repositório novo chamado `todopixtemcpf` (pode ser privado).
2. Clique em **Add file → Upload files** e arraste **o conteúdo desta pasta** (as pastas `public` e `netlify` e os arquivos `netlify.toml` e `package.json`). Clique em **Commit changes**.

### 3. Netlify
1. Em app.netlify.com: **Add new site → Import an existing project → GitHub** → escolha `todopixtemcpf`. Não precisa mudar nada nas configurações de build: o `netlify.toml` já diz tudo. Clique em **Deploy**.
2. Em **Site configuration → Environment variables**, crie:
   - `MP_ACCESS_TOKEN` = o Access Token do Mercado Pago
   - `ADMIN_KEY` = uma senha só sua, para o painel
   - (opcional) `PASS_PRICE` = `9.90`
3. Vá em **Deploys → Trigger deploy → Deploy site** para ele ler as variáveis.
4. Troque o nome em **Site configuration → Change site name** para `todopixtemcpf`.

### 4. Teste
Abra o site, empreste um @ seu e pague R$ 9,90. Em poucos segundos aparece "CONTA Nº 001". Depois abra `/admin.html`, digite a senha e a parte: seu @ aparece na lista.

## A cada episódio
Mude no `public/index.html` o bloco `CONFIG` (próxima parte, horário, votação, capítulos, rastros). No GitHub, edite o arquivo ou envie o novo `index.html`: o Netlify publica sozinho em 1 minuto.
