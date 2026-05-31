# Monitoramento

Aplicação de monitoramento (React + Vite) com diagrama SVG, fibra, rádios e URs.

## Desenvolvimento

```bash
npm install
npm run dev
```

Abra [http://localhost:5173/monitoramento/](http://localhost:5173/monitoramento/) (o `base` do Vite usa o prefixo `/monitoramento/`).

A API `PUT /api/config-fibra` só existe em desenvolvimento (`npm run dev`). Em preview/produção o app lê `public/config-fibra.json`.

## GitHub Pages

Publicação automática no push na branch `main`.

**URL:** [https://trivia-monitoramento.github.io/monitoramento/](https://trivia-monitoramento.github.io/monitoramento/)

### Ativar no repositório (uma vez)

1. GitHub → **Settings** → **Pages**
2. **Build and deployment** → **Source:** **GitHub Actions**
3. Faça push na `main` (ou rode o workflow **Deploy GitHub Pages** manualmente em **Actions**)

O workflow está em `.github/workflows/deploy-pages.yml`.

### Preview local do build de produção

```bash
npm run build
npm run preview
```

Abra a URL que o `vite preview` mostrar (com o mesmo prefixo `/monitoramento/`).
