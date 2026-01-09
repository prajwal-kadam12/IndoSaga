Deployment Guide

This doc explains deploying the frontend to Netlify and keeping your cPanel PHP+MySQL backend.

Frontend (Netlify):
- Connect the GitHub repo to Netlify or upload the `dist/public` folder.
- Build command: `npm run build`
- Publish directory: dist/public
- `netlify.toml` is included in this repo and configures the publish dir and SPA redirect.
- Set an environment variable on Netlify for your API base (example: `VITE_API_BASE=https://your-cpanel-domain.com`).

Backend (cPanel PHP + MySQL):
- Netlify cannot run PHP or MySQL. Keep your PHP API and MySQL on cPanel and call it from the frontend via HTTPS.
- Do NOT expose DB credentials in frontend code.

CORS / FRONTEND_URL:
- There is a helper `php/config/cors.php` which will read `FRONTEND_URL` or the request Origin.
- You can set the allowed origin using `.htaccess` in the `api/` folder (example below) or via host environment variables.

Example `.htaccess` (place inside `api/` directory on cPanel):

    SetEnv FRONTEND_URL "https://your-netlify-site.netlify.app"
    <IfModule mod_headers.c>
      Header set Access-Control-Allow-Origin "https://your-netlify-site.netlify.app"
      Header set Access-Control-Allow-Methods "GET,POST,OPTIONS,PUT,DELETE"
      Header set Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With"
      Header set Access-Control-Allow-Credentials "true"
    </IfModule>

Quick test:

    curl -I -X OPTIONS https://your-cpanel-domain.com/api/contact -H "Origin: https://your-netlify-site.netlify.app"

Expect `200` and `Access-Control-Allow-Origin` set to your Netlify URL.

Security notes:
- Use HTTPS on both frontend and backend.
- Keep DB creds server-side and behind the PHP API.
- Many cPanel hosts block remote MySQL; prefer server-side DB access.
