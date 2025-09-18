# 🔧 Konfiguracja Zmiennych Środowiskowych

## Backend (.env)

Skopiuj plik `backend/.env.example` do `backend/.env` i skonfiguruj:

### MongoDB
```env
# MongoDB Atlas (darmowy tier):
MONGO_URL=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority

# Lub MongoDB lokalne:
MONGO_URL=mongodb://localhost:27017

# Nazwa bazy danych
DB_NAME=hd_problems_db
```

### Administrator
```env
# Email administratora - ten użytkownik będzie miał uprawnienia admina
ADMIN_EMAIL=twoj.email@twoja-firma.pl
```

### CORS
```env
# Dla produkcji: wstaw domenę frontendu
# Dla developmentu: można zostawić *
CORS_ORIGINS=*
```

---

## Frontend (.env)

Skopiuj plik `frontend/.env.example` do `frontend/.env` i skonfiguruj:

### Backend URL
```env
# URL gdzie hostowany jest backend
# Przykład dla Render.com:
REACT_APP_BACKEND_URL=https://twoja-nazwa-backend.onrender.com

# Przykład dla lokalnego developmentu:
REACT_APP_BACKEND_URL=http://localhost:8001
```

### Demo User
```env
# Email demo użytkownika (dla testów poza Teams)
# MUSI być taki sam jak ADMIN_EMAIL w backend
REACT_APP_DEMO_ADMIN_EMAIL=twoj.email@twoja-firma.pl
```

### WebSocket
```env
# Dla Render.com i większości hostingów zostaw:
WDS_SOCKET_PORT=443
```

---

## Teams Manifest

W pliku `teams-package/manifest.json` zastąp:

### URLs
```json
{
  "staticTabs": [
    {
      "contentUrl": "https://TWOJ-FRONTEND.onrender.com",
      "websiteUrl": "https://TWOJ-FRONTEND.onrender.com"
    }
  ],
  "validDomains": [
    "TWOJ-FRONTEND.onrender.com"
  ]
}
```

### Company Info
```json
{
  "packageName": "com.twoja-firma.hd.problems",
  "developer": {
    "name": "Twoja Firma IT Team",
    "websiteUrl": "https://twoja-domena.pl",
    "privacyUrl": "https://twoja-domena.pl",
    "termsOfUseUrl": "https://twoja-domena.pl"
  }
}
```

---

## Sprawdzenie Konfiguracji

### 1. Test Backend
```bash
curl https://twoj-backend.onrender.com/api/
# Powinna zwrócić: {"message": "HD - Baza Problemów IT API is running"}
```

### 2. Test Frontend
Otwórz `https://twoj-frontend.onrender.com` w przeglądarce

### 3. Test Połączenia
Sprawdź czy frontend łączy się z backendem (Network tab w F12)

### 4. Test Administratora
Sprawdź czy Twój email ma uprawnienia admina:
```bash
curl https://twoj-backend.onrender.com/api/check-admin/twoj.email@firma.pl
# Powinna zwrócić: {"is_admin": true}
```