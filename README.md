# Monitoramento

Aplicação de monitoramento (React + Vite) com diagrama SVG, fibra, rádios e URs.

## Desenvolvimento

```bash
npm install
npm run dev
```

Abra [http://localhost:5173/](http://localhost:5173/).

A API `PUT /api/config-fibra` só existe em desenvolvimento (`npm run dev`). Em preview/produção o app lê `public/config-fibra.json`.

## GitHub Pages

**URL:** [https://gui1535.github.io/monitoramento-geral-trivia/](https://gui1535.github.io/monitoramento-geral-trivia/)

### Configuração (uma vez)

1. **Settings** → **Pages**
2. **Source:** Deploy from a branch
3. **Branch:** `main` · pasta **`/docs`** → **Save**

> Não use a pasta **`/` (root)** na branch `main`. Isso publica o código-fonte e gera erro em `/src/main.jsx` e `%BASE_URL%`.

4. Faça **push** na `main` (fora da pasta `docs/`)
5. Em **Actions**, aguarde **Deploy GitHub Pages** (verde) — ele roda `npm run build` e grava o resultado em `docs/`
6. Abra **https://gui1535.github.io/monitoramento-geral-trivia/**

### Se ainda aparecer `src/main.jsx` ou `%BASE_URL%`

- Confirme em Pages: branch **`main`**, pasta **`/docs`** (não `/`)
- Veja se o último commit em `docs/index.html` contém `/assets/index-....js` (não `/src/main.jsx`)
- Limpe o cache do navegador (Ctrl+Shift+R)

### Preview local do build

```bash
VITE_BASE_PATH=/monitoramento-geral-trivia/ npm run build
npm run preview
```
