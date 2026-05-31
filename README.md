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

1. Faça **push** na `main` e aguarde o workflow **Deploy GitHub Pages** terminar (verde) em **Actions**
2. GitHub → **Settings** → **Pages**
3. **Build and deployment** → **Source:** **Deploy from a branch**
4. **Branch:** `gh-pages` · pasta **`/ (root)`** → **Save**

> **Importante:** não use a branch `main` na raiz `/`. Isso publica o código-fonte e causa o erro `src/main.jsx` com MIME `text/html`.

5. Abra a URL do repositório, por exemplo:  
   **https://gui1535.github.io/monitoramento-geral-trivia/**  
   (não use só `https://gui1535.github.io/` — essa é a página do usuário, outro site)

O workflow está em `.github/workflows/deploy-pages.yml`.

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
