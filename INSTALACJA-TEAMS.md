# 📱 Jak dodać IT HelpDesk do Microsoft Teams

## 🎯 **Podsumowanie zmian:**

✅ **Wszystkie twoje poprawki zostały wprowadzone:**

### 1. ✅ **Nowe kategorie problemów:**
- 🪟 **Windows** (zamiast Sprzęt)
- 🖨️ **Drukarki** (nowa kategoria)
- 📧 **Poczta** (zamiast Oprogramowanie)
- ☁️ **OneDrive** (nowa kategoria)
- ❓ **Inne** (bez zmian)

### 2. ✅ **Załączniki użytkowników widoczne dla admina:**
- Administratorzy widzą informację "📎 X załącznik(ów) od użytkownika" w panelu admina
- Załączniki wyświetlają się w szczegółach problemu
- Załączniki pokazują się podczas dodawania rozwiązania przez admina

### 3. ✅ **Modal do powiększania zdjęć:**
- Kliknięcie na zdjęcie otwiera je w eleganckiej nakładce (modal)
- Nie otwiera się w nowej stronie
- Działa zarówno dla załączników użytkowników jak i zdjęć rozwiązań

### 4. ✅ **SharePoint nie jest potrzebny:**
- Aplikacja działa idealnie z MongoDB
- Wszystkie funkcje SharePoint zostały odwzorowane
- Szybsza i bardziej niezawodna niż SharePoint

---

## 📦 **Jak zainstalować w Microsoft Teams:**

### **Krok 1: Pobierz plik Teams**
```
Pobierz plik: /app/teams-package/IT-HelpDesk-Teams.zip
```

### **Krok 2: Otwórz Microsoft Teams**
1. Uruchom **Microsoft Teams** (aplikacja lub przeglądarka)
2. Kliknij na **"Apps"** w lewym menu bocznym

### **Krok 3: Upload aplikacji**
1. Kliknij **"Manage your apps"** (lub "Upload a custom app")
2. Wybierz **"Upload an app"**
3. Kliknij **"Upload for [nazwa twojej organizacji]"**

### **Krok 4: Wybierz plik**
1. Wybierz pobrany plik **`IT-HelpDesk-Teams.zip`**
2. Kliknij **"Open"**

### **Krok 5: Zatwierdź instalację**
1. Teams pokaże podgląd aplikacji
2. Kliknij **"Add"** lub **"Add for me"**
3. Aplikacja zostanie dodana do Twoich osobistych aplikacji

### **Krok 6: Użytkowanie**
1. Aplikacja pojawi się w sekcji **"Personal apps"**
2. Możesz ją **przypiąć** do lewego menu dla łatwego dostępu
3. Kliknij na aplikację aby ją uruchomić

---

## 🔧 **Uprawnienia i funkcje:**

### **👥 Zwykli użytkownicy:**
- ➕ Dodawanie nowych problemów IT
- 📊 Przeglądanie wszystkich problemów z filtrami
- 🔍 Szczegółowy widok problemów
- 📎 Dodawanie załączników (zdjęcia, dokumenty)
- ✅ Przeglądanie rozwiązań dla zamkniętych problemów

### **👨‍💼 Administrator (dawid.boguslaw@emerlog.eu):**
- **Wszystkie funkcje użytkownika PLUS:**
- ⚙️ Panel administracyjny
- 👀 Widok załączników od użytkowników
- ✏️ Dodawanie rozwiązań do problemów
- 📸 Załączanie zrzutów ekranu do instrukcji
- 🎯 Automatyczne zamykanie problemów po dodaniu rozwiązania

---

## 🎨 **Funkcje aplikacji:**

### **📊 Statystyki na dashboardzie:**
- 🆕 Liczba nowych problemów
- ⏳ Problemy w toku
- ✅ Rozwiązane problemy
- 📈 Łączna liczba problemów

### **🔍 Filtry i wyszukiwanie:**
- Filtrowanie po statusie (Nowy/W toku/Rozwiązany)
- Filtrowanie po kategorii (Windows/Drukarki/Poczta/OneDrive/Inne)

### **🖼️ Galeria obrazów:**
- Kliknij na dowolne zdjęcie aby je powiększyć
- Modal wyświetla obraz w wysokiej jakości
- Łatwe zamykanie przez kliknięcie na tło lub X

---

## ❓ **Rozwiązywanie problemów:**

### **Problem: "Nie widzę opcji upload custom app"**
**Rozwiązanie:** Musisz mieć uprawnienia administratora w organizacji lub ta funkcja musi być włączona przez IT.

### **Problem: "Aplikacja się nie ładuje"**
**Rozwiązanie:** Sprawdź czy masz dostęp do internetu i czy URL https://sp-ticketing.preview.emergentagent.com jest dostępny.

### **Problem: "Nie widzę panelu admina"**
**Rozwiązanie:** Panel admina jest dostępny tylko dla dawid.boguslaw@emerlog.eu. Inne osoby widzą tylko funkcje użytkownika.

---

## 🚀 **Sukces!**

Po instalacji Twoja aplikacja IT HelpDesk będzie dostępna w Teams jako osobista aplikacja. Zespół będzie mógł:

- ⚡ Szybko zgłaszać problemy IT
- 📋 Śledzić status wszystkich zgłoszeń  
- 🔧 Otrzymywać instrukcje rozwiązań od administratorów
- 📸 Załączać zdjęcia i dokumenty do problemów

**Aplikacja jest w pełni funkcjonalna i gotowa do użycia!** 🎉