# Deploy iGameForge

Ghid pentru un server Linux cu systemd și Nginx. Baza de date se exportă manual
din local și se importă pe server, cu schema și datele deja pregătite.
**Acest deploy nu rulează migrări, seed-uri sau scripturi de import de template-uri.**

## 1. Configurația folosită în exemple

- Domeniu: `https://igameforge.example.com` — se înlocuiește cu domeniul real.
- Proiect: `/srv/igameforge`, cu directoarele `server` și `frontend`.
- Backend NestJS: port intern `3001`, acces public prin `/api/`.
- Frontend Nuxt: generat static, servit de Nginx.
- Bază de date: MySQL/MariaDB, baza `igameforge`.
- Utilizator Linux dedicat aplicației: `igameforge`.

Sysadmin-ul pregătește Node.js 24 LTS cu npm ≥ 10, Nginx, systemd și accesul la
MySQL/MariaDB. Dacă build-ul se face pe server: Git, Python 3, make și g++.
Punct de pornire orientativ pentru trafic redus: 2 vCPU și 4 GB RAM.
Nu sunt necesare un server Nuxt separat sau o instalare globală de NestJS/Prisma.

Porturile publice sunt 80/443; portul 3001 și baza de date rămân accesibile doar
intern, prin firewall. Configurația actuală NestJS nu limitează singură ascultarea
la localhost. DNS-ul, certificatul HTTPS și reînnoirea lui sunt pregătite de sysadmin.

## 2. Importul manual al bazei de date

Se livrează un export complet al bazei locale actualizate: structură și date,
inclusiv `game_resource_types`, `games_resources_values`, utilizatori, roluri și
`_prisma_migrations`, dacă există. Se folosește exportul bazei aplicației,
nu dump-ul legacy `games (2).sql`.

Schema exportată trebuie să corespundă versiunii de cod livrate. Păstrați istoricul
migrărilor pentru actualizările viitoare; nu îl ștergeți și nu îl recreați manual.

Sysadmin-ul creează baza și utilizatorii. Importul se face într-o bază nouă, goală;
pentru o bază deja utilizată se face backup înainte. Exemplu, folosind clientul MySQL:

```bash
mysql -h DB_HOST -u IMPORT_USER -p igameforge < /cale/export-igameforge.sql
```

Parola este cerută interactiv. Utilizatorul aplicației primește acces la baza
`igameforge`; contul de import poate avea separat drepturile DDL necesare restaurării.
Datele importate vor include conturile locale; parolele lor rămân cele din export.

**Nu se execută** `prisma migrate dev`, `prisma migrate deploy`, `prisma db push`,
`prisma migrate reset`, seed-uri sau scriptul `import-game-templates.mjs`.

## 3. Configurația backend

Codul se copiază din versiunea aprobată, fără `node_modules`, `.env` local și
artefactele locale de build. Configurația de producție se creează separat în
`/srv/igameforge/server/.env`:

```dotenv
NODE_ENV=production
PORT=3001
DATABASE_URL="mysql://APP_USER:URL_ENCODED_PASSWORD@DB_HOST:3306/igameforge"
CORS_ORIGINS=https://igameforge.example.com

JWT_SECRET=REPLACE_WITH_RANDOM_SECRET_AT_LEAST_32_CHARACTERS
JWT_REFRESH_SECRET=REPLACE_WITH_DIFFERENT_RANDOM_SECRET_AT_LEAST_32_CHARACTERS
JWT_ACCESS_EXPIRES_IN=30m
JWT_REFRESH_EXPIRES_IN=7d
JWT_REFRESH_COOKIE_SAME_SITE=lax

IGAMEFORGE_DEV_ENDPOINT=https://REPLACE_DEV_ENDPOINT
IGAMEFORGE_UAT_ENDPOINT=https://REPLACE_UAT_ENDPOINT
IGAMEFORGE_PROD_ENDPOINT=https://REPLACE_PROD_ENDPOINT
IGAMEFORGE_PRNG_PROD_ENDPOINT=https://REPLACE_PRNG_ENDPOINT
IGAMEFORGE_CLIENT_ID=REPLACE
IGAMEFORGE_CLIENT_SECRET=REPLACE
IGAMEFORGE_PRNG_CLIENT_ID=REPLACE
IGAMEFORGE_PRNG_CLIENT_SECRET=REPLACE
```

