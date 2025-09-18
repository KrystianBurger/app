# 🌐 Jak zmienić domenę z emergent.sh na własną

## 🎯 **Dlaczego warto mieć własną domenę?**

- ✅ **Pełna kontrola** nad aplikacją
- ✅ **Własny branding** - twoja-firma.com/helpdesk
- ✅ **Niezależność** od zewnętrznych dostawców
- ✅ **Dostosowanie do polityki IT** firmy
- ✅ **SSL certyfikat** na własnej domenie

---

## 🚀 **Opcja 1: Szybkie przeniesienie (Rekomendowane)**

### **Krok 1: Przygotuj serwer**
```bash
# Na serwerze Ubuntu/Debian
sudo apt update && sudo apt install docker.io docker-compose nginx certbot

# Utwórz katalog aplikacji
sudo mkdir -p /opt/hd-problemy
cd /opt/hd-problemy
```

### **Krok 2: Pobierz kod aplikacji**
```bash
# Skopiuj pliki z obecnej aplikacji (dostaniesz je ode mnie)
# Lub sklonuj repozytorium jeśli udostępnię
```

### **Krok 3: Konfiguracja Docker**
Utwórz `docker-compose.yml`:
```yaml
version: '3.8'
services:
  mongodb:
    image: mongo:6
    restart: always
    volumes:
      - mongodb_data:/data/db
    environment:
      MONGO_INITDB_DATABASE: hd_problems

  backend:
    build: ./backend
    restart: always
    ports:
      - "8001:8001"
    environment:
      - MONGO_URL=mongodb://mongodb:27017
      - DB_NAME=hd_problems
      - CORS_ORIGINS=https://twoja-domena.com
    depends_on:
      - mongodb

  frontend:
    build: ./frontend
    restart: always
    ports:
      - "3000:3000"
    environment:
      - REACT_APP_BACKEND_URL=https://twoja-domena.com

volumes:
  mongodb_data:
```

### **Krok 4: Konfiguracja Nginx**
```bash
# Utwórz konfigurację nginx
sudo nano /etc/nginx/sites-available/hd-problemy
```

```nginx
server {
    listen 80;
    server_name twoja-domena.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name twoja-domena.com;

    ssl_certificate /etc/letsencrypt/live/twoja-domena.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/twoja-domena.com/privkey.pem;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:8001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### **Krok 5: SSL certyfikat**
```bash
# Włącz konfigurację nginx
sudo ln -s /etc/nginx/sites-available/hd-problemy /etc/nginx/sites-enabled/
sudo nginx -t

# Uzyskaj SSL certyfikat
sudo certbot --nginx -d twoja-domena.com

# Automatyczne odnawianie
sudo crontab -e
# Dodaj linię:
0 12 * * * /usr/bin/certbot renew --quiet
```

### **Krok 6: Uruchomienie**
```bash
# Uruchom aplikację
docker-compose up -d

# Sprawdź status
docker-compose ps
```

---

## 🔧 **Opcja 2: Hosting w chmurze (Azure/AWS)**

### **Azure App Service:**
1. **Utwórz Azure App Service**
2. **Skonfiguruj GitHub deployment** lub upload kodu
3. **Dodaj Azure Database for MongoDB**
4. **Skonfiguruj custom domain** w Azure
5. **Włącz SSL** (automatycznie w Azure)

### **AWS (EC2 + RDS):**
1. **EC2 instance** z Ubuntu
2. **DocumentDB** (MongoDB-compatible)
3. **Application Load Balancer**
4. **Route 53** dla DNS
5. **Certificate Manager** dla SSL

---

## 📱 **Krok 7: Aktualizacja Teams package**

Po przeniesieniu na własną domenę, zaktualizuj manifest:

```json
{
  "staticTabs": [
    {
      "entityId": "hd-problems-tab",
      "name": "HD Problemy IT",
      "contentUrl": "https://twoja-domena.com",
      "websiteUrl": "https://twoja-domena.com",
      "scopes": ["personal"]
    }
  ],
  "validDomains": [
    "twoja-domena.com"
  ]
}
```

Następnie:
1. **Utwórz nowy ZIP** z zaktualizowanym manifestem
2. **Odinstaluj starą** aplikację z Teams
3. **Zainstaluj nową** z nowym manifestem

---

## 🗄️ **Migracja danych**

### **Eksport z obecnej bazy:**
```bash
# Eksportuj dane (poproszę o dostęp do eksportu)
mongodump --uri="mongodb://..." --db=hd_problems --out=backup/
```

### **Import do nowej bazy:**
```bash
# Importuj do nowej bazy
mongorestore --uri="mongodb://localhost:27017" --db=hd_problems backup/hd_problems/
```

---

## 💰 **Szacunkowe koszty miesięczne:**

### **Własny serwer (VPS):**
- **DigitalOcean/Linode:** $10-20/miesiąc
- **Domena:** $10-15/rok
- **Łącznie:** ~$12-22/miesiąc

### **Azure App Service:**
- **Basic plan:** $13-55/miesiąc
- **Azure Cosmos DB:** $24+/miesiąc
- **Łącznie:** ~$40-80/miesiąc

### **AWS:**
- **EC2 t2.small:** $17/miesiąc
- **DocumentDB:** $55+/miesiąc
- **Load Balancer:** $16/miesiąc
- **Łącznie:** ~$90+/miesiąc

---

## 🎯 **Zalecenie:**

### **Dla małej/średniej firmy:**
**Opcja 1 (VPS + Docker)** - najtańsza i najprostsza

### **Dla dużej korporacji:**
**Azure App Service** - łatwość zarządzania, automatyczne skalowanie

---

## 📞 **Wsparcie w migracji:**

Mogę pomóc z:
1. ✅ **Przygotowaniem kodu** do self-hostingu
2. ✅ **Konfiguracją Docker/nginx**
3. ✅ **Migracją danych** z obecnej bazy
4. ✅ **Aktualizacją Teams package**
5. ✅ **Testowaniem** po migracji

**Chcesz żebym przygotował kompletny pakiet do self-hostingu?** 🚀

---

## ⚡ **Szybki start (jeśli masz domenę):**

Jeśli masz już domenę, mogę:
1. **Przygotować kod** z konfiguracją dla Twojej domeny
2. **Utworzyć Docker setup** gotowy do wdrożenia
3. **Dostarczyć skrypty** instalacyjne
4. **Zaktualizować Teams package** z nową domeną

**Po prostu powiedz jaka jest Twoja domena, a przygotuję wszystko!** 🎯