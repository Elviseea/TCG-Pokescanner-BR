const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { URL } = require('node:url');
const { execFile } = require('node:child_process');

const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '127.0.0.1';
const ROOT_DIR = __dirname;
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
const DATA_DIR = path.join(ROOT_DIR, 'data');
const SETS_DIR = path.join(DATA_DIR, 'sets');
const IMAGES_DIR = path.join(DATA_DIR, 'images');
const SESSIONS_DIR = path.join(DATA_DIR, 'sessions');
const CATALOG_FILE = path.join(DATA_DIR, 'catalog.json');
const SESSION_FILE = path.join(SESSIONS_DIR, 'current_session.json');
const COLLECTION_FILE = path.join(DATA_DIR, 'collection.json');
const COLLECTION_BACKUP_FILE = path.join(DATA_DIR, 'collection.backup.json');
const CARD_TYPES_INDEX_FILE = path.join(DATA_DIR, 'card_types_index.json');

// Ensure directories exist
for (const dir of [PUBLIC_DIR, DATA_DIR, SETS_DIR, IMAGES_DIR, SESSIONS_DIR]) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

// Explicit mapping for special sets between TCGdex ID and LigaPokemon acronym/id
const SPECIAL_SET_MAP = {
  '30th': '30C',
  '30th-c': '30C-C',
  'ex1': 'RS',
  'swsh10.5': 'PGO',
  'cel25cc': 'CCC',
  'swshp': 'SSPR',
  'svp': 'SVP',
  'smp': 'SMP',
  'xyp': 'XYPR',
  'bwp': 'BWPR',
  'hgssp': 'HSPR',
  'dpp': 'DPPR',
  'basep': 'WPR',
  'wp': 'WOTCP',
  'swsh9tg': 'BSTG',
  'swsh10tg': 'ARTG',
  'swsh11tg': 'LORTG',
  'swsh12tg': 'SITTG',
  'swsh12.5gg': 'CZGG',
  'swsh4.5sv': 'SFS',
  'sma': 'HIF',
  'sve': 'SV-BE',
  'mee': 'MEEb',
  'mep': 'MEP',
  '2024sv': 'M24',
  '2023sv': 'M23',
  '2022swsh': 'MC22',
  '2021swsh': 'MC21',
  '2019sm': 'MCD19',
  '2018sm': 'MC18E',
  '2017sm': 'MCD17',
  '2016xy': 'MCD16',
  '2015xy': 'MCD15',
  '2014xy': 'MCD14',
  '2012bw': 'MCD2',
  '2011bw': 'MCD1',
  'fut2020': 'FUT20',
  'ru1': 'RU',
  'ecard1': 'EX',
  'rc': 'LTR',
  'exu': 'UF',
  'mfb': 'MFBP',
  'tk-sm-l': 'TK10A',
  'tk-sm-r': 'TK10B',
  'tk-xy-su': 'TK9B',
  'tk-xy-p': 'TK9A',
  'tk-xy-latia': 'TK8B',
  'tk-xy-latio': 'TK8A',
  'tk-xy-w': 'XYT4',
  'tk-xy-b': 'XYT4',
  'tk-xy-sy': 'TK6B',
  'tk-xy-n': 'TK6A',
  'tk-bw-z': 'TK5A',
  'tk-bw-e': 'TK5B',
  'tk-hs-g': 'TK4G',
  'tk-hs-r': 'TK4R',
  'tk-dp-m': 'TK3A',
  'tk-dp-l': 'TK3B',
  'tk-ex-p': 'TK2P',
  'tk-ex-m': 'TK2M',
  'tk-ex-latio': 'TK1B',
  'tk-ex-latia': 'TK1A'
};

// TCGdex sets that are digital-only (Pokémon TCG Pocket) or have no standalone LigaPokémon edition
// and must not collide by acronym (e.g. Pocket 'B2' vs Base Set 2 'B2', or 'xya' vs JP Deck 'XYA')
const NO_LIGA_TCGDEX_SETS = new Set([
  'A1', 'A1a', 'A2', 'A2a', 'A2b', 'A3', 'A3a', 'A3b', 'A4', 'A4a',
  'B1', 'B1a', 'B2', 'B2a', 'P-A',
  'xya', 'ex5.5', 'sp', 'jumbo', 'miscp'
]);

// Legacy Liga-only set IDs that are now unified into hybrid TCGdex sets
const SET_ID_ALIASES = {
  'liga-dlr': 'me06',
  'dlr': 'me06',
  'liga-sv-be': 'sve',
  'sv-be': 'sve',
  'liga-meeb': 'mee',
  'meeb': 'mee',
  'liga-sfs': 'swsh4.5sv',
  'liga-m24': '2024sv',
  'liga-mc18e': '2018sm',
  'liga-fut20': 'fut2020',
  'liga-ru': 'ru1',
  'liga-ex': 'ecard1',
  'liga-wotcp': 'wp'
};

const CATALOG_SCHEMA_VERSION = 2;

// LigaPokemon extra/variant codes
const LIGA_EXTRAS_LABELS = {
  '0': 'Normal',
  '2': 'Foil / Holo',
  '3': 'Reverse Foil',
  '5': '1ª Edição',
  '7': 'Promo',
  '11': 'Assinada',
  '13': 'Pre-Release',
  '17': 'Alterada',
  '19': 'Staff',
  '23': 'Textless',
  '29': 'Jumbo / Oversize',
  '31': 'Shadowless',
  '37': 'Misprint',
  '41': 'Shattered Holo',
  '43': 'Master Ball Foil',
  '47': 'Poké Ball Foil'
};

const LIGA_RARITY_LABELS = {
  1: 'Comum',
  2: 'Incomum',
  3: 'Rara',
  4: 'Rara Holográfica',
  5: 'Rara Holográfica EX',
  6: 'Rara Holográfica Lv.X',
  7: 'Rara Ultra',
  8: 'Rara Prime',
  9: 'ACE SPEC',
  10: 'Lenda',
  11: 'Promocional',
  12: 'Rara Incrível',
  13: 'Pokémon Brilhante',
  14: 'Rara Hiper',
  15: 'Rara Secreta',
  16: 'Rara Turbo',
  17: 'Ilustração Rara',
  18: 'Ilustração Rara Especial',
  19: 'Rara Holográfica GX',
  20: 'Rara Dupla',
  21: 'Rara Arco-Íris',
  22: 'Rara Radiante',
  23: 'Sem Raridade',
  24: 'Mega Attack Rare',
  25: 'Rara Futurista'
};

const MAX_BODY_BYTES = 1 * 1024 * 1024; // 1 MB limit for JSON request bodies
const ALLOWED_EXTERNAL_HOSTS = new Set([
  'www.ligapokemon.com.br',
  'ligapokemon.com.br',
  'api.tcgdex.net',
  'assets.tcgdex.net',
  'repositorio.sbrauble.com'
]);

function roundCents(val) {
  const num = Number(val);
  if (!Number.isFinite(num)) return 0;
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

function sanitizeSetId(rawId) {
  const id = String(rawId || '').trim();
  if (!id || !/^[a-zA-Z0-9._-]+$/.test(id) || id.includes('..')) {
    throw new Error(`Identificador de coleção inválido: '${rawId}'`);
  }
  return SET_ID_ALIASES[id.toLowerCase()] || id;
}

function resolveSafeChildPath(baseDir, unsafeRelativePath) {
  const resolvedBase = path.resolve(baseDir);
  const cleanedRel = String(unsafeRelativePath || '').replace(/^[/\\]+/, '');
  const resolvedTarget = path.resolve(resolvedBase, cleanedRel);
  const rel = path.relative(resolvedBase, resolvedTarget);
  if (!rel || rel.startsWith('..') || path.isAbsolute(rel)) {
    return null;
  }
  return resolvedTarget;
}

function validateExternalUrl(rawUrl) {
  let parsed;
  try {
    parsed = new URL(String(rawUrl || '').trim());
  } catch {
    throw new Error(`URL externa inválida: ${rawUrl}`);
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error(`Protocolo não permitido em URL externa: ${parsed.protocol}`);
  }
  const host = parsed.hostname.toLowerCase();
  if (!ALLOWED_EXTERNAL_HOSTS.has(host)) {
    throw new Error(`Host externo não autorizado: ${host}`);
  }
  return parsed.href;
}

// Atomic JSON write with per-file queue to avoid concurrent race conditions and partial writes
const writeQueues = new Map();

function writeJsonAtomic(filePath, data, createBackupPath = null) {
  const resolvedPath = path.resolve(filePath);
  const prevPromise = writeQueues.get(resolvedPath) || Promise.resolve();

  const nextPromise = prevPromise
    .catch(() => {})
    .then(async () => {
      const jsonStr = JSON.stringify(data, null, 2);
      const tmpPath = `${resolvedPath}.${process.pid}.${Date.now()}.${Math.random().toString(36).slice(2, 6)}.tmp`;
      try {
        if (createBackupPath && fs.existsSync(resolvedPath)) {
          try {
            const st = await fs.promises.stat(resolvedPath);
            if (st.size > 10) {
              await fs.promises.copyFile(resolvedPath, createBackupPath);
            }
          } catch {
            // ignore backup error
          }
        }
        await fs.promises.writeFile(tmpPath, jsonStr, 'utf8');
        let renamed = false;
        let lastRenameErr = null;
        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            await fs.promises.rename(tmpPath, resolvedPath);
            renamed = true;
            break;
          } catch (renameErr) {
            lastRenameErr = renameErr;
            if (renameErr && ['EBUSY', 'EPERM', 'EACCES'].includes(renameErr.code)) {
              await new Promise(r => setTimeout(r, 50 * attempt));
              continue;
            }
            throw renameErr;
          }
        }
        if (!renamed) {
          if (lastRenameErr && ['EBUSY', 'EPERM', 'EACCES'].includes(lastRenameErr.code)) {
            // Fallback without truncating target directly: copy from already-written .tmp
            fs.copyFileSync(tmpPath, resolvedPath);
          } else if (lastRenameErr) {
            throw lastRenameErr;
          }
        }
      } finally {
        if (fs.existsSync(tmpPath)) {
          await fs.promises.unlink(tmpPath).catch(() => {});
        }
      }
    });

  writeQueues.set(resolvedPath, nextPromise);
  nextPromise.catch(err => {
    console.error(`[WriteAtomic Error] Falha ao gravar ${resolvedPath}:`, err.message);
  });
  return nextPromise;
}

// Per-set mutex lock to serialize Read-Modify-Write operations on data/sets/<setId>.json
const setLocks = new Map();

function withSetLock(setId, fn) {
  const safeId = sanitizeSetId(setId);
  const prev = setLocks.get(safeId) || Promise.resolve();
  const next = prev.catch(() => {}).then(() => fn());
  setLocks.set(safeId, next);
  return next;
}

function resolveLigaAssetUrl(rawPath) {
  if (!rawPath) return null;
  const s = String(rawPath).trim();
  if (!s) return null;
  if (/^https?:\/\//i.test(s)) {
    return s.replace(/^https?:\/\/arquivos\//i, 'https://repositorio.sbrauble.com/arquivos/');
  }
  if (s.startsWith('//repositorio.sbrauble.com/')) {
    return `https:${s}`;
  }
  const cleanPath = s.replace(/^\/+/, '');
  return `https://repositorio.sbrauble.com/${cleanPath}`;
}

// SSE Clients for real-time Studio & Download updates
const sseClients = new Set();

function broadcastSSE(event, data) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of sseClients) {
    if (client.writableEnded || client.destroyed) {
      sseClients.delete(client);
      continue;
    }
    try {
      client.write(payload);
    } catch {
      sseClients.delete(client);
    }
  }
}

// Periodic SSE heartbeat to prevent idle disconnects and clean up dead sockets
setInterval(() => {
  for (const client of sseClients) {
    if (client.writableEnded || client.destroyed) {
      sseClients.delete(client);
      continue;
    }
    try {
      client.write(': ping\n\n');
    } catch {
      sseClients.delete(client);
    }
  }
}, 25000).unref();

function loadSession() {
  if (fs.existsSync(SESSION_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(SESSION_FILE, 'utf8'));
    } catch {
      // fallback
    }
  }
  return {
    title: 'Abertura de Pacotes',
    packsOpened: 0,
    priceMode: 'menor',
    items: []
  };
}

async function saveSession(session) {
  await writeJsonAtomic(SESSION_FILE, session);
  broadcastSSE('session', session);
}

let currentSession = loadSession();

// Helper to decode HTML entities from LigaPokemon strings
function decodeHtmlEntities(str) {
  if (!str) return '';
  return String(str)
    .replace(/&amp;/gi, '&')
    .replace(/&eacute;/gi, 'é')
    .replace(/&aacute;/gi, 'á')
    .replace(/&iacute;/gi, 'í')
    .replace(/&oacute;/gi, 'ó')
    .replace(/&uacute;/gi, 'ú')
    .replace(/&atilde;/gi, 'ã')
    .replace(/&otilde;/gi, 'õ')
    .replace(/&acirc;/gi, 'â')
    .replace(/&ecirc;/gi, 'ê')
    .replace(/&ocirc;/gi, 'ô')
    .replace(/&ccedil;/gi, 'ç')
    .replace(/&#039;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&#x26;/g, '&')
    .trim();
}

function normalizeName(str) {
  return decodeHtmlEntities(str)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

function normalizeCardNumber(numStr) {
  if (numStr === undefined || numStr === null) return '';
  const raw = String(numStr).trim().toUpperCase();
  // Strip "/total" if user or source has "136/189"
  const mainPart = raw.split('/')[0].trim();
  // If purely numeric, strip leading zeros ("001" -> "1")
  if (/^\d+$/.test(mainPart)) {
    return String(parseInt(mainPart, 10));
  }
  // If alphanumeric with leading zeros in number part like "TG01" or "SVE001", normalize to "TG1" / "SVE1"
  return mainPart.replace(/^([A-Z-]+)0+(\d+)$/, '$1$2');
}

function normalizeAlphaNum(numStr) {
  const main = normalizeCardNumber(numStr);
  return main.replace(/^([A-Z-]+)0+(\d+)$/, '$1$2');
}

function extractPureCardNumber(numStr) {
  if (numStr === undefined || numStr === null) return '';
  const mainPart = String(numStr).trim().toUpperCase().split('/')[0].trim();
  if (/^\d+$/.test(mainPart)) {
    return String(parseInt(mainPart, 10));
  }
  const m = mainPart.match(/^[A-Z-]+0*(\d+)$/);
  return m ? String(parseInt(m[1], 10)) : '';
}

function getCardPrefixPriority(localId, setId = '') {
  const raw = String(localId || '').trim().toUpperCase().split('/')[0].trim();
  if (/^\d+$/.test(raw)) return 0;
  const m = raw.match(/^([A-Z-]+)\d+[A-Z]*$/);
  const prefix = m ? m[1] : raw;
  const sId = String(setId || '').toLowerCase();
  if (sId === 'sve' && (prefix === 'SVE' || prefix === 'SV')) return 1;
  if (sId === 'mee' && prefix === 'MEE') return 1;
  if (sId.endsWith('tg') && prefix === 'TG') return 1;
  if (sId.endsWith('gg') && prefix === 'GG') return 1;
  if ((sId === 'swsh4.5sv' || sId === 'sma') && prefix === 'SV') return 1;
  if (prefix === sId.toUpperCase()) return 1;
  return 2;
}

function compareCardsByNumber(a, b, setId = '') {
  const prioA = getCardPrefixPriority(a.localId, setId);
  const prioB = getCardPrefixPriority(b.localId, setId);
  if (prioA !== prioB) return prioA - prioB;

  const prefA = (String(a.localId || '').toUpperCase().match(/^([A-Z-]+)/) || [''])[0];
  const prefB = (String(b.localId || '').toUpperCase().match(/^([A-Z-]+)/) || [''])[0];
  if (prioA === 2 && prefA !== prefB) {
    return prefA.localeCompare(prefB);
  }

  const numA = parseInt(extractPureCardNumber(a.localId), 10);
  const numB = parseInt(extractPureCardNumber(b.localId), 10);
  if (!isNaN(numA) && !isNaN(numB) && numA !== numB) return numA - numB;
  return String(a.localId || '').localeCompare(String(b.localId || ''));
}

function normalizeCardNameKey(str) {
  return decodeHtmlEntities(str)
    .replace(/\(#.*?\)/g, '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

const POKEMON_ELEMENT_COLORS = new Set(['G', 'R', 'W', 'L', 'P', 'F', 'D', 'M', 'O', 'N', 'Y']);

function normalizeLigaColor(rawColor) {
  if (!rawColor) return null;
  const c = String(rawColor).trim().toUpperCase();
  if (!c) return null;
  if (c === 'O') return 'N'; // LigaPokémon uses 'O' for Dragon (Dragão)
  if (POKEMON_ELEMENT_COLORS.has(c) || c === 'C' || c === 'E') return c;
  return null;
}

function detectEnergyElementFromName(namePt, nameEn) {
  const combined = `${namePt || ''} ${nameEn || ''}`.toLowerCase();
  if (/fogo|fire|igni[cç][aã]o|ignition|calor|heat|queimadura/.test(combined)) return 'R';
  if (/[aá]gua|water|borbulhante|bubbly|gelo|ice/.test(combined)) return 'W';
  if (/planta|grama|grass|folha|arom[aá]tica/.test(combined)) return 'G';
  if (/el[eé]tric|raios|lightning|rel[aâ]mpago|speed\s*l/.test(combined)) return 'L';
  if (/ps[ií]quic|psychic|mist[eé]rio|horror/.test(combined)) return 'P';
  if (/luta|fighting|pedra|strong/.test(combined)) return 'F';
  if (/escurid[aã]o|noturn|darkness|ocult/.test(combined)) return 'D';
  if (/metal|a[cç]o|magn[eé]tic|coating/.test(combined)) return 'M';
  if (/fada|fairy/.test(combined)) return 'Y';
  if (/drag[aã]o|dragon/.test(combined)) return 'N';
  return 'C';
}

function isEnergyCardByName(namePt, nameEn) {
  const cleanPt = String(namePt || '').replace(/\(#.*?\)/g, '').trim();
  const cleanEn = String(nameEn || '').replace(/\(#.*?\)/g, '').trim();
  if (/^(energia\b|basic\s+.*?\s+energy\b)/i.test(cleanPt) || /^(energia\b|basic\s+.*?\s+energy\b)/i.test(cleanEn)) {
    return true;
  }
  if (/\benergy$/i.test(cleanEn) && !/\b(recycler|retrieval|switch|search|loto|sticker|removal|restore|ark|charge)\b/i.test(cleanEn)) {
    return true;
  }
  return false;
}

function detectTrainerSubtypeHeuristic(namePt, nameEn) {
  const cleanPt = String(namePt || '').replace(/\(#.*?\)/g, '').trim();
  const cleanEn = String(nameEn || '').replace(/\(#.*?\)/g, '').trim();
  const combined = `${cleanPt} ${cleanEn}`;

  // Stadiums
  if (/\b(est[aá]dio|stadium|torre\b|tower\b|vale\b|valley|[aá]rvore grandiosa|grand tree|jaula de batalha|battle cage|pra[cç]a\b|plaza|gin[aá]sio|gym|laborat[oó]rio|lab\b|templo|temple|santu[aá]rio|shrine|quadra|court|praia|beach|caverna|cave|ru[ií]nas|ruins|[aá]rea zero|area zero|mesagoza|artazon|levincia| lago |lake\b)\b/i.test(combined)) {
    return { category: 'trainer', subCategory: 'stadium', elementType: null };
  }

  // Tools
  if (/\b(capacete|helmet|pingente|charm|amulet|faixa|band\b|belt|cinto|capa\b|cape|cloak|pedra selada|seal stone|bexiga|air balloon|[oó]culos|goggles|specs|patins|skates|colete|vest|mt:|tm:|technical machine|ferramenta|tool)\b/i.test(combined)) {
    return { category: 'trainer', subCategory: 'tool', elementType: null };
  }

  // Items
  if (/\b(bola\b|ball\b|po[cç][aã]o|potion|doce raro|rare candy|substitui[cç][aã]o|switch|poffin|pok[eé]\s*tablet|pok[eé]\s*pad|pok[eé]gear|pegador|catcher|maca noturna|night stretcher|vara de pescar|super rod|reciclador de energia|energy recycler|recupera[cç][aã]o|retrieval|recipiente terrestre|earthen vessel|carrinho|trolley|carimbo|stamp|cart[aã]o vermelho|red card|tomo\b|tome\b|fragmento|shard|incenso|incense|corda de fuga|escape rope|bloco de amigos|pal pad|gerador el[eé]trico|electric generator| flauta |flute|lanterna|lantern|apito|whistle|mapa|map\b|bicicleta|bike|bicycle|patins|substituto|robo)\b/i.test(combined)) {
    return { category: 'trainer', subCategory: 'item', elementType: null };
  }

  // Supporters
  if (/\b(ordem da chefia|boss's orders|pesquisa de professores|professor's research|determina[cç][aã]o da l[ií]lian|lillie's determination|show da roxie|roxie's performance|artimanha|scheme|cuspidor de fogo|firebreather|gar[cç]onete|waitress|surfista|surfer|juiz|judge|kissera|iono|arven|irida|crispin|ciphermaniac|briar|lacey|carmine|kieran|perrin|bianca|cheren|hilda|dawn|emma|tranquilidade do az|az's tranquility|philippe|apoiador|supporter)\b/i.test(combined)) {
    return { category: 'trainer', subCategory: 'supporter', elementType: null };
  }

  return null;
}

function parseLigaTypeString(ligaTypeStr, ligaColor, namePt, nameEn) {
  const normColor = normalizeLigaColor(ligaColor);
  if (!ligaTypeStr) return null;
  const t = String(ligaTypeStr).toLowerCase();
  if (t.includes('supporter') || t.includes('apoiador')) {
    return { category: 'trainer', subCategory: 'supporter', elementType: null };
  }
  if (t.includes('tool') || t.includes('ferramenta') || t.includes('technical machine')) {
    return { category: 'trainer', subCategory: 'tool', elementType: null };
  }
  if (t.includes('stadium') || t.includes('estádio') || t.includes('estadio')) {
    return { category: 'trainer', subCategory: 'stadium', elementType: null };
  }
  if (t.includes('trainer') || t.includes('treinador') || t.includes('item')) {
    return { category: 'trainer', subCategory: 'item', elementType: null };
  }
  if (t.includes('energy') || t.includes('energia')) {
    return { category: 'energy', subCategory: 'energy', elementType: detectEnergyElementFromName(namePt, nameEn) };
  }
  if (t.includes('pokémon') || t.includes('pokemon')) {
    return { category: 'pokemon', subCategory: 'pokemon', elementType: (normColor && normColor !== 'E') ? normColor : 'C' };
  }
  return null;
}

let cardTypesIndexCache = null;

function loadCachedCardTypesIndex() {
  if (cardTypesIndexCache) return cardTypesIndexCache;
  if (fs.existsSync(CARD_TYPES_INDEX_FILE)) {
    try {
      cardTypesIndexCache = JSON.parse(fs.readFileSync(CARD_TYPES_INDEX_FILE, 'utf8'));
      return cardTypesIndexCache;
    } catch {
      // ignore corrupted cache
    }
  }
  return { byId: {}, byName: {} };
}

function classifyCardMetadata(cardObj, setId = '') {
  const namePt = cardObj.namePt || '';
  const nameEn = cardObj.nameEn || '';
  const localId = String(cardObj.localId || '').trim();
  const normNum = cardObj.normNumber || normalizeCardNumber(localId);
  const normColor = normalizeLigaColor(cardObj.ligaColor || cardObj.elementType);

  // 1. Explicit Liga card page type string ('Trainer – Supporter', 'Trainer – Item', etc.)
  const fromLigaType = parseLigaTypeString(cardObj.ligaType, normColor, namePt, nameEn);
  if (fromLigaType) return fromLigaType;

  // 2. If Liga color is a specific non-Colorless Pokémon element ('G','R','W','L','P','F','D','M','N','Y'), it is 100% a Pokémon
  if (normColor && POKEMON_ELEMENT_COLORS.has(normColor)) {
    return { category: 'pokemon', subCategory: 'pokemon', elementType: normColor };
  }

  // 3. Check TCGdex Trainer & Energy Index by exact Card ID (<setId>-<localId>)
  const idx = loadCachedCardTypesIndex();
  const effectiveSetId = String(setId || cardObj.setId || '').toLowerCase();
  const pad3 = localId.padStart(3, '0');
  const idCandidates = [
    cardObj.id ? String(cardObj.id).toLowerCase() : '',
    effectiveSetId && localId ? `${effectiveSetId}-${localId.toLowerCase()}` : '',
    effectiveSetId && pad3 ? `${effectiveSetId}-${pad3.toLowerCase()}` : '',
    effectiveSetId && normNum ? `${effectiveSetId}-${String(normNum).toLowerCase()}` : ''
  ].filter(Boolean);

  for (const cand of idCandidates) {
    const hit = idx.byId?.[cand];
    if (hit) {
      return {
        category: hit.category,
        subCategory: hit.subCategory,
        elementType: hit.category === 'energy' ? detectEnergyElementFromName(namePt, nameEn) : null
      };
    }
  }

  // 4. Energy check by LigaColor === 'E' or card name pattern
  if (normColor === 'E' || isEnergyCardByName(namePt, nameEn)) {
    return {
      category: 'energy',
      subCategory: 'energy',
      elementType: detectEnergyElementFromName(namePt, nameEn)
    };
  }

  // 5. Trainer keyword/name heuristics or TCGdex Trainer name lookup (for Colorless/unknown LigaColor)
  if (!normColor || normColor === 'C') {
    const heur = detectTrainerSubtypeHeuristic(namePt, nameEn);
    if (heur) return heur;

    const nnEn = normalizeCardNameKey(nameEn);
    const nnPt = normalizeCardNameKey(namePt);
    const byNameHit = (nnEn && idx.byName?.[nnEn]) || (nnPt && idx.byName?.[nnPt]) || null;
    if (byNameHit) {
      return {
        category: byNameHit.category,
        subCategory: byNameHit.subCategory,
        elementType: byNameHit.category === 'energy' ? detectEnergyElementFromName(namePt, nameEn) : null
      };
    }
  }

  // 6. Default to Pokémon (Colorless or already known elementType)
  if (cardObj.category && cardObj.subCategory) {
    return {
      category: cardObj.category,
      subCategory: cardObj.subCategory,
      elementType: cardObj.category === 'pokemon' ? (normColor || 'C') : (cardObj.elementType || null)
    };
  }

  return {
    category: 'pokemon',
    subCategory: 'pokemon',
    elementType: (normColor && normColor !== 'E') ? normColor : 'C'
  };
}

function makeCardKey(setId, localId, variantCode = '0') {
  const rawSet = String(setId || '').trim().toLowerCase();
  const normSet = SET_ID_ALIASES[rawSet] || rawSet;
  const normLocal = normalizeAlphaNum(localId) || String(localId || '').trim().toUpperCase();
  const normVar = String(variantCode || '0').trim();
  return `${normSet}::${normLocal}::${normVar}`;
}

function normalizeCanonicalCardKey(rawKey) {
  const parts = String(rawKey || '').split('::');
  if (parts.length < 2) return String(rawKey || '').trim();
  return makeCardKey(parts[0], parts[1], parts[2] || '0');
}

// Persistent User Collection Database ("Minha Coleção" + Radar de Valorização)
function loadCollection() {
  if (fs.existsSync(COLLECTION_FILE)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(COLLECTION_FILE, 'utf8'));
      const rawItems = Array.isArray(parsed.items) ? parsed.items : [];
      const mergedByCanonicalKey = new Map();
      for (const item of rawItems) {
        if (!item || !item.setId || !item.localId) continue;
        const rawSetLower = String(item.setId).trim().toLowerCase();
        if (SET_ID_ALIASES[rawSetLower]) {
          item.setId = SET_ID_ALIASES[rawSetLower];
        }
        const canonicalKey = makeCardKey(item.setId, item.localId, item.variantCode || '0');
        item.cardKey = canonicalKey;
        item.normNumber = normalizeCardNumber(item.localId);
        const cls = classifyCardMetadata(item, item.setId);
        item.category = cls.category;
        item.subCategory = cls.subCategory;
        item.elementType = cls.elementType;
        if (mergedByCanonicalKey.has(canonicalKey)) {
          const existing = mergedByCanonicalKey.get(canonicalKey);
          existing.quantity = (Number(existing.quantity) || 1) + (Number(item.quantity) || 1);
        } else {
          mergedByCanonicalKey.set(canonicalKey, item);
        }
      }
      return {
        updatedAt: parsed.updatedAt || new Date().toISOString(),
        lastPriceSyncAt: parsed.lastPriceSyncAt || null,
        priceMode: parsed.priceMode || 'menor',
        autoSaveOnSessionAdd: Boolean(parsed.autoSaveOnSessionAdd),
        items: Array.from(mergedByCanonicalKey.values())
      };
    } catch {
      // fallback
    }
  }
  return {
    updatedAt: new Date().toISOString(),
    lastPriceSyncAt: null,
    priceMode: 'menor',
    autoSaveOnSessionAdd: false,
    items: []
  };
}

async function saveCollection(col, createBackup = false) {
  col.updatedAt = new Date().toISOString();
  await writeJsonAtomic(COLLECTION_FILE, col, createBackup ? COLLECTION_BACKUP_FILE : null);
  broadcastSSE('collection', col);
}

let userCollection = loadCollection();

function appendPriceHistorySnapshot(historyArr, pricesObj) {
  const list = Array.isArray(historyArr) ? [...historyArr] : [];
  const today = new Date().toISOString().slice(0, 10);
  const snapshot = {
    date: today,
    menor: roundCents(pricesObj.menor),
    medio: roundCents(pricesObj.medio),
    maior: roundCents(pricesObj.maior),
    sales3m: roundCents(pricesObj.sales3m)
  };
  if (list.length > 0 && list[list.length - 1].date === today) {
    list[list.length - 1] = snapshot;
  } else {
    list.push(snapshot);
  }
  return list.slice(-45); // keep last 45 daily snapshots
}

function upsertCardIntoCollection(payload, quantityDelta = 1) {
  const setId = String(payload.setId || '').trim();
  const localId = String(payload.localId || '').trim();
  const variantCode = String(payload.variantCode || '0').trim();
  if (!setId || !localId) {
    throw new Error('setId e localId são obrigatórios para salvar na coleção');
  }

  const cardKey = makeCardKey(setId, localId, variantCode);
  const incomingPrices = {
    menor: roundCents(payload.prices?.menor),
    medio: roundCents(payload.prices?.medio),
    maior: roundCents(payload.prices?.maior),
    sales3m: roundCents(payload.sales3m ?? payload.prices?.sales3m)
  };

  const now = new Date().toISOString();
  const existing = userCollection.items.find(
    i => i.cardKey === cardKey || normalizeCanonicalCardKey(i.cardKey) === cardKey
  );

  if (existing) {
    existing.cardKey = cardKey;
    const delta = Number(quantityDelta) || 1;
    existing.quantity = Math.max(1, (existing.quantity || 1) + delta);
    existing.updatedAt = now;
    if (payload.namePt) existing.namePt = payload.namePt;
    if (payload.nameEn) existing.nameEn = payload.nameEn;
    if (payload.rarity) existing.rarity = payload.rarity;
    if (payload.setName) existing.setName = payload.setName;
    if (payload.ligaAcronym) existing.ligaAcronym = payload.ligaAcronym;
    if (payload.image) existing.image = payload.image;
    if (payload.ligaUrl) existing.ligaUrl = payload.ligaUrl;
    if (payload.numberFormatted) existing.numberFormatted = payload.numberFormatted;
    if (payload.variantLabel) existing.variantLabel = payload.variantLabel;
    if (payload.ligaColor) existing.ligaColor = normalizeLigaColor(payload.ligaColor);
    if (payload.ligaType) existing.ligaType = payload.ligaType;
    const cls = classifyCardMetadata({ ...existing, ...payload }, setId);
    existing.category = cls.category;
    existing.subCategory = cls.subCategory;
    existing.elementType = cls.elementType;

    // If added earlier with 0 price and now has a valid price, initialize baseline priceAtAddition
    if ((existing.priceAtAddition?.menor || 0) === 0 && incomingPrices.menor > 0) {
      existing.priceAtAddition = { ...incomingPrices };
    }
    if (incomingPrices.menor > 0 || incomingPrices.medio > 0) {
      const prevMenor = existing.currentPrices?.menor || 0;
      if (prevMenor > 0 && Math.abs(prevMenor - incomingPrices.menor) >= 0.01) {
        existing.previousPrices = { ...existing.currentPrices };
      }
      existing.currentPrices = {
        menor: incomingPrices.menor,
        medio: incomingPrices.medio,
        maior: incomingPrices.maior,
        sales3m: incomingPrices.sales3m || existing.currentPrices?.sales3m || 0
      };
      existing.priceHistory = appendPriceHistorySnapshot(existing.priceHistory, existing.currentPrices);
    }
    return existing;
  }

  const cls = classifyCardMetadata(payload, setId);
  const newEntry = {
    cardKey,
    setId,
    setName: payload.setName || setId,
    ligaAcronym: payload.ligaAcronym || '',
    localId,
    normNumber: normalizeCardNumber(localId),
    numberFormatted: payload.numberFormatted || `#${localId}`,
    namePt: payload.namePt || `#${localId}`,
    nameEn: payload.nameEn || payload.namePt || `#${localId}`,
    rarity: payload.rarity || '',
    category: cls.category,
    subCategory: cls.subCategory,
    elementType: cls.elementType,
    ligaColor: normalizeLigaColor(payload.ligaColor) || null,
    ligaType: payload.ligaType || null,
    variantCode,
    variantLabel: payload.variantLabel || LIGA_EXTRAS_LABELS[variantCode] || 'Normal',
    image: payload.image || '',
    ligaUrl: payload.ligaUrl || '',
    quantity: Math.max(1, Number(quantityDelta) || 1),
    addedAt: now,
    updatedAt: now,
    priceAtAddition: { ...incomingPrices },
    previousPrices: { ...incomingPrices },
    currentPrices: { ...incomingPrices },
    priceHistory: appendPriceHistorySnapshot([], incomingPrices)
  };

  userCollection.items.unshift(newEntry);
  return newEntry;
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 15000) {
  const safeUrl = validateExternalUrl(url);
  const signal = AbortSignal.timeout(timeoutMs);
  return fetch(safeUrl, { ...options, signal });
}

async function fetchJson(url) {
  try {
    const text = await fetchTextViaCurl(url, 'application/json');
    if (text) return JSON.parse(text);
  } catch {
    // Fallback to Node fetch below
  }
  const res = await fetchWithTimeout(url, {
    headers: { 'User-Agent': USER_AGENT, 'Accept': 'application/json' }
  }, 10000);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return await res.json();
}

function isCloudflareBlocked(html) {
  if (!html || typeof html !== 'string') return true;
  return (
    html.includes('<title>Attention Required! | Cloudflare</title>') ||
    html.includes('<title>Just a moment...</title>') ||
    html.includes('<title>Um momento...</title>') ||
    html.includes('cf-browser-verification') ||
    html.includes('window._cf_chl_opt')
  );
}

// Balanced bracket/brace extractor for JavaScript variables embedded in LigaPokemon HTML
function extractEmbeddedJson(html, varName) {
  if (!html || !varName) return null;
  const escapedVar = varName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const assignRegex = new RegExp(`(?:var|let|const)?\\s*\\b${escapedVar}\\b\\s*=\\s*([\\[{])`);
  const match = assignRegex.exec(html);
  if (!match) return null;

  const startIdx = match.index + match[0].length - 1;
  const openChar = html[startIdx];
  const closeChar = openChar === '[' ? ']' : '}';

  let depth = 0;
  let inString = false;
  let stringQuote = '';
  let isEscaped = false;

  for (let i = startIdx; i < html.length; i++) {
    const ch = html[i];
    if (isEscaped) {
      isEscaped = false;
      continue;
    }
    if (inString) {
      if (ch === '\\') {
        isEscaped = true;
      } else if (ch === stringQuote) {
        inString = false;
      }
      continue;
    }
    if (ch === '"' || ch === "'") {
      inString = true;
      stringQuote = ch;
      continue;
    }
    if (ch === openChar) {
      depth++;
    } else if (ch === closeChar) {
      depth--;
      if (depth === 0) {
        const jsonCandidate = html.slice(startIdx, i + 1);
        try {
          return JSON.parse(jsonCandidate);
        } catch {
          break;
        }
      }
    }
  }

  // Fallback to non-greedy regex if balanced scan failed
  const fallbackRegex = new RegExp(`${escapedVar}\\s*=\\s*(${openChar === '[' ? '\\[.*?\\]' : '\\{.*?\\}'});`, 's');
  const fbMatch = html.match(fallbackRegex);
  if (fbMatch) {
    try {
      return JSON.parse(fbMatch[1]);
    } catch {
      return null;
    }
  }
  return null;
}

function fetchTextViaCurl(url, acceptHeader = 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8') {
  const safeUrl = validateExternalUrl(url);
  return new Promise((resolve, reject) => {
    execFile(
      'curl.exe',
      [
        '-s',
        '-L',
        '--compressed',
        '--max-time', '20',
        '--proto', '=http,https',
        '-A', USER_AGENT,
        '-H', `Accept: ${acceptHeader}`,
        '-H', 'Accept-Language: pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        '--',
        safeUrl
      ],
      { encoding: 'utf8', maxBuffer: 25 * 1024 * 1024, windowsHide: true },
      (err, stdout) => {
        if (err || !stdout) {
          return reject(err || new Error('Empty response from curl.exe'));
        }
        resolve(stdout);
      }
    );
  });
}

async function fetchText(url) {
  const safeUrl = validateExternalUrl(url);
  // Use Windows native curl.exe first so Schannel TLS passes LigaPokemon's Cloudflare check
  try {
    const html = await fetchTextViaCurl(safeUrl);
    if (html && !isCloudflareBlocked(html)) {
      return html;
    }
  } catch {
    // fallback to fetch below
  }

  const res = await fetchWithTimeout(safeUrl, {
    headers: {
      'User-Agent': USER_AGENT,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7'
    }
  }, 20000);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${safeUrl}`);
  const text = await res.text();
  if (isCloudflareBlocked(text)) {
    throw new Error('Acesso temporariamente bloqueado pelo Cloudflare na LigaPokémon.');
  }
  return text;
}

// Fetch LigaPokemon editions list
async function fetchLigaEditions() {
  const html = await fetchText('https://www.ligapokemon.com.br/?view=cards/edicoes');
  const parsed = extractEmbeddedJson(html, 'jsonEditions');
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Não foi possível encontrar jsonEditions na LigaPokémon');
  }
  const auxList = Array.isArray(parsed.aux)
    ? parsed.aux
    : Object.values(parsed.aux || {}).flat();
  const all = [...(parsed.main || []), ...auxList];
  return all.map(ed => ({
    ligaId: String(ed.id),
    acronym: decodeHtmlEntities(ed.acronym || ''),
    namePt: decodeHtmlEntities(ed.namept || ed.name || ''),
    nameEn: decodeHtmlEntities(ed.nameen || ''),
    namePtSa: decodeHtmlEntities(ed.nameptsa || ''),
    releaseDate: ed.dtrelease ? ed.dtrelease.split(' ')[0] : null,
    icon: resolveLigaAssetUrl(ed.icon)
  }));
}

// Reconcile cached catalog sets with latest SPECIAL_SET_MAP and NO_LIGA_TCGDEX_SETS without full network rebuild
function reconcileCatalogLigaMappings(catalog) {
  if (!catalog || !Array.isArray(catalog.sets) || !Array.isArray(catalog.ligaEditions)) {
    return false;
  }
  const ligaEditions = catalog.ligaEditions;
  const matchedLigaIds = new Set();
  const hybridSets = catalog.sets.filter(s => s.source === 'hybrid');

  for (const s of hybridSets) {
    const id = s.id;
    if (NO_LIGA_TCGDEX_SETS.has(id)) {
      s.liga = null;
      s.symbol = s.tcgdexSymbol || null;
      continue;
    }

    let ligaMatch = null;
    const specialAcronym = SPECIAL_SET_MAP[id];
    if (specialAcronym) {
      ligaMatch = ligaEditions.find(l => l.acronym.toUpperCase() === specialAcronym.toUpperCase()) || null;
    }
    if (!ligaMatch) {
      const normPt = normalizeName(s.namePt);
      const normEn = normalizeName(s.nameEn);
      ligaMatch = ligaEditions.find(l =>
        (normEn && normalizeName(l.nameEn) === normEn) ||
        (normPt && normalizeName(l.namePt) === normPt) ||
        (normPt && normalizeName(l.namePtSa) === normPt)
      ) || null;
    }
    if (!ligaMatch) {
      ligaMatch = ligaEditions.find(l =>
        !matchedLigaIds.has(l.ligaId) &&
        l.acronym &&
        l.acronym.toLowerCase() === id.toLowerCase()
      ) || null;
    }

    if (ligaMatch) {
      matchedLigaIds.add(ligaMatch.ligaId);
      s.liga = {
        ligaId: ligaMatch.ligaId,
        acronym: ligaMatch.acronym,
        namePt: ligaMatch.namePt,
        nameEn: ligaMatch.nameEn,
        releaseDate: ligaMatch.releaseDate,
        icon: ligaMatch.icon
      };
      s.symbol = ligaMatch.icon || s.tcgdexSymbol || s.symbol || null;
    } else {
      s.liga = null;
      s.symbol = s.tcgdexSymbol || null;
    }
  }

  // Rebuild liga-only sets excluding any Liga edition now matched to a hybrid TCGdex set
  const ligaOnlySets = [];
  for (const l of ligaEditions) {
    if (!matchedLigaIds.has(l.ligaId)) {
      const customId = `liga-${l.acronym || l.ligaId}`.toLowerCase().replace(/[^a-z0-9-_]/g, '');
      ligaOnlySets.push({
        id: customId,
        source: 'liga-only',
        tcgdexId: null,
        namePt: l.namePt || l.nameEn || l.acronym,
        nameEn: l.nameEn || l.namePt || l.acronym,
        hasPtTcgdex: false,
        logo: null,
        symbol: l.icon,
        cardCount: { total: 0, official: 0 },
        liga: {
          ligaId: l.ligaId,
          acronym: l.acronym,
          namePt: l.namePt,
          nameEn: l.nameEn,
          releaseDate: l.releaseDate,
          icon: l.icon
        }
      });
    }
  }

  catalog.sets = [...ligaOnlySets.reverse(), ...hybridSets];
  catalog.totalSets = catalog.sets.length;
  catalog.schemaVersion = CATALOG_SCHEMA_VERSION;
  return true;
}

// Build or refresh the unified Catalog (TCGdex PT + EN + LigaPokemon)
async function buildCatalog(forceRefresh = false) {
  let prevCached = null;
  if (fs.existsSync(CATALOG_FILE)) {
    try {
      prevCached = JSON.parse(fs.readFileSync(CATALOG_FILE, 'utf8'));
    } catch {
      prevCached = null;
    }
  }
  if (!forceRefresh && prevCached && Array.isArray(prevCached.sets) && prevCached.sets.length > 0) {
    if (prevCached.schemaVersion !== CATALOG_SCHEMA_VERSION && reconcileCatalogLigaMappings(prevCached)) {
      await writeJsonAtomic(CATALOG_FILE, prevCached);
    }
    return annotateCatalogWithOfflineStatus(prevCached);
  }

  console.log('[Catalog] Sincronizando catálogo com TCGdex (PT/EN) e LigaPokémon...');
  const [ptSetsRes, enSetsRes, ligaEditionsRes] = await Promise.allSettled([
    fetchJson('https://api.tcgdex.net/v2/pt/sets'),
    fetchJson('https://api.tcgdex.net/v2/en/sets'),
    fetchLigaEditions()
  ]);

  const ptSets = ptSetsRes.status === 'fulfilled' && Array.isArray(ptSetsRes.value) ? ptSetsRes.value : [];
  const enSets = enSetsRes.status === 'fulfilled' && Array.isArray(enSetsRes.value) ? enSetsRes.value : [];
  const ligaEditions = (ligaEditionsRes.status === 'fulfilled' && Array.isArray(ligaEditionsRes.value) && ligaEditionsRes.value.length > 0)
    ? ligaEditionsRes.value
    : (prevCached?.ligaEditions || []);

  if (ptSets.length === 0 && enSets.length === 0 && prevCached?.sets?.length > 0) {
    return annotateCatalogWithOfflineStatus(prevCached);
  }

  const ptMap = new Map(ptSets.map(s => [s.id, s]));
  const enMap = new Map(enSets.map(s => [s.id, s]));

  // Combine all TCGdex sets (prioritize sets in PT, but also include EN sets)
  const allTcgdexIds = Array.from(new Set([...ptSets.map(s => s.id), ...enSets.map(s => s.id)]));
  const matchedLigaIds = new Set();
  const sets = [];

  for (const id of allTcgdexIds) {
    const pt = ptMap.get(id);
    const en = enMap.get(id);
    const namePt = pt ? pt.name : (en ? en.name : id);
    const nameEn = en ? en.name : (pt ? pt.name : id);
    const normPt = normalizeName(namePt);
    const normEn = normalizeName(nameEn);

    let ligaMatch = null;
    if (!NO_LIGA_TCGDEX_SETS.has(id)) {
      const specialAcronym = SPECIAL_SET_MAP[id];
      if (specialAcronym) {
        ligaMatch = ligaEditions.find(l => l.acronym.toUpperCase() === specialAcronym.toUpperCase());
      }
      if (!ligaMatch) {
        ligaMatch = ligaEditions.find(l =>
          (normEn && normalizeName(l.nameEn) === normEn) ||
          (normPt && normalizeName(l.namePt) === normPt) ||
          (normPt && normalizeName(l.namePtSa) === normPt)
        );
      }
      if (!ligaMatch) {
        ligaMatch = ligaEditions.find(l =>
          !matchedLigaIds.has(l.ligaId) &&
          l.acronym &&
          l.acronym.toLowerCase() === id.toLowerCase()
        );
      }
    }

    if (ligaMatch) {
      matchedLigaIds.add(ligaMatch.ligaId);
    }

    const baseObj = pt || en;
    sets.push({
      id,
      source: 'hybrid',
      tcgdexId: id,
      namePt,
      nameEn,
      hasPtTcgdex: Boolean(pt),
      logo: baseObj?.logo ? `${baseObj.logo}.webp` : null,
      symbol: ligaMatch?.icon || (baseObj?.symbol ? `${baseObj.symbol}.webp` : null),
      tcgdexSymbol: baseObj?.symbol ? `${baseObj.symbol}.webp` : null,
      cardCount: baseObj?.cardCount || { total: 0, official: 0 },
      liga: ligaMatch ? {
        ligaId: ligaMatch.ligaId,
        acronym: ligaMatch.acronym,
        namePt: ligaMatch.namePt,
        nameEn: ligaMatch.nameEn,
        releaseDate: ligaMatch.releaseDate,
        icon: ligaMatch.icon
      } : null
    });
  }

  // Also add LigaPokemon editions that were not in TCGdex (so every Brazilian/JP/special edition is accessible!)
  for (const l of ligaEditions) {
    if (!matchedLigaIds.has(l.ligaId)) {
      const customId = `liga-${l.acronym || l.ligaId}`.toLowerCase().replace(/[^a-z0-9-_]/g, '');
      sets.push({
        id: customId,
        source: 'liga-only',
        tcgdexId: null,
        namePt: l.namePt || l.nameEn || l.acronym,
        nameEn: l.nameEn || l.namePt || l.acronym,
        hasPtTcgdex: false,
        logo: null,
        symbol: l.icon,
        cardCount: { total: 0, official: 0 },
        liga: {
          ligaId: l.ligaId,
          acronym: l.acronym,
          namePt: l.namePt,
          nameEn: l.nameEn,
          releaseDate: l.releaseDate,
          icon: l.icon
        }
      });
    }
  }

  // Reverse order so newest sets appear first by default
  sets.reverse();

  const catalog = {
    schemaVersion: CATALOG_SCHEMA_VERSION,
    updatedAt: new Date().toISOString(),
    totalSets: sets.length,
    ligaEditions,
    sets
  };

  await writeJsonAtomic(CATALOG_FILE, catalog);
  return annotateCatalogWithOfflineStatus(catalog);
}

function findExistingLocalImage(setId, localId) {
  let safeSetId;
  try {
    safeSetId = sanitizeSetId(setId);
  } catch {
    return null;
  }
  const safeLocalId = String(localId).replace(/[^a-zA-Z0-9_-]/g, '_');
  const setImgDir = resolveSafeChildPath(IMAGES_DIR, safeSetId);
  if (!setImgDir) return null;
  for (const ext of ['.webp', '.jpg', '.png']) {
    const fileName = `${safeLocalId}${ext}`;
    const filePath = resolveSafeChildPath(setImgDir, fileName);
    if (filePath && fs.existsSync(filePath) && fs.statSync(filePath).size > 500) {
      return `/data/images/${safeSetId}/${fileName}`;
    }
  }
  return null;
}

// In-memory cache of offline set status indexed by setId -> { mtimeMs, offlineInfo }
const setOfflineStatusCache = new Map();

function annotateCatalogWithOfflineStatus(catalog) {
  const annotatedSets = catalog.sets.map(s => {
    let setFile = null;
    try {
      const safeId = sanitizeSetId(s.id);
      setFile = resolveSafeChildPath(SETS_DIR, `${safeId}.json`);
    } catch {
      setFile = null;
    }

    let offlineInfo = {
      isOffline: false,
      isCached: false,
      offlineCardCount: 0,
      offlineImagesCount: 0,
      pricesUpdatedAt: null,
      downloadedAt: null
    };

    if (setFile && fs.existsSync(setFile)) {
      try {
        const stat = fs.statSync(setFile);
        const cachedEntry = setOfflineStatusCache.get(s.id);
        if (cachedEntry && cachedEntry.mtimeMs === stat.mtimeMs) {
          offlineInfo = cachedEntry.offlineInfo;
        } else {
          const data = JSON.parse(fs.readFileSync(setFile, 'utf8'));
          const cards = data.cards || [];
          const imgCount = cards.filter(c => c.localImage).length;
          const isFullyOffline = Boolean(data.isOfflineBackup) || (cards.length > 0 && imgCount > 0);
          offlineInfo = {
            isOffline: isFullyOffline,
            isCached: true,
            offlineCardCount: cards.length,
            offlineImagesCount: imgCount,
            pricesUpdatedAt: data.pricesUpdatedAt || null,
            downloadedAt: isFullyOffline ? (data.downloadedAt || null) : null
          };
          setOfflineStatusCache.set(s.id, { mtimeMs: stat.mtimeMs, offlineInfo });
        }
      } catch {
        // ignore corrupted file
      }
    } else {
      setOfflineStatusCache.delete(s.id);
    }

    const resolvedSymbol = s.liga?.icon ? resolveLigaAssetUrl(s.liga.icon) : (s.symbol || null);
    return { ...s, symbol: resolvedSymbol, offline: offlineInfo };
  });

  return { ...catalog, sets: annotatedSets };
}

// Fetch cardsjson from LigaPokemon for a given Liga edition (id + acronym)
async function fetchLigaSetCards(ligaId, acronym) {
  if (!ligaId || !acronym) return [];
  const url = `https://www.ligapokemon.com.br/?view=cards/search&card=edid=${encodeURIComponent(ligaId)}%20ed=${encodeURIComponent(acronym)}`;
  const html = await fetchText(url);
  const rawCards = extractEmbeddedJson(html, 'cardsjson');
  if (!Array.isArray(rawCards)) return [];
  try {
    return rawCards.map(c => {
      const imgUrl = resolveLigaAssetUrl(c.sP);
      const menor = parseFloat(c.p1a || c.precoMenor || '0') || 0;
      const medio = parseFloat(c.p1b || '0') || 0;
      const maior = parseFloat(c.p1c || c.precoMaior || '0') || 0;
      return {
        ligaCardId: c.id,
        acronym: c.sSigla || acronym,
        ligaEdId: c.idE || ligaId,
        number: String(c.sN || '').trim(),
        namePt: decodeHtmlEntities(c.nPT || c.nEN || ''),
        nameEnFull: decodeHtmlEntities(c.nEN || ''),
        rarityCode: c.iR,
        rarityLabel: LIGA_RARITY_LABELS[c.iR] || '',
        ligaColor: normalizeLigaColor(c.sC),
        image: imgUrl,
        prices: {
          menor,
          medio,
          maior
        },
        ligaUrl: `https://www.ligapokemon.com.br/?view=cards/card&card=${encodeURIComponent(decodeHtmlEntities(c.nEN || c.nPT || ''))}&ed=${encodeURIComponent(c.sSigla || acronym)}&num=${encodeURIComponent(String(c.sN || ''))}`
      };
    });
  } catch (err) {
    console.error('[Liga] Erro ao parsear cardsjson:', err.message);
    return [];
  }
}

// Subset filters for TCGdex sets that share a parent LigaPokemon edition
const SUBSET_LIGA_FILTERS = {
  'sma': c => /^SV\d+/i.test(c.number),
  'rc': c => /^RC\d+/i.test(c.number),
  'exu': c => Boolean(c.number) && !/^\d+$/.test(c.number)
};

// Fetch and merge complete Set data (TCGdex PT/EN + LigaPokemon prices)
async function fetchAndMergeSet(rawSetId, existingSetData = null) {
  const setId = sanitizeSetId(rawSetId);
  const catalog = await buildCatalog(false);
  const catalogEntry = catalog.sets.find(s => s.id === setId);
  if (!catalogEntry && !existingSetData) {
    throw new Error(`Coleção '${setId}' não encontrada no catálogo.`);
  }

  const tcgdexId = catalogEntry?.tcgdexId ?? existingSetData?.tcgdexId;
  const ligaInfo = catalogEntry?.liga ?? existingSetData?.liga;

  // Discard cached cards if existingSetData was linked to a different LigaPokemon edition (e.g. 'mee' previously linked to 'MEE' 815 instead of 'MEEb' 737)
  const isSameLigaEdition = !existingSetData?.liga?.ligaId || !ligaInfo?.ligaId || String(existingSetData.liga.ligaId) === String(ligaInfo.ligaId);
  const safeExistingCards = isSameLigaEdition ? (existingSetData?.cards || []) : [];

  let ptSet = null;
  let enSet = null;
  let ligaCards = [];

  const tasks = [];
  if (tcgdexId) {
    tasks.push(
      fetchJson(`https://api.tcgdex.net/v2/pt/sets/${encodeURIComponent(tcgdexId)}`).then(r => { ptSet = r; }).catch(() => {}),
      fetchJson(`https://api.tcgdex.net/v2/en/sets/${encodeURIComponent(tcgdexId)}`).then(r => { enSet = r; }).catch(() => {})
    );
  }
  if (ligaInfo?.ligaId && ligaInfo?.acronym) {
    tasks.push(
      fetchLigaSetCards(ligaInfo.ligaId, ligaInfo.acronym).then(r => { ligaCards = r; }).catch(() => {})
    );
  }

  await Promise.all(tasks);

  if (SUBSET_LIGA_FILTERS[setId] && ligaCards.length > 0) {
    ligaCards = ligaCards.filter(SUBSET_LIGA_FILTERS[setId]);
  }

  // Sort Liga cards by prefix priority & numeric order (so e.g. in 'sve' SVE001..SVE016 and SV017..SV024 come first before CH/SF/UPC)
  ligaCards.sort((a, b) => compareCardsByNumber({ localId: a.number }, { localId: b.number }, setId));

  // Build map of Liga cards by normalized number, alphanumeric, and pure number fallback
  const ligaByNormNum = new Map();
  const ligaByAlphaNum = new Map();
  const ligaByPureNum = new Map();
  for (const lc of ligaCards) {
    const k1 = normalizeCardNumber(lc.number);
    const k2 = normalizeAlphaNum(lc.number);
    const kPure = extractPureCardNumber(lc.number);
    if (k1 && !ligaByNormNum.has(k1)) ligaByNormNum.set(k1, lc);
    if (k2 && !ligaByAlphaNum.has(k2)) ligaByAlphaNum.set(k2, lc);
    if (kPure && !ligaByPureNum.has(kPure)) ligaByPureNum.set(kPure, lc);
  }

  const ptCardsMap = new Map((ptSet?.cards || []).map(c => [c.localId, c]));
  const enCardsMap = new Map((enSet?.cards || []).map(c => [c.localId, c]));
  const existingCardsMap = new Map(safeExistingCards.map(c => [c.localId, c]));

  const hasPtSetImages = (ptSet?.cards || []).some(c => Boolean(c.image));
  const tcgdexHasAnyImage = hasPtSetImages || (enSet?.cards || []).some(c => Boolean(c.image));

  // If TCGdex has zero images for this set (e.g. sve, mee, swsh4.5sv, 30th-c) and LigaPokemon has the full card list + images + real card numbers, use LigaPokemon directly
  const allLocalIds = (!tcgdexHasAnyImage && ligaCards.length > 0)
    ? []
    : Array.from(new Set([
        ...(ptSet?.cards || []).map(c => c.localId),
        ...(enSet?.cards || []).map(c => c.localId)
      ]));

  const mergedCards = [];
  const matchedLigaNumbers = new Set();

  for (const localId of allLocalIds) {
    const ptCard = ptCardsMap.get(localId);
    const enCard = enCardsMap.get(localId);
    const prevCard = existingCardsMap.get(localId);

    const k1 = normalizeCardNumber(localId);
    const k2 = normalizeAlphaNum(localId);
    const kPure = extractPureCardNumber(localId);
    const ligaCard = ligaByNormNum.get(k1) || ligaByAlphaNum.get(k2) || (kPure ? ligaByPureNum.get(kPure) : null) || null;
    if (ligaCard) {
      matchedLigaNumbers.add(ligaCard.number);
    }

    const ptImg = ptCard?.image
      ? `${ptCard.image}/high.webp`
      : (hasPtSetImages && enCard?.image ? `${enCard.image.replace('/en/', '/pt/')}/high.webp` : null);
    const enImg = enCard?.image ? `${enCard.image}/high.webp` : null;
    const ligaImg = ligaCard?.image || resolveLigaAssetUrl(prevCard?.imageLiga);

    const cardId = ptCard?.id || enCard?.id || `${setId}-${localId}`;
    const cardNamePt = ptCard?.name || ligaCard?.namePt || enCard?.name || `#${localId}`;
    const cardNameEn = enCard?.name || ligaCard?.nameEnFull || ptCard?.name || `#${localId}`;
    const cardLigaColor = ligaCard?.ligaColor || prevCard?.ligaColor || null;
    const cardLigaType = prevCard?.ligaType || null;
    const cls = classifyCardMetadata({
      id: cardId,
      setId: tcgdexId || setId,
      localId: String(localId),
      normNumber: k1,
      namePt: cardNamePt,
      nameEn: cardNameEn,
      ligaColor: cardLigaColor,
      ligaType: cardLigaType,
      category: prevCard?.category,
      subCategory: prevCard?.subCategory,
      elementType: prevCard?.elementType
    }, tcgdexId || setId);

    mergedCards.push({
      id: cardId,
      localId: String(localId),
      normNumber: k1,
      namePt: cardNamePt,
      nameEn: cardNameEn,
      rarity: ligaCard?.rarityLabel || prevCard?.rarity || '',
      category: cls.category,
      subCategory: cls.subCategory,
      elementType: cls.elementType,
      ligaColor: cardLigaColor,
      ligaType: cardLigaType,
      imagePt: ptImg,
      imageEn: enImg,
      imageLiga: ligaImg,
      localImage: prevCard?.localImage || findExistingLocalImage(setId, localId),
      pricesBRL: ligaCard ? ligaCard.prices : (prevCard?.pricesBRL || { menor: 0, medio: 0, maior: 0 }),
      variantPricesBRL: prevCard?.variantPricesBRL || null,
      salesLast3Months: prevCard?.salesLast3Months || null,
      ligaUrl: ligaCard?.ligaUrl || prevCard?.ligaUrl || (ligaInfo?.acronym ? `https://www.ligapokemon.com.br/?view=cards/search&card=${encodeURIComponent(`ed=${ligaInfo.acronym} ${localId}`)}` : null),
      ligaCardNumber: ligaCard?.number || String(localId)
    });
  }

  // Also include any Liga cards that weren't in TCGdex (e.g. secret rares, promos, or Liga-only sets)
  for (const lc of ligaCards) {
    if (!matchedLigaNumbers.has(lc.number)) {
      const prevCard = existingCardsMap.get(lc.number);
      const cardId = `${setId}-${lc.number}`;
      const cardNamePt = lc.namePt || lc.nameEnFull || `#${lc.number}`;
      const cardNameEn = lc.nameEnFull || lc.namePt || `#${lc.number}`;
      const cardLigaColor = lc.ligaColor || prevCard?.ligaColor || null;
      const cardLigaType = prevCard?.ligaType || null;
      const cls = classifyCardMetadata({
        id: cardId,
        setId: tcgdexId || setId,
        localId: lc.number,
        normNumber: normalizeCardNumber(lc.number),
        namePt: cardNamePt,
        nameEn: cardNameEn,
        ligaColor: cardLigaColor,
        ligaType: cardLigaType,
        category: prevCard?.category,
        subCategory: prevCard?.subCategory,
        elementType: prevCard?.elementType
      }, tcgdexId || setId);

      mergedCards.push({
        id: cardId,
        localId: lc.number,
        normNumber: normalizeCardNumber(lc.number),
        namePt: cardNamePt,
        nameEn: cardNameEn,
        rarity: lc.rarityLabel || prevCard?.rarity || '',
        category: cls.category,
        subCategory: cls.subCategory,
        elementType: cls.elementType,
        ligaColor: cardLigaColor,
        ligaType: cardLigaType,
        imagePt: null,
        imageEn: null,
        imageLiga: lc.image,
        localImage: prevCard?.localImage || findExistingLocalImage(setId, lc.number),
        pricesBRL: lc.prices,
        variantPricesBRL: prevCard?.variantPricesBRL || null,
        salesLast3Months: prevCard?.salesLast3Months || null,
        ligaUrl: lc.ligaUrl,
        ligaCardNumber: lc.number
      });
    }
  }

  mergedCards.sort((a, b) => compareCardsByNumber(a, b, setId));

  let ligaOfficialCount = 0;
  for (const lc of ligaCards) {
    const mOff = String(lc.nameEnFull || '').match(/\(#\d+\/(\d+)\)/);
    if (mOff) {
      ligaOfficialCount = parseInt(mOff[1], 10) || 0;
      if (ligaOfficialCount > 0) break;
    }
  }
  const officialCount = ptSet?.cardCount?.official || enSet?.cardCount?.official || catalogEntry?.cardCount?.official || ligaOfficialCount || mergedCards.length;
  const totalCount = Math.max(mergedCards.length, ptSet?.cardCount?.total || enSet?.cardCount?.total || 0);
  const localImgCount = mergedCards.filter(c => c.localImage).length;
  const isOfflineBackup = Boolean(existingSetData?.isOfflineBackup) || localImgCount > 0;

  const result = {
    id: setId,
    tcgdexId: tcgdexId || null,
    namePt: ptSet?.name || catalogEntry?.namePt || existingSetData?.namePt || setId,
    nameEn: enSet?.name || catalogEntry?.nameEn || existingSetData?.nameEn || setId,
    releaseDate: ptSet?.releaseDate || enSet?.releaseDate || ligaInfo?.releaseDate || null,
    logo: (ptSet?.logo || enSet?.logo) ? `${ptSet?.logo || enSet?.logo}.webp` : (catalogEntry?.logo || null),
    symbol: ligaInfo?.icon || catalogEntry?.liga?.icon || ((ptSet?.symbol || enSet?.symbol) ? `${ptSet?.symbol || enSet?.symbol}.webp` : (catalogEntry?.symbol || null)),
    cardCount: {
      official: officialCount,
      total: totalCount
    },
    liga: ligaInfo || null,
    isOfflineBackup,
    downloadedAt: isOfflineBackup ? (existingSetData?.downloadedAt || new Date().toISOString()) : null,
    pricesUpdatedAt: new Date().toISOString(),
    cards: mergedCards
  };

  return result;
}

// Download a single card image with fallback (PT TCGdex -> LigaPokemon -> EN TCGdex)
async function downloadCardImage(rawSetId, card) {
  const setId = sanitizeSetId(rawSetId);
  const setImgDir = resolveSafeChildPath(IMAGES_DIR, setId);
  if (!setImgDir) {
    throw new Error(`Diretório de imagens inválido para a coleção '${setId}'`);
  }
  if (!fs.existsSync(setImgDir)) {
    fs.mkdirSync(setImgDir, { recursive: true });
  }

  const safeLocalId = String(card.localId).replace(/[^a-zA-Z0-9_-]/g, '_');
  const candidates = [
    { url: card.imagePt, ext: '.webp' },
    { url: card.imageLiga, ext: '.jpg' },
    { url: card.imageEn, ext: '.webp' }
  ].filter(c => Boolean(c.url));

  for (const cand of candidates) {
    const fileName = `${safeLocalId}${cand.ext}`;
    const filePath = resolveSafeChildPath(setImgDir, fileName);
    if (!filePath) continue;
    const publicPath = `/data/images/${setId}/${fileName}`;

    if (fs.existsSync(filePath) && fs.statSync(filePath).size > 500) {
      return publicPath;
    }

    try {
      const res = await fetchWithTimeout(cand.url, { headers: { 'User-Agent': USER_AGENT } }, 15000);
      if (res.ok) {
        const buf = Buffer.from(await res.arrayBuffer());
        if (buf.length > 500) {
          fs.writeFileSync(filePath, buf);
          return publicPath;
        }
      }
    } catch {
      // try next candidate
    }
  }
  return null;
}

// Download entire set offline (JSON + all card images in parallel batches)
async function downloadSetOffline(rawSetId, downloadImages = true) {
  const setId = sanitizeSetId(rawSetId);
  return withSetLock(setId, async () => {
    const setFile = resolveSafeChildPath(SETS_DIR, `${setId}.json`);
    if (!setFile) throw new Error(`Caminho inválido para a coleção '${setId}'`);
    const existing = fs.existsSync(setFile) ? JSON.parse(fs.readFileSync(setFile, 'utf8')) : null;

    broadcastSSE('download-progress', {
      setId,
      stage: 'metadata',
      message: 'Buscando cartas na TCGdex e preços em R$ na LigaPokémon...',
      current: 0,
      total: 100
    });

    const setData = await fetchAndMergeSet(setId, existing);
    await writeJsonAtomic(setFile, setData);

    if (downloadImages && setData.cards.length > 0) {
      const total = setData.cards.length;
      let completed = 0;
      const batchSize = 10;

      for (let i = 0; i < total; i += batchSize) {
        const batch = setData.cards.slice(i, i + batchSize);
        await Promise.all(batch.map(async (card) => {
          const localImg = await downloadCardImage(setId, card);
          if (localImg) {
            card.localImage = localImg;
          }
          completed++;
        }));

        broadcastSSE('download-progress', {
          setId,
          stage: 'images',
          message: `Baixando imagens para backup offline (${completed}/${total})...`,
          current: completed,
          total
        });
      }

      setData.isOfflineBackup = true;
      setData.downloadedAt = new Date().toISOString();
      await writeJsonAtomic(setFile, setData);
    }

    broadcastSSE('download-progress', {
      setId,
      stage: 'done',
      message: `Coleção ${setData.namePt} salva offline com sucesso!`,
      current: setData.cards.length,
      total: setData.cards.length
    });

    return setData;
  });
}

// Fetch detailed variant prices (Normal, Reverse Foil, Foil, Pokeball, Master Ball) + Last Sales from LigaPokemon card page
async function fetchCardVariantsFromLiga(rawSetId, localId) {
  const setId = sanitizeSetId(rawSetId);
  const setFile = resolveSafeChildPath(SETS_DIR, `${setId}.json`);
  if (!setFile) throw new Error(`Caminho inválido para a coleção '${setId}'`);

  let setData = null;
  if (fs.existsSync(setFile)) {
    setData = JSON.parse(fs.readFileSync(setFile, 'utf8'));
  } else {
    setData = await fetchAndMergeSet(setId);
  }

  const normTarget = normalizeCardNumber(localId);
  const alphaTarget = normalizeAlphaNum(localId);
  const card = setData.cards.find(
    c => String(c.localId) === String(localId) || c.normNumber === normTarget || normalizeAlphaNum(c.localId) === alphaTarget
  );
  if (!card) throw new Error('Carta não encontrada na coleção');

  const acronym = setData.liga?.acronym;
  const ligaId = setData.liga?.ligaId;
  if (!acronym) {
    return { variants: {}, card, salesLast3Months: null };
  }

  const url = card.ligaUrl || `https://www.ligapokemon.com.br/?view=cards/card&ed=${encodeURIComponent(acronym)}&num=${encodeURIComponent(card.ligaCardNumber || card.localId)}`;
  const html = await fetchText(url);
  const editions = extractEmbeddedJson(html, 'cards_editions');
  const stockList = extractEmbeddedJson(html, 'cards_stock');
  const pageExtras = extractEmbeddedJson(html, 'dataExtras');
  const dynamicExtraLabels = { ...LIGA_EXTRAS_LABELS };
  if (Array.isArray(pageExtras)) {
    for (const ex of pageExtras) {
      if (ex && ex.id !== undefined && ex.label && !dynamicExtraLabels[String(ex.id)]) {
        dynamicExtraLabels[String(ex.id)] = decodeHtmlEntities(ex.label);
      }
    }
  }

  const variants = {};
  let salesLast3Months = null;

  if (Array.isArray(editions) && editions.length > 0) {
    const edEntry = editions.find(e =>
      String(e.id) === String(ligaId) ||
      (e.code && e.code.toUpperCase() === acronym.toUpperCase())
    ) || editions[0];

    if (edEntry) {
      const emptyPriceExtraCodes = new Set();
      if (edEntry.price && typeof edEntry.price === 'object') {
        for (const [extCode, pObj] of Object.entries(edEntry.price)) {
          if (pObj && !Array.isArray(pObj) && (pObj.p || pObj.m || pObj.g)) {
            variants[extCode] = {
              code: extCode,
              label: dynamicExtraLabels[extCode] || `Variante ${extCode}`,
              menor: parseFloat(pObj.p || '0') || 0,
              medio: parseFloat(pObj.m || '0') || 0,
              maior: parseFloat(pObj.g || '0') || 0
            };
          } else if (extCode !== '0') {
            // LigaPokemon often sets "2": [] on Holo/Ultra cards when all listings are Foil and aggregated under "0"
            emptyPriceExtraCodes.add(String(extCode));
          }
        }
      }

      // Also detect active store stock extras for this edition (e.g. Foil=2 and Reverse Foil=3 on Holo Rares like Butterfree 003/159)
      if (Array.isArray(stockList)) {
        for (const stItem of stockList) {
          if (stItem && String(stItem.idEdicao) === String(edEntry.id) && stItem.extras !== undefined && stItem.extras !== null) {
            const rawExt = String(stItem.extras).trim();
            if (rawExt && rawExt !== '0' && dynamicExtraLabels[rawExt]) {
              emptyPriceExtraCodes.add(rawExt);
            }
          }
        }
      }

      if (edEntry.ls && typeof edEntry.ls === 'object') {
        salesLast3Months = {
          quantity: parseInt(edEntry.ls.q || '0', 10) || 0,
          menor: parseFloat(edEntry.ls.p || '0') || 0,
          medio: parseFloat(edEntry.ls.m || '0') || 0,
          maior: parseFloat(edEntry.ls.g || '0') || 0
        };
      }

      if (edEntry?.rarid?.label && !card.rarity) {
        card.rarity = decodeHtmlEntities(edEntry.rarid.label);
      }
      if (edEntry?.color) {
        card.ligaColor = normalizeLigaColor(edEntry.color);
      }
      if (edEntry?.type) {
        card.ligaType = decodeHtmlEntities(edEntry.type);
      }
      const cls = classifyCardMetadata(card, setData.tcgdexId || setId);
      card.category = cls.category;
      card.subCategory = cls.subCategory;
      card.elementType = cls.elementType;

      // Guarantee standard Foil / Reverse Foil options when detected in Liga stock/edEntry or by card rarity
      const rarLower = String(card.rarity || '').toLowerCase();
      if (/hologr|dupla|ultra|ilustra|hiper|secreta|ace spec|radiante|brilhante|ex\b|gx\b|v\b|vmax|vstar/i.test(rarLower)) {
        emptyPriceExtraCodes.add('2');
      }
      if (/comum|incomum|^rara$|rara hologr/i.test(rarLower)) {
        emptyPriceExtraCodes.add('2');
        emptyPriceExtraCodes.add('3');
      }

      const fallbackBase = variants['0'] || card.pricesBRL || { menor: 0, medio: 0, maior: 0 };
      for (const extCode of emptyPriceExtraCodes) {
        if (!variants[extCode]) {
          variants[extCode] = {
            code: extCode,
            label: dynamicExtraLabels[extCode] || `Variante ${extCode}`,
            menor: fallbackBase.menor || 0,
            medio: fallbackBase.medio || 0,
            maior: fallbackBase.maior || 0
          };
        }
      }
    }
  }

  // Fallback to default prices if '0' not populated
  if (!variants['0'] && card.pricesBRL) {
    variants['0'] = {
      code: '0',
      label: 'Normal',
      ...card.pricesBRL
    };
  }

  card.variantPricesBRL = variants;
  if (salesLast3Months) {
    card.salesLast3Months = salesLast3Months;
  }

  // Serialize Read-Modify-Write on setFile so concurrent variant fetches don't overwrite each other
  if (fs.existsSync(setFile)) {
    await withSetLock(setId, async () => {
      try {
        const latestData = JSON.parse(fs.readFileSync(setFile, 'utf8'));
        const targetInLatest = (latestData.cards || []).find(
          c => String(c.localId) === String(localId) || c.normNumber === normTarget || normalizeAlphaNum(c.localId) === alphaTarget
        );
        if (targetInLatest) {
          targetInLatest.variantPricesBRL = variants;
          if (salesLast3Months) targetInLatest.salesLast3Months = salesLast3Months;
          if (card.rarity && !targetInLatest.rarity) targetInLatest.rarity = card.rarity;
          if (card.ligaColor) targetInLatest.ligaColor = card.ligaColor;
          if (card.ligaType) targetInLatest.ligaType = card.ligaType;
          if (card.category) targetInLatest.category = card.category;
          if (card.subCategory) targetInLatest.subCategory = card.subCategory;
          if (card.elementType !== undefined) targetInLatest.elementType = card.elementType;
          await writeJsonAtomic(setFile, latestData);
        }
      } catch (err) {
        console.error(`[Variant Save Error] Falha ao atualizar variantes em ${setFile}:`, err.message);
      }
    });
  }

  return { variants, card, salesLast3Months };
}

function getServerPriceByMode(priceObj, mode = 'menor') {
  if (!priceObj) return 0;
  if (mode === 'vendas3m') {
    const s3m = Number(priceObj.sales3m) || 0;
    if (s3m > 0) return roundCents(s3m);
    const med = Number(priceObj.medio) || 0;
    if (med > 0) return roundCents(med);
    return roundCents(priceObj.menor);
  }
  const val = Number(priceObj[mode]);
  if (val > 0) return roundCents(val);
  return roundCents(priceObj.menor);
}

// Update collection items belonging to a specific set using fresh set data
function applySetPricesToCollection(setId, setData) {
  if (!setData || !Array.isArray(setData.cards)) return 0;
  let updatedCount = 0;

  for (const item of userCollection.items) {
    if (String(item.setId || '').toLowerCase() !== String(setId || '').toLowerCase()) continue;
    const normTarget = normalizeCardNumber(item.localId);
    const alphaTarget = normalizeAlphaNum(item.localId);
    const matchedCard = setData.cards.find(
      c => String(c.localId) === String(item.localId) || c.normNumber === normTarget || normalizeAlphaNum(c.localId) === alphaTarget
    );
    if (!matchedCard) continue;

    if (matchedCard.ligaColor) item.ligaColor = matchedCard.ligaColor;
    if (matchedCard.ligaType) item.ligaType = matchedCard.ligaType;
    const cls = classifyCardMetadata({
      ...item,
      ligaColor: matchedCard.ligaColor || item.ligaColor,
      ligaType: matchedCard.ligaType || item.ligaType
    }, setData.tcgdexId || setId);
    item.category = cls.category;
    item.subCategory = cls.subCategory;
    item.elementType = cls.elementType;

    // Determine updated price for the card's variant
    // Note: LigaPokemon 'ls' (salesLast3Months) applies to the default/normal edition; do not overwrite special variants with normal card's sales3m
    let newPriceObj = null;
    const isSpecialVariant = Boolean(item.variantCode && item.variantCode !== '0');
    if (isSpecialVariant && matchedCard.variantPricesBRL?.[item.variantCode]) {
      const vp = matchedCard.variantPricesBRL[item.variantCode];
      newPriceObj = {
        menor: roundCents(vp.menor),
        medio: roundCents(vp.medio),
        maior: roundCents(vp.maior),
        sales3m: 0
      };
    } else if (!isSpecialVariant && (matchedCard.variantPricesBRL?.['0'] || matchedCard.pricesBRL)) {
      const baseP = matchedCard.variantPricesBRL?.['0'] || matchedCard.pricesBRL;
      newPriceObj = {
        menor: roundCents(baseP.menor),
        medio: roundCents(baseP.medio),
        maior: roundCents(baseP.maior),
        sales3m: roundCents(matchedCard.salesLast3Months?.medio || item.currentPrices?.sales3m || 0)
      };
    }

    if (newPriceObj && (newPriceObj.menor > 0 || newPriceObj.medio > 0)) {
      const oldMenor = roundCents(item.currentPrices?.menor);
      const oldMedio = roundCents(item.currentPrices?.medio);
      if (oldMenor > 0 && (Math.abs(oldMenor - newPriceObj.menor) >= 0.01 || Math.abs(oldMedio - newPriceObj.medio) >= 0.01)) {
        item.previousPrices = { ...item.currentPrices };
      }
      if ((item.priceAtAddition?.menor || 0) === 0) {
        item.priceAtAddition = { ...newPriceObj };
      }
      item.currentPrices = newPriceObj;
      item.priceHistory = appendPriceHistorySnapshot(item.priceHistory, newPriceObj);
      item.updatedAt = new Date().toISOString();
      if (matchedCard.localImage) item.image = matchedCard.localImage;
      if (matchedCard.rarity && !item.rarity) item.rarity = matchedCard.rarity;
      if (setData.liga?.acronym && !item.ligaAcronym) item.ligaAcronym = setData.liga.acronym;
      updatedCount++;
    }
  }
  return updatedCount;
}

// Synchronize all sets present in user's collection with LigaPokemon
async function syncCollectionPrices() {
  const uniqueSetIds = Array.from(new Set(userCollection.items.map(i => i.setId).filter(Boolean)));
  if (uniqueSetIds.length === 0) {
    return {
      updatedSets: 0,
      updatedCards: 0,
      gainersCount: 0
    };
  }

  let completedSets = 0;
  let totalUpdatedCards = 0;

  for (const rawSetId of uniqueSetIds) {
    let setId;
    try {
      setId = sanitizeSetId(rawSetId);
    } catch {
      completedSets++;
      continue;
    }

    broadcastSSE('download-progress', {
      setId,
      stage: 'collection-sync',
      message: `Atualizando preços da sua coleção na LigaPokémon (${completedSets + 1}/${uniqueSetIds.length} edições)...`,
      current: completedSets,
      total: uniqueSetIds.length
    });

    try {
      const setFile = resolveSafeChildPath(SETS_DIR, `${setId}.json`);
      if (!setFile) throw new Error(`Caminho inválido para ${setId}`);
      const updatedSet = await withSetLock(setId, async () => {
        const existing = fs.existsSync(setFile) ? JSON.parse(fs.readFileSync(setFile, 'utf8')) : null;
        const merged = await fetchAndMergeSet(setId, existing);
        await writeJsonAtomic(setFile, merged);
        return merged;
      });

      // Deduplicate variant fetches by normalized localId within the same set
      const variantItems = userCollection.items.filter(
        i => String(i.setId || '').toLowerCase() === setId.toLowerCase() && i.variantCode && i.variantCode !== '0'
      );
      const uniqueLocalIdsForVariants = new Map();
      for (const vItem of variantItems) {
        const normKey = normalizeAlphaNum(vItem.localId) || String(vItem.localId).trim();
        if (!uniqueLocalIdsForVariants.has(normKey)) {
          uniqueLocalIdsForVariants.set(normKey, vItem.localId);
        }
      }

      let isFirstVariantCall = true;
      for (const [, targetLocalId] of uniqueLocalIdsForVariants.entries()) {
        if (!isFirstVariantCall) {
          await new Promise(r => setTimeout(r, 150));
        }
        isFirstVariantCall = false;
        try {
          const vData = await fetchCardVariantsFromLiga(setId, targetLocalId);
          const normT = normalizeCardNumber(targetLocalId);
          const alphaT = normalizeAlphaNum(targetLocalId);
          const cInSet = updatedSet.cards.find(
            c => String(c.localId) === String(targetLocalId) || c.normNumber === normT || normalizeAlphaNum(c.localId) === alphaT
          );
          if (cInSet && vData.variants) {
            cInSet.variantPricesBRL = vData.variants;
            if (vData.salesLast3Months) cInSet.salesLast3Months = vData.salesLast3Months;
          }
        } catch {
          // continue even if individual variant page fails
        }
      }

      totalUpdatedCards += applySetPricesToCollection(setId, updatedSet);
    } catch (err) {
      console.error(`[Collection Sync] Erro ao atualizar set ${setId}:`, err.message);
    }

    completedSets++;
  }

  userCollection.lastPriceSyncAt = new Date().toISOString();
  await saveCollection(userCollection, true);

  const activeMode = userCollection.priceMode || 'menor';
  const gainersCount = userCollection.items.filter(i => {
    const base = getServerPriceByMode(i.priceAtAddition, activeMode);
    const curr = getServerPriceByMode(i.currentPrices, activeMode);
    return base > 0 && roundCents(curr - base) >= 0.01;
  }).length;

  broadcastSSE('download-progress', {
    setId: 'collection',
    stage: 'done',
    message: `Coleção atualizada! ${totalUpdatedCards} cartas verificadas (${gainersCount} em valorização).`,
    current: uniqueSetIds.length,
    total: uniqueSetIds.length
  });

  return {
    updatedSets: completedSets,
    updatedCards: totalUpdatedCards,
    gainersCount
  };
}

// Helper to read JSON body from POST requests with 1MB payload protection
function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let totalBytes = 0;
    let aborted = false;

    req.on('data', chunk => {
      if (aborted) return;
      totalBytes += chunk.length;
      if (totalBytes > MAX_BODY_BYTES) {
        aborted = true;
        req.destroy();
        return reject(new Error('Payload JSON excede o limite máximo permitido (1 MB).'));
      }
      chunks.push(chunk);
    });

    req.on('end', () => {
      if (aborted) return;
      if (chunks.length === 0) return resolve({});
      try {
        const bodyStr = Buffer.concat(chunks).toString('utf8');
        if (!bodyStr.trim()) return resolve({});
        resolve(JSON.parse(bodyStr));
      } catch (e) {
        reject(new Error(`JSON inválido no corpo da requisição: ${e.message}`));
      }
    });

    req.on('error', err => {
      if (!aborted) reject(err);
    });
  });
}

function sendJson(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*'
  });
  res.end(JSON.stringify(data));
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function serveStaticFile(res, filePath) {
  if (!filePath || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Arquivo não encontrado');
    return;
  }
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  const isAssetImage = ['.webp', '.png', '.jpg', '.jpeg', '.ico', '.svg'].includes(ext);
  res.writeHead(200, {
    'Content-Type': contentType,
    'Cache-Control': isAssetImage ? 'public, max-age=3600' : 'no-cache, no-store, must-revalidate'
  });
  const stream = fs.createReadStream(filePath);
  stream.on('error', (err) => {
    console.error(`[Static Stream Error] ${filePath}:`, err.message);
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Erro ao ler arquivo');
    } else if (!res.writableEnded) {
      res.end();
    }
  });
  stream.pipe(res);
}

// Track sets that already had an auto-heal attempt in this process to avoid infinite heal loops
const autoHealedSetsAttempted = new Set();

// HTTP Server
const server = http.createServer(async (req, res) => {
  try {
    const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = decodeURIComponent(parsedUrl.pathname);

    // CORS preflight
    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      });
      return res.end();
    }

    // 1. SSE Endpoint for real-time Session, Collection & Download progress
    if (pathname === '/api/events' && req.method === 'GET') {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*'
      });
      res.write(`event: session\ndata: ${JSON.stringify(currentSession)}\n\n`);
      res.write(`event: collection\ndata: ${JSON.stringify(userCollection)}\n\n`);
      sseClients.add(res);
      const cleanupClient = () => sseClients.delete(res);
      req.on('close', cleanupClient);
      res.on('close', cleanupClient);
      res.on('error', cleanupClient);
      return;
    }

    // 2. Catalog Endpoint
    if (pathname === '/api/catalog' && req.method === 'GET') {
      const refresh = parsedUrl.searchParams.get('refresh') === '1';
      const catalog = await buildCatalog(refresh);
      return sendJson(res, 200, catalog);
    }

    // 3. Get Set Details (loads from offline backup if available, otherwise fetches live and caches JSON)
    const setMatch = pathname.match(/^\/api\/sets\/([^/]+)$/);
    if (setMatch && req.method === 'GET') {
      const setId = sanitizeSetId(setMatch[1]);
      const setFile = resolveSafeChildPath(SETS_DIR, `${setId}.json`);
      if (!setFile) return sendJson(res, 400, { error: 'Identificador de coleção inválido' });

      if (fs.existsSync(setFile)) {
        let data = JSON.parse(fs.readFileSync(setFile, 'utf8'));
        const catalog = await buildCatalog(false);
        const catEntry = catalog.sets.find(s => s.id === setId);
        let ligaChanged = false;
        if (catEntry?.liga && (!data.liga || String(data.liga.ligaId) !== String(catEntry.liga.ligaId))) {
          data.liga = catEntry.liga;
          ligaChanged = true;
        }
        const hasAnyPrice = (data.cards || []).some(c => (c.pricesBRL?.menor || 0) > 0 || (c.pricesBRL?.medio || 0) > 0);
        const hasAnyImage = (data.cards || []).some(c => Boolean(c.localImage || c.imagePt || c.imageLiga || c.imageEn));
        const hasSpoilerNames = (data.cards || []).some(c => /\(#\d+\/\d+\)/.test(c.namePt || ''));
        const hasNoCards = (data.cards || []).length === 0;
        const isIncompletePreRelease = hasNoCards || ((catEntry?.cardCount?.total || 0) > (data.cards || []).length && !autoHealedSetsAttempted.has(setId));
        const needsHeal = ligaChanged || (!autoHealedSetsAttempted.has(setId) && (!hasAnyPrice || !hasAnyImage || hasSpoilerNames || isIncompletePreRelease));
        // Auto-heal cached set if it has a LigaPokemon link but all prices or images were cached empty, Liga edition changed, or pre-release spoilers were cached
        if (data.liga?.ligaId && data.liga?.acronym && needsHeal) {
          autoHealedSetsAttempted.add(setId);
          try {
            data = await withSetLock(setId, async () => {
              const latest = fs.existsSync(setFile) ? JSON.parse(fs.readFileSync(setFile, 'utf8')) : data;
              const healed = await fetchAndMergeSet(setId, ligaChanged ? null : latest);
              await writeJsonAtomic(setFile, healed);
              return healed;
            });
          } catch (e) {
            console.error(`[Auto-Heal Prices] Falha ao recuperar preços de ${setId}:`, e.message);
          }
        }
        if (data.liga?.icon) {
          data.symbol = resolveLigaAssetUrl(data.liga.icon);
        }
        const hasLocalImgs = Boolean(data.isOfflineBackup) || (data.cards || []).some(c => c.localImage);
        return sendJson(res, 200, { ...data, isOffline: hasLocalImgs, isCached: true });
      }
      const data = await fetchAndMergeSet(setId);
      // Save JSON metadata cache automatically so next load is instant!
      await writeJsonAtomic(setFile, data);
      const hasLocalImgs = Boolean(data.isOfflineBackup) || (data.cards || []).some(c => c.localImage);
      return sendJson(res, 200, { ...data, isOffline: hasLocalImgs, isCached: true });
    }

    // 4. Download Set Offline (JSON + Images)
    const downloadMatch = pathname.match(/^\/api\/sets\/([^/]+)\/download$/);
    if (downloadMatch && req.method === 'POST') {
      const setId = sanitizeSetId(downloadMatch[1]);
      const body = await readJsonBody(req);
      const includeImages = body.includeImages !== false;
      const data = await downloadSetOffline(setId, includeImages);
      return sendJson(res, 200, { ok: true, set: data });
    }

    // 5. Fast Sync Prices Only (1 second via LigaPokemon cardsjson)
    const syncPricesMatch = pathname.match(/^\/api\/sets\/([^/]+)\/sync-prices$/);
    if (syncPricesMatch && req.method === 'POST') {
      const setId = sanitizeSetId(syncPricesMatch[1]);
      const setFile = resolveSafeChildPath(SETS_DIR, `${setId}.json`);
      if (!setFile) return sendJson(res, 400, { error: 'Identificador de coleção inválido' });
      const updated = await withSetLock(setId, async () => {
        const existing = fs.existsSync(setFile) ? JSON.parse(fs.readFileSync(setFile, 'utf8')) : null;
        const merged = await fetchAndMergeSet(setId, existing);
        await writeJsonAtomic(setFile, merged);
        return merged;
      });
      if (applySetPricesToCollection(setId, updated) > 0) {
        userCollection.lastPriceSyncAt = new Date().toISOString();
        await saveCollection(userCollection, true);
      }
      return sendJson(res, 200, { ok: true, set: updated });
    }

    // 6. Link a Set to a specific LigaPokemon Edition manually if desired
    const linkLigaMatch = pathname.match(/^\/api\/sets\/([^/]+)\/link-liga$/);
    if (linkLigaMatch && req.method === 'POST') {
      const setId = sanitizeSetId(linkLigaMatch[1]);
      const setFile = resolveSafeChildPath(SETS_DIR, `${setId}.json`);
      if (!setFile) return sendJson(res, 400, { error: 'Identificador de coleção inválido' });
      const body = await readJsonBody(req);
      const catalog = await buildCatalog(false);
      const ligaEd = (catalog.ligaEditions || []).find(l =>
        String(l.ligaId) === String(body.ligaId) ||
        (body.acronym && l.acronym.toUpperCase() === body.acronym.toUpperCase())
      );
      if (!ligaEd) {
        return sendJson(res, 404, { error: 'Edição da LigaPokémon não encontrada' });
      }
      if (fs.existsSync(CATALOG_FILE)) {
        try {
          const rawCatalog = JSON.parse(fs.readFileSync(CATALOG_FILE, 'utf8'));
          const rawSetEntry = (rawCatalog.sets || []).find(s => s.id === setId);
          if (rawSetEntry) {
            rawSetEntry.liga = ligaEd;
            await writeJsonAtomic(CATALOG_FILE, rawCatalog);
          }
        } catch (err) {
          console.error('[Link Liga] Falha ao atualizar catálogo puro:', err.message);
        }
      }
      const updated = await withSetLock(setId, async () => {
        const existing = fs.existsSync(setFile) ? JSON.parse(fs.readFileSync(setFile, 'utf8')) : null;
        const merged = await fetchAndMergeSet(setId, { ...(existing || {}), liga: ligaEd });
        await writeJsonAtomic(setFile, merged);
        return merged;
      });
      return sendJson(res, 200, { ok: true, set: updated });
    }

    // 7. Delete Offline Backup for a Set
    if (setMatch && req.method === 'DELETE') {
      const setId = sanitizeSetId(setMatch[1]);
      const setFile = resolveSafeChildPath(SETS_DIR, `${setId}.json`);
      const imgDir = resolveSafeChildPath(IMAGES_DIR, setId);
      await withSetLock(setId, async () => {
        if (setFile && fs.existsSync(setFile)) fs.unlinkSync(setFile);
        if (imgDir && fs.existsSync(imgDir)) fs.rmSync(imgDir, { recursive: true, force: true });
        setOfflineStatusCache.delete(setId);
      });
      return sendJson(res, 200, { ok: true });
    }

    // 8. Fetch Variant Prices (Normal, Reverse Foil, Foil, Master Ball, Pokeball) for a specific card
    const variantMatch = pathname.match(/^\/api\/cards\/([^/]+)\/([^/]+)\/variants$/);
    if (variantMatch && req.method === 'GET') {
      const setId = sanitizeSetId(variantMatch[1]);
      const localId = variantMatch[2];
      const result = await fetchCardVariantsFromLiga(setId, localId);
      return sendJson(res, 200, result);
    }

    // 9. Session / Pack Opening Counter API
    if (pathname === '/api/session' && req.method === 'GET') {
      return sendJson(res, 200, currentSession);
    }

    if (pathname === '/api/session/add' && req.method === 'POST') {
      const item = await readJsonBody(req);
      const entry = {
        ...item,
        uid: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        addedAt: new Date().toISOString()
      };
      currentSession.items.unshift(entry);
      await saveSession(currentSession);

      // If auto-save to collection is enabled (or explicitly requested), also upsert into permanent collection
      if (userCollection.autoSaveOnSessionAdd || item.alsoAddToCollection) {
        try {
          upsertCardIntoCollection(item, 1);
          await saveCollection(userCollection);
        } catch (e) {
          console.error('[Collection AutoSave Error]', e.message);
        }
      }

      return sendJson(res, 200, currentSession);
    }

    if (pathname === '/api/session/update-card' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const targetSetId = String(body.setId || '').toLowerCase();
      const targetNormNum = normalizeAlphaNum(body.localId);
      let changed = false;

      for (const item of currentSession.items) {
        if (
          String(item.setId || '').toLowerCase() === targetSetId &&
          normalizeAlphaNum(item.localId) === targetNormNum
        ) {
          if (body.previousVariantCode && String(item.variantCode || '0') !== String(body.previousVariantCode)) {
            continue;
          }
          if (body.variantCode) item.variantCode = body.variantCode;
          if (body.variantLabel) item.variantLabel = body.variantLabel;
          if (body.rarity) item.rarity = body.rarity;
          if (typeof body.sales3m === 'number') item.sales3m = roundCents(body.sales3m);
          if (body.prices && typeof body.prices === 'object') {
            item.prices = {
              menor: roundCents(body.prices.menor),
              medio: roundCents(body.prices.medio),
              maior: roundCents(body.prices.maior)
            };
          }
          changed = true;
        }
      }

      if (changed) {
        await saveSession(currentSession);
      }
      return sendJson(res, 200, currentSession);
    }

    if (pathname === '/api/session/remove' && req.method === 'POST') {
      const { uid } = await readJsonBody(req);
      currentSession.items = currentSession.items.filter(i => i.uid !== uid);
      await saveSession(currentSession);
      return sendJson(res, 200, currentSession);
    }

    if (pathname === '/api/session/packs' && req.method === 'POST') {
      const { delta, packsOpened, priceMode } = await readJsonBody(req);
      if (typeof packsOpened === 'number') {
        currentSession.packsOpened = Math.max(0, packsOpened);
      } else if (typeof delta === 'number') {
        currentSession.packsOpened = Math.max(0, (currentSession.packsOpened || 0) + delta);
      }
      if (priceMode) {
        currentSession.priceMode = priceMode;
      }
      await saveSession(currentSession);
      return sendJson(res, 200, currentSession);
    }

    if (pathname === '/api/session/clear' && req.method === 'POST') {
      currentSession = {
        title: 'Abertura de Pacotes',
        packsOpened: 0,
        priceMode: currentSession.priceMode || 'menor',
        items: []
      };
      await saveSession(currentSession);
      return sendJson(res, 200, currentSession);
    }

    // 10B. Permanent User Collection ("Minha Coleção" & Radar de Valorização) API
    if (pathname === '/api/collection' && req.method === 'GET') {
      return sendJson(res, 200, userCollection);
    }

    if (pathname === '/api/collection/add' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const item = upsertCardIntoCollection(body, body.quantity || 1);
      await saveCollection(userCollection);
      return sendJson(res, 200, { ok: true, item, collection: userCollection });
    }

    if (pathname === '/api/collection/update' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const { cardKey, delta, quantity, priceAtAddition } = body;
      const canonicalTarget = normalizeCanonicalCardKey(cardKey);
      const idx = userCollection.items.findIndex(
        i => i.cardKey === cardKey || normalizeCanonicalCardKey(i.cardKey) === canonicalTarget
      );
      if (idx === -1) {
        return sendJson(res, 404, { error: 'Carta não encontrada na sua coleção' });
      }
      const target = userCollection.items[idx];
      if (typeof quantity === 'number') {
        target.quantity = quantity;
      } else if (typeof delta === 'number') {
        target.quantity = (target.quantity || 1) + delta;
      }
      if (priceAtAddition && typeof priceAtAddition === 'object') {
        const prev = (target.priceAtAddition && typeof target.priceAtAddition === 'object')
          ? target.priceAtAddition
          : {};
        const nextPrice = {
          menor: roundCents(prev.menor),
          medio: roundCents(prev.medio),
          maior: roundCents(prev.maior),
          sales3m: roundCents(prev.sales3m)
        };
        for (const field of ['menor', 'medio', 'maior', 'sales3m']) {
          if (priceAtAddition[field] !== undefined && priceAtAddition[field] !== null) {
            const num = Number(priceAtAddition[field]);
            if (Number.isFinite(num) && num >= 0) {
              nextPrice[field] = roundCents(num);
            }
          }
        }
        target.priceAtAddition = nextPrice;
      }
      target.updatedAt = new Date().toISOString();
      if (target.quantity <= 0) {
        userCollection.items.splice(idx, 1);
      }
      await saveCollection(userCollection);
      return sendJson(res, 200, { ok: true, collection: userCollection });
    }

    if (pathname === '/api/collection/remove' && req.method === 'POST') {
      const { cardKey } = await readJsonBody(req);
      const canonicalTarget = normalizeCanonicalCardKey(cardKey);
      userCollection.items = userCollection.items.filter(
        i => i.cardKey !== cardKey && normalizeCanonicalCardKey(i.cardKey) !== canonicalTarget
      );
      await saveCollection(userCollection);
      return sendJson(res, 200, { ok: true, collection: userCollection });
    }

    if (pathname === '/api/collection/settings' && req.method === 'POST') {
      const body = await readJsonBody(req);
      if (typeof body.autoSaveOnSessionAdd === 'boolean') {
        userCollection.autoSaveOnSessionAdd = body.autoSaveOnSessionAdd;
      }
      if (body.priceMode) {
        userCollection.priceMode = body.priceMode;
      }
      await saveCollection(userCollection);
      return sendJson(res, 200, { ok: true, collection: userCollection });
    }

    if (pathname === '/api/collection/import-session' && req.method === 'POST') {
      const sessionItems = currentSession.items || [];
      let importedCount = 0;
      // Iterate in reverse so oldest in session is added first, keeping newest on top
      for (const sItem of [...sessionItems].reverse()) {
        if (sItem.setId && sItem.localId) {
          upsertCardIntoCollection(sItem, 1);
          importedCount++;
        }
      }
      await saveCollection(userCollection);
      return sendJson(res, 200, { ok: true, importedCount, collection: userCollection });
    }

    if (pathname === '/api/collection/sync-prices' && req.method === 'POST') {
      const syncReport = await syncCollectionPrices();
      return sendJson(res, 200, { ok: true, syncReport, collection: userCollection });
    }

    // 11. Serve downloaded offline images from /data/images/...
    if (pathname.startsWith('/data/images/')) {
      const rel = pathname.slice('/data/images/'.length);
      const safePath = resolveSafeChildPath(IMAGES_DIR, rel);
      if (safePath) {
        return serveStaticFile(res, safePath);
      }
      res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('Acesso negado');
    }

    // 12. Serve Frontend Pages
    if (pathname === '/' || pathname === '/index.html') {
      return serveStaticFile(res, path.join(PUBLIC_DIR, 'index.html'));
    }

    const staticFile = resolveSafeChildPath(PUBLIC_DIR, pathname);
    if (staticFile) {
      return serveStaticFile(res, staticFile);
    }

    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Não encontrado');
  } catch (err) {
    console.error('[Server Error]', err);
    sendJson(res, 500, { error: err.message || 'Erro interno no servidor' });
  }
});

// Build TCGdex Trainer/Energy Index and backfill Liga colors & categories for existing collection items
async function ensureCardTypesIndexAndBackfillCollection() {
  try {
    const idx = loadCachedCardTypesIndex();
    const hasIndex = idx && idx.byId && Object.keys(idx.byId).length > 500;
    if (!hasIndex) {
      const endpoints = [
        { url: 'https://api.tcgdex.net/v2/en/trainer-types/Item', cat: 'trainer', sub: 'item' },
        { url: 'https://api.tcgdex.net/v2/pt/trainer-types/Item', cat: 'trainer', sub: 'item' },
        { url: 'https://api.tcgdex.net/v2/en/trainer-types/Supporter', cat: 'trainer', sub: 'supporter' },
        { url: 'https://api.tcgdex.net/v2/pt/trainer-types/Apoiador', cat: 'trainer', sub: 'supporter' },
        { url: 'https://api.tcgdex.net/v2/en/trainer-types/Stadium', cat: 'trainer', sub: 'stadium' },
        { url: 'https://api.tcgdex.net/v2/en/trainer-types/Tool', cat: 'trainer', sub: 'tool' },
        { url: 'https://api.tcgdex.net/v2/en/trainer-types/Technical%20Machine', cat: 'trainer', sub: 'tool' },
        { url: 'https://api.tcgdex.net/v2/en/categories/Energy', cat: 'energy', sub: 'energy' }
      ];
      const byId = { ...(idx.byId || {}) };
      const byName = { ...(idx.byName || {}) };

      for (const ep of endpoints) {
        try {
          const data = await fetchJson(ep.url);
          const cards = Array.isArray(data) ? data : (data.cards || []);
          for (const c of cards) {
            if (!c || !c.id) continue;
            byId[String(c.id).toLowerCase()] = { category: ep.cat, subCategory: ep.sub };
            if (!String(c.id).toLowerCase().startsWith('ecard')) {
              const nn = normalizeCardNameKey(c.name);
              if (nn) byName[nn] = { category: ep.cat, subCategory: ep.sub };
            }
          }
        } catch {
          // continue on individual endpoint failure
        }
      }

      if (Object.keys(byId).length > 0) {
        cardTypesIndexCache = { updatedAt: new Date().toISOString(), byId, byName };
        await writeJsonAtomic(CARD_TYPES_INDEX_FILE, cardTypesIndexCache);
      }
    }

    // Check if any collection items lack ligaColor and enrich them from cached set files or LigaPokemon
    const itemsNeedingColor = userCollection.items.filter(i => !i.ligaColor && i.category === 'pokemon');
    const uniqueSetsToCheck = Array.from(new Set(itemsNeedingColor.map(i => i.setId).filter(Boolean)));
    const catalog = uniqueSetsToCheck.length > 0 ? await buildCatalog(false).catch(() => null) : null;

    const ligaColorMapBySet = new Map();
    for (const rawSetId of uniqueSetsToCheck) {
      try {
        const setId = sanitizeSetId(rawSetId);
        const setFile = resolveSafeChildPath(SETS_DIR, `${setId}.json`);
        let setData = (setFile && fs.existsSync(setFile)) ? JSON.parse(fs.readFileSync(setFile, 'utf8')) : null;
        const hasColorsInSet = (setData?.cards || []).some(c => Boolean(c.ligaColor));

        if (!hasColorsInSet) {
          const catEntry = catalog?.sets?.find(s => s.id === setId);
          const ligaInfo = catEntry?.liga || setData?.liga;
          if (ligaInfo?.ligaId && ligaInfo?.acronym) {
            const ligaCards = await fetchLigaSetCards(ligaInfo.ligaId, ligaInfo.acronym).catch(() => []);
            const mapForSet = new Map();
            for (const lc of ligaCards) {
              if (lc.ligaColor) {
                mapForSet.set(normalizeCardNumber(lc.number), lc.ligaColor);
                mapForSet.set(normalizeAlphaNum(lc.number), lc.ligaColor);
                mapForSet.set(String(lc.number).trim(), lc.ligaColor);
              }
            }
            ligaColorMapBySet.set(setId.toLowerCase(), mapForSet);

            if (setData && Array.isArray(setData.cards) && mapForSet.size > 0) {
              for (const sc of setData.cards) {
                const cCol = mapForSet.get(sc.normNumber) || mapForSet.get(normalizeAlphaNum(sc.localId)) || mapForSet.get(String(sc.localId));
                if (cCol) sc.ligaColor = cCol;
                const cls = classifyCardMetadata(sc, setData.tcgdexId || setId);
                sc.category = cls.category;
                sc.subCategory = cls.subCategory;
                sc.elementType = cls.elementType;
              }
              await writeJsonAtomic(setFile, setData);
            }
          }
        } else if (setData?.cards) {
          const mapForSet = new Map();
          for (const sc of setData.cards) {
            if (sc.ligaColor) {
              mapForSet.set(sc.normNumber || normalizeCardNumber(sc.localId), sc.ligaColor);
              mapForSet.set(String(sc.localId), sc.ligaColor);
            }
          }
          ligaColorMapBySet.set(setId.toLowerCase(), mapForSet);
        }
      } catch {
        // ignore set enrichment error
      }
    }

    let collectionChanged = false;
    for (const item of userCollection.items) {
      const setMap = ligaColorMapBySet.get(String(item.setId || '').toLowerCase());
      if (setMap && !item.ligaColor) {
        const foundColor = setMap.get(item.normNumber || normalizeCardNumber(item.localId))
          || setMap.get(normalizeAlphaNum(item.localId))
          || setMap.get(String(item.localId));
        if (foundColor) {
          item.ligaColor = foundColor;
          collectionChanged = true;
        }
      }
      const cls = classifyCardMetadata(item, item.setId);
      if (item.category !== cls.category || item.subCategory !== cls.subCategory || item.elementType !== cls.elementType) {
        item.category = cls.category;
        item.subCategory = cls.subCategory;
        item.elementType = cls.elementType;
        collectionChanged = true;
      }
    }

    if (collectionChanged) {
      await saveCollection(userCollection);
    }
  } catch (err) {
    console.warn('[CardTypes Enrichment]', err.message);
  }
}

server.listen(PORT, HOST, () => {
  console.log('====================================================');
  console.log(`🚀 PokéScanner BR — TCGdex & LigaPokémon Iniciado!`);
  console.log(`👉 Acesse no navegador: http://${HOST}:${PORT}`);
  console.log('====================================================');
  ensureCardTypesIndexAndBackfillCollection();
});
