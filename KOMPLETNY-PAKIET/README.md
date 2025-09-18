# 🛠️ HD - Baza Problemów IT

System zarządzania problemami IT z integracją Microsoft Teams.

## 🚀 **Funkcje**

- ✅ **Zgłaszanie problemów** z załącznikami
- ✅ **Wyszukiwarka** po tytułach i opisach
- ✅ **Panel administratora** z zarządzaniem
- ✅ **Instrukcje rozwiązań** ze zrzutami ekranu
- ✅ **Integracja z Microsoft Teams**
- ✅ **Zarządzanie administratorami**
- ✅ **Modal do powiększania zdjęć**

## 📱 **Microsoft Teams**

Aplikacja jest przygotowana do instalacji w Microsoft Teams jako Personal App.

**Teams package:** `teams-package/HD-Baza-Problemow-IT.zip`

## 🏗️ **Struktura projektu**

```
hd-baza-problemow/
├── backend/           # FastAPI backend
│   ├── server.py      # Główny serwer
│   └── requirements.txt
├── frontend/          # React frontend
│   ├── src/
│   │   ├── App.js     # Główny komponent
│   │   ├── index.js   # Punkt wejścia React
│   │   └── index.css  # Style Tailwind
│   ├── public/
│   │   └── index.html # Template HTML
│   └── package.json
└── teams-package/     # Microsoft Teams
    ├── manifest.json  # Teams manifest
    ├── color.png      # Ikona kolorowa
    ├── outline.png    # Ikona konturu
    └── *.zip          # Gotowy pakiet Teams
```

## 🚀 **Wdrożenie lokalne**

### **Wymagania:**
- Python 3.8+
- Node.js 16+
- MongoDB

### **Backend:**
```bash
cd backend
pip install -r requirements.txt
export MONGO_URL="mongodb://localhost:27017"
export DB_NAME="hd_problems"
python server.py
```

### **Frontend:**
```bash
cd frontend
npm install
export REACT_APP_BACKEND_URL="http://localhost:8001"
npm start
```

## ☁️ **Wdrożenie na Render.com**

Szczegółowa instrukcja w pliku: **`INSTRUKCJA-RENDER.md`**

### **Szybki start:**
1. Utwórz MongoDB Atlas (darmowe)
2. Skopiuj kod na GitHub
3. Utwórz Web Service (backend) na Render
4. Utwórz Static Site (frontend) na Render
5. Zaktualizuj Teams manifest z nową domeną

## 🔧 **Konfiguracja**

### **Zmienne środowiskowe Backend:**
- `MONGO_URL` - URL połączenia z MongoDB
- `DB_NAME` - nazwa bazy danych
- `CORS_ORIGINS` - dozwolone domeny frontend
- `PORT` - port serwera (domyślnie 8001)

### **Zmienne środowiskowe Frontend:**
- `REACT_APP_BACKEND_URL` - URL backendu

## 👥 **Administratorzy**

Domyślny administrator: `dawid.boguslaw@emerlog.eu`

Zarządzanie administratorami dostępne w aplikacji:
- Dodawanie nowych administratorów
- Usuwanie administratorów (z zabezpieczeniami)
- Historia dodawania

## 📊 **Kategorie problemów**

- 🪟 **Windows** - problemy z systemem Windows
- 🖨️ **Drukarki** - problemy z drukarkami
- 📧 **Poczta** - problemy z pocztą email
- ☁️ **OneDrive** - problemy z OneDrive
- ❓ **Inne** - pozostałe problemy

## 🔍 **Statusy problemów**

- 🆕 **Nowy** - świeżo zgłoszony problem
- ⏳ **W toku** - problem w trakcie rozwiązywania
- ✅ **Rozwiązany** - problem rozwiązany z instrukcją

## 🛡️ **Bezpieczeństwo**

- Role-based access control (user/admin)
- Walidacja danych wejściowych
- CORS protection
- SSL/HTTPS (na produkcji)

## 📄 **Licencja**

Ten projekt został stworzony dla firmy Emerlog. Wszystkie prawa zastrzeżone.

## 🆘 **Wsparcie**

W przypadku problemów lub pytań, skontaktuj się z zespołem IT.

---

**Wersja:** 1.0.0  
**Ostatnia aktualizacja:** Wrzesień 2024