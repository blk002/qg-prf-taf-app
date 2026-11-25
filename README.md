# QG da PRF • TAF (App Android + Google AI Studio)

Aplicativo oficial de preparação física para o **TAF da Polícia Rodoviária Federal (PRF)**, construído em **React + Vite + TypeScript + Tailwind CSS + Capacitor Android** para permitir edição visual ao vivo no **Google AI Studio**, geração automática de **APK Android** no GitHub Actions e sincronização em tempo real com o site **QG da PRF** (`blk002/qgdaPRFWILSON`) via **Supabase**.

---

## Como editar o visual no Google AI Studio
1. Conecte este repositório no **Google AI Studio Build** (via GitHub).
2. Edite livremente qualquer tela em `src/screens/` ou componente em `src/components/`.
3. Faça o commit/push das alterações para a branch **`main`**.

---

## Como gerar o APK automaticamente no GitHub
A cada push na branch `main`, o workflow `.github/workflows/build-apk.yml` compila o frontend e gera o arquivo `app-debug.apk`:

1. No repositório do GitHub, vá em **Settings → Secrets and variables → Actions → New repository secret** e adicione:
   - `VITE_SUPABASE_URL` — mesma URL do Supabase usada no site do QG da PRF
   - `VITE_SUPABASE_ANON_KEY` — mesma Anon Key usada no site do QG da PRF
2. Após qualquer alteração enviada para `main`, abra a aba **Actions** → último workflow **Build Android APK** → baixe o artifact **`qg-prf-taf-apk`**.

---

## Sincronização com o QG da PRF (Supabase)
- O app usa as mesmas RPCs seguras (`get_taf_sync_payload` e `sync_taf_payload` em `supabase/taf_sync_rpc.sql`) já instaladas no Supabase do QG.
- Os treinos planejados e concluídos (corrida Jack Daniels + força estilo Lyfta) são sincronizados automaticamente na aba **Rotina de Vida** do site e os simulados aparecem na aba **Treino TAF**.
