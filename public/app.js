// State
let catalog = null;
let activeSet = null;
let activeCard = null;
let activeVariantCode = '0';
let catalogFilter = 'all';
let sessionData = {
  packsOpened: 0,
  priceMode: 'menor',
  items: []
};
let collectionData = {
  updatedAt: null,
  lastPriceSyncAt: null,
  priceMode: 'menor',
  autoSaveOnSessionAdd: false,
  items: []
};
let collectionTab = 'all'; // 'all' | 'gainers' | 'meta-jump' | 'dupes'
let collectionCategoryFilter = 'all'; // 'all' | 'pokemon' | 'trainer' | 'item' | 'supporter' | 'tool' | 'stadium' | 'energy'
let collectionElementFilter = 'all'; // 'all' | 'G' | 'R' | 'W' | 'L' | 'P' | 'F' | 'D' | 'M' | 'N' | 'Y' | 'C'

// DOM Elements
const setPickerTrigger = document.getElementById('setPickerTrigger');
const activeSetSymbol = document.getElementById('activeSetSymbol');
const activeSetName = document.getElementById('activeSetName');
const activeSetBadge = document.getElementById('activeSetBadge');
const btnSyncPrices = document.getElementById('btnSyncPrices');
const btnDownloadActiveSet = document.getElementById('btnDownloadActiveSet');
const btnOpenCatalogModal = document.getElementById('btnOpenCatalogModal');
const offlineSetsCount = document.getElementById('offlineSetsCount');

const downloadBanner = document.getElementById('downloadBanner');
const downloadMessage = document.getElementById('downloadMessage');
const downloadProgressBar = document.getElementById('downloadProgressBar');
const downloadPercent = document.getElementById('downloadPercent');

const cardNumberInput = document.getElementById('cardNumberInput');
const officialSetTotal = document.getElementById('officialSetTotal');
const btnClearSearch = document.getElementById('btnClearSearch');
const cardNameFilter = document.getElementById('cardNameFilter');
const sortCardsSelect = document.getElementById('sortCardsSelect');
const cardsListCount = document.getElementById('cardsListCount');
const pricesLastSync = document.getElementById('pricesLastSync');
const cardsGrid = document.getElementById('cardsGrid');

const emptySpotlight = document.getElementById('emptySpotlight');
const cardSpotlight = document.getElementById('cardSpotlight');
const card3dFrame = document.getElementById('card3dFrame');
const spotlightImage = document.getElementById('spotlightImage');
const cardVariantBadge = document.getElementById('cardVariantBadge');
const spotlightLigaLink = document.getElementById('spotlightLigaLink');
const spotlightNumber = document.getElementById('spotlightNumber');
const spotlightRarity = document.getElementById('spotlightRarity');
const spotlightOfflineBadge = document.getElementById('spotlightOfflineBadge');
const spotlightNamePt = document.getElementById('spotlightNamePt');
const spotlightNameEn = document.getElementById('spotlightNameEn');
const btnLoadDetailedVariants = document.getElementById('btnLoadDetailedVariants');
const variantPillsContainer = document.getElementById('variantPillsContainer');
const activeVariantLabel = document.getElementById('activeVariantLabel');

const priceMinBRL = document.getElementById('priceMinBRL');
const priceAvgBRL = document.getElementById('priceAvgBRL');
const priceMaxBRL = document.getElementById('priceMaxBRL');
const labelPriceMin = document.getElementById('labelPriceMin');
const labelPriceAvg = document.getElementById('labelPriceAvg');
const labelPriceMax = document.getElementById('labelPriceMax');
const subPriceMin = document.getElementById('subPriceMin');
const subPriceAvg = document.getElementById('subPriceAvg');
const subPriceMax = document.getElementById('subPriceMax');
const btnAddCardToSession = document.getElementById('btnAddCardToSession');

const btnPrevCard = document.getElementById('btnPrevCard');
const btnNextCard = document.getElementById('btnNextCard');

const btnClearSession = document.getElementById('btnClearSession');
const btnPackMinus = document.getElementById('btnPackMinus');
const btnPackPlus = document.getElementById('btnPackPlus');
const packsOpenedCount = document.getElementById('packsOpenedCount');
const sessionPriceMode = document.getElementById('sessionPriceMode');
const sessionTotalValue = document.getElementById('sessionTotalValue');
const sessionTotalMin = document.getElementById('sessionTotalMin');
const sessionTotalAvg = document.getElementById('sessionTotalAvg');
const sessionCardsCount = document.getElementById('sessionCardsCount');
const topHitBanner = document.getElementById('topHitBanner');
const topHitName = document.getElementById('topHitName');
const topHitPrice = document.getElementById('topHitPrice');
const sessionItemsList = document.getElementById('sessionItemsList');

const catalogModal = document.getElementById('catalogModal');
const btnCloseCatalogModal = document.getElementById('btnCloseCatalogModal');
const catalogSearchInput = document.getElementById('catalogSearchInput');
const btnRefreshCatalog = document.getElementById('btnRefreshCatalog');
const catalogListContainer = document.getElementById('catalogListContainer');

// Confirm Modal DOM Elements
const confirmModal = document.getElementById('confirmModal');
const confirmModalIcon = document.getElementById('confirmModalIcon');
const confirmModalTitle = document.getElementById('confirmModalTitle');
const confirmModalMessage = document.getElementById('confirmModalMessage');
const btnConfirmCancel = document.getElementById('btnConfirmCancel');
const btnConfirmAccept = document.getElementById('btnConfirmAccept');

function showConfirmModal({
  icon = '🗑️',
  title = 'Confirmar ação',
  message = 'Tem certeza que deseja continuar?',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar'
} = {}) {
  return new Promise((resolve) => {
    confirmModalIcon.textContent = icon;
    confirmModalTitle.textContent = title;
    confirmModalMessage.textContent = message;
    btnConfirmAccept.textContent = confirmText;
    btnConfirmCancel.textContent = cancelText;

    const cleanup = (result) => {
      confirmModal.classList.add('hidden');
      btnConfirmAccept.removeEventListener('click', onAccept);
      btnConfirmCancel.removeEventListener('click', onCancel);
      confirmModal.removeEventListener('click', onBackdrop);
      window.removeEventListener('keydown', onKeyDown, true);
      resolve(result);
    };

    const onAccept = () => cleanup(true);
    const onCancel = () => cleanup(false);
    const onBackdrop = (e) => {
      if (e.target === confirmModal) cleanup(false);
    };
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        cleanup(false);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        cleanup(true);
      }
    };

    btnConfirmAccept.addEventListener('click', onAccept);
    btnConfirmCancel.addEventListener('click', onCancel);
    confirmModal.addEventListener('click', onBackdrop);
    window.addEventListener('keydown', onKeyDown, true);

    confirmModal.classList.remove('hidden');
    btnConfirmCancel.focus();
  });
}

// Collection DOM Elements
const btnOpenCollectionModal = document.getElementById('btnOpenCollectionModal');
const myCollectionCountBadge = document.getElementById('myCollectionCountBadge');
const myCollectionTotalBadge = document.getElementById('myCollectionTotalBadge');
const spotlightOwnedBadge = document.getElementById('spotlightOwnedBadge');
const btnAddCardToCollection = document.getElementById('btnAddCardToCollection');
const chkAutoSaveCollection = document.getElementById('chkAutoSaveCollection');
const btnImportSessionToCollection = document.getElementById('btnImportSessionToCollection');

const collectionModal = document.getElementById('collectionModal');
const btnCloseCollectionModal = document.getElementById('btnCloseCollectionModal');
const btnSyncCollectionPrices = document.getElementById('btnSyncCollectionPrices');
const btnExportCollectionCsv = document.getElementById('btnExportCollectionCsv');
const collectionSyncAlert = document.getElementById('collectionSyncAlert');

const colDashCurrentTotal = document.getElementById('colDashCurrentTotal');
const colDashTotalCopies = document.getElementById('colDashTotalCopies');
const colDashInitialTotal = document.getElementById('colDashInitialTotal');
const colDashProfitValue = document.getElementById('colDashProfitValue');
const colDashProfitPercent = document.getElementById('colDashProfitPercent');
const colDashLastSync = document.getElementById('colDashLastSync');
const colDashGainersCount = document.getElementById('colDashGainersCount');
const colDashTopGainer = document.getElementById('colDashTopGainer');

const colTabCountAll = document.getElementById('colTabCountAll');
const colTabCountGainers = document.getElementById('colTabCountGainers');
const colTabCountMeta = document.getElementById('colTabCountMeta');
const colTabCountDupes = document.getElementById('colTabCountDupes');

const collectionSearchInput = document.getElementById('collectionSearchInput');
const collectionSetFilter = document.getElementById('collectionSetFilter');
const collectionPriceMode = document.getElementById('collectionPriceMode');
const collectionSortSelect = document.getElementById('collectionSortSelect');
const collectionListContainer = document.getElementById('collectionListContainer');
const collectionCategoryPills = document.getElementById('collectionCategoryPills');
const collectionElementPills = document.getElementById('collectionElementPills');

const ELEMENT_TYPE_META = {
  G: { icon: '🌿', label: 'Planta' },
  R: { icon: '🔥', label: 'Fogo' },
  W: { icon: '💧', label: 'Água' },
  L: { icon: '⚡', label: 'Elétrico' },
  P: { icon: '🔮', label: 'Psíquico' },
  F: { icon: '✊', label: 'Luta' },
  D: { icon: '🌑', label: 'Escuridão' },
  M: { icon: '⚙️', label: 'Metal' },
  N: { icon: '🐉', label: 'Dragão' },
  Y: { icon: '✨', label: 'Fada' },
  C: { icon: '⭐', label: 'Normal' }
};

const SUBCATEGORY_META = {
  pokemon: { icon: '🐾', label: 'Pokémon' },
  trainer: { icon: '🎒', label: 'Treinador' },
  item: { icon: '📦', label: 'Item' },
  supporter: { icon: '🧑‍🎤', label: 'Apoiador' },
  tool: { icon: '🛠️', label: 'Ferramenta' },
  stadium: { icon: '🏟️', label: 'Estádio' },
  energy: { icon: '🔋', label: 'Energia' }
};

function detectEnergyElementClient(namePt, nameEn) {
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

function getCardClassificationClient(item) {
  if (!item) return { category: 'pokemon', subCategory: 'pokemon', elementType: 'C' };
  const rawElem = item.elementType === 'O' ? 'N' : item.elementType;
  const rawLigaCol = item.ligaColor === 'O' ? 'N' : item.ligaColor;

  if (item.category && item.subCategory) {
    return {
      category: item.category,
      subCategory: item.subCategory,
      elementType: item.category === 'trainer' ? null : (rawElem || rawLigaCol || 'C')
    };
  }

  const namePt = String(item.namePt || '').replace(/\(#.*?\)/g, '').trim();
  const nameEn = String(item.nameEn || '').replace(/\(#.*?\)/g, '').trim();
  const combined = `${namePt} ${nameEn}`;

  if (rawLigaCol && ELEMENT_TYPE_META[rawLigaCol] && rawLigaCol !== 'C') {
    return { category: 'pokemon', subCategory: 'pokemon', elementType: rawLigaCol };
  }
  if (rawLigaCol === 'E' || /^(energia\b|basic\s+.*?\s+energy\b)/i.test(namePt) || (/\benergy$/i.test(nameEn) && !/\b(recycler|retrieval|switch|search|loto|sticker)\b/i.test(nameEn))) {
    return { category: 'energy', subCategory: 'energy', elementType: detectEnergyElementClient(namePt, nameEn) };
  }
  if (/\b(est[aá]dio|stadium|torre\b|tower\b|vale\b|valley|[aá]rvore grandiosa|grand tree|jaula de batalha|battle cage|pra[cç]a\b|plaza|gin[aá]sio|gym|laborat[oó]rio|lab\b|templo|temple|[aá]rea zero|area zero|mesagoza|artazon|levincia)\b/i.test(combined)) {
    return { category: 'trainer', subCategory: 'stadium', elementType: null };
  }
  if (/\b(capacete|helmet|pingente|charm|amulet|faixa|band\b|belt|cinto|capa\b|cape|cloak|pedra selada|seal stone|bexiga|air balloon|[oó]culos|goggles|specs|patins|skates|colete|vest|mt:|tm:|technical machine|ferramenta|tool)\b/i.test(combined)) {
    return { category: 'trainer', subCategory: 'tool', elementType: null };
  }
  if (/\b(bola\b|ball\b|po[cç][aã]o|potion|doce raro|rare candy|substitui[cç][aã]o|switch|poffin|pok[eé]\s*tablet|pok[eé]\s*pad|pok[eé]gear|pegador|catcher|maca noturna|night stretcher|vara de pescar|super rod|reciclador de energia|energy recycler|recupera[cç][aã]o|retrieval|recipiente terrestre|earthen vessel|carrinho|trolley|carimbo|stamp|cart[aã]o vermelho|red card|tomo\b|tome\b|fragmento|shard|incenso|incense|corda de fuga|escape rope|bloco de amigos|pal pad|gerador el[eé]trico|electric generator)\b/i.test(combined)) {
    return { category: 'trainer', subCategory: 'item', elementType: null };
  }
  if (/\b(ordem da chefia|boss's orders|pesquisa de professores|professor's research|determina[cç][aã]o da l[ií]lian|lillie's determination|show da roxie|roxie's performance|artimanha|scheme|cuspidor de fogo|firebreather|gar[cç]onete|waitress|surfista|surfer|juiz|judge|kissera|iono|arven|irida|crispin|ciphermaniac|briar|lacey|carmine|kieran|perrin|bianca|cheren|hilda|dawn|emma|tranquilidade do az|az's tranquility|philippe)\b/i.test(combined)) {
    return { category: 'trainer', subCategory: 'supporter', elementType: null };
  }
  return { category: 'pokemon', subCategory: 'pokemon', elementType: rawElem || rawLigaCol || 'C' };
}

function renderCardTypeBadgesHtml(cls) {
  if (!cls) return '';
  if (cls.category === 'trainer') {
    const sub = SUBCATEGORY_META[cls.subCategory] || SUBCATEGORY_META.trainer;
    const cssClass = `col-cat-${escapeHtml(cls.subCategory || 'trainer')}`;
    return `<span class="col-cat-badge ${cssClass}" title="Carta de Treinador — ${escapeHtml(sub.label)}">${sub.icon} ${escapeHtml(sub.label)}</span>`;
  }
  if (cls.category === 'energy') {
    const elemMeta = cls.elementType && ELEMENT_TYPE_META[cls.elementType] ? ELEMENT_TYPE_META[cls.elementType] : null;
    const elemHtml = elemMeta
      ? `<span class="col-type-badge col-type-${escapeHtml(cls.elementType)}" title="Energia do tipo ${escapeHtml(elemMeta.label)}">${elemMeta.icon} ${escapeHtml(elemMeta.label)}</span>`
      : '';
    return `<span class="col-cat-badge col-cat-energy" title="Carta de Energia">🔋 Energia</span>${elemHtml}`;
  }
  const elemCode = (cls.elementType && ELEMENT_TYPE_META[cls.elementType]) ? cls.elementType : 'C';
  const meta = ELEMENT_TYPE_META[elemCode];
  return `<span class="col-type-badge col-type-${escapeHtml(elemCode)}" title="Pokémon de tipo ${escapeHtml(meta.label)}">${meta.icon} ${escapeHtml(meta.label)}</span>`;
}

// Format BRL currency
function formatBRL(val) {
  const num = Number(val) || 0;
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function roundCents(val) {
  return Math.round((Number(val) + Number.EPSILON) * 100) / 100;
}

function escapeHtml(str) {
  if (str === undefined || str === null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function sanitizeUrl(url, fallback = '') {
  if (!url || typeof url !== 'string') return fallback;
  const trimmed = url.trim();
  if (!trimmed) return fallback;
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    return trimmed;
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return trimmed;
    }
  } catch (e) {
    // invalid URL
  }
  return fallback;
}

function resolveUrlHref(url) {
  if (!url) return '';
  try {
    return new URL(url, location.origin).href;
  } catch {
    return String(url);
  }
}

function showToast(message, type = 'error') {
  if (!message) return;
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    Object.assign(container.style, {
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      zIndex: '99999',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      maxWidth: '380px',
      pointerEvents: 'none'
    });
    document.body.appendChild(container);
  }

  const toastType = ['error', 'success', 'info'].includes(type) ? type : 'info';
  const toast = document.createElement('div');
  toast.className = `toast toast-${toastType}`;
  toast.textContent = String(message);

  const bgColors = {
    error: '#dc2626',
    success: '#059669',
    info: '#2563eb'
  };
  Object.assign(toast.style, {
    padding: '10px 14px',
    borderRadius: '8px',
    background: bgColors[toastType] || bgColors.info,
    color: '#ffffff',
    fontSize: '13px',
    fontWeight: '500',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.35)',
    pointerEvents: 'auto',
    cursor: 'pointer',
    opacity: '0',
    transition: 'opacity 0.2s ease'
  });

  const dismiss = () => {
    toast.style.opacity = '0';
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 220);
  };
  toast.addEventListener('click', dismiss, { once: true });

  container.appendChild(toast);
  requestAnimationFrame(() => {
    toast.style.opacity = '1';
  });
  setTimeout(dismiss, 4000);
}

async function apiFetch(url, options = {}) {
  const res = await fetch(url, options);
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || errData.message || `Erro HTTP ${res.status}`);
  }
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

function escapeCsvCell(val) {
  let str = String(val ?? '');
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  return `"${str.replace(/"/g, '""')}"`;
}

function normalizeNumInput(str) {
  if (!str) return '';
  const raw = String(str).trim().toUpperCase().split('/')[0].trim();
  if (/^\d+$/.test(raw)) {
    return String(parseInt(raw, 10));
  }
  return raw.replace(/^([A-Z-]+)0+(\d+)$/, '$1$2');
}

function extractCardPureNumber(str) {
  if (!str) return '';
  const main = String(str).trim().toUpperCase().split('/')[0].trim();
  if (/^\d+$/.test(main)) return String(parseInt(main, 10));
  const m = main.match(/^[A-Z-]+0*(\d+)$/);
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

function compareCardsByNumberClient(a, b, setId = '') {
  const prioA = getCardPrefixPriority(a.localId, setId);
  const prioB = getCardPrefixPriority(b.localId, setId);
  if (prioA !== prioB) return prioA - prioB;

  const prefA = (String(a.localId || '').toUpperCase().match(/^([A-Z-]+)/) || [''])[0];
  const prefB = (String(b.localId || '').toUpperCase().match(/^([A-Z-]+)/) || [''])[0];
  if (prioA === 2 && prefA !== prefB) {
    return prefA.localeCompare(prefB);
  }

  const numA = parseInt(extractCardPureNumber(a.localId), 10);
  const numB = parseInt(extractCardPureNumber(b.localId), 10);
  if (!isNaN(numA) && !isNaN(numB) && numA !== numB) return numA - numB;
  return String(a.localId || '').localeCompare(String(b.localId || ''));
}

function isCardNumberExactMatch(card, rawQuery, setId = '') {
  if (!card || !rawQuery) return false;
  const rawUpper = String(rawQuery).trim().toUpperCase().split('/')[0].trim();
  const norm = normalizeNumInput(rawUpper);
  const localIdStr = String(card.localId || '');
  const cardAlpha = normalizeNumInput(localIdStr);
  const cardNorm = normalizeNumInput(card.normNumber || localIdStr);
  if (localIdStr.toUpperCase() === rawUpper || cardAlpha === norm || cardNorm === norm) {
    return true;
  }
  if (String(setId || '').toLowerCase() === 'sve' && /^SVE\d+$/.test(norm)) {
    if (cardAlpha === norm.replace(/^SVE/, 'SV')) return true;
  }
  if (/^\d+$/.test(norm)) {
    return extractCardPureNumber(localIdStr) === norm;
  }
  return false;
}

function findBestCardByNumberQuery(cards, rawQuery, setId = '') {
  if (!Array.isArray(cards) || !rawQuery) return null;
  const rawUpper = String(rawQuery).trim().toUpperCase().split('/')[0].trim();
  const norm = normalizeNumInput(rawUpper);

  // 1. Direct alphanumeric / literal match (e.g. "001" == "001" or "SVE001" == "SVE001" or "SVE1" == "SVE1")
  const direct = cards.find(c => {
    const lid = String(c?.localId || '');
    return lid.toUpperCase() === rawUpper ||
      normalizeNumInput(lid) === norm ||
      normalizeNumInput(c?.normNumber) === norm ||
      (String(setId || '').toLowerCase() === 'sve' && /^SVE\d+$/.test(norm) && normalizeNumInput(lid) === norm.replace(/^SVE/, 'SV'));
  });
  if (direct) return direct;

  // 2. Pure numeric match against prefixed cards (e.g. user types "1" or "001" for "SVE001" / "MEE001" / "TG01")
  if (/^\d+$/.test(norm)) {
    const pureMatches = cards
      .filter(c => extractCardPureNumber(c.localId) === norm)
      .sort((a, b) => compareCardsByNumberClient(a, b, setId));
    if (pureMatches.length > 0) return pureMatches[0];
  }

  return null;
}

function getCardImageUrl(card) {
  return sanitizeUrl(
    card.localImage || card.imagePt || card.imageLiga || card.imageEn,
    'https://tcgdex.dev/favicon.svg'
  );
}

const CLIENT_VARIANT_LABELS = {
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

function getEffectiveVariantsForCard(card) {
  if (!card) return {};
  const rawVariants = (card.variantPricesBRL && typeof card.variantPricesBRL === 'object')
    ? card.variantPricesBRL
    : {};
  const baseRef = rawVariants['0'] || card.pricesBRL || { menor: 0, medio: 0, maior: 0 };
  const result = {};

  for (const [code, vObj] of Object.entries(rawVariants)) {
    if (vObj && typeof vObj === 'object') {
      result[code] = {
        code: String(vObj.code || code),
        label: vObj.label || CLIENT_VARIANT_LABELS[code] || `Variante ${code}`,
        menor: Number(vObj.menor) || 0,
        medio: Number(vObj.medio) || 0,
        maior: Number(vObj.maior) || 0
      };
    }
  }

  // Only inject synthetic standard variants ('0', '2', '3') when variantPricesBRL has not been loaded yet
  if (Object.keys(result).length === 0) {
    for (const stdCode of ['0', '2', '3']) {
      result[stdCode] = {
        code: stdCode,
        label: CLIENT_VARIANT_LABELS[stdCode],
        menor: Number(baseRef.menor) || 0,
        medio: Number(baseRef.medio) || 0,
        maior: Number(baseRef.maior) || 0
      };
    }
  }

  return result;
}

function resolveDefaultVariantCode(card, preferredCode = '0') {
  const variants = getEffectiveVariantsForCard(card);
  if (preferredCode && variants[preferredCode]) return preferredCode;
  if (variants['0']) return '0';
  const keys = Object.keys(variants);
  return keys.length > 0 ? keys[0] : (preferredCode || '0');
}

function getCardPricesForVariant(card, variantCode = '0') {
  if (!card) {
    return { code: '0', label: 'Normal', menor: 0, medio: 0, maior: 0 };
  }
  const variants = getEffectiveVariantsForCard(card);
  const resolvedCode = resolveDefaultVariantCode(card, variantCode);
  if (variants[resolvedCode]) {
    return variants[resolvedCode];
  }
  return {
    code: resolvedCode || '0',
    label: CLIENT_VARIANT_LABELS[resolvedCode] || 'Normal',
    menor: card.pricesBRL?.menor || 0,
    medio: card.pricesBRL?.medio || 0,
    maior: card.pricesBRL?.maior || 0
  };
}

let activeSetAbortCtrl = null;
let activeDetailsAbortCtrl = null;
let activeDetailsPromise = null;
let cardInputDebounceTimer = null;

// Initialize SSE for live progress & session updates
function initSSE() {
  const es = new EventSource('/api/events');
  let sseErrorNotified = false;

  es.onopen = () => {
    sseErrorNotified = false;
  };

  es.onerror = (err) => {
    console.warn('Conexão SSE instável ou perdida:', err);
    if (!sseErrorNotified) {
      sseErrorNotified = true;
      showToast('Conexão em tempo real (SSE) instável. Tentando reconectar...', 'info');
    }
  };

  es.addEventListener('download-progress', (e) => {
    try {
      const data = JSON.parse(e.data);
      if (!data) return;
      downloadBanner.classList.remove('hidden');
      downloadMessage.textContent = data.message || '';
      const pct = data.total > 0 ? Math.round((data.current / data.total) * 100) : 0;
      downloadProgressBar.style.width = `${pct}%`;
      downloadPercent.textContent = `${pct}%`;

      if (data.stage === 'done') {
        setTimeout(() => {
          downloadBanner.classList.add('hidden');
        }, 2500);
      }
    } catch (err) {
      console.error('Erro ao processar evento download-progress:', err);
    }
  });

  es.addEventListener('session', (e) => {
    try {
      sessionData = JSON.parse(e.data);
      renderSession();
    } catch (err) {
      console.error('Erro ao processar evento session:', err);
    }
  });

  es.addEventListener('collection', (e) => {
    try {
      collectionData = JSON.parse(e.data);
      onCollectionUpdated();
    } catch (err) {
      console.error('Erro ao processar evento collection:', err);
    }
  });
}

async function loadCollection() {
  try {
    const res = await fetch('/api/collection');
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP ${res.status}`);
    }
    collectionData = await res.json();
    onCollectionUpdated();
  } catch (err) {
    console.error('Erro ao carregar Minha Coleção:', err);
  }
}

function getOwnedQuantityForCard(setId, localId, variantCode = null) {
  if (!collectionData || !Array.isArray(collectionData.items)) return 0;
  const targetSetId = String(setId || '').toLowerCase();
  const targetLocalId = normalizeNumInput(localId);
  return collectionData.items.reduce((acc, item) => {
    if (
      String(item.setId || '').toLowerCase() === targetSetId &&
      normalizeNumInput(item.localId) === targetLocalId
    ) {
      if (variantCode === null || String(item.variantCode || '0') === String(variantCode)) {
        return acc + (Number(item.quantity) || 1);
      }
    }
    return acc;
  }, 0);
}

function getCollectionPriceValue(priceObj, mode = 'menor') {
  if (!priceObj) return 0;
  const pMin = Number(priceObj.menor) || 0;
  const pAvg = Number(priceObj.medio) || 0;
  const pMax = Number(priceObj.maior) || 0;
  const s3m = Number(priceObj.sales3m) || 0;
  if (mode === 'vendas3m') {
    return s3m > 0 ? s3m : (pMin > 0 ? pMin : pAvg);
  }
  if (mode === 'medio') return pAvg > 0 ? pAvg : pMin;
  if (mode === 'maior') return pMax > 0 ? pMax : pMin;
  return pMin > 0 ? pMin : pAvg;
}

function computeCardValuation(item, mode = 'menor') {
  const qty = Math.max(1, Number(item.quantity) || 1);
  const currUnit = roundCents(getCollectionPriceValue(item.currentPrices, mode));
  const rawBaseUnit = roundCents(getCollectionPriceValue(item.priceAtAddition, mode));
  const baseUnit = rawBaseUnit > 0 ? rawBaseUnit : currUnit;
  const prevUnit = roundCents(getCollectionPriceValue(item.previousPrices, mode)) || baseUnit;

  const diffUnitBRL = roundCents(currUnit - baseUnit);
  const diffTotalBRL = roundCents(diffUnitBRL * qty);
  const diffPct = baseUnit > 0 ? ((currUnit - baseUnit) / baseUnit) * 100 : 0;

  const recentDiffUnitBRL = roundCents(currUnit - prevUnit);
  const isGainer = baseUnit > 0 && diffUnitBRL >= 0.01;
  const isLoser = baseUnit > 0 && diffUnitBRL <= -0.01;
  const isMetaJump = isGainer && currUnit >= 2.0 && (diffUnitBRL >= 0.5 || diffPct >= 30);

  return {
    qty,
    baseUnit,
    currUnit,
    prevUnit,
    totalBaseBRL: roundCents(baseUnit * qty),
    totalCurrBRL: roundCents(currUnit * qty),
    diffUnitBRL,
    diffTotalBRL,
    diffPct,
    recentDiffUnitBRL,
    isGainer,
    isLoser,
    isMetaJump
  };
}

function onCollectionUpdated() {
  if (chkAutoSaveCollection) {
    chkAutoSaveCollection.checked = Boolean(collectionData.autoSaveOnSessionAdd);
  }
  if (collectionPriceMode && collectionData.priceMode) {
    collectionPriceMode.value = collectionData.priceMode;
  }
  updateCollectionTopbarSummary();
  updateSpotlightOwnedBadge();
  renderCardsGrid();
  if (!collectionModal.classList.contains('hidden')) {
    populateCollectionSetFilter();
    renderCollectionModal();
  }
}

function updateCollectionTopbarSummary() {
  const items = collectionData?.items || [];
  const mode = collectionData?.priceMode || 'menor';
  let totalCopies = 0;
  let totalValue = 0;
  for (const item of items) {
    const qty = Math.max(1, Number(item.quantity) || 1);
    const unit = roundCents(getCollectionPriceValue(item.currentPrices, mode));
    totalCopies += qty;
    totalValue = roundCents(totalValue + roundCents(unit * qty));
  }
  if (myCollectionCountBadge) myCollectionCountBadge.textContent = totalCopies;
  if (myCollectionTotalBadge) myCollectionTotalBadge.textContent = formatBRL(totalValue);
}

function updateSpotlightOwnedBadge() {
  if (!spotlightOwnedBadge) return;
  if (!activeCard || !activeSet) {
    spotlightOwnedBadge.classList.add('hidden');
    return;
  }
  const totalOwned = getOwnedQuantityForCard(activeSet.id, activeCard.localId, null);
  const variantOwned = getOwnedQuantityForCard(activeSet.id, activeCard.localId, activeVariantCode);
  if (totalOwned > 0) {
    spotlightOwnedBadge.classList.remove('hidden');
    if (variantOwned > 0 && variantOwned !== totalOwned) {
      spotlightOwnedBadge.textContent = `💎 Na Coleção: ${totalOwned}x (${variantOwned}x nesta versão)`;
    } else {
      spotlightOwnedBadge.textContent = `💎 Na Coleção: ${totalOwned}x`;
    }
  } else {
    spotlightOwnedBadge.classList.add('hidden');
  }
}

// Fetch Catalog
async function loadCatalog(refresh = false) {
  try {
    const res = await fetch(`/api/catalog${refresh ? '?refresh=1' : ''}`);
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP ${res.status}`);
    }
    catalog = await res.json();

    const offlineCount = (catalog.sets || []).filter(s => s.offline?.isOffline).length;
    offlineSetsCount.textContent = offlineCount;

    renderCatalogModalList();
    return catalog;
  } catch (err) {
    console.error('Erro ao carregar catálogo:', err);
    if (!catalog) catalog = { sets: [] };
    return catalog;
  }
}

// Load a Set into active studio
async function selectSet(setId) {
  if (activeSetAbortCtrl) {
    activeSetAbortCtrl.abort();
  }
  activeSetAbortCtrl = new AbortController();
  const { signal } = activeSetAbortCtrl;

  activeSetName.textContent = 'Carregando coleção...';
  try {
    activeSet = await apiFetch(`/api/sets/${encodeURIComponent(setId)}`, { signal });
    localStorage.setItem('pokescanner_last_set', setId);

    // Update Header UI
    activeSetName.textContent = `${activeSet.namePt}${activeSet.liga?.acronym ? ` (${activeSet.liga.acronym})` : ''}`;
    const symbolUrl = sanitizeUrl(activeSet.liga?.icon || activeSet.symbol);
    if (symbolUrl) {
      activeSetSymbol.classList.remove('hidden');
      activeSetSymbol.onerror = () => {
        const fbIcon = sanitizeUrl(activeSet.liga?.icon);
        if (fbIcon && resolveUrlHref(activeSetSymbol.src) !== resolveUrlHref(fbIcon)) {
          activeSetSymbol.src = fbIcon;
        } else {
          activeSetSymbol.classList.add('hidden');
        }
      };
      activeSetSymbol.src = symbolUrl;
    } else {
      activeSetSymbol.classList.add('hidden');
    }

    const imgCount = (activeSet.cards || []).filter(c => c.localImage).length;
    if (imgCount > 0 && imgCount >= activeSet.cards.length * 0.8) {
      activeSetBadge.textContent = '⚡ Offline HD';
      activeSetBadge.style.background = 'rgba(16, 185, 129, 0.2)';
      activeSetBadge.style.color = '#34d399';
    } else {
      activeSetBadge.textContent = '☁️ Cache Dados';
      activeSetBadge.style.background = 'rgba(59, 130, 246, 0.2)';
      activeSetBadge.style.color = '#60a5fa';
    }

    officialSetTotal.textContent = `/ ${activeSet.cardCount?.official || activeSet.cards?.length || '---'}`;

    if (activeSet.pricesUpdatedAt) {
      const dt = new Date(activeSet.pricesUpdatedAt);
      pricesLastSync.textContent = `R$ atualizado: ${dt.toLocaleDateString('pt-BR')} ${dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      pricesLastSync.textContent = '';
    }

    renderCardsGrid();
    loadCatalog(false); // refresh offline counter in header

    // Auto-focus number input so user can type right away
    cardNumberInput.focus();
    cardNumberInput.select();
  } catch (err) {
    if (err && err.name === 'AbortError') return;
    showToast(`Erro ao carregar coleção: ${err.message}`, 'error');
  }
}

// Update only the .active highlight class on existing card tiles without re-rendering DOM
function updateActiveTileHighlight() {
  const targetId = activeCard ? String(activeCard.localId) : null;
  cardsGrid.querySelectorAll('.card-tile').forEach(tile => {
    const isMatch = targetId !== null && tile.getAttribute('data-localid') === targetId;
    tile.classList.toggle('active', isMatch);
  });
}

// Event Delegation for cardsGrid
cardsGrid.addEventListener('click', (e) => {
  const tile = e.target.closest('.card-tile');
  if (!tile || !activeSet || !activeSet.cards) return;
  const lid = tile.getAttribute('data-localid');
  const found = activeSet.cards.find(c => String(c.localId) === String(lid));
  if (found) {
    selectCardForSpotlight(found);
  }
});

// Render Left Column Cards Grid based on Number & Name filters
function renderCardsGrid() {
  if (!activeSet || !activeSet.cards) {
    cardsGrid.innerHTML = '';
    return;
  }

  const filtered = getCurrentlyFilteredCards();

  cardsListCount.textContent = `${filtered.length} de ${activeSet.cards.length} cartas`;

  cardsGrid.innerHTML = filtered.map(card => {
    const isSelected = activeCard && String(activeCard.localId) === String(card.localId);
    const imgUrl = getCardImageUrl(card);
    const fallbackUrl = sanitizeUrl(card.imageEn || card.imageLiga, 'https://tcgdex.dev/favicon.svg');
    const menor = card.pricesBRL?.menor || 0;
    const ownedQty = getOwnedQuantityForCard(activeSet.id, card.localId, null);
    return `
      <div class="card-tile ${isSelected ? 'active' : ''} ${ownedQty > 0 ? 'owned' : ''}" data-localid="${escapeHtml(card.localId)}">
        <img class="card-tile-thumb" src="${escapeHtml(imgUrl)}" data-fallback="${escapeHtml(fallbackUrl)}" loading="lazy" alt="${escapeHtml(card.namePt)}" />
        <div class="card-tile-info">
          <div class="card-tile-top-row">
            <span class="card-tile-num">#${escapeHtml(card.localId)}</span>
            ${ownedQty > 0 ? `<span class="tile-owned-badge" title="Na sua coleção: ${ownedQty}x">💎 ${ownedQty}x</span>` : ''}
          </div>
          <div class="card-tile-name" title="${escapeHtml(card.namePt)}">${escapeHtml(card.namePt)}</div>
          <div class="card-tile-price">${menor > 0 ? formatBRL(menor) : 'S/ cotação'}</div>
        </div>
      </div>
    `;
  }).join('');

  cardsGrid.querySelectorAll('.card-tile-thumb').forEach(img => {
    img.addEventListener('error', () => {
      const fb = sanitizeUrl(img.getAttribute('data-fallback'));
      if (fb && resolveUrlHref(img.src) !== resolveUrlHref(fb)) {
        img.src = fb;
      }
    }, { once: true });
  });
}

// Display card in Spotlight
function selectCardForSpotlight(card, variantCode = '0') {
  activeCard = card;
  activeVariantCode = resolveDefaultVariantCode(card, variantCode);

  emptySpotlight.classList.add('hidden');
  cardSpotlight.classList.remove('hidden');

  const official = activeSet?.cardCount?.official || activeSet?.cards?.length || '';
  spotlightNumber.textContent = `#${card.localId}${official ? `/${official}` : ''}`;
  spotlightRarity.textContent = card.rarity || 'Carta TCG';
  spotlightNamePt.textContent = card.namePt;
  spotlightNameEn.textContent = `${card.nameEn} • ${activeSet?.namePt || ''}`;

  if (card.localImage) {
    spotlightOfflineBadge.classList.remove('hidden');
  } else {
    spotlightOfflineBadge.classList.add('hidden');
  }

  const primaryImg = getCardImageUrl(card);
  spotlightImage.src = sanitizeUrl(primaryImg, 'https://tcgdex.dev/favicon.svg');
  spotlightImage.onerror = () => {
    const ligaImg = sanitizeUrl(card.imageLiga);
    const enImg = sanitizeUrl(card.imageEn);
    if (ligaImg && resolveUrlHref(spotlightImage.src) !== resolveUrlHref(ligaImg)) {
      spotlightImage.src = ligaImg;
    } else if (enImg && resolveUrlHref(spotlightImage.src) !== resolveUrlHref(enImg)) {
      spotlightImage.src = enImg;
    }
  };

  const safeLigaUrl = sanitizeUrl(card.ligaUrl);
  if (safeLigaUrl) {
    spotlightLigaLink.href = safeLigaUrl;
    spotlightLigaLink.classList.remove('hidden');
  } else {
    spotlightLigaLink.removeAttribute('href');
    spotlightLigaLink.classList.add('hidden');
  }

  renderVariantPills(card);
  updateSpotlightPriceDisplay();
  updateSpotlightOwnedBadge();
  updateActiveTileHighlight();

  // If variants or sales history haven't been loaded yet (or only '0' was cached previously), auto-fetch in background
  const cachedVarKeys = Object.keys(card.variantPricesBRL || {});
  if (!card.variantPricesBRL || cachedVarKeys.length <= 1 || !card.salesLast3Months) {
    autoFetchCardDetails(card);
  }
}

async function autoFetchCardDetails(card) {
  if (!activeSet || !card) return;
  if (activeDetailsAbortCtrl) {
    activeDetailsAbortCtrl.abort();
  }
  activeDetailsAbortCtrl = new AbortController();
  const targetSetId = activeSet.id;
  const targetLocalId = card.localId;

  const task = (async () => {
    try {
      const res = await fetch(
        `/api/cards/${encodeURIComponent(targetSetId)}/${encodeURIComponent(targetLocalId)}/variants`,
        { signal: activeDetailsAbortCtrl.signal }
      );
      if (!res.ok) return;
      const data = await res.json();
      if (data.card) {
        card.variantPricesBRL = data.variants;
        if (data.salesLast3Months) {
          card.salesLast3Months = data.salesLast3Months;
        }
        if (data.card.rarity) card.rarity = data.card.rarity;
        if (data.card.category) card.category = data.card.category;
        if (data.card.subCategory) card.subCategory = data.card.subCategory;
        if (data.card.elementType !== undefined) card.elementType = data.card.elementType;
        if (data.card.ligaColor) card.ligaColor = data.card.ligaColor;
        if (data.card.ligaType) card.ligaType = data.card.ligaType;

        const prevVariantCode = activeVariantCode;
        const resolvedVar = resolveDefaultVariantCode(card, prevVariantCode);
        const updatedPrices = getCardPricesForVariant(card, resolvedVar);
        const isDefaultVar = !resolvedVar || resolvedVar === '0';
        const sales3mVal = isDefaultVar ? (card.salesLast3Months?.medio || 0) : 0;

        if (activeSet?.id === targetSetId && activeCard?.localId === targetLocalId) {
          activeVariantCode = resolvedVar;
          spotlightRarity.textContent = activeCard.rarity || 'Carta TCG';
          renderVariantPills(activeCard);
          updateSpotlightPriceDisplay();
          updateSpotlightOwnedBadge();
        }

        // If this card was already added to the current Video Session before variants finished loading, update its price in the session
        const hasInSession = (sessionData?.items || []).some(
          i => String(i.setId).toLowerCase() === String(targetSetId).toLowerCase() &&
               normalizeNumInput(i.localId) === normalizeNumInput(targetLocalId)
        );
        if (hasInSession) {
          await fetch('/api/session/update-card', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              setId: targetSetId,
              localId: targetLocalId,
              previousVariantCode: prevVariantCode,
              variantCode: resolvedVar,
              variantLabel: updatedPrices.label || 'Normal',
              rarity: card.rarity || '',
              sales3m: sales3mVal,
              prices: {
                menor: updatedPrices.menor,
                medio: updatedPrices.medio,
                maior: updatedPrices.maior
              }
            })
          }).catch(() => {});
        }
      }
    } catch (err) {
      if (err && err.name === 'AbortError') return;
      // silently keep default
    }
  })();

  activeDetailsPromise = task;
  return task;
}

// Event Delegation for variantPillsContainer
if (variantPillsContainer) {
  variantPillsContainer.addEventListener('click', (e) => {
    const btn = e.target.closest('.variant-pill');
    if (!btn || !activeCard) return;
    activeVariantCode = btn.getAttribute('data-variant');
    renderVariantPills(activeCard);
    updateSpotlightPriceDisplay();
    updateSpotlightOwnedBadge();
  });
}

function renderVariantPills(card) {
  const variants = getEffectiveVariantsForCard(card);
  const variantList = Object.values(variants);
  if (variantList.length === 0) {
    variantPillsContainer.innerHTML = `
      <button class="variant-pill active" data-variant="0">Normal / Padrão</button>
    `;
    return;
  }

  variantPillsContainer.innerHTML = variantList.map(v => `
    <button class="variant-pill ${v.code === activeVariantCode ? 'active' : ''}" data-variant="${escapeHtml(v.code)}">
      ${escapeHtml(v.label)} (${formatBRL(v.menor)})
    </button>
  `).join('');
}

const VARIANT_VISUAL_ICONS = {
  '2': '✨',
  '3': '🌈',
  '5': '1️⃣',
  '7': '⭐',
  '13': '🏷️',
  '19': '🛡️',
  '41': '💎',
  '43': '🟣',
  '47': '🔴'
};

function updateCardVariantVisual(variantCode, label) {
  if (!card3dFrame) return;
  const code = String(variantCode || '0');
  card3dFrame.setAttribute('data-variant', code);

  if (!cardVariantBadge) return;
  if (code === '0') {
    cardVariantBadge.classList.add('hidden');
    cardVariantBadge.textContent = '';
  } else {
    const icon = VARIANT_VISUAL_ICONS[code] || '✨';
    cardVariantBadge.textContent = `${icon} ${label || 'Especial'}`;
    cardVariantBadge.classList.remove('hidden');
  }
}

function updateSpotlightPriceDisplay() {
  if (!activeCard) return;
  activeVariantCode = resolveDefaultVariantCode(activeCard, activeVariantCode);
  const p = getCardPricesForVariant(activeCard, activeVariantCode);
  activeVariantLabel.textContent = p.label || 'Normal';
  updateCardVariantVisual(activeVariantCode, p.label);
  const isDefaultVariant = !activeVariantCode || activeVariantCode === '0';

  // Always show the exact LigaPokemon listing prices of the selected variant so Spotlight, Video Session, and Collection always match
  priceMinBRL.textContent = formatBRL(p.menor);
  priceAvgBRL.textContent = formatBRL(p.medio);
  priceMaxBRL.textContent = formatBRL(p.maior);

  labelPriceMin.textContent = 'MENOR PREÇO';
  labelPriceAvg.textContent = 'PREÇO MÉDIO';
  labelPriceMax.textContent = 'MAIOR PREÇO';

  subPriceMin.textContent = 'Referência lojistas';
  if (isDefaultVariant && activeCard.salesLast3Months && activeCard.salesLast3Months.medio > 0) {
    const s = activeCard.salesLast3Months;
    const q = s.quantity;
    subPriceAvg.textContent = `Média 3m: ${formatBRL(s.medio)}${q > 0 ? ` (${q} un.)` : ''}`;
  } else {
    subPriceAvg.textContent = 'Média da versão';
  }
  subPriceMax.textContent = 'Topo de loja';
}

// Fetch detailed variant prices (Reverse Foil, Foil, Master Ball, Pokeball) + Sales History from LigaPokemon
btnLoadDetailedVariants.addEventListener('click', async () => {
  if (!activeCard || !activeSet) return;
  if (!btnLoadDetailedVariants.dataset.origText) {
    btnLoadDetailedVariants.dataset.origText = btnLoadDetailedVariants.textContent;
  }
  if (btnLoadDetailedVariants.dataset.timerId) {
    clearTimeout(Number(btnLoadDetailedVariants.dataset.timerId));
  }
  btnLoadDetailedVariants.textContent = '⏳ Consultando variantes e histórico na LigaPokémon...';
  try {
    const data = await apiFetch(`/api/cards/${encodeURIComponent(activeSet.id)}/${encodeURIComponent(activeCard.localId)}/variants`);
    if (data.card) {
      activeCard.variantPricesBRL = data.variants;
      if (data.salesLast3Months) {
        activeCard.salesLast3Months = data.salesLast3Months;
      }
      if (data.card.rarity) activeCard.rarity = data.card.rarity;
      spotlightRarity.textContent = activeCard.rarity || 'Carta TCG';
      renderVariantPills(activeCard);
      updateSpotlightPriceDisplay();
    }
    btnLoadDetailedVariants.textContent = '✅ Dados atualizados!';
    btnLoadDetailedVariants.dataset.timerId = String(setTimeout(() => {
      btnLoadDetailedVariants.textContent = btnLoadDetailedVariants.dataset.origText;
      delete btnLoadDetailedVariants.dataset.timerId;
    }, 2000));
  } catch (err) {
    showToast(`Erro ao buscar variantes: ${err.message}`, 'error');
    btnLoadDetailedVariants.textContent = '⚠️ Erro ao buscar variantes';
    btnLoadDetailedVariants.dataset.timerId = String(setTimeout(() => {
      btnLoadDetailedVariants.textContent = btnLoadDetailedVariants.dataset.origText;
      delete btnLoadDetailedVariants.dataset.timerId;
    }, 2000));
  }
});

// Number Input Fast Lookup (debounced)
cardNumberInput.addEventListener('input', () => {
  if (cardInputDebounceTimer) {
    clearTimeout(cardInputDebounceTimer);
  }
  cardInputDebounceTimer = setTimeout(() => {
    renderCardsGrid();
    // If exact match exists while typing, preview it automatically!
    const raw = cardNumberInput.value.trim();
    if (!raw || !activeSet?.cards) return;
    const exact = findBestCardByNumberQuery(activeSet.cards, raw, activeSet.id);
    if (exact) {
      selectCardForSpotlight(exact);
    }
  }, 120);
});

cardNumberInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    const raw = cardNumberInput.value.trim();
    if (!raw || !activeSet?.cards) return;
    const match = findBestCardByNumberQuery(activeSet.cards, raw, activeSet.id) ||
      getCurrentlyFilteredCards()[0] ||
      null;
    if (match) {
      selectCardForSpotlight(match);
      // Select text so user can immediately type the next card number without pressing Backspace!
      cardNumberInput.select();
    }
  } else if (e.key === '+' || e.key === '=') {
    e.preventDefault();
    addActiveCardToSession();
    cardNumberInput.select();
  } else if ((e.key === 'c' || e.key === 'C') && /^\d*$/.test(cardNumberInput.value.trim())) {
    e.preventDefault();
    addActiveCardToCollection();
    cardNumberInput.select();
  } else if (e.key === 'Escape') {
    cardNumberInput.value = '';
    renderCardsGrid();
  }
});

if (btnClearSearch) {
  btnClearSearch.addEventListener('click', () => {
    if (cardInputDebounceTimer) {
      clearTimeout(cardInputDebounceTimer);
    }
    cardNumberInput.value = '';
    renderCardsGrid();
    cardNumberInput.focus();
  });
}

// Next / Previous Card Navigation
function navigateCard(direction) {
  if (!activeSet || !activeSet.cards || activeSet.cards.length === 0) return;
  const cards = getCurrentlyFilteredCards();
  if (cards.length === 0) return;

  let currentIndex = -1;
  if (activeCard) {
    currentIndex = cards.findIndex(c => c.localId === activeCard.localId);
  }

  let nextIndex = currentIndex + direction;
  if (nextIndex < 0) {
    nextIndex = cards.length - 1; // loop to end
  } else if (nextIndex >= cards.length) {
    nextIndex = 0; // loop to start
  }

  const targetCard = cards[nextIndex];
  if (targetCard) {
    selectCardForSpotlight(targetCard);
    // Scroll corresponding tile into view safely using CSS.escape
    const safeSelectorId = typeof CSS !== 'undefined' && typeof CSS.escape === 'function'
      ? CSS.escape(String(targetCard.localId))
      : String(targetCard.localId).replace(/["\\]/g, '\\$&');
    const tile = cardsGrid.querySelector(`[data-localid="${safeSelectorId}"]`);
    if (tile) {
      tile.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }
}

btnPrevCard.addEventListener('click', () => navigateCard(-1));
btnNextCard.addEventListener('click', () => navigateCard(1));

// Helper to get currently filtered and sorted cards list
function getCurrentlyFilteredCards() {
  if (!activeSet || !activeSet.cards) return [];
  const rawNumQuery = cardNumberInput.value.trim();
  const normNumQuery = normalizeNumInput(rawNumQuery);
  const nameQuery = cardNameFilter.value.trim().toLowerCase();
  const sortMode = sortCardsSelect.value;
  const setId = activeSet.id || '';

  let filtered = activeSet.cards.filter(card => {
    if (rawNumQuery) {
      const exactMatch = isCardNumberExactMatch(card, rawNumQuery, setId);
      const localIdStr = String(card.localId || '');
      const cardAlpha = normalizeNumInput(localIdStr);
      const cardPure = extractCardPureNumber(localIdStr);
      const partialMatch =
        localIdStr.toUpperCase().includes(rawNumQuery.toUpperCase()) ||
        cardAlpha.includes(normNumQuery) ||
        (cardPure && cardPure.startsWith(normNumQuery));
      if (!exactMatch && !partialMatch) return false;
    }
    if (nameQuery) {
      const matchPt = (card.namePt || '').toLowerCase().includes(nameQuery);
      const matchEn = (card.nameEn || '').toLowerCase().includes(nameQuery);
      if (!matchPt && !matchEn) return false;
    }
    return true;
  });

  filtered.sort((a, b) => {
    if (normNumQuery) {
      const aExact = isCardNumberExactMatch(a, rawNumQuery, setId);
      const bExact = isCardNumberExactMatch(b, rawNumQuery, setId);
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      if (aExact && bExact) {
        return compareCardsByNumberClient(a, b, setId);
      }
    }

    if (sortMode === 'price-desc') {
      return (b.pricesBRL?.menor || 0) - (a.pricesBRL?.menor || 0);
    }
    if (sortMode === 'price-asc') {
      return (a.pricesBRL?.menor || 0) - (b.pricesBRL?.menor || 0);
    }
    if (sortMode === 'name') {
      return (a.namePt || '').localeCompare(b.namePt || '');
    }
    return compareCardsByNumberClient(a, b, setId);
  });

  return filtered;
}

cardNameFilter.addEventListener('input', renderCardsGrid);
sortCardsSelect.addEventListener('change', renderCardsGrid);

// Global Keyboard Shortcuts
window.addEventListener('keydown', (e) => {
  if (!confirmModal.classList.contains('hidden')) return;

  const tag = document.activeElement?.tagName;
  const isTyping = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';

  if (e.key === '/' && !isTyping) {
    e.preventDefault();
    cardNumberInput.focus();
    cardNumberInput.select();
  } else if ((e.key === '+' || e.key === '=') && !isTyping) {
    e.preventDefault();
    addActiveCardToSession();
  } else if ((e.key === 'c' || e.key === 'C') && !isTyping) {
    e.preventDefault();
    addActiveCardToCollection();
  } else if (e.key === 'ArrowLeft' && !isTyping) {
    e.preventDefault();
    navigateCard(-1);
  } else if (e.key === 'ArrowRight' && !isTyping) {
    e.preventDefault();
    navigateCard(1);
  }
});

// 3D Card Tilt Effect in Spotlight
card3dFrame.addEventListener('mousemove', (e) => {
  const rect = card3dFrame.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const rotY = ((x / rect.width) - 0.5) * 18;
  const rotX = ((0.5 - (y / rect.height))) * 18;
  const mx = Math.max(0, Math.min(100, (x / rect.width) * 100));
  const my = Math.max(0, Math.min(100, (y / rect.height) * 100));
  card3dFrame.style.setProperty('--mx', `${mx.toFixed(1)}%`);
  card3dFrame.style.setProperty('--my', `${my.toFixed(1)}%`);
  card3dFrame.style.transform = `perspective(700px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(1.02)`;
});

card3dFrame.addEventListener('mouseleave', () => {
  card3dFrame.style.setProperty('--mx', '50%');
  card3dFrame.style.setProperty('--my', '50%');
  card3dFrame.style.transform = 'perspective(700px) rotateX(0deg) rotateY(0deg) scale(1)';
});

// Add Active Card to Video Session Counter
async function addActiveCardToSession() {
  if (!activeCard || !activeSet) return;
  if (!activeCard.variantPricesBRL && activeDetailsPromise) {
    await Promise.race([activeDetailsPromise, new Promise(r => setTimeout(r, 1200))]);
  }
  activeVariantCode = resolveDefaultVariantCode(activeCard, activeVariantCode);
  const prices = getCardPricesForVariant(activeCard, activeVariantCode);
  const official = activeSet?.cardCount?.official || activeSet?.cards?.length || '';
  const isDefaultVariant = !activeVariantCode || activeVariantCode === '0';
  const sales3m = isDefaultVariant ? (activeCard.salesLast3Months?.medio || 0) : 0;

  try {
    await apiFetch('/api/session/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        setId: activeSet.id,
        setName: activeSet.namePt,
        ligaAcronym: activeSet.liga?.acronym || '',
        localId: activeCard.localId,
        numberFormatted: `#${activeCard.localId}${official ? `/${official}` : ''}`,
        namePt: activeCard.namePt,
        nameEn: activeCard.nameEn,
        rarity: activeCard.rarity || '',
        category: activeCard.category || null,
        subCategory: activeCard.subCategory || null,
        elementType: activeCard.elementType || null,
        ligaColor: activeCard.ligaColor || null,
        ligaType: activeCard.ligaType || null,
        variantCode: activeVariantCode,
        variantLabel: prices.label || 'Normal',
        image: getCardImageUrl(activeCard),
        ligaUrl: sanitizeUrl(activeCard.ligaUrl || ''),
        sales3m: sales3m,
        prices: {
          menor: prices.menor,
          medio: prices.medio,
          maior: prices.maior
        }
      })
    });

    // Visual button feedback
    if (!btnAddCardToSession.dataset.origHtml) {
      btnAddCardToSession.dataset.origHtml = btnAddCardToSession.innerHTML;
    }
    if (btnAddCardToSession.dataset.timerId) {
      clearTimeout(Number(btnAddCardToSession.dataset.timerId));
    }
    btnAddCardToSession.innerHTML = collectionData.autoSaveOnSessionAdd
      ? '✅ Somado + Salvo na Coleção!'
      : '✅ Adicionado à Soma!';
    btnAddCardToSession.dataset.timerId = String(setTimeout(() => {
      btnAddCardToSession.innerHTML = btnAddCardToSession.dataset.origHtml;
      delete btnAddCardToSession.dataset.timerId;
    }, 900));
  } catch (err) {
    console.error('Erro ao adicionar carta à sessão:', err);
    showToast(`Erro ao adicionar carta à sessão: ${err.message}`, 'error');
  }
}

