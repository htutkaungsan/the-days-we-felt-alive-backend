# Hosted classroom deployment

Frontend and backend are deployed together at **https://the-day.yangon-tech-by-okker.site** on server `142.93.60.71`.

- Project directory: `/var/www/the-days-we-felt-alive`, with separate `backend` and `frontend` repositories.
- Compose file: `backend/deploy/docker-compose.yml`; run Compose from that directory.
- Only the frontend is published, on `127.0.0.1:4217`. Host Nginx terminates HTTPS and forwards to it. The frontend container forwards `/api/` and `/images/` to `express-api:3000` on the private project network.
- MySQL is private and uses a persistent `rental-data` volume. Fresh startup initializes the three tables, imports 16 retro titles and creates the environment-configured admin.
- `.env` is stored only on the server, mode 600, with separate generated database/JWT/admin secrets. Demo credentials are supplied separately; no production password is committed.
- `TRUST_PROXY=1` is used only behind this private API/proxy arrangement: the outer Nginx supplies the client IP for the login limiter. Local development defaults to zero trusted proxy hops.

## Operate

```sh
cd /var/www/the-days-we-felt-alive/backend/deploy
docker compose up -d --build
docker compose ps
docker compose logs --tail=50 express-api
```

The Compose build expects sibling repositories. Both containers restart automatically. `docker compose down` preserves data; do not use `down -v` for routine deployments.

## TLS and renewal

The domain's DNS A record is `the-day → 142.93.60.71`. `nginx-http.conf` provides the initial HTTP proxy and the ACME webroot at `/var/www/letsencrypt`. After DNS resolves to the server, issue the certificate:

```sh
certbot certonly --webroot -w /var/www/letsencrypt -d the-day.yangon-tech-by-okker.site
```

Then use the installed HTTPS Nginx site. The server's existing Certbot schedule checks twice daily and its deployment hook reloads Nginx after renewal. Only the new project's site is added; existing sites are retained.
