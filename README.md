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

Publicação automática no push na branch `main`.

**URL (projeto):** `https://<seu-usuario>.github.io/<nome-do-repositorio>/`  
Ex.: [https://gui1535.github.io/monitoramento-geral-trivia/](https://gui1535.github.io/monitoramento-geral-trivia/)

### Ativar no repositório (uma vez)

1. GitHub → **Settings** → **Pages**
2. **Build and deployment** → **Source:** **GitHub Actions** (não use “Deploy from a branch” na raiz do repo — isso publica o código-fonte e gera erro de MIME em `/src/main.jsx`)
3. Faça push na `main` (ou rode o workflow **Deploy GitHub Pages** em **Actions**)
4. Abra sempre a URL com o nome do repositório no final (não só `https://gui1535.github.io/`)

O workflow está em `.github/workflows/deploy-pages.yml`.

O `public/404.html` redireciona rotas como `/monitoramento` de volta ao `index.html` para o refresh funcionar no GitHub Pages.

### Preview local do build de produção

```bash
npm run build
npm run preview
```

```bash
VITE_BASE_PATH=/monitoramento-geral-trivia/ npm run build
npm run preview
```

Abra a URL que o `vite preview` mostrar (com o mesmo prefixo do repositório).