btnAddCardToSession.addEventListener('click', addActiveCardToSession);

// Add Active Card directly to Permanent User Collection ("Minha Coleção")
async function addActiveCardToCollection() {
  if (!activeCard || !activeSet) return;
  if (!activeCard.variantPricesBRL && activeDetailsPromise) {
    await Promise.race([activeDetailsPromise, new Promise(r => setTimeout(r, 1200))]);
  }
  activeVariantCode = resolveDefaultVariantCode(activeCard, activeVariantCode);
  const prices = getCardPricesForVariant(activeCard, activeVariantCode);
  const official = activeSet?.cardCount?.official || activeSet?.cards?.length || '';
  const isDefaultVariant = !activeVariantCode || activeVariantCode === '0';
  const sales3m = isDefaultVariant ? (activeCard.salesLast3Months?.medio || 0) : 0;

  try {
    await apiFetch('/api/collection/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        setId: activeSet.id,
        setName: activeSet.namePt,
        ligaAcronym: activeSet.liga?.acronym || '',
        localId: activeCard.localId,
        numberFormatted: `#${activeCard.localId}${official ? `/${official}` : ''}`,
        namePt: activeCard.namePt,
        nameEn: activeCard.nameEn,
        rarity: activeCard.rarity || '',
        category: activeCard.category || null,
        subCategory: activeCard.subCategory || null,
        elementType: activeCard.elementType || null,
        ligaColor: activeCard.ligaColor || null,
        ligaType: activeCard.ligaType || null,
        variantCode: activeVariantCode,
        variantLabel: prices.label || 'Normal',
        image: getCardImageUrl(activeCard),
        ligaUrl: sanitizeUrl(activeCard.ligaUrl || ''),
        sales3m: sales3m,
        prices: {
          menor: prices.menor,
          medio: prices.medio,
          maior: prices.maior
        }
      })
    });

    if (btnAddCardToCollection) {
      if (!btnAddCardToCollection.dataset.origHtml) {
        btnAddCardToCollection.dataset.origHtml = btnAddCardToCollection.innerHTML;
      }
      if (btnAddCardToCollection.dataset.timerId) {
        clearTimeout(Number(btnAddCardToCollection.dataset.timerId));
      }
      btnAddCardToCollection.innerHTML = '💎 Salvo na Minha Coleção!';
      btnAddCardToCollection.dataset.timerId = String(setTimeout(() => {
        btnAddCardToCollection.innerHTML = btnAddCardToCollection.dataset.origHtml;
        delete btnAddCardToCollection.dataset.timerId;
      }, 950));
    }
  } catch (err) {
    console.error('Erro ao adicionar carta à coleção:', err);
    showToast(`Erro ao adicionar carta à coleção: ${err.message}`, 'error');
  }
}

