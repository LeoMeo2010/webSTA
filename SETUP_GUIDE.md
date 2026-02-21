# 🚀 Guida completa — KotlinEval

Guida passo-passo per configurare e mettere online il sito da zero.

---

## 📋 Cosa ti serve prima di iniziare

- Un account **GitHub** (gratuito) → [github.com](https://github.com)
- Un account **Supabase** (gratuito) → [supabase.com](https://supabase.com)
- Un account **Netlify** (gratuito) → [netlify.com](https://netlify.com)
- **Node.js 18+** installato sul tuo computer → [nodejs.org](https://nodejs.org)
- Un editor di codice (consigliato: **VS Code**)

---

## FASE 1 — Configurazione Supabase

### 1.1 Crea il progetto

1. Vai su [supabase.com](https://supabase.com) → clicca **"New project"**
2. Scegli un nome (es. `kotlineval`) e una password sicura per il database
3. Seleziona la regione più vicina (es. `Europe West`)
4. Aspetta ~2 minuti che il progetto si avvii

### 1.2 Crea il database

1. Nel pannello Supabase, clicca su **"SQL Editor"** nel menu a sinistra
2. Clicca su **"New query"**
3. Copia e incolla **tutto** il contenuto del file `supabase/migrations/001_schema.sql`
4. Clicca **"Run"** (o premi `Ctrl+Enter`)
5. Dovresti vedere `Success. No rows returned` → il database è pronto

### 1.3 Configura l'autenticazione

1. Nel menu a sinistra, vai su **Authentication → Providers**
2. Assicurati che **Email** sia abilitato (dovrebbe esserlo di default)
3. Vai su **Authentication → Email Templates** e personalizza le email se vuoi
4. (Opzionale) In **Authentication → Settings** puoi disabilitare "Confirm email" durante lo sviluppo per semplicità

### 1.4 Prendi le chiavi API

1. Nel menu a sinistra, vai su **Settings → API**
2. Copia e salva:
   - **Project URL** → è il tuo `VITE_SUPABASE_URL`
   - **anon/public key** → è il tuo `VITE_SUPABASE_ANON_KEY`
   
   ⚠️ Non usare mai la `service_role` key nel frontend!

---

## FASE 2 — Setup del progetto in locale

### 2.1 Scarica il codice

```bash
# Opzione A: se hai già creato una repo GitHub (consigliato)
git clone https://github.com/tuo-username/kotlineval.git
cd kotlineval

# Opzione B: crea una nuova cartella e copia i file del progetto
mkdir kotlineval && cd kotlineval
```

### 2.2 Installa le dipendenze

```bash
npm install
```

Questo installa automaticamente React, Supabase, Monaco Editor e tutto il necessario.

### 2.3 Crea il file .env

Nella cartella principale del progetto, crea un file chiamato **`.env`** (non `.env.example`) e inserisci:

```
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Sostituisci i valori con quelli copiati al punto 1.4.

### 2.4 Avvia il server di sviluppo

```bash
npm run dev
```

Apri il browser su **http://localhost:5173** — dovresti vedere la pagina di login.

---

## FASE 3 — Creare il primo account Admin

### 3.1 Registrati

1. Vai su `http://localhost:5173/register`
2. Inserisci il tuo nome, email e password
3. Se hai lasciato la conferma email attiva, controlla la casella e clicca il link

### 3.2 Promuovi l'account ad Admin

Di default tutti gli utenti registrati sono `student`. Devi promuovere il tuo account ad `admin` manualmente:

1. Vai su Supabase → **SQL Editor**
2. Prima trova il tuo UUID:
   ```sql
   SELECT id, full_name, email FROM auth.users;
   ```
3. Poi promuovilo:
   ```sql
   UPDATE public.profiles 
   SET role = 'admin' 
   WHERE id = 'incolla-qui-il-tuo-uuid';
   ```
4. Ricarica la pagina → ora vedrai la Dashboard Admin

---

## FASE 4 — Pubblicare su Netlify

### 4.1 Pubblica il codice su GitHub

```bash
# Se non l'hai ancora fatto:
git init
git add .
git commit -m "Initial commit — KotlinEval"

# Crea una repo su github.com, poi:
git remote add origin https://github.com/tuo-username/kotlineval.git
git branch -M main
git push -u origin main
```

### 4.2 Collega Netlify a GitHub

1. Vai su [netlify.com](https://netlify.com) → **"Add new site" → "Import an existing project"**
2. Scegli **GitHub** e autorizza Netlify
3. Seleziona la repo `kotlineval`
4. Netlify rileva automaticamente le impostazioni dal `netlify.toml`:
   - Build command: `npm run build`
   - Publish directory: `dist`
5. Clicca **"Deploy site"** (il primo deploy fallirà perché mancano le variabili d'ambiente)

### 4.3 Aggiungi le variabili d'ambiente su Netlify

1. Nel pannello Netlify del tuo sito, vai su **Site settings → Environment variables**
2. Clicca **"Add a variable"** e aggiungi:

   | Key | Value |
   |-----|-------|
   | `VITE_SUPABASE_URL` | `https://xxxxxxxxxxxx.supabase.co` |
   | `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |

3. Vai su **Deploys → Trigger deploy → Deploy site**
4. Aspetta 1-2 minuti → il sito è online!

### 4.4 Configura il dominio personalizzato (opzionale)

1. In Netlify → **Site settings → Domain management**
2. Clicca **"Add custom domain"** e segui le istruzioni

---

## FASE 5 — Configurazione Supabase per il dominio di produzione

### 5.1 Aggiorna i redirect URL

Quando usi l'autenticazione via email, Supabase ha bisogno di sapere qual è il tuo dominio:

1. Vai su Supabase → **Authentication → URL Configuration**
2. In **"Site URL"** inserisci il tuo dominio Netlify (es. `https://kotlineval.netlify.app`)
3. In **"Redirect URLs"** aggiungi:
   - `https://kotlineval.netlify.app/**`
   - `http://localhost:5173/**` (per lo sviluppo locale)

---

## 📂 Struttura dei file

```
kotlineval/
├── index.html                    # Entry point HTML
├── netlify.toml                  # Configurazione Netlify
├── package.json                  # Dipendenze npm
├── vite.config.ts                # Configurazione Vite
├── tsconfig.json                 # Configurazione TypeScript
├── tailwind.config.js            # Configurazione Tailwind CSS
├── .env                          # ⚠️ Non committare mai questo file!
├── .env.example                  # Template variabili d'ambiente
├── supabase/
│   └── migrations/
│       └── 001_schema.sql        # Schema completo del database
└── src/
    ├── main.tsx                  # Entry point React
    ├── App.tsx                   # Router principale
    ├── index.css                 # Stili globali
    ├── types/
    │   └── index.ts              # TypeScript interfaces
    ├── lib/
    │   └── supabase.ts           # Client Supabase
    ├── hooks/
    │   └── useAuth.ts            # Hook autenticazione
    ├── components/
    │   └── shared/
    │       ├── Layout.tsx        # Navbar + layout
    │       └── ui.tsx            # Componenti riutilizzabili
    └── pages/
        ├── LoginPage.tsx
        ├── RegisterPage.tsx
        ├── admin/
        │   ├── AdminDashboard.tsx      # Statistiche e azioni rapide
        │   ├── AdminExercises.tsx      # Lista esercizi con CRUD
        │   ├── AdminExerciseForm.tsx   # ⭐ Crea/modifica esercizio + criteri
        │   ├── AdminSubmissions.tsx    # Lista invii degli studenti
        │   └── AdminGrade.tsx          # ⭐ Valuta con punteggi per criterio
        └── student/
            ├── StudentDashboard.tsx    # Lista esercizi disponibili
            ├── StudentExercise.tsx     # Editor + invio codice
            └── StudentGrades.tsx       # ⭐ Voti con breakdown per criterio
```

---

## 🔄 Flusso d'uso quotidiano

### Admin — Creare un esercizio

1. Accedi come admin → **Esercizi → Nuovo esercizio**
2. Compila titolo, descrizione, difficoltà e scadenza
3. Aggiungi i **criteri di valutazione** con i punti massimi per ciascuno
   - Esempio: "Correttezza logica" → 10pt, "Pulizia del codice" → 8pt, "Test completi" → 12pt
   - Il totale viene calcolato in automatico
4. Spunta **"Pubblica subito"** o lasciala come bozza
5. Clicca **"Crea esercizio"**

### Student — Svolgere un esercizio

1. Accede → vede la lista esercizi con il totale punti di ciascuno
2. Clicca su un esercizio → legge la descrizione e i criteri di valutazione
3. Scrive il codice nell'editor Monaco (Main.kt e MainTest.kt)
4. Clicca **"Invia codice"**

### Admin — Valutare un invio

1. Dashboard → **Invii → "Da valutare"**
2. Clicca **"Valuta"** sull'invio
3. Legge il codice dello studente nell'editor (read-only, con syntax highlight)
4. Per ogni criterio, usa lo slider o digita il punteggio
5. Aggiunge un commento di feedback
6. Clicca **"Salva valutazione"** → lo studente vede immediatamente il risultato

### Student — Vedere i voti

1. **I miei voti** → lista degli esercizi valutati
2. Per ogni esercizio: punteggio totale, barra di avanzamento, dettaglio per criterio, commento del docente

---

## 🛠 Operazioni amministrative utili

### Aggiungere un nuovo admin
```sql
UPDATE public.profiles SET role = 'admin' WHERE id = 'uuid-utente';
```

### Vedere tutti gli utenti e i loro ruoli
```sql
SELECT p.full_name, u.email, p.role, p.created_at 
FROM public.profiles p 
JOIN auth.users u ON u.id = p.id
ORDER BY p.created_at DESC;
```

### Statistiche sugli invii
```sql
SELECT 
  e.title,
  count(s.id) as total_submissions,
  count(case when s.status = 'graded' then 1 end) as graded,
  round(avg(g.total_score), 1) as avg_score
FROM exercises e
LEFT JOIN submissions s ON s.exercise_id = e.id
LEFT JOIN grades g ON g.submission_id = s.id
GROUP BY e.id, e.title;
```

### Reimpostare il codice di uno studente (se necessario)
```sql
UPDATE submissions SET status = 'pending' WHERE id = 'uuid-submission';
```

---

## ❓ Problemi comuni

| Problema | Soluzione |
|----------|-----------|
| "Missing Supabase environment variables" | Controlla che `.env` esista e abbia i valori corretti |
| Login non funziona | Verifica l'email in Supabase Auth → Users |
| Admin vede pagina student | Esegui la query SQL per promuovere l'utente ad admin |
| Deploy Netlify fallisce | Controlla le variabili d'ambiente nel pannello Netlify |
| RLS: "new row violates policy" | Verifica di essere autenticato e che le policy siano attive |
| Monaco Editor lento | È normale al primo caricamento, poi è in cache |

---

## 📦 Dipendenze principali

| Pacchetto | Versione | Scopo |
|-----------|----------|-------|
| `react` | 18 | UI library |
| `react-router-dom` | 6 | Routing SPA |
| `@supabase/supabase-js` | 2 | Client database + auth |
| `@monaco-editor/react` | 4 | Editor di codice con syntax highlight |
| `vite` | 5 | Build tool |
| `typescript` | 5 | Type safety |
| `tailwindcss` | 3 | Utility CSS |

---

*Guida generata per KotlinEval — Piattaforma di valutazione codice Kotlin*