Endpoint-urile și credențialele externe se completează pentru mediile utilizate.
`CORS_ORIGINS` conține origini complete, fără `/api` sau slash final.
Caracterele speciale din parola bazei se encodează pentru URL.
Secretele JWT sunt diferite și generate pentru producție. Fișierul `.env` este
accesibil numai administratorului și utilizatorului aplicației și nu se comite.
Exemplul PostgreSQL din `server/.env.example` este învechit: se folosește `mysql://`.

Build, executat ca utilizator al aplicației:

```bash
cd /srv/igameforge/server
npm ci --include=dev
npm run prisma:generate
npm run build
```

`prisma:generate` generează clientul din schema locală; nu modifică baza de date.
Dependențele de dezvoltare sunt necesare pentru generare și compilare.

## 4. Serviciul backend

Sysadmin-ul creează `/etc/systemd/system/igameforge.service`:

```ini
[Unit]
Description=iGameForge backend
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=igameforge
Group=igameforge
WorkingDirectory=/srv/igameforge/server
EnvironmentFile=/srv/igameforge/server/.env
ExecStart=/usr/bin/node /srv/igameforge/server/dist/main.js
Restart=on-failure
RestartSec=5
TimeoutStopSec=30

[Install]
WantedBy=multi-user.target
```

Se verifică locația reală a executabilului cu `command -v node` și se ajustează
`ExecStart`. systemd nu încarcă automat configurația nvm din shell.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now igameforge
sudo systemctl status igameforge
curl --fail http://127.0.0.1:3001/api/health
```

Răspuns așteptat: `{"status":"ok"}`. Endpoint-ul verifică procesul, nu conexiunea DB.
Se pornește inițial o singură instanță backend; pentru replici se verifică separat
eventualele joburi programate, pentru a evita execuțiile multiple.

## 5. Build frontend

```bash
cd /srv/igameforge/frontend
npm ci --include=dev
API_URL=https://igameforge.example.com/api APP_NAME=iGameForge npm run generate
```

Rezultatul este în `frontend/.output/public`. URL-ul API include `/api` și este
stabilit la build. Schimbarea lui necesită regenerarea frontend-ului.
Configurația frontend expusă browserului nu trebuie să conțină secrete.
Nginx trebuie să aibă acces de citire și traversare la directorul public.

## 6. Nginx și HTTPS

Exemplu de configurație, după emiterea certificatului. Căile certificatului sunt
orientative și se înlocuiesc cu cele reale. Backend-ul păstrează prefixul `/api`:

```nginx
server {
    listen 80;
    server_name igameforge.example.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name igameforge.example.com;

    ssl_certificate /etc/letsencrypt/live/igameforge.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/igameforge.example.com/privkey.pem;

    root /srv/igameforge/frontend/.output/public;
    index index.html;

    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

`proxy_pass` nu are slash final, pentru a transmite calea `/api/...` intactă.
Nu se adaugă separat headere CORS în Nginx; backend-ul le gestionează deja.
Swagger `/docs` nu este publicat prin acest exemplu.

```bash
sudo nginx -t
sudo systemctl reload nginx
curl --fail https://igameforge.example.com/api/health
```

## 7. Verificări și actualizări

- Deschideți frontend-ul prin HTTPS și verificați login, refresh de sesiune și logout.
- Reîncărcați direct o rută internă, de exemplu `/game-templates`, pentru fallback SPA.
- Verificați jocurile și template-urile importate, apoi salvarea unui câmp de test.
- Verificați accesul la API-urile externe pentru mediile configurate.
- Consultați logurile: `sudo journalctl -u igameforge -n 100 --no-pager`.

Pentru actualizări fără schimbări de schemă: salvați versiunea precedentă, instalați
dependențele din lockfile, generați Prisma Client, recompilați backend-ul și
regenerați frontend-ul dacă s-a schimbat. Apoi executați
`sudo systemctl restart igameforge` și verificați aplicația.
Build-urile se pregătesc preferabil într-un director de release separat și se
publică împreună după succes; pentru deploy în același director folosiți o fereastră
de mentenanță. La eșec se restaurează artefactele versiunii precedente.

Exportul/importul manual al bazei este pentru instalarea inițială. După apariția
datelor de producție nu se înlocuiește baza cu exporturi locale. Schimbările viitoare
de schemă necesită un plan separat de actualizare și backup.

Referințe: [Nuxt — static deployment](https://nuxt.com/docs/3.x/getting-started/deployment#client-side-only-rendering),
[Nginx — proxy_pass](https://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_pass).