if (btnAddCardToCollection) {
  btnAddCardToCollection.addEventListener('click', addActiveCardToCollection);
}

if (chkAutoSaveCollection) {
  chkAutoSaveCollection.addEventListener('change', async () => {
    try {
      await apiFetch('/api/collection/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autoSaveOnSessionAdd: chkAutoSaveCollection.checked })
      });
    } catch (err) {
      console.error('Erro ao salvar configuração de autoSave:', err);
      chkAutoSaveCollection.checked = !chkAutoSaveCollection.checked;
      showToast(`Erro ao salvar configuração: ${err.message}`, 'error');
    }
  });
}

if (btnImportSessionToCollection) {
  btnImportSessionToCollection.addEventListener('click', async () => {
    const items = sessionData?.items || [];
    if (items.length === 0) {
      showToast('Nenhuma carta na Soma do Vídeo atual para salvar na coleção.', 'info');
      return;
    }
    btnImportSessionToCollection.disabled = true;
    const orig = btnImportSessionToCollection.textContent;
    btnImportSessionToCollection.textContent = '⏳ Salvando...';
    try {
      const data = await apiFetch('/api/collection/import-session', { method: 'POST' });
      btnImportSessionToCollection.textContent = `✅ ${data.importedCount || items.length} salvas!`;
      setTimeout(() => {
        btnImportSessionToCollection.textContent = orig;
        btnImportSessionToCollection.disabled = false;
      }, 1500);
    } catch (err) {
      showToast(`Erro ao salvar cartas na coleção: ${err.message}`, 'error');
      btnImportSessionToCollection.textContent = orig;
      btnImportSessionToCollection.disabled = false;
    }
  });
}

// Helper to determine item price based on mode
function getItemPriceByMode(item, mode) {
  const pMin = item.prices?.menor || 0;
  const pAvg = item.prices?.medio || 0;
  const pMax = item.prices?.maior || 0;
  const sales3m = item.sales3m || 0;

  if (mode === 'vendas3m') {
    return sales3m > 0 ? sales3m : (pMin > 0 ? pMin : pAvg);
  }
  if (mode === 'medio') return pAvg;
  if (mode === 'maior') return pMax;
  return pMin;
}

// Event Delegation for sessionItemsList
if (sessionItemsList) {
  sessionItemsList.addEventListener('click', async (e) => {
    const btn = e.target.closest('.btn-remove-session');
    if (!btn) return;
    const uid = btn.getAttribute('data-uid');
    try {
      await apiFetch('/api/session/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid })
      });
    } catch (err) {
      console.error('Erro ao remover item da sessão:', err);
      showToast(`Erro ao remover item da sessão: ${err.message}`, 'error');
    }
  });
}

