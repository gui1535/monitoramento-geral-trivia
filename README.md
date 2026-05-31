# Monitoramento

Aplicação de monitoramento (React + Vite) com diagrama SVG, fibra, rádios e URs.

## Desenvolvimento

```bash
npm install
npm run dev
```

Abra [http://localhost:5173/](http://localhost:5173/) (entrada: `index.dev.html`).

A API `PUT /api/config-fibra` só existe em desenvolvimento. Em produção o app lê `config-fibra.json`.

## GitHub Pages

**URL:** [https://gui1535.github.io/monitoramento-geral-trivia/](https://gui1535.github.io/monitoramento-geral-trivia/)

### Configuração no GitHub

**Settings → Pages:**

| Opção | Valor |
|--------|--------|
| Source | Deploy from a branch |
| Branch | `main` |
| Folder | **`/ (root)`** ou **`/docs`** (os dois funcionam após o deploy) |

O arquivo **`index.html` na raiz** do repositório é o **build de produção** (não edite à mão).  
Desenvolvimento usa **`index.dev.html`**.

### Publicar

```bash
VITE_BASE_PATH=/monitoramento-geral-trivia/ npm run build:pages
git add index.html index.dev.html 404.html assets/ docs/ scripts/ package.json vite.config.js .github/ favicon.svg config-fibra.json esquema-gerencia.svg logotipo-*.png .nojekyll
git commit -m "deploy: corrige GitHub Pages na raiz do repositório"
git push
```

Ou: push na `main` → o workflow **Deploy GitHub Pages** gera os arquivos automaticamente.

### Se ainda aparecer `src/main.jsx`

1. Confirme no GitHub que `index.html` na **raiz** contém `/assets/index-`, não `/src/main.jsx`
2. Aguarde 1–2 min após o push
3. Ctrl+Shift+R no navegador
