# Ink & Blade Studio Platform

A full-stack web and mobile application for high-end tattoo and barber studios featuring:
- **Portfolio & Flash Sheet Repository**: Curated styles with filter tags and pricing estimates.
- **Smart Appointment Scheduling**: Live available slots with duration calculations and 15-minute buffers.
- **Stripe Upfront Deposit Checkout**: Collect deposit payments ($25-$100) before confirming slots.
- **Custom Tattoo Request Pipeline**: Multi-step consultation form with placement, budget, and image reference tracker.
- **Staff Command Center**: Admin dashboard for daily/weekly schedules, custom quote submissions, and aftercare email dispatch.
- **Official Invoice & Receipt Generator**: Printable studio receipt with financial breakdown.

---

## Tech Stack
- **Frontend**: React 19, Tailwind CSS, Lucide Icons, Shadcn UI primitives, Sonner toasts
- **Backend**: Python FastAPI, Uvicorn, Motor (Async MongoDB driver), PyJWT, Bcrypt, Stripe Python SDK
- **Database**: MongoDB (Local or MongoDB Atlas)

---

## Local Setup & Execution Guide

### 1. Prerequisites
- Node.js (v18+) & Yarn
- Python 3.10+
- MongoDB (Running locally on `localhost:27017` or MongoDB Atlas URI)

---

### 2. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure environment variables:
   - Copy `.env.example` to `.env`:
     ```bash
     cp .env.example .env
     ```
   - Fill in your MongoDB URI, JWT secret, and Stripe API keys.
5. Start the FastAPI server:
   ```bash
   uvicorn server:app --host 0.0.0.0 --port 8001 --reload
   ```
   *The backend will be available at `http://localhost:8001`.*

---

### 3. Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   yarn install
   ```
3. Configure environment variables:
   - Copy `.env.example` to `.env`:
     ```bash
     cp .env.example .env
     ```
   - Set `REACT_APP_BACKEND_URL=http://localhost:8001`
4. Start the development server:
   ```bash
   yarn start
   ```
   *The application will open at `http://localhost:3000`.*

---

### 4. Build for Production
To generate an optimized production build of the frontend:
```bash
cd frontend
yarn build
```
The output files in `frontend/build` can be served with Nginx, Vercel, Netlify, Cloudflare Pages, or AWS S3 + CloudFront.