// Render Video Pack Opening Session
function renderSession() {
  const mode = sessionData.priceMode || 'menor';
  sessionPriceMode.value = mode;
  packsOpenedCount.textContent = sessionData.packsOpened || 0;

  const items = sessionData.items || [];
  sessionCardsCount.textContent = items.length;

  let sumMin = 0;
  let sumAvg = 0;
  let sumSelected = 0;
  let topHit = null;

  for (const item of items) {
    const pMin = roundCents(item.prices?.menor || 0);
    const pAvg = roundCents(item.prices?.medio || 0);
    const pSel = roundCents(getItemPriceByMode(item, mode));

    sumMin = roundCents(sumMin + pMin);
    sumAvg = roundCents(sumAvg + pAvg);
    sumSelected = roundCents(sumSelected + pSel);

    if (!topHit || pSel > topHit.val) {
      topHit = { item, val: pSel };
    }
  }

  sessionTotalValue.textContent = formatBRL(sumSelected);
  sessionTotalMin.textContent = formatBRL(sumMin);
  sessionTotalAvg.textContent = formatBRL(sumAvg);

  if (topHit && topHit.val > 0) {
    topHitBanner.classList.remove('hidden');
    topHitName.textContent = `${topHit.item.namePt} (${topHit.item.numberFormatted})`;
    topHitPrice.textContent = formatBRL(topHit.val);
  } else {
    topHitBanner.classList.add('hidden');
  }

  sessionItemsList.innerHTML = items.map(item => {
    const val = roundCents(getItemPriceByMode(item, mode));
    const subPriceLabel = mode === 'vendas3m' && item.sales3m > 0 ? ' (Média 3m)' : '';
    const safeImg = sanitizeUrl(item.image, 'https://tcgdex.dev/favicon.svg');
    return `
      <div class="session-item">
        <img src="${escapeHtml(safeImg)}" alt="${escapeHtml(item.namePt)}" />
        <div class="session-item-info">
          <div class="session-item-title">${escapeHtml(item.namePt)}</div>
          <div class="session-item-meta">${escapeHtml(item.numberFormatted)} • ${escapeHtml(item.variantLabel || 'Normal')}${subPriceLabel}</div>
        </div>
        <div class="session-item-price">${formatBRL(val)}</div>
        <button class="btn-icon btn-remove-session" data-uid="${escapeHtml(item.uid)}" title="Remover">✕</button>
      </div>
    `;
  }).join('');
}

btnPackPlus.addEventListener('click', async () => {
  try {
    await apiFetch('/api/session/packs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ delta: 1 })
    });
  } catch (err) {
    showToast(`Erro ao atualizar boosters: ${err.message}`, 'error');
  }
});

btnPackMinus.addEventListener('click', async () => {
  try {
    await apiFetch('/api/session/packs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ delta: -1 })
    });
  } catch (err) {
    showToast(`Erro ao atualizar boosters: ${err.message}`, 'error');
  }
});

sessionPriceMode.addEventListener('change', async () => {
  const prevMode = sessionData.priceMode || 'menor';
  try {
    await apiFetch('/api/session/packs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priceMode: sessionPriceMode.value })
    });
  } catch (err) {
    sessionPriceMode.value = prevMode;
    showToast(`Erro ao alterar modo de preço: ${err.message}`, 'error');
  }
});

btnClearSession.addEventListener('click', async () => {
  const confirmed = await showConfirmModal({
    icon: '🗑️',
    title: 'Zerar abertura atual?',
    message: 'Todas as cartas adicionadas e o contador de boosters deste vídeo serão removidos.',
    confirmText: 'Sim, zerar',
    cancelText: 'Cancelar'
  });
  if (confirmed) {
    try {
      await apiFetch('/api/session/clear', { method: 'POST' });
    } catch (err) {
      showToast(`Erro ao zerar sessão: ${err.message}`, 'error');
    }
  }
});

// Topbar Actions: Sync Prices & Save Offline
btnSyncPrices.addEventListener('click', async () => {
  if (!activeSet) return;
  btnSyncPrices.disabled = true;
  const orig = btnSyncPrices.textContent;
  btnSyncPrices.textContent = '⏳ Atualizando R$...';
  try {
    const data = await apiFetch(`/api/sets/${encodeURIComponent(activeSet.id)}/sync-prices`, { method: 'POST' });
    if (data.set) {
      activeSet = data.set;
      renderCardsGrid();
      if (activeCard) {
        const updatedCard = activeSet.cards.find(c => c.localId === activeCard.localId);
        if (updatedCard) selectCardForSpotlight(updatedCard, activeVariantCode);
      }
    }
    btnSyncPrices.textContent = '✅ Preços Atualizados!';
    setTimeout(() => { btnSyncPrices.textContent = orig; btnSyncPrices.disabled = false; }, 1500);
  } catch (err) {
    showToast(`Erro ao atualizar preços: ${err.message}`, 'error');
    btnSyncPrices.textContent = orig;
    btnSyncPrices.disabled = false;
  }
});

btnDownloadActiveSet.addEventListener('click', async () => {
  if (!activeSet) return;
  btnDownloadActiveSet.disabled = true;
  try {
    const data = await apiFetch(`/api/sets/${encodeURIComponent(activeSet.id)}/download`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ includeImages: true })
    });
    if (data.set) {
      activeSet = data.set;
      selectSet(activeSet.id);
    }
  } catch (err) {
    showToast(`Erro no backup offline: ${err.message}`, 'error');
  } finally {
    btnDownloadActiveSet.disabled = false;
  }
});

// Catalog Modal Logic
function openCatalogModal() {
  catalogModal.classList.remove('hidden');
  catalogSearchInput.value = '';
  catalogSearchInput.focus();
  renderCatalogModalList();
}

function closeCatalogModal() {
  catalogModal.classList.add('hidden');
}

setPickerTrigger.addEventListener('click', openCatalogModal);
btnOpenCatalogModal.addEventListener('click', openCatalogModal);
btnCloseCatalogModal.addEventListener('click', closeCatalogModal);
catalogModal.addEventListener('click', (e) => {
  if (e.target === catalogModal) closeCatalogModal();
});

catalogSearchInput.addEventListener('input', renderCatalogModalList);
catalogSearchInput.addEventListener('click', () => {
  if (catalogSearchInput.value) {
    catalogSearchInput.value = '';
    renderCatalogModalList();
  }
});

document.querySelectorAll('.filter-pill').forEach(pill => {
  pill.addEventListener('click', () => {
    document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    catalogFilter = pill.getAttribute('data-filter');
    renderCatalogModalList();
  });
});

btnRefreshCatalog.addEventListener('click', async () => {
  btnRefreshCatalog.disabled = true;
  btnRefreshCatalog.textContent = '⏳ Sincronizando...';
  try {
    await loadCatalog(true);
  } finally {
    btnRefreshCatalog.disabled = false;
    btnRefreshCatalog.textContent = '🔄 Atualizar Lista de Coleções';
  }
});

function renderCatalogModalList() {
  if (!catalog || !catalog.sets) return;
  const q = catalogSearchInput.value.trim().toLowerCase();

  const filtered = catalog.sets.filter(s => {
    if (catalogFilter === 'offline' && !s.offline?.isOffline) return false;
    if (catalogFilter === 'pt' && !s.hasPtTcgdex && !s.liga?.namePt) return false;
    if (q) {
      const mPt = (s.namePt || '').toLowerCase().includes(q);
      const mEn = (s.nameEn || '').toLowerCase().includes(q);
      const mId = (s.id || '').toLowerCase().includes(q);
      const mAc = (s.liga?.acronym || '').toLowerCase().includes(q);
      if (!mPt && !mEn && !mId && !mAc) return false;
    }
    return true;
  });

  const truncationNote = filtered.length > 120
    ? `<div class="catalog-truncation-note" style="padding:10px 12px;text-align:center;font-size:12px;color:#94a3b8;opacity:0.9;">Mostrando os primeiros 120 de ${filtered.length} resultados. Refine sua busca para ver outras coleções.</div>`
    : '';

  catalogListContainer.innerHTML = filtered.slice(0, 120).map(s => {
    const isOff = s.offline?.isOffline;
    const isCached = s.offline?.isCached;
    const imgCount = s.offline?.offlineImagesCount || 0;
    const ligaBadge = s.liga ? `🇧🇷 Liga: ${escapeHtml(s.liga.acronym)}` : '🌐 Só TCGdex';
    const statusText = isOff
      ? `⚡ Salva no PC (${s.offline.offlineCardCount} cartas, ${imgCount} fotos HD)`
      : isCached
        ? `☁️ Cache Dados (${s.offline.offlineCardCount} cartas) • ${ligaBadge}`
        : `${s.cardCount?.total || '?'} cartas • ${ligaBadge}`;

    const iconUrl = sanitizeUrl(s.liga?.icon || s.symbol || '');
    const fallbackIconUrl = sanitizeUrl(s.liga?.icon || '');

    return `
      <div class="catalog-item">
        <div class="catalog-item-left" data-select-set="${escapeHtml(s.id)}">
          ${iconUrl ? `<img class="catalog-item-icon" src="${escapeHtml(iconUrl)}" data-fallback="${escapeHtml(fallbackIconUrl)}" alt="" />` : `<div class="catalog-item-icon">📦</div>`}
          <div class="catalog-item-titles">
            <div class="catalog-item-name">${escapeHtml(s.namePt)} ${s.liga?.acronym ? `<span style="color:#facc15">[${escapeHtml(s.liga.acronym)}]</span>` : ''}</div>
            <div class="catalog-item-sub">${escapeHtml(s.nameEn)} • ${statusText}</div>
          </div>
        </div>
        <div class="catalog-item-actions">
          <button class="btn btn-sm btn-secondary" data-select-set="${escapeHtml(s.id)}">Abrir</button>
          <button class="btn btn-sm btn-primary" data-download-set="${escapeHtml(s.id)}" title="Baixar todas as fotos HD + Preços R$ no PC">
            ${isOff && imgCount > 0 ? '🔄 Rebaixar' : '💾 Baixar HD'}
          </button>
        </div>
      </div>
    `;
  }).join('') + truncationNote;

  catalogListContainer.querySelectorAll('img.catalog-item-icon').forEach(img => {
    img.addEventListener('error', () => {
      const fb = sanitizeUrl(img.getAttribute('data-fallback'));
      if (fb && resolveUrlHref(img.src) !== resolveUrlHref(fb)) {
        img.src = fb;
      } else {
        const placeholder = document.createElement('div');
        placeholder.className = 'catalog-item-icon';
        placeholder.textContent = '📦';
        img.replaceWith(placeholder);
      }
    }, { once: true });
  });

  catalogListContainer.querySelectorAll('[data-select-set]').forEach(el => {
    el.addEventListener('click', () => {
      const id = el.getAttribute('data-select-set');
      closeCatalogModal();
      selectSet(id);
    });
  });

  catalogListContainer.querySelectorAll('[data-download-set]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-download-set');
      btn.disabled = true;
      btn.textContent = '⏳ Baixando...';
      closeCatalogModal();
      await selectSet(id);
      try {
        await apiFetch(`/api/sets/${encodeURIComponent(id)}/download`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ includeImages: true })
        });
        if (activeSet && activeSet.id === id) {
          await selectSet(id);
        } else {
          loadCatalog(false);
        }
      } catch (err) {
        showToast(`Erro ao baixar coleção: ${err.message}`, 'error');
      }
    });
  });
}

// My Collection & Radar of Meta Modal Logic
function openCollectionModal() {
  collectionModal.classList.remove('hidden');
  populateCollectionSetFilter();
  renderCollectionModal();
}

function closeCollectionModal() {
  collectionModal.classList.add('hidden');
}

if (btnOpenCollectionModal) btnOpenCollectionModal.addEventListener('click', openCollectionModal);
if (btnCloseCollectionModal) btnCloseCollectionModal.addEventListener('click', closeCollectionModal);
if (collectionModal) {
  collectionModal.addEventListener('click', (e) => {
    if (e.target === collectionModal) closeCollectionModal();
  });
}

document.querySelectorAll('[data-col-tab]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('[data-col-tab]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    collectionTab = btn.getAttribute('data-col-tab');
    renderCollectionModal();
  });
});

if (collectionCategoryPills) {
  collectionCategoryPills.addEventListener('click', (e) => {
    const pill = e.target.closest('[data-col-cat]');
    if (!pill) return;
    const selectedCat = pill.getAttribute('data-col-cat') || 'all';
    collectionCategoryFilter = selectedCat;
    collectionCategoryPills.querySelectorAll('[data-col-cat]').forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-col-cat') === selectedCat);
    });
    // If selecting a Trainer category, reset element filter to 'all' since Trainers have no energy element
    if (['trainer', 'item', 'supporter', 'tool', 'stadium'].includes(selectedCat) && collectionElementFilter !== 'all') {
      collectionElementFilter = 'all';
      if (collectionElementPills) {
        collectionElementPills.querySelectorAll('[data-col-elem]').forEach(b => {
          b.classList.toggle('active', b.getAttribute('data-col-elem') === 'all');
        });
      }
    }
    renderCollectionModal();
  });
}

