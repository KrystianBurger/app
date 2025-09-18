# 🚀 Instrukcja Hostingu Za Darmo: GitHub + Render.com

## Przygotowanie kodu

### 1. Skonfiguruj zmienne środowiskowe

#### Backend (.env)
Skopiuj plik `backend/.env.example` do `backend/.env` i uzupełnij:

```env
# MongoDB Atlas (DARMOWY TIER 512MB)
MONGO_URL=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
DB_NAME=hd_problems_db

# Twój email administratora
ADMIN_EMAIL=twoj.email@twoja-firma.pl

# CORS
CORS_ORIGINS=*
```

#### Frontend (.env)
Skopiuj plik `frontend/.env.example` do `frontend/.env` i uzupełnij:

```env
# URL backendu (dostaniesz po wdrożeniu na Render.com)
REACT_APP_BACKEND_URL=https://twoja-nazwa-backend.onrender.com

# Email demo administratora (taki sam jak w backend)
REACT_APP_DEMO_ADMIN_EMAIL=twoj.email@twoja-firma.pl

WDS_SOCKET_PORT=443
```

### 2. Aktualizuj Teams Manifest
W pliku `teams-package/manifest.json` zastąp:
- `TWOJA-DOMENA-APLIKACJI.onrender.com` → URL frontendu z Render.com
- `com.twoja-firma.hd.problems` → unikalny package name
- `https://twoja-domena.pl` → URL Twojej firmy

---

## Krok 1: MongoDB Atlas (Darmowa Baza Danych)

