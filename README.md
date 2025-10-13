# Pizzería Rex

Proyecto full‑stack para gestión de pizzería (Django + React).

## Estructura sugerida
- **backend/**: Django (API REST, `requirements.txt`, `.env.example`)
- **frontend/**: React / Vite (`package.json`)
- **docs/**: documentación, diagramas, etc.

## Cómo correr local
### Backend (Django)
```bash
cd backend
python -m venv .venv
# Windows:
.venv\Scripts\activate
# Linux/Mac:
# source .venv/bin/activate

pip install -r requirements.txt
# Variables de entorno (copiar y completar):
cp .env.example .env  # en Windows usar copy
python manage.py migrate
python manage.py runserver
```

### Frontend (React)
```bash
cd frontend
npm install
npm run dev
```

## Licencia
MIT (o la que elijas).