if (collectionElementPills) {
  collectionElementPills.addEventListener('click', (e) => {
    const pill = e.target.closest('[data-col-elem]');
    if (!pill) return;
    const selectedElem = pill.getAttribute('data-col-elem') || 'all';
    collectionElementFilter = selectedElem;
    collectionElementPills.querySelectorAll('[data-col-elem]').forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-col-elem') === selectedElem);
    });
    // If user was on a Trainer filter and clicks an Energy/Element type, auto-switch category to 'all'
    if (selectedElem !== 'all' && ['trainer', 'item', 'supporter', 'tool', 'stadium'].includes(collectionCategoryFilter)) {
      collectionCategoryFilter = 'all';
      if (collectionCategoryPills) {
        collectionCategoryPills.querySelectorAll('[data-col-cat]').forEach(b => {
          b.classList.toggle('active', b.getAttribute('data-col-cat') === 'all');
        });
      }
    }
    renderCollectionModal();
  });
}

if (collectionSearchInput) collectionSearchInput.addEventListener('input', renderCollectionModal);
if (collectionSetFilter) collectionSetFilter.addEventListener('change', renderCollectionModal);
if (collectionSortSelect) collectionSortSelect.addEventListener('change', renderCollectionModal);

if (collectionPriceMode) {
  collectionPriceMode.addEventListener('change', async () => {
    const prevPriceMode = collectionData.priceMode || 'menor';
    const priceMode = collectionPriceMode.value;
    collectionData.priceMode = priceMode;
    renderCollectionModal();
    updateCollectionTopbarSummary();
    try {
      await apiFetch('/api/collection/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceMode })
      });
    } catch (err) {
      console.error('Erro ao salvar modo de preço:', err);
      collectionData.priceMode = prevPriceMode;
      collectionPriceMode.value = prevPriceMode;
      renderCollectionModal();
      updateCollectionTopbarSummary();
      showToast(`Erro ao salvar modo de preço: ${err.message}`, 'error');
    }
  });
}

// Event Delegation for collectionListContainer
if (collectionListContainer) {
  collectionListContainer.addEventListener('click', async (e) => {
    const editBtn = e.target.closest('[data-edit-base]');
    if (editBtn) {
      e.stopPropagation();
      const cardKey = editBtn.getAttribute('data-edit-base');
      const currBase = editBtn.getAttribute('data-curr-base') || '0';
      const input = prompt('Digite o valor em R$ de quando você conseguiu/cadastrou esta carta (ex: 0.25):', String(currBase).replace('.', ','));
      if (input === null) return;
      const parsed = parseFloat(input.replace(',', '.'));
      if (isNaN(parsed) || parsed < 0) {
        showToast('Valor inválido.', 'error');
        return;
      }
      const rounded = roundCents(parsed);
      try {
        await apiFetch('/api/collection/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cardKey,
            priceAtAddition: {
              menor: rounded,
              medio: rounded,
              maior: rounded,
              sales3m: rounded
            }
          })
        });
      } catch (err) {
        showToast(`Erro ao atualizar preço base: ${err.message}`, 'error');
      }
      return;
    }

    const qtyBtn = e.target.closest('[data-col-qty-delta]');
    if (qtyBtn) {
      const cardKey = qtyBtn.getAttribute('data-key');
      const delta = parseInt(qtyBtn.getAttribute('data-col-qty-delta'), 10);
      try {
        await apiFetch('/api/collection/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cardKey, delta })
        });
      } catch (err) {
        showToast(`Erro ao atualizar quantidade: ${err.message}`, 'error');
      }
      return;
    }

    const removeBtn = e.target.closest('[data-remove-key]');
    if (removeBtn) {
      const cardKey = removeBtn.getAttribute('data-remove-key');
      const confirmed = await showConfirmModal({
        icon: '🗑️',
        title: 'Remover da coleção?',
        message: 'Esta carta será removida permanentemente do banco de dados da sua coleção.',
        confirmText: 'Sim, remover',
        cancelText: 'Cancelar'
      });
      if (confirmed) {
        try {
          await apiFetch('/api/collection/remove', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cardKey })
          });
        } catch (err) {
          showToast(`Erro ao remover carta da coleção: ${err.message}`, 'error');
        }
      }
      return;
    }

    const openEl = e.target.closest('[data-open-set]');
    if (openEl) {
      const setId = openEl.getAttribute('data-open-set');
      const localId = openEl.getAttribute('data-open-localid');
      const variantCode = openEl.getAttribute('data-open-variant') || '0';
      closeCollectionModal();
      if (!activeSet || activeSet.id !== setId) {
        await selectSet(setId);
      }
      if (activeSet && activeSet.cards) {
        const normTarget = normalizeNumInput(localId);
        const found = activeSet.cards.find(c =>
          String(c.localId) === String(localId) || normalizeNumInput(c.localId) === normTarget
        );
        if (found) selectCardForSpotlight(found, variantCode);
      }
    }
  });
}

function populateCollectionSetFilter() {
  if (!collectionSetFilter) return;
  const currentVal = collectionSetFilter.value || 'all';
  const items = collectionData?.items || [];
  const setsMap = new Map();
  for (const item of items) {
    if (item.setId && !setsMap.has(item.setId)) {
      const label = `${item.setName || item.setId}${item.ligaAcronym ? ` [${item.ligaAcronym}]` : ''}`;
      setsMap.set(item.setId, label);
    }
  }
  const optionsHtml = [
    `<option value="all">Todas as Edições (${setsMap.size})</option>`,
    ...Array.from(setsMap.entries()).map(([id, label]) => `<option value="${escapeHtml(id)}">${escapeHtml(label)}</option>`)
  ].join('');
  collectionSetFilter.innerHTML = optionsHtml;
  if (setsMap.has(currentVal)) {
    collectionSetFilter.value = currentVal;
  } else {
    collectionSetFilter.value = 'all';
  }
}

