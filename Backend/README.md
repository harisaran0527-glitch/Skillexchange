# SkillSwap Backend

SkillSwap – Student Skill Exchange Platform (backend)

Quick start:

1. Copy `.env.example` to `.env` and fill in values (MONGO_URI, JWT_SECRET).
2. From project root run:
   - npm install
   - npm run dev

Or use the Windows helper script (PowerShell):

   ./run-dev.ps1

Docker (production)
1. Create .env with MONGO_URI and JWT_SECRET
2. Build and run with docker-compose:
   docker-compose up --build -d
3. Check logs:
   docker-compose logs -f
4. The backend will listen on port 5005 (http://localhost:5005)

Docker (development)
1. Create .env if needed
2. docker-compose -f docker-compose.dev.yml up --build

API Endpoints
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/logout
- GET /api/users/profile (protected)
- PUT /api/users/profile (protected)
- GET /api/users/search (protected)
- POST /api/users/profile/skills (protected) - add skill
- DELETE /api/users/profile/skills (protected) - remove skill
- POST /api/skills (protected)
- GET /api/skills
- PUT /api/skills/:id (protected)
- DELETE /api/skills/:id (protected)
- GET /api/match (protected)

Notes
- Protected routes require HTTP header: Authorization: Bearer <token>
- For development, CORS allows all origins. Set CORS_ORIGIN in .env for production.
- Server now binds to 0.0.0.0 to be reachable inside containers.

Troubleshooting deployment issues that prevent Chrome from loading the site
1. Mixed content: If your frontend is served over HTTPS and backend is HTTP, Chrome will block requests. Serve backend over HTTPS or configure frontend to use HTTPS for API calls.
2. CORS: If Chrome shows CORS errors in DevTools console, set CORS_ORIGIN in .env to the frontend origin (e.g., https://your-app.example.com) and enable CORS_CREDENTIALS=true if cookies/credentials are used.
3. Firewall / Port blocking: Ensure port 5005 (or proxy port) is open on the host and any cloud firewall allows inbound traffic.
4. Reverse proxy: If using Nginx/Traefik, ensure proxy passes correct Host and X-Forwarded headers and routes to container IP:5005.
5. DNS / SSL: Ensure domain resolves to host IP and SSL is configured; Chrome blocks insecure content on HTTPS pages.

If you encounter an error during deployment, run the diagnostics script (created in the repository):
  chmod +x diagnostics.sh
  ./diagnostics.sh

Share the generated diagnostics-output.txt (redact secrets) and I'll analyze and provide exact fixes.
