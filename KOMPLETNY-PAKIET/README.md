# 🎯 HD - Baza Problemów IT

**Kompleksowy system zgłaszania i rozwiązywania problemów IT zintegrowany z Microsoft Teams**

## 📋 Opis

Aplikacja webowa do zarządzania problemami IT w organizacji z możliwością:
- Zgłaszania problemów przez użytkowników
- Zarządzania rozwiązaniami przez administratorów
- Wyszukiwania w bazie problemów
- Integracji z Microsoft Teams jako Personal App

## 🏗️ Architektura

- **Frontend:** React.js + Tailwind CSS
- **Backend:** FastAPI (Python)
- **Baza danych:** MongoDB
- **Integracja:** Microsoft Teams SDK

## 📁 Struktura Projektu

```
├── backend/                 # FastAPI backend
│   ├── server.py           # Główna aplikacja
│   ├── requirements.txt    # Zależności Python
│   └── .env.example       # Przykład konfiguracji
├── frontend/               # React frontend
│   ├── src/               # Kod źródłowy
│   ├── public/            # Pliki statyczne
│   ├── package.json       # Zależności Node.js
│   └── .env.example       # Przykład konfiguracji
├── teams-package/          # Pakiet Microsoft Teams
│   ├── manifest.json      # Manifest aplikacji Teams
│   ├── color.png          # Ikona kolorowa
│   └── outline.png        # Ikona konturu
└── INSTRUKCJA-GITHUB-RENDER.md  # Instrukcja hostingu
```

## 🚀 Szybki Start

### 1. Konfiguracja
1. Skopiuj `.env.example` do `.env` w folderach `backend` i `frontend`
2. Uzupełnij zmienne środowiskowe (szczegóły w `KONFIGURACJA-ZMIENNYCH.md`)

### 2. Hosting (DARMOWY)
Następuj instrukcjom w `INSTRUKCJA-GITHUB-RENDER.md` dla hostingu na:
- MongoDB Atlas (darmowy tier)
- Render.com (darmowy plan)
- GitHub (darmowe repozytoria)

### 3. Teams Integration
1. Skonfiguruj `teams-package/manifest.json`
2. Zapakuj do ZIP
3. Zainstaluj w Microsoft Teams

## ✨ Funkcje

### Dla Użytkowników
- 📝 Zgłaszanie problemów z załącznikami
- 🔍 Wyszukiwanie w bazie problemów
- 📋 Filtrowanie według kategorii i statusu
- 👀 Przeglądanie rozwiązań

### Dla Administratorów
- ✅ Dodawanie rozwiązań z obrazami
- 👥 Zarządzanie administratorami
- 🗑️ Usuwanie problemów i rozwiązań
- 📊 Pełny dostęp do systemu

### Kategorie Problemów
- **Windows** - Problemy z systemem Windows
- **Drukarki** - Problemy z drukarkami
- **Poczta** - Problemy z pocztą elektroniczną  
- **OneDrive** - Problemy z OneDrive
- **Inne** - Pozostałe problemy IT

## 🔧 Rozwój Lokalny

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn server:app --reload --host 0.0.0.0 --port 8001
```

### Frontend
```bash
cd frontend
yarn install
yarn start
```

## 📞 Wsparcie

W przypadku problemów sprawdź:
1. `KONFIGURACJA-ZMIENNYCH.md` - konfiguracja środowiska
2. `INSTRUKCJA-GITHUB-RENDER.md` - hosting i deployment
3. Logi aplikacji w dashboard hostingu

## 📄 Licencja

Projekt stworzony dla potrzeb wewnętrznych organizacji.