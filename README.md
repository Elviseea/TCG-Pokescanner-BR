# 🃏 PokéScanner BR — Consulta Rápida Pokémon TCG (TCGdex HD + LigaPokémon R$)

Sistema web local ultrarrápido desenvolvido em **Node.js (Zero-Dependency)** para consulta instantânea de cartas de **Pokémon TCG**, integrando imagens em alta definição do **TCGdex** com cotações em Reais (**R$**) em tempo real da **LigaPokémon**, contador de abertura de pacotes (boosters), banco de dados de coleção pessoal e **Radar de Valorização do Meta**.

---

## ✨ Funcionalidades Principais

- **🔢 Busca Instantânea por Número (`#`)**: Digite apenas o número da carta (ex: `136`, `004`, `TG01`) e pressione `Enter` para visualizar a carta em alta definição com efeito 3D e todos os preços praticados no Brasil.
- **🇧🇷 Cotações LigaPokémon em Tempo Real (R$)**:
  - Exibe **Menor Preço**, **Preço Médio** (com média de vendas dos últimos 3 meses) e **Maior Preço**.
  - Suporte completo a variantes e acabamentos especiais: **Normal, Foil / Holo, Reverse Foil, Poké Ball Foil, Master Ball Foil, Promo, Staff e Pre-Release**.
- **💎 Minha Coleção & Radar do Meta**:
  - Banco de dados local persistente (`data/collection.json`) para cadastrar suas cartas.
  - Compara automaticamente o **preço de quando você cadastrou** com o **preço atual na LigaPokémon**, destacando cartas que subiram de valor com o meta competitivo.
  - Filtros estilo **Pokémon TCG Live** por Categoria (*Pokémon, Treinador, Item, Apoiador, Ferramenta, Estádio, Energia*) e por Tipo Elemental (*Planta, Fogo, Água, Elétrico, Psíquico, Luta, Escuridão, Metal, Dragão, Fada, Incolor*).
  - Exportação completa para planilha **CSV (Excel)**.
- **🎬 Contador de Abertura de Pacotes (Sessão)**:
  - Some rapidamente as cartas tiradas em aberturas de boosters usando a tecla de atalho `+`, acompanhe a contagem de pacotes abertos e destaque automático do **Maior Hit**.
- **⚡ Modo 100% Offline**:
  - Permite baixar coleções completas (dados + imagens HD) para o computador com 1 clique, garantindo funcionamento instantâneo mesmo sem internet.

---

## 🚀 Pré-requisitos

- **[Node.js](https://nodejs.org/)** versão **18.0** ou superior instalado (não requer instalação de pacotes externos via `npm install`, pois utiliza apenas módulos nativos do Node.js).

---

## 🛠️ Como Executar

### Opção 1: Pelo Atalho no Windows
Basta dar dois cliques no arquivo:
```bat
Iniciar_PokemonTCG.bat
```
Ele iniciará o servidor em segundo plano e abrirá automaticamente `http://127.0.0.1:3001` no seu navegador.

### Opção 2: Pelo Terminal
```bash
npm start
# ou diretamente:
node server.js
```
Em seguida, acesse no navegador: **[http://127.0.0.1:3001](http://127.0.0.1:3001)** (ou `http://localhost:3001`)

---

## ⌨️ Atalhos de Teclado

| Tecla | Ação |
| :---: | :--- |
| `/` | Foca imediatamente no campo de digitar o número da carta |
| `Enter` | Seleciona a carta correspondente ao número digitado |
| `⬅️` / `➡️` | Navega para a carta anterior / próxima da coleção |
| `+` | Adiciona a carta atual à soma da abertura de pacotes |
| `C` | Salva a carta atual diretamente na **Minha Coleção** |
| `Esc` | Limpa o campo de busca de número |

---

## 📂 Estrutura do Projeto

```text
├── public/
│   ├── index.html          # Interface principal (Busca, Spotlight 3D, Abertura e Minha Coleção)
│   ├── styles.css          # Estilização moderna Dark UI
│   └── app.js              # Lógica de frontend, filtros TCG Live e atalhos rápidos
├── data/
│   ├── catalog.json        # Catálogo unificado de edições (TCGdex + LigaPokémon)
│   ├── collection.json     # Banco de dados da sua coleção e histórico de preços
│   ├── card_types_index.json # Índice de categorias de cartas (Treinadores / Energias)
│   ├── sets/               # Cache JSON das coleções consultadas
│   └── images/             # Imagens HD salvas para uso Offline (ignorado no Git)
├── server.js               # Servidor HTTP + API REST + Scraper LigaPokémon + SSE
├── Iniciar_PokemonTCG.bat  # Inicializador rápido para Windows
└── package.json            # Manifesto do projeto Node.js
```

---

## 📄 Licença

Distribuído sob a licença **MIT**.