function renderCollectionModal() {
  if (!collectionListContainer) return;
  const items = collectionData?.items || [];
  const mode = collectionPriceMode?.value || collectionData?.priceMode || 'menor';
  const query = (collectionSearchInput?.value || '').trim().toLowerCase();
  const selectedSet = collectionSetFilter?.value || 'all';
  const sortMode = collectionSortSelect?.value || 'gain-brl-desc';

  let totalUnique = items.length;
  let totalCopies = 0;
  let sumInitialBRL = 0;
  let sumCurrentBRL = 0;
  let gainersCount = 0;
  let metaJumpCount = 0;
  let dupesCount = 0;
  let topGainer = null;

  const catCounts = {
    all: items.length,
    pokemon: 0,
    trainer: 0,
    item: 0,
    supporter: 0,
    tool: 0,
    stadium: 0,
    energy: 0
  };
  const elemCounts = {
    all: items.length,
    G: 0, R: 0, W: 0, L: 0, P: 0, F: 0, D: 0, M: 0, N: 0, Y: 0, C: 0
  };

  const enriched = items.map(item => {
    const val = computeCardValuation(item, mode);
    const cls = getCardClassificationClient(item);
    totalCopies += val.qty;
    sumInitialBRL = roundCents(sumInitialBRL + val.totalBaseBRL);
    sumCurrentBRL = roundCents(sumCurrentBRL + val.totalCurrBRL);
    if (val.isGainer) gainersCount++;
    if (val.isMetaJump) metaJumpCount++;
    if (val.qty >= 2) dupesCount++;

    if (cls.category === 'pokemon') catCounts.pokemon++;
    else if (cls.category === 'trainer') {
      catCounts.trainer++;
      if (catCounts[cls.subCategory] !== undefined) catCounts[cls.subCategory]++;
    } else if (cls.category === 'energy') {
      catCounts.energy++;
    }

    if (cls.elementType && elemCounts[cls.elementType] !== undefined) {
      elemCounts[cls.elementType]++;
    }

    if (val.isGainer && (!topGainer || val.diffUnitBRL > topGainer.val.diffUnitBRL)) {
      topGainer = { item, val };
    }
    return { item, val, cls };
  });

  // Update TCG Live Category & Element Type Pill Counters
  if (collectionCategoryPills) {
    collectionCategoryPills.querySelectorAll('[data-col-cat]').forEach(btn => {
      const cKey = btn.getAttribute('data-col-cat');
      const count = catCounts[cKey] ?? 0;
      let countBadge = btn.querySelector('.pill-count');
      if (!countBadge) {
        countBadge = document.createElement('span');
        countBadge.className = 'pill-count';
        btn.appendChild(countBadge);
      }
      countBadge.textContent = count;
    });
  }
  if (collectionElementPills) {
    collectionElementPills.querySelectorAll('[data-col-elem]').forEach(btn => {
      const eKey = btn.getAttribute('data-col-elem');
      const count = elemCounts[eKey] ?? 0;
      let countBadge = btn.querySelector('.pill-count');
      if (!countBadge) {
        countBadge = document.createElement('span');
        countBadge.className = 'pill-count';
        btn.appendChild(countBadge);
      }
      countBadge.textContent = count;
    });
  }

  // Update Dashboard Summary
  const totalProfitBRL = roundCents(sumCurrentBRL - sumInitialBRL);
  const totalProfitPct = sumInitialBRL > 0 ? ((sumCurrentBRL - sumInitialBRL) / sumInitialBRL) * 100 : 0;

  if (colDashCurrentTotal) colDashCurrentTotal.textContent = formatBRL(sumCurrentBRL);
  if (colDashTotalCopies) colDashTotalCopies.textContent = `${totalUnique} cartas únicas • ${totalCopies} cópias no total`;
  if (colDashInitialTotal) colDashInitialTotal.textContent = formatBRL(sumInitialBRL);

  if (colDashProfitValue) {
    const sign = totalProfitBRL > 0.009 ? '+' : '';
    colDashProfitValue.textContent = `${sign}${formatBRL(totalProfitBRL)}`;
    colDashProfitValue.className = `col-stat-value ${totalProfitBRL > 0.009 ? 'text-gain' : totalProfitBRL < -0.009 ? 'text-loss' : ''}`;
  }
  if (colDashProfitPercent) {
    const sign = totalProfitPct > 0.05 ? '+' : '';
    colDashProfitPercent.textContent = `${sign}${totalProfitPct.toFixed(1)}%`;
    colDashProfitPercent.className = `col-profit-pill ${totalProfitBRL > 0.009 ? 'pill-gain' : totalProfitBRL < -0.009 ? 'pill-loss' : ''}`;
  }

  if (colDashLastSync) {
    if (collectionData.lastPriceSyncAt) {
      const dt = new Date(collectionData.lastPriceSyncAt);
      colDashLastSync.textContent = `Preços Liga atualizados: ${dt.toLocaleDateString('pt-BR')} às ${dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      colDashLastSync.textContent = 'Clique em "Atualizar Todos os Preços" no topo';
    }
  }

  if (colDashGainersCount) colDashGainersCount.textContent = `${gainersCount} ${gainersCount === 1 ? 'carta subiu' : 'cartas subiram'}`;
  if (colDashTopGainer) {
    if (topGainer) {
      colDashTopGainer.textContent = `Destaque: ${topGainer.item.namePt} (+${formatBRL(topGainer.val.diffUnitBRL)} / +${Math.round(topGainer.val.diffPct)}%)`;
    } else {
      colDashTopGainer.textContent = 'Nenhuma alta detectada ainda';
    }
  }

  // Update Tab Badges
  if (colTabCountAll) colTabCountAll.textContent = totalUnique;
  if (colTabCountGainers) colTabCountGainers.textContent = gainersCount;
  if (colTabCountMeta) colTabCountMeta.textContent = metaJumpCount;
  if (colTabCountDupes) colTabCountDupes.textContent = dupesCount;

  // Filter items
  let filtered = enriched.filter(({ item, val, cls }) => {
    if (collectionTab === 'gainers' && !val.isGainer) return false;
    if (collectionTab === 'meta-jump' && !val.isMetaJump) return false;
    if (collectionTab === 'dupes' && val.qty < 2) return false;

    // Pokémon TCG Live Category / Trainer Subtype filter
    if (collectionCategoryFilter !== 'all') {
      if (collectionCategoryFilter === 'pokemon' && cls.category !== 'pokemon') return false;
      if (collectionCategoryFilter === 'trainer' && cls.category !== 'trainer') return false;
      if (collectionCategoryFilter === 'energy' && cls.category !== 'energy') return false;
      if (['item', 'supporter', 'tool', 'stadium'].includes(collectionCategoryFilter)) {
        if (cls.category !== 'trainer' || cls.subCategory !== collectionCategoryFilter) return false;
      }
    }

    // Pokémon TCG Live Element / Energy Type filter
    if (collectionElementFilter !== 'all') {
      if (cls.elementType !== collectionElementFilter) return false;
    }

    if (selectedSet !== 'all' && item.setId !== selectedSet) return false;

    if (query) {
      const elemLabel = (cls.elementType && ELEMENT_TYPE_META[cls.elementType]?.label || '').toLowerCase();
      const subLabel = (SUBCATEGORY_META[cls.subCategory]?.label || '').toLowerCase();
      const mNamePt = (item.namePt || '').toLowerCase().includes(query);
      const mNameEn = (item.nameEn || '').toLowerCase().includes(query);
      const mNum = (item.numberFormatted || item.localId || '').toLowerCase().includes(query);
      const mSet = (item.setName || '').toLowerCase().includes(query);
      const mAc = (item.ligaAcronym || '').toLowerCase().includes(query);
      const mRar = (item.rarity || '').toLowerCase().includes(query);
      const mType = elemLabel.includes(query) || subLabel.includes(query);
      if (!mNamePt && !mNameEn && !mNum && !mSet && !mAc && !mRar && !mType) return false;
    }
    return true;
  });

  // Sort items
  filtered.sort((a, b) => {
    if (sortMode === 'gain-brl-desc') {
      if (Math.abs(b.val.diffUnitBRL - a.val.diffUnitBRL) > 0.005) {
        return b.val.diffUnitBRL - a.val.diffUnitBRL;
      }
      return b.val.currUnit - a.val.currUnit;
    }
    if (sortMode === 'gain-pct-desc') {
      if (Math.abs(b.val.diffPct - a.val.diffPct) > 0.05) {
        return b.val.diffPct - a.val.diffPct;
      }
      return b.val.diffUnitBRL - a.val.diffUnitBRL;
    }
    if (sortMode === 'price-desc') {
      return b.val.currUnit - a.val.currUnit;
    }
    if (sortMode === 'total-desc') {
      return b.val.totalCurrBRL - a.val.totalCurrBRL;
    }
    if (sortMode === 'qty-desc') {
      if (b.val.qty !== a.val.qty) return b.val.qty - a.val.qty;
      return b.val.currUnit - a.val.currUnit;
    }
    if (sortMode === 'name-asc') {
      return (a.item.namePt || '').localeCompare(b.item.namePt || '');
    }
    // 'recent'
    return String(b.item.addedAt || '').localeCompare(String(a.item.addedAt || ''));
  });

  if (filtered.length === 0) {
    collectionListContainer.innerHTML = `
      <div class="collection-empty-state">
        <div class="empty-icon">💎</div>
        <h3>${items.length === 0 ? 'Sua coleção ainda está vazia!' : 'Nenhuma carta encontrada neste filtro'}</h3>
        <p>${
          items.length === 0
            ? 'Enquanto estiver abrindo seus pacotinhos, consulte o número da carta e clique em <strong>"💎 Adicionar à Minha Coleção"</strong> (ou aperte a tecla <kbd>C</kbd>) para montar seu banco de dados e acompanhar a valorização no meta!'
            : 'Tente mudar a aba selecionada ou limpar o campo de busca.'
        }</p>
      </div>
    `;
    return;
  }

  collectionListContainer.innerHTML = filtered.map(({ item, val, cls }) => {
    const addedDate = item.addedAt ? new Date(item.addedAt).toLocaleDateString('pt-BR') : '---';
    const typeBadgesHtml = renderCardTypeBadgesHtml(cls);
    let deltaBadgeHtml = '';
    if (val.isGainer) {
      const sign = '+';
      deltaBadgeHtml = `
        <div class="valuation-badge gain-badge" title="Esta carta valorizou desde que você cadastrou!">
          🔥 ${sign}${formatBRL(val.diffUnitBRL)} (${sign}${Math.round(val.diffPct)}%)
        </div>
      `;
    } else if (val.isLoser) {
      deltaBadgeHtml = `
        <div class="valuation-badge loss-badge" title="Variação desde o cadastro">
          📉 ${formatBRL(val.diffUnitBRL)} (${Math.round(val.diffPct)}%)
        </div>
      `;
    } else {
      deltaBadgeHtml = `
        <div class="valuation-badge neutral-badge">
          = Sem variação (R$ 0,00)
        </div>
      `;
    }

    const metaCallout = val.isMetaJump
      ? `<span class="meta-alert-tag" title="Carta subiu de valor e já vale múltiplos reais!">🚀 ALTA DE META</span>`
      : '';

    const safeThumbUrl = sanitizeUrl(item.image, 'https://tcgdex.dev/favicon.svg');
    const safeItemLigaUrl = sanitizeUrl(item.ligaUrl);

    return `
      <div class="collection-row ${val.isGainer ? 'row-gainer' : ''} ${val.isMetaJump ? 'row-meta-jump' : ''}">
        <div class="col-row-card-main" data-open-set="${escapeHtml(item.setId)}" data-open-localid="${escapeHtml(item.localId)}" data-open-variant="${escapeHtml(item.variantCode || '0')}" title="Clique para abrir esta carta no Scanner">
          <img class="col-row-thumb" src="${escapeHtml(safeThumbUrl)}" alt="${escapeHtml(item.namePt)}" loading="lazy" />
          <div class="col-row-info">
            <div class="col-row-title-line">
              <span class="col-row-num">${escapeHtml(item.numberFormatted || `#${item.localId}`)}</span>
              <strong class="col-row-name">${escapeHtml(item.namePt)}</strong>
              ${typeBadgesHtml}
              <span class="col-row-variant">${escapeHtml(item.variantLabel || 'Normal')}</span>
              ${item.rarity ? `<span class="col-row-rarity">${escapeHtml(item.rarity)}</span>` : ''}
              ${metaCallout}
            </div>
            <div class="col-row-sub-line">
              <span>📦 ${escapeHtml(item.setName || item.setId)}${item.ligaAcronym ? ` (${escapeHtml(item.ligaAcronym)})` : ''}</span>
              <span>• Salva em ${addedDate}</span>
            </div>
          </div>
        </div>

        <!-- COMPARATIVO DE PREÇOS (QUANDO CADASTROU vs HOJE) -->
        <div class="col-row-prices">
          <div class="col-price-col">
            <span class="col-price-lbl">QUANDO CADASTROU</span>
            <div class="col-base-price-wrap">
              <strong class="col-price-val muted-price">${formatBRL(val.baseUnit)}</strong>
              <button class="btn-edit-base-price" data-edit-base="${escapeHtml(item.cardKey)}" data-curr-base="${val.baseUnit}" title="Editar preço base de quando você conseguiu a carta">✏️</button>
            </div>
          </div>

          <div class="col-price-arrow">➔</div>

          <div class="col-price-col">
            <span class="col-price-lbl">HOJE NA LIGA (UN.)</span>
            <strong class="col-price-val current-price">${formatBRL(val.currUnit)}</strong>
          </div>

          <div class="col-price-col col-delta-col">
            <span class="col-price-lbl">VALORIZAÇÃO</span>
            ${deltaBadgeHtml}
          </div>
        </div>

        <!-- QUANTIDADE E TOTAL ACUMULADO -->
        <div class="col-row-actions">
          <div class="col-qty-control">
            <button class="btn-counter" data-col-qty-delta="-1" data-key="${escapeHtml(item.cardKey)}" title="Diminuir quantidade">−</button>
            <strong class="col-qty-badge">${val.qty}x</strong>
            <button class="btn-counter" data-col-qty-delta="1" data-key="${escapeHtml(item.cardKey)}" title="Aumentar quantidade">+</button>
          </div>

          <div class="col-total-stack">
            <span class="col-price-lbl">TOTAL (${val.qty}x)</span>
            <strong class="col-total-val">${formatBRL(val.totalCurrBRL)}</strong>
          </div>

          <div class="col-links-group">
            ${safeItemLigaUrl ? `<a href="${escapeHtml(safeItemLigaUrl)}" target="_blank" rel="noopener" class="btn-icon" title="Abrir página da carta na LigaPokémon">🔗</a>` : ''}
            <button class="btn-icon btn-remove-col" data-remove-key="${escapeHtml(item.cardKey)}" title="Remover carta da coleção">🗑️</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Sync All Collection Prices with LigaPokemon
if (btnSyncCollectionPrices) {
  btnSyncCollectionPrices.addEventListener('click', async () => {
    const items = collectionData?.items || [];
    if (items.length === 0) {
      showToast('Adicione cartas à sua coleção primeiro para atualizar os preços.', 'info');
      return;
    }
    btnSyncCollectionPrices.disabled = true;
    const orig = btnSyncCollectionPrices.textContent;
    btnSyncCollectionPrices.textContent = '⏳ Consultando LigaPokémon...';
    if (collectionSyncAlert) {
      collectionSyncAlert.classList.remove('hidden');
      collectionSyncAlert.textContent = '⏳ Buscando cotações atualizadas na LigaPokémon para todas as edições da sua coleção...';
    }

    try {
      const data = await apiFetch('/api/collection/sync-prices', { method: 'POST' });
      if (data.collection) {
        collectionData = data.collection;
        onCollectionUpdated();
      }
      const rep = data.syncReport || {};
      if (collectionSyncAlert) {
        collectionSyncAlert.classList.remove('hidden');
        collectionSyncAlert.innerHTML = `✅ <strong>Sincronização concluída!</strong> ${rep.updatedCards || 0} cartas verificadas em ${rep.updatedSets || 0} edições • <strong>🔥 ${rep.gainersCount || 0} cartas estão valendo mais do que quando você cadastrou!</strong>`;
      }
      btnSyncCollectionPrices.textContent = '✅ Preços Atualizados!';
      setTimeout(() => {
        btnSyncCollectionPrices.textContent = orig;
        btnSyncCollectionPrices.disabled = false;
      }, 2000);
    } catch (err) {
      showToast(`Erro ao sincronizar preços da coleção: ${err.message}`, 'error');
      btnSyncCollectionPrices.textContent = orig;
      btnSyncCollectionPrices.disabled = false;
    }
  });
}

// Export Collection to CSV (Excel)
if (btnExportCollectionCsv) {
  btnExportCollectionCsv.addEventListener('click', () => {
    const items = collectionData?.items || [];
    if (items.length === 0) {
      showToast('Sua coleção está vazia.', 'info');
      return;
    }
    const mode = collectionPriceMode?.value || collectionData?.priceMode || 'menor';
    const headers = [
      'Nome (PT)',
      'Nome (EN)',
      'Categoria',
      'Tipo / Subtipo',
      'Numero',
      'Edicao',
      'Sigla Liga',
      'Variante',
      'Raridade',
      'Quantidade',
      'Preco no Cadastro (R$)',
      'Preco Atual Unitario (R$)',
      'Valorizacao Unitaria (R$)',
      'Valorizacao (%)',
      'Valor Total Copias (R$)',
      'Data Cadastro',
      'Link LigaPokemon'
    ];
    const rows = items.map(item => {
      const v = computeCardValuation(item, mode);
      const cls = getCardClassificationClient(item);
      const catLabel = SUBCATEGORY_META[cls.category]?.label || cls.category || '';
      const subOrElemLabel = cls.category === 'trainer'
        ? (SUBCATEGORY_META[cls.subCategory]?.label || 'Treinador')
        : (ELEMENT_TYPE_META[cls.elementType]?.label || 'Normal');
      return [
        escapeCsvCell(item.namePt || ''),
        escapeCsvCell(item.nameEn || ''),
        escapeCsvCell(catLabel),
        escapeCsvCell(subOrElemLabel),
        escapeCsvCell(item.numberFormatted || item.localId || ''),
        escapeCsvCell(item.setName || item.setId || ''),
        escapeCsvCell(item.ligaAcronym || ''),
        escapeCsvCell(item.variantLabel || 'Normal'),
        escapeCsvCell(item.rarity || ''),
        v.qty,
        v.baseUnit.toFixed(2).replace('.', ','),
        v.currUnit.toFixed(2).replace('.', ','),
        v.diffUnitBRL.toFixed(2).replace('.', ','),
        `${v.diffPct.toFixed(1).replace('.', ',')}%`,
        v.totalCurrBRL.toFixed(2).replace('.', ','),
        escapeCsvCell(item.addedAt ? new Date(item.addedAt).toLocaleDateString('pt-BR') : ''),
        escapeCsvCell(sanitizeUrl(item.ligaUrl || ''))
      ].join(';');
    });

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `minha_colecao_pokemon_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
}

// Initial Boot
(async function init() {
  await loadCollection();
  if (typeof loadSession === 'function') {
    await loadSession();
  }
  initSSE();
  const cat = await loadCatalog(false);
  const sets = cat?.sets || [];
  const savedSetId = localStorage.getItem('pokescanner_last_set');
  const defaultSet = sets.find(s => s.id === savedSetId)
    || sets.find(s => s.id === 'sv08')
    || sets.find(s => s.id === 'sv03.5')
    || sets.find(s => s.hasPtTcgdex && s.liga)
    || sets[0];

  if (defaultSet) {
    await selectSet(defaultSet.id);
  }
})();
