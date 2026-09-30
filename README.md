# ClauseChain

ClauseChain reads the official laws of an economy, finds the provisions that
matter for the UN ESCAP Regional Digital Trade Integration Index (RDTII), and
records each one with an article-level citation, a verbatim quote and a link
back to its source, for human legal review. One pipeline runs on two model
backends: a commercial hosted model (Engine A) and an open-weights model
(Engine B), switched inside the app.

## Quick start

Needs only Docker. See **[DEPLOYMENT.md](DEPLOYMENT.md)** for the full guide.

```bash
git clone https://github.com/nafew0/clausechain-escap.git
cd clausechain-escap
./deploy.sh --env-file /path/to/keys.env
```

Windows: `powershell -ExecutionPolicy Bypass -File .\deploy.ps1 -EnvFile C:\path\to\keys.env`

Then open http://localhost:8080 and sign in as `admin` (password in
`.deploy-credentials.txt`).

## Licence

Released under the Apache License 2.0. See [LICENSE](LICENSE).
