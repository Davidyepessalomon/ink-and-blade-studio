# Ink & Blade — migration out of Emergent

This package is prepared to run outside Emergent.

## Recommended hosting

- Frontend: Render Static Site (free tier)
- Backend: Render Python Web Service (free tier)
- Database: MongoDB Atlas M0 (free tier)
- Payments: Stripe (configure your own keys)

## Important

Do not commit `.env` files or secret keys. Use Render Environment Variables.

## Render

1. Create a GitHub repository and upload this project.
2. In Render choose **New > Blueprint** and connect the repository.
3. Render will read `render.yaml` and create the frontend and backend.
4. During the first setup, provide the secret values requested by `sync: false`.
5. Create a MongoDB Atlas M0 cluster and paste its connection string into `MONGO_URL`.
6. After the backend receives its `onrender.com` URL, set:
   - Backend `FRONTEND_URL` = frontend `https://...onrender.com`
   - Backend `CORS_ORIGINS` = same frontend URL
   - Frontend `REACT_APP_BACKEND_URL` = backend `https://...onrender.com`
7. Redeploy the frontend after setting its API URL.
8. In Stripe, create the production secret and webhook signing secret, then set them in Render.

## Local

Backend:

    cd backend
    python -m venv venv
    # Windows: venv\\Scripts\\activate
    # macOS/Linux: source venv/bin/activate
    pip install -r requirements.txt
    copy .env.example .env       # Windows
    # cp .env.example .env       # macOS/Linux
    uvicorn server:app --host 0.0.0.0 --port 8001 --reload

Frontend:

    cd frontend
    npm install
    # Set REACT_APP_BACKEND_URL in frontend/.env
    npm start

## Notes

The Emergent visual-editing dependency and Emergent-only Python dependencies were removed from this export. The backend now has a `/health` endpoint for deployment health checks, the Emergent Stripe fallback was removed, and the old hard-coded admin/artist passwords are no longer used.