### 1.1. Załóż konto
1. Idź na [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Kliknij "Try Free"
3. Załóż konto z emailem

### 1.2. Stwórz klaster
1. Wybierz plan **FREE** (M0 Sandbox)
2. Wybierz region (najlepiej najbliższy Europie)
3. Nazwij klaster (np. "hd-problems")
4. Kliknij "Create Cluster"

### 1.3. Skonfiguruj dostęp
1. **Database Access:**
   - Kliknij "Database Access" w menu
   - "Add New Database User"
   - Username: `hduser` (lub dowolny)
   - Password: wygeneruj silne hasło
   - Role: "Read and write to any database"
   - Zapisz username i password!

2. **Network Access:**
   - Kliknij "Network Access"
   - "Add IP Address"
   - Wybierz "Allow access from anywhere" (0.0.0.0/0)
   - Potwierdź

### 1.4. Pobierz Connection String
1. Kliknij "Connect" przy klastrze
2. Wybierz "Connect your application"
3. Driver: Node.js, Version: 4.1 or later
4. Skopiuj connection string
5. Zastąp `<username>` i `<password>` swoimi danymi

---

## Krok 2: GitHub Repository

### 2.1. Stwórz repository
1. Idź na [GitHub](https://github.com)
2. Kliknij "New repository"
3. Nazwa: `hd-problemy-it` (lub dowolna)
4. **WAŻNE:** Ustaw jako **Public** (Render.com free wymaga public repo)
5. Kliknij "Create repository"

### 2.2. Wgraj kod
Skopiuj wszystkie pliki z `KOMPLETNY-PAKIET` do swojego repozytorium:

```
twoje-repo/
├── backend/
│   ├── server.py
│   ├── requirements.txt
│   └── .env
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── .env
└── teams-package/
    ├── manifest.json
    ├── color.png
    └── outline.png
```

**UWAGA:** Dodaj `.env` do `.gitignore` jeśli planujesz udostępnić kod publicznie!

---

## Krok 3: Render.com - Backend (API)

### 3.1. Załóż konto
1. Idź na [Render.com](https://render.com)
2. Kliknij "Get Started" i połącz z GitHub

### 3.2. Wdróż Backend
1. Kliknij "New +" → "Web Service"
2. Wybierz swoje repository
3. **Konfiguracja:**
   - **Name:** `hd-problems-backend` (lub dowolna)
   - **Root Directory:** `backend`
   - **Environment:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn server:app --host 0.0.0.0 --port $PORT`

### 3.3. Ustaw zmienne środowiskowe
W sekcji "Environment Variables" dodaj:

| Key | Value |
|-----|--------|
| `MONGO_URL` | Twój MongoDB Atlas connection string |
| `DB_NAME` | `hd_problems_db` |
| `ADMIN_EMAIL` | Twój email administratora |
| `CORS_ORIGINS` | `*` |

### 3.4. Deploy
1. Kliknij "Create Web Service"
2. Poczekaj na deployment (3-5 min)
3. **Zapisz URL backendu** (np. `https://hd-problems-backend.onrender.com`)

---

## Krok 4: Render.com - Frontend

### 4.1. Wdróż Frontend
1. Kliknij "New +" → "Static Site"
2. Wybierz swoje repository
3. **Konfiguracja:**
   - **Name:** `hd-problems-frontend`
   - **Root Directory:** `frontend`
   - **Build Command:** `yarn install && yarn build`
   - **Publish Directory:** `build`

### 4.2. Ustaw zmienne środowiskowe
W sekcji "Environment Variables" dodaj:

| Key | Value |
|-----|--------|
| `REACT_APP_BACKEND_URL` | URL backendu z kroku 3.4 |
| `REACT_APP_DEMO_ADMIN_EMAIL` | Twój email administratora |

### 4.3. Deploy
1. Kliknij "Create Static Site"
2. Poczekaj na deployment (3-5 min)
3. **Zapisz URL frontendu** (np. `https://hd-problems-frontend.onrender.com`)

---

## Krok 5: Konfiguracja Teams

### 5.1. Aktualizuj manifest
W pliku `teams-package/manifest.json` zastąp wszystkie wystąpienia:
- `TWOJA-DOMENA-APLIKACJI.onrender.com` → URL frontendu z kroku 4.3

### 5.2. Stwórz pakiet Teams
1. Spakuj do ZIP wszystkie pliki z folderu `teams-package`:
   - `manifest.json`
   - `color.png`
   - `outline.png`
2. Nazwij plik: `HD-Problemy-IT.zip`

### 5.3. Zainstaluj w Teams
1. Otwórz Microsoft Teams
2. Idź do "Apps" (po lewej stronie)
3. Kliknij "Manage your apps"
4. "Upload an app" → "Upload a custom app"
5. Wybierz plik `HD-Problemy-IT.zip`
6. Kliknij "Add"

---

## ✅ Gotowe!

Twoja aplikacja jest teraz dostępna:
- **Frontend:** https://twoj-frontend.onrender.com
- **Backend API:** https://twoj-backend.onrender.com
- **Teams App:** Zainstalowana w Teams

### Kosze na miesiąc (DARMOWE):
- MongoDB Atlas: 512MB (wystarczy na ~1000+ problemów)
- Render.com: 750h/miesiąc (wystarczy na cały miesiąc)
- GitHub: Unlimited public repositories

---

## 🔧 Rozwiązywanie problemów

### Backend nie startuje
```bash
# Sprawdź logi w Render.com dashboard
# Najczęstsze przyczyny:
# 1. Błędny MONGO_URL
# 2. Brak zmiennych środowiskowych
# 3. Błąd w requirements.txt
```

### Frontend nie łączy się z backendem
```bash
# Sprawdź:
# 1. Czy REACT_APP_BACKEND_URL jest poprawny
# 2. Czy backend jest uruchomiony
# 3. Czy CORS_ORIGINS jest ustawiony na "*"
```

### Teams nie ładuje aplikacji
```bash
# Sprawdź:
# 1. Czy URL w manifest.json są poprawne
# 2. Czy domena jest w validDomains
# 3. Czy aplikacja ładuje się w przeglądarce
```

### Baza danych nie działa
```bash
# MongoDB Atlas:
# 1. Sprawdź czy IP 0.0.0.0/0 jest w Network Access
# 2. Sprawdź czy user ma uprawnienia do zapisu
# 3. Sprawdź czy connection string jest poprawny
```

---

## 📞 Wsparcie

Jeśli masz problemy:
1. Sprawdź logi w Render.com dashboard
2. Sprawdź Network tab w przeglądarce (F12)
3. Sprawdź czy wszystkie URL-e są poprawne