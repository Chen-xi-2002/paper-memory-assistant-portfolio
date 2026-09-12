import * as pdfjsLib from './vendor/pdfjs/pdf.mjs';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('./vendor/pdfjs/pdf.worker.mjs', import.meta.url).href;

const MAIN_DB_NAME = 'wenmai-paper-memory-v1';
const DEMO_DB_NAME = 'wenmai-paper-memory-demo-v1';
const IS_DEMO_MODE = new URLSearchParams(window.location.search).get('demo') === '1';
const DB_NAME = IS_DEMO_MODE ? DEMO_DB_NAME : MAIN_DB_NAME;
const DB_VERSION = 1;
const STORES = ['papers', 'chats', 'meta'];
const nowISO = () => new Date().toISOString();
const todayLabel = () => new Intl.DateTimeFormat('zh-CN', { month: 'short', day: 'numeric' }).format(new Date());

const state = {
  papers: [],
  chats: [],
  activeChatId: null,
  activeView: 'chat',
  activeCitations: [],
  selectedPaperId: null,
  libraryQuery: '',
  isAnswering: false,
  searchMode: 'smart',
  externalCandidates: new Map(),
  externalSearchCache: new Map(),
};

const els = {
  sidebar: document.getElementById('sidebar'),
  mobileScrim: document.getElementById('mobileScrim'),
  menuButton: document.getElementById('menuButton'),
  sidebarClose: document.getElementById('sidebarClose'),
  newChatButton: document.getElementById('newChatButton'),
  clearChatsButton: document.getElementById('clearChatsButton'),
  importTopButton: document.getElementById('importTopButton'),
  exportButton: document.getElementById('exportButton'),
  navItems: [...document.querySelectorAll('.nav-item')],
  viewTitle: document.getElementById('viewTitle'),
  chatView: document.getElementById('chatView'),
  libraryView: document.getElementById('libraryView'),
  messages: document.getElementById('messages'),
  chatScroll: document.getElementById('chatScroll'),
  chatForm: document.getElementById('chatForm'),
  chatInput: document.getElementById('chatInput'),
  sendButton: document.getElementById('sendButton'),
  quickPrompts: document.getElementById('quickPrompts'),
  searchModeButtons: [...document.querySelectorAll('[data-search-mode]')],
  composerHint: document.querySelector('.composer-hint'),
  recentList: document.getElementById('recentList'),
  sidebarTags: document.getElementById('sidebarTags'),
  chatCount: document.getElementById('chatCount'),
  paperCount: document.getElementById('paperCount'),
  aside: document.getElementById('aside'),
  asideToggle: document.getElementById('asideToggle'),
  asideClose: document.getElementById('asideClose'),
  citationPanel: document.getElementById('citationPanel'),
  coverageStats: document.getElementById('coverageStats'),
  coverageTags: document.getElementById('coverageTags'),
  viewLibraryButton: document.getElementById('viewLibraryButton'),
  importSideButton: document.getElementById('importSideButton'),
  librarySearch: document.getElementById('librarySearch'),
  librarySummary: document.getElementById('librarySummary'),
  paperGrid: document.getElementById('paperGrid'),
  importButton: document.getElementById('importButton'),
  importModal: document.getElementById('importModal'),
  closeImportButton: document.getElementById('closeImportButton'),
  importTabs: [...document.querySelectorAll('.import-tab')],
  importPanes: {
    pdf: document.getElementById('importPanePdf'),
    manual: document.getElementById('importPaneManual'),
    json: document.getElementById('importPaneJson'),
  },
  dropzone: document.getElementById('dropzone'),
  paperFileInput: document.getElementById('paperFileInput'),
  extractStatus: document.getElementById('extractStatus'),
  manualForm: document.getElementById('importPaneManual'),
  clearManualForm: document.getElementById('clearManualForm'),
  jsonFileInput: document.getElementById('jsonFileInput'),
  jsonPaste: document.getElementById('jsonPaste'),
  importPastedJson: document.getElementById('importPastedJson'),
  downloadJsonButton: document.getElementById('downloadJsonButton'),
  reviewModal: document.getElementById('reviewModal'),
  reviewBody: document.getElementById('reviewBody'),
  closeReviewButton: document.getElementById('closeReviewButton'),
  drawerBackdrop: document.getElementById('drawerBackdrop'),
  paperDrawer: document.getElementById('paperDrawer'),
  drawerContent: document.getElementById('drawerContent'),
  closeDrawerButton: document.getElementById('closeDrawerButton'),
  toastRegion: document.getElementById('toastRegion'),
};

const DEMO_PAPERS = [
  {
    id: 'demo-flege-1995',
    title: 'Second language speech learning: Theory, findings, and problems',
    authors: ['James Emil Flege'],
    year: 1995,
    venue: 'Speech Perception and Linguistic Experience: Issues in Cross-language Research',
    doi: '',
    tags: ['二语语音', '语言经验', '语音感知', '言语学习模型'],
    abstract: 'Flege 的言语学习模型强调二语语音学习是持续发展的过程。学习者能否形成新的二语语音范畴，与长期语言接触、输入质量、使用量和年龄等因素共同有关。',
    notes: [{
      id: 'demo-note-flege-1995',
      content: '写“二语经验是否重要”时，这篇适合作为理论框架：不要把问题简化为年龄或关键期，语言经验的数量与质量本身也是解释变量。',
      createdAt: '2026-08-18T08:00:00.000Z',
    }],
    evidence: [{
      id: 'demo-ev-flege-1995',
      text: '二语语音范畴会随着长期的语言接触和学习而重建；只按年龄划分“能否学会”过于简单，语言经验的数量与质量都会影响结果。',
      page: 'pp. 233–277',
      tags: ['语言经验', '理论框架'],
      sourceType: 'reading-note',
    }],
    fullText: '演示用概述：The Speech Learning Model treats second language speech learning as a long-term process. L2 experience, input quality, language use, and age jointly shape whether learners establish new phonetic categories.',
    isDemo: true,
    addedAt: '2026-08-18T08:00:00.000Z',
  },
  {
    id: 'demo-flege-mackay-2004',
    title: 'Perceiving vowels in a second language',
    authors: ['James Emil Flege', 'Ian R. A. MacKay'],
    year: 2004,
    venue: 'Studies in Second Language Acquisition',
    doi: '10.1017/S0272263104261010',
    tags: ['二语经验', '元音感知', '语言接触', '个体差异'],
    abstract: '研究比较不同二语经验背景的学习者。结果支持持续的二语接触与元音感知表现有关，而年龄效应并不能单独解释所有差异。',
    notes: [{
      id: 'demo-note-flege-mackay-2004',
      content: '可用于说明“经验”不是模糊背景变量：需要继续区分接触时长、当前使用频率、输入质量和学习环境。',
      createdAt: '2026-08-20T09:20:00.000Z',
    }],
    evidence: [{
      id: 'demo-ev-flege-mackay-2004',
      text: '在控制年龄和学习环境后，二语经验仍与元音感知表现相关；持续输入比一次性的学习时长更能解释个体差异。',
      page: 'pp. 1–34',
      tags: ['二语经验', '元音感知'],
      sourceType: 'reading-note',
    }],
    fullText: '演示用概述：This study examines vowel perception by learners with different amounts and qualities of second language experience. It reports that L2 experience remains relevant to perceptual performance and cautions against treating age as the sole explanation.',
    isDemo: true,
    addedAt: '2026-08-20T09:20:00.000Z',
  },
  {
    id: 'demo-best-tyler-2007',
    title: 'Nonnative and second-language speech perception: Commonalities and complementarities',
    authors: ['Catherine T. Best', 'Michael D. Tyler'],
    year: 2007,
    venue: 'Language Experience in Second Language Speech Learning',
    doi: '',
    tags: ['感知同化模型', '母语经验', '二语经验', '语音感知'],
    abstract: '感知同化模型讨论母语语音系统与二语经验如何共同影响非母语语音感知，强调听者会把二语语音同化到已有音系范畴中。',
    notes: [{
      id: 'demo-note-best-tyler-2007',
      content: '这篇的价值在于解释机制：为什么同样的 L2 输入，不同母语背景的人会表现出不同感知模式。适合放在“母语经验”和“二语经验”交互作用的段落。',
      createdAt: '2026-08-22T07:35:00.000Z',
    }],
    evidence: [{
      id: 'demo-ev-best-tyler-2007',
      text: '非母语语音感知不能只归结为二语接触量；母语音系范畴和既有语言经验会共同塑造听者对二语对比的感知方式。',
      page: 'pp. 13–34',
      tags: ['母语经验', '感知机制'],
      sourceType: 'reading-note',
    }],
    fullText: '演示用概述：The Perceptual Assimilation Model discusses how native phonological categories and language experience jointly shape nonnative speech perception. It treats L2 perception as an interaction between native and nonnative systems.',
    isDemo: true,
    addedAt: '2026-08-22T07:35:00.000Z',
  },
  {
    id: 'demo-bradlow-bent-2008',
    title: 'Perceptual adaptation to non-native speech',
    authors: ['Ann R. Bradlow', 'Tessa Bent'],
    year: 2008,
    venue: 'Cognition',
    doi: '10.1016/j.cognition.2007.04.005',
    tags: ['感知适应', '语言经验', '非母语语音', '暴露'],
    abstract: '研究考察听者如何适应带口音或非母语语音。短时暴露能够带来适应，而既有语言经验会影响适应的起点和程度。',
    notes: [{
      id: 'demo-note-bradlow-bent-2008',
      content: '区分“即时暴露带来的适应”和“长期二语经验形成的稳定表征”。两类经验都可能重要，但机制不同。',
      createdAt: '2026-08-25T10:10:00.000Z',
    }],
    evidence: [{
      id: 'demo-ev-bradlow-bent-2008',
      text: '暴露于非母语语音后，听者会快速适应；既有二语经验会影响适应起点和程度，说明经验既包含即时输入，也包含长期表征。',
      page: 'pp. 707–729',
      tags: ['语言经验', '感知适应'],
      sourceType: 'reading-note',
    }],
    fullText: '演示用概述：Listeners adapt to non-native speech after exposure, while prior language experience influences the starting point and extent of adaptation. The findings distinguish short-term adaptation from long-term linguistic experience.',
    isDemo: true,
    addedAt: '2026-08-25T10:10:00.000Z',
  },
  {
    id: 'demo-dupoux-1997',
    title: 'A destressing “deafness” in French?',
    authors: ['Emmanuel Dupoux', 'Christophe Pallier', 'Núria Sebastián-Gallés', 'Jacques Mehler'],
    year: 1997,
    venue: 'Journal of Memory and Language',
    doi: '10.1006/jmla.1996.2500',
    tags: ['轻重音', '词汇重音', '韵律感知', '母语经验'],
    abstract: '研究考察法语听者对词汇重音变化的敏感性。结果常被用来说明母语韵律系统的长期经验会影响非母语重音的感知与加工。',
    notes: [{
      id: 'demo-note-dupoux-1997',
      content: '如果论文要写“轻重音感知受母语韵律背景影响”，这是核心引用之一。注意它的重点是 stress deafness，不能直接推成所有二语者都听不到重音。',
      createdAt: '2026-08-27T13:10:00.000Z',
    }],
    evidence: [{
      id: 'demo-ev-dupoux-1997',
      text: '法语听者对非母语对比中的词汇重音不够敏感，说明母语韵律系统的长期经验会塑造听者利用重音线索的方式。',
      page: 'pp. 406–421',
      tags: ['轻重音', '母语经验'],
      sourceType: 'reading-note',
    }],
    fullText: '演示用概述：The study investigates French listeners’ reduced sensitivity to lexical stress contrasts. Its findings are widely used to argue that long-term experience with the native prosodic system shapes nonnative stress perception.',
    isDemo: true,
    addedAt: '2026-08-27T13:10:00.000Z',
  },
  {
    id: 'demo-cooper-2002',
    title: 'Constraints of lexical stress on lexical access in English: Evidence from native and non-native listeners',
    authors: ['Nicole Cooper', 'Anne Cutler', 'Roger Wales'],
    year: 2002,
    venue: 'Language and Speech',
    doi: '10.1177/00238309020450030101',
    tags: ['轻重音', '词汇重音', '词汇识别', '二语加工'],
    abstract: '研究比较母语者与非母语者在英语词汇识别中利用重音信息的情况，讨论母语韵律经验与二语英语经验如何约束词汇加工。',
    notes: [{
      id: 'demo-note-cooper-2002',
      content: '这篇可以连接“感知”与“词汇识别”：重音线索不只在辨音任务中重要，也会影响词如何被激活。',
      createdAt: '2026-08-29T15:45:00.000Z',
    }],
    evidence: [{
      id: 'demo-ev-cooper-2002',
      text: '英语母语者可在词汇识别早期利用重音信息，而非母语听者对重音线索的利用会受到母语韵律和英语经验约束。',
      page: 'pp. 207–228',
      tags: ['轻重音', '词汇识别'],
      sourceType: 'reading-note',
    }],
    fullText: '演示用概述：This study examines how native and non-native listeners use lexical stress during English word recognition. It connects prosodic perception with lexical access and shows that native-language and L2 experience constrain processing.',
    isDemo: true,
    addedAt: '2026-08-29T15:45:00.000Z',
  },
];

const PUBLIC_DEMO_PAPER = {
  id: 'demo-public-l1-prosody',
  title: 'Demo Paper: L1 Prosody, Mandarin and Cantonese Listeners of English',
  authors: ['Public Demo Corpus'],
  year: 2026,
  venue: 'Synthetic Product Demonstration Paper',
  doi: '',
  tags: ['公开演示', '轻重音', '粤语', '普通话', '语音感知', '语音产出'],
  abstract: '这是一篇为产品展示而编写的合成论文，用来演示 PDF 全文记忆和单篇查证功能。研究比较粤语和普通话母语者在感知与产出英语词汇重音时的表现。',
  notes: [],
  evidence: [
    {
      id: 'demo-public-evidence-1',
      text: '感知结果显示，粤语组和普通话组总体差异未达到显著水平，但普通话组的平均正确率略高于粤语组。',
      page: 'Synthetic Results, paragraph 1',
      tags: ['感知', '粤语', '普通话'],
      sourceType: 'quote',
    },
    {
      id: 'demo-public-evidence-2',
      text: '产出结果显示，普通话使用者在重音时长对比上比粤语使用者更明显，F0 和强度差异相对接近。',
      page: 'Synthetic Results, paragraph 2',
      tags: ['产出', '时长', '粤语', '普通话'],
      sourceType: 'quote',
    },
  ],
  fullText: `Synthetic demonstration paper. This document is not a real research article and is included only to demonstrate product functionality.

Abstract
This synthetic study compares how Mandarin and Cantonese listeners perceive and produce English lexical stress. The demonstration asks whether experience with Mandarin neutral tone is associated with a small advantage in processing non-native lexical stress.

1. Introduction
Mandarin and Cantonese are both tone languages, but their prosodic systems differ in the use and acoustic realization of neutral tone. This synthetic demonstration examines whether those differences are associated with different patterns of English lexical stress perception and production.

2. Method
Participants were late learners of English from Mandarin and Cantonese language backgrounds. Perception was measured with an ABX lexical stress discrimination task. Production was measured with repeated English words containing trochaic and iambic stress patterns. Acoustic measures included duration, F0, and intensity.

3. Results
Perception results showed no significant overall between-group difference, but Mandarin participants had a slightly higher average accuracy than Cantonese participants. Production results showed that Mandarin and English speakers produced a more distinct duration contrast than Cantonese speakers. The two groups showed more similar patterns in F0 and intensity.

4. Discussion
The synthetic results suggest that experience with Mandarin neutral tone may provide a small advantage in processing non-native lexical stress. The demonstration does not establish a universal conclusion about all Mandarin or Cantonese speakers. A real study would require a larger sample, stronger control of English experience, and more challenging perception tasks.

5. Conclusion
This synthetic paper is designed to show how a user can import a PDF, save a note, ask a writing question, open a paper, and verify whether specific information appears in the saved full text. It must not be cited as a real source.`,
  isDemo: true,
  isShowcaseFallback: true,
  addedAt: '2026-09-01T08:00:00.000Z',
};

const STOP_PHRASES = [
  '请问',
  '我想知道',
  '帮我找',
  '帮我查',
  '有哪些',
  '哪些',
  '是哪几篇',
  '哪几篇',
  '哪篇论文',
  '哪几篇论文',
  '哪一篇',
  '什么论文',
  '有没有论文',
  '论文',
  '文献',
  '研究',
  '觉得',
  '认为',
  '大概',
  '可能',
  '有些',
  '关于',
  '相关',
  '的时候',
  '是不是',
  '是否',
  '也很',
  '非常',
  '重要',
  '主要',
  '直接',
];

const CONCEPTS = {
  l2experience: [
    '语言经验', '二语经验', '第二语言经验', '语言接触', '接触量', '输入经验', '输入质量',
    '使用频率', '学习环境', 'l2 experience', 'second language experience', 'language experience',
    'language contact', 'experience',
  ],
  speechperception: [
    '语音感知', '言语感知', '非母语语音', '元音感知', '辅音感知', '语音加工', '语音范畴',
    'speech perception', 'nonnative speech', 'non-native speech', 'vowel perception', 'phonetic perception',
  ],
  stress: [
    '轻重音', '词重音', '词汇重音', '词汇重音', '重音感知', '重音加工', '韵律感知', '韵律',
    'lexical stress', 'word stress', 'stress perception', 'prosody', 'prosodic',
  ],
  proficiency: [
    '熟练度', '二语水平', '语言水平', '经验多少', '高水平', '低水平', 'proficiency',
  ],
};

const ENGLISH_STOPWORDS = new Set([
  'the', 'a', 'an', 'of', 'and', 'or', 'in', 'on', 'to', 'for', 'with', 'by', 'from',
  'is', 'are', 'was', 'were', 'be', 'been', 'this', 'that', 'these', 'those', 'what',
  'which', 'how', 'why', 'when', 'where', 'paper', 'study',
]);

const BILINGUAL_TERMS = {
  '粤语': ['Cantonese'],
  '广东话': ['Cantonese'],
  '汉语': ['Mandarin', 'Chinese'],
  '普通话': ['Mandarin'],
  '中文': ['Mandarin', 'Chinese'],
  '英语': ['English'],
  '法语': ['French'],
  '西班牙语': ['Spanish'],
  '韩语': ['Korean'],
  '日语': ['Japanese'],
  '二语': ['L2', 'second language'],
  '母语': ['L1', 'native language'],
  '重音': ['stress', 'lexical stress'],
  '轻重音': ['lexical stress', 'word stress'],
  '韵律': ['prosody', 'prosodic'],
  '感知': ['perception', 'perceive'],
  '产出': ['production', 'produce'],
  '发音': ['production', 'pronunciation'],
  '习得': ['acquisition', 'development'],
  '发展': ['development'],
  '婴儿': ['infant'],
  '儿童': ['children', 'child'],
  '时长': ['duration'],
  '基频': ['F0', 'fundamental frequency', 'pitch'],
  '音高': ['F0', 'pitch'],
  '强度': ['intensity', 'amplitude'],
  '声调': ['tone', 'tonal'],
  '元音': ['vowel'],
  '辅音': ['consonant'],
  '差异': ['difference', 'contrast'],
  '特点': ['pattern', 'feature', 'characteristic'],
  '结论': ['result', 'finding', 'conclusion'],
  '方法': ['method', 'procedure'],
  '任务': ['task'],
};

let dbPromise;

function openDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      for (const store of STORES) {
        if (!db.objectStoreNames.contains(store)) {
          db.createObjectStore(store, { keyPath: store === 'meta' ? 'key' : 'id' });
        }
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  return dbPromise;
}

async function dbGetAll(storeName) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const request = db.transaction(storeName, 'readonly').objectStore(storeName).getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

async function dbGet(storeName, key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const request = db.transaction(storeName, 'readonly').objectStore(storeName).get(key);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

async function dbPut(storeName, value) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const request = db.transaction(storeName, 'readwrite').objectStore(storeName).put(value);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function dbDelete(storeName, key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const request = db.transaction(storeName, 'readwrite').objectStore(storeName).delete(key);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function readMainDatabasePapers() {
  if (!IS_DEMO_MODE || !indexedDB.databases) return [];
  const databases = await indexedDB.databases();
  if (!databases.some((database) => database.name === MAIN_DB_NAME)) return [];
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(MAIN_DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction('papers', 'readonly');
      const getAll = transaction.objectStore('papers').getAll();
      getAll.onsuccess = () => resolve(getAll.result || []);
      getAll.onerror = () => reject(getAll.error);
      transaction.oncomplete = () => db.close();
    };
  });
}

async function syncShowcasePaperFromMainDatabase() {
  if (!IS_DEMO_MODE) return;
  try {
    const sourcePapers = await readMainDatabasePapers();
    const source = sourcePapers
      .filter((paper) => paper.fullText && paper.fullText.length > 5000)
      .find((paper) => /L1 Prosody|Cantonese|Mandarin|Lexical Stress/i.test(`${paper.title} ${paper.abstract || ''} ${paper.fullText.slice(0, 1200)}`));
    if (!source) return;
    const showcase = {
      ...source,
      id: 'demo-showcase-l1-prosody',
      title: source.title,
      notes: source.notes || [],
      evidence: source.evidence || [],
      tags: source.tags || [],
      isDemo: false,
      isShowcase: true,
      importedFrom: source.importedFrom || source.title,
      addedAt: source.addedAt || nowISO(),
    };
    await dbPut('papers', showcase);
    state.papers = (await dbGetAll('papers')).sort((a, b) => new Date(b.addedAt || 0) - new Date(a.addedAt || 0));
  } catch (error) {
    console.warn('无法复制本地示例论文到演示库', error);
  }
}

async function dbClear(storeName) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const request = db.transaction(storeName, 'readwrite').objectStore(storeName).clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

function uid(prefix = 'item') {
  if (crypto.randomUUID) return `${prefix}-${crypto.randomUUID()}`;
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function escapeHTML(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function escapeRegExp(value = '') {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeText(value = '') {
  return String(value)
    .toLowerCase()
    .normalize('NFKC')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function splitList(value = '') {
  return unique(String(value).split(/[,，;；、|]/).map((item) => item.trim()).filter(Boolean));
}

function formatAuthors(authors = []) {
  if (!authors || !authors.length) return '作者未录入';
  if (authors.length === 1) return authors[0];
  if (authors.length === 2) return `${authors[0]} & ${authors[1]}`;
  return `${authors.slice(0, 2).join(', ')} et al.`;
}

function formatCitation(paper) {
  const authors = formatAuthors(paper.authors);
  const year = paper.year ? ` (${paper.year})` : '';
  const venue = paper.venue ? ` ${paper.venue}.` : '';
  return `${authors}${year}. ${paper.title}.${venue}`;
}

function getAllPaperText(paper) {
  return [
    paper.title,
    (paper.authors || []).join(' '),
    paper.year,
    paper.venue,
    (paper.tags || []).join(' '),
    paper.abstract,
    ...(paper.notes || []).map((note) => note.content || note),
    ...(paper.evidence || []).map((item) => `${item.text || ''} ${(item.tags || []).join(' ')}`),
    paper.fullText,
  ].filter(Boolean).join('\n');
}

function cleanQueryForTerms(query) {
  let cleaned = ` ${normalizeText(query)} `;
  for (const phrase of STOP_PHRASES) {
    cleaned = cleaned.split(phrase).join(' ');
  }
  return cleaned.replace(/[，。！？、,.!?;；:："'“”‘’（）()【】\[\]<>《》]/g, ' ');
}

function tokenizeQuery(query) {
  const cleaned = cleanQueryForTerms(query);
  const terms = [];
  const latinTerms = cleaned.match(/[a-z0-9][a-z0-9.+-]{1,}/g) || [];
  terms.push(...latinTerms);

  const chineseRuns = cleaned.match(/[\u4e00-\u9fff]+/g) || [];
  for (const run of chineseRuns) {
    if (run.length <= 5) terms.push(run);
    for (let i = 0; i < run.length - 1; i += 1) {
      terms.push(run.slice(i, i + 2));
    }
    if (run.length >= 6) {
      for (let i = 0; i < run.length - 2; i += 1) {
        terms.push(run.slice(i, i + 3));
      }
    }
  }

  const normalizedQuery = normalizeText(query);
  for (const [chineseTerm, englishTerms] of Object.entries(BILINGUAL_TERMS)) {
    if (normalizedQuery.includes(chineseTerm)) terms.push(...englishTerms);
  }
  for (const conceptTerms of Object.values(CONCEPTS)) {
    if (conceptTerms.some((term) => normalizedQuery.includes(normalizeText(term)))) {
      terms.push(...conceptTerms);
    }
  }

  return unique(terms
    .map((term) => normalizeText(term))
    .filter((term) => term.length >= 2 && !STOP_PHRASES.includes(term) && !ENGLISH_STOPWORDS.has(term)))
    .sort((a, b) => b.length - a.length)
    .slice(0, 80);
}

function countOccurrences(text, term) {
  if (!text || !term) return 0;
  let count = 0;
  let index = 0;
  while (count < 4) {
    index = text.indexOf(term, index);
    if (index === -1) break;
    count += 1;
    index += Math.max(1, term.length);
  }
  return count;
}

function scoreField(value, terms, weight, label) {
  const text = normalizeText(value);
  if (!text || !terms.length) return { score: 0, matched: [], label, text: value || '' };
  let score = 0;
  const matched = [];
  for (const term of terms) {
    const count = countOccurrences(text, term);
    if (!count) continue;
    const termWeight = 0.72 + Math.min(term.length, 8) * 0.12;
    score += weight * termWeight * (1 + Math.min(count - 1, 2) * 0.28);
    matched.push(term);
  }
  return { score, matched, label, text: value || '' };
}

function makeExcerpt(text, terms, radius = 150) {
  const source = String(text || '').replace(/\s+/g, ' ').trim();
  if (!source) return '';
  const normalized = normalizeText(source);
  let bestIndex = -1;
  let bestTerm = '';
  for (const term of terms) {
    const index = normalized.indexOf(term);
    if (index !== -1 && (bestIndex === -1 || index < bestIndex)) {
      bestIndex = index;
      bestTerm = term;
    }
  }
  if (bestIndex === -1) return source.slice(0, radius * 2);
  const start = Math.max(0, bestIndex - radius);
  const end = Math.min(source.length, bestIndex + bestTerm.length + radius);
  return `${start > 0 ? '…' : ''}${source.slice(start, end)}${end < source.length ? '…' : ''}`;
}

function highlight(value, terms = []) {
  let output = escapeHTML(value);
  const safeTerms = terms
    .map((term) => normalizeText(term))
    .filter((term) => term.length >= 2)
    .sort((a, b) => b.length - a.length)
    .slice(0, 24);
  for (const term of safeTerms) {
    const escapedTerm = escapeHTML(term);
    const pattern = new RegExp(`(${escapeRegExp(escapedTerm)})`, 'gi');
    output = output.replace(pattern, '<mark>$1</mark>');
  }
  return output;
}

function scoreAndMatchPaper(paper, terms) {
  const fields = [
    scoreField(paper.title, terms, 9, '标题'),
    scoreField((paper.authors || []).join(', '), terms, 3, '作者'),
    scoreField([paper.year, paper.venue].filter(Boolean).join(' '), terms, 3.5, '出版信息'),
    scoreField((paper.tags || []).join(' '), terms, 8, '主题标签'),
    scoreField(paper.abstract, terms, 4, '摘要'),
    ...(paper.notes || []).map((note) => scoreField(note.content || note, terms, 7, '读后笔记')),
    ...(paper.evidence || []).map((item) => scoreField(item.text, terms, 8.5, item.sourceType === 'quote' ? '原文片段' : '标注笔记')),
    scoreField(paper.fullText, terms, 1.4, '论文全文'),
  ];

  const score = fields.reduce((sum, field) => sum + field.score, 0);
  const matched = unique(fields.flatMap((field) => field.matched));
  const best = fields
    .filter((field) => field.score > 0)
    .sort((a, b) => b.score - a.score)[0];

  return {
    paper,
    score,
    matched,
    match: best ? {
      label: best.label,
      text: makeExcerpt(best.text, matched),
      page: best.label === '读后笔记' || best.label === '标注笔记' || best.label === '原文片段'
        ? ((paper.evidence || []).find((item) => item.text === best.text)?.page || '')
        : '',
    } : {
      label: '标题 / 主题',
      text: paper.abstract || paper.title,
      page: '',
    },
  };
}

function searchPapers(query, limit = 5) {
  const terms = tokenizeQuery(query);
  if (!state.papers.length) return { terms, results: [] };
  const normalizedQuery = normalizeText(query);
  let domainFilter = () => true;
  let domainRestricted = false;
  if (/(婴儿|婴幼儿|infant|baby)/.test(normalizedQuery) && /(韵律|prosod)/.test(normalizedQuery)) {
    domainRestricted = true;
    domainFilter = (result) => /(婴儿|婴幼儿|infant|baby|neonat|newborn|months? of age|月龄)/.test(normalizeText(getAllPaperText(result.paper)));
  } else if (/(stress deafness|destressing|重音不敏感|deafness)/.test(normalizedQuery)) {
    domainRestricted = true;
    domainFilter = (result) => /(stress deafness|destressing|deafness|重音不敏感)/.test(normalizeText(getAllPaperText(result.paper)));
  }
  const results = state.papers
    .map((paper) => scoreAndMatchPaper(paper, terms))
    .filter((result) => result.score > 0)
    .filter(domainFilter)
    .sort((a, b) => b.score - a.score || (b.paper.year || 0) - (a.paper.year || 0))
    .slice(0, limit);

  if (!results.length && terms.length && !domainRestricted) {
    const fallback = state.papers
      .map((paper) => ({
        paper,
        score: 0,
        matched: [],
        match: { label: '最近导入', text: paper.abstract || paper.notes?.[0]?.content || paper.title, page: '' },
      }))
      .sort((a, b) => new Date(b.paper.addedAt || 0) - new Date(a.paper.addedAt || 0))
      .slice(0, 2);
    return { terms, results: fallback };
  }
  return { terms, results };
}

function pageNumberFromText(text = '') {
  const match = String(text).match(/\[\[PAGE\s+(\d+)\]\]/i);
  return match ? Number(match[1]) : null;
}

function requiredLanguageGroups(query) {
  const normalized = normalizeText(query);
  const groups = [];
  if (/(粤语|广东话|cantonese)/.test(normalized)) groups.push(['cantonese']);
  if (/(汉语|普通话|中文|mandarin)/.test(normalized)) groups.push(['mandarin', 'chinese']);
  if (/(英语|english)/.test(normalized)) groups.push(['english']);
  if (/(法语|french)/.test(normalized)) groups.push(['french']);
  if (/(西班牙语|spanish)/.test(normalized)) groups.push(['spanish']);
  if (/(韩语|korean)/.test(normalized)) groups.push(['korean']);
  return groups;
}

function searchPaperFullText(paper, query, limit = 4) {
  if (!paper?.fullText) return { terms: [], totalHits: 0, snippets: [] };
  const terms = tokenizeQuery(query).filter((term) => term.length >= 2);
  if (!terms.length) return { terms: [], totalHits: 0, snippets: [] };
  const fullText = String(paper.fullText);
  const requiredGroups = requiredLanguageGroups(query).slice(0, 2);
  const paragraphs = fullText
    .split(/\n\s*\n/)
    .flatMap((paragraph) => paragraph.length > 120 ? paragraph.split(/(?<=[.!?])\s+/) : [paragraph])
    .map((text) => text.trim())
    .filter((text) => text.length > 20);

  const snippets = paragraphs.map((paragraph) => {
    const normalized = normalizeText(paragraph);
    if (requiredGroups.length > 1 && !requiredGroups.every((group) => group.some((term) => normalized.includes(term)))) {
      return { text: '', page: null, matched: [], score: 0 };
    }
    const matched = [];
    let score = 0;
    for (const term of terms) {
      const count = countOccurrences(normalized, term);
      if (!count) continue;
      matched.push(term);
      score += (1 + Math.min(count - 1, 2) * 0.35) * (1 + Math.min(term.length, 10) * 0.1);
    }
    if (/(result|finding|difference|better|higher|lower|showed|suggest|conclusion|performed)/.test(normalized)) score += 2.5;
    if (requiredGroups.length > 1) score += 1.5;
    return {
      raw: paragraph,
      text: '',
      page: pageNumberFromText(paragraph),
      matched: unique(matched),
      score,
    };
  })
    .filter((item) => item.matched.length)
    .sort((a, b) => b.score - a.score || b.matched.length - a.matched.length)
    .slice(0, limit)
    .map((item) => {
      const sourceIndex = fullText.indexOf(item.raw);
      const contextWindow = sourceIndex >= 0
        ? fullText.slice(Math.max(0, sourceIndex - 220), Math.min(fullText.length, sourceIndex + item.raw.length + 320))
        : item.raw;
      return { ...item, text: makeExcerpt(contextWindow, item.matched, 420) };
    });

  const totalHits = terms.reduce((sum, term) => sum + countOccurrences(normalizeText(fullText), term), 0);
  return { terms, totalHits, snippets };
}

function renderFullTextHits(hits, heading = '全文命中片段') {
  if (!hits?.snippets?.length) return '';
  return `
    <div class="paper-search-hits">
      <div class="paper-search-hits-head">
        <strong>${escapeHTML(heading)}</strong>
        <span>${hits.totalHits} 处关键词命中</span>
      </div>
      ${hits.snippets.map((snippet) => `
        <blockquote class="source-hit">
          <span class="excerpt-label">${snippet.page ? `第 ${snippet.page} 页` : '全文片段'} · ${escapeHTML(snippet.matched.slice(0, 4).join(' / '))}</span>
          ${highlight(snippet.text, snippet.matched)}
        </blockquote>
      `).join('')}
    </div>
  `;
}

function isPaperCoverageQuestion(query) {
  const normalized = normalizeText(query);
  const refersToPaper = /(这篇|那篇|该论文|此文|论文里|文章中|pdf里|我要的信息)/.test(normalized);
  const asksCoverage = /(有没有|是否|提到|涉及|包含|覆盖|找到|讲没讲|说没说到)/.test(normalized);
  return refersToPaper && asksCoverage;
}

function answerPaperCoverage(paper, query, previousQuery = '') {
  if (!paper) {
    return {
      content: '<p>我没有确定你说的是哪一篇论文。可以写成“《论文标题》里有没有提到……”或者先在文献库打开这篇论文再提问。</p>',
      results: [],
    };
  }

  const strippedTopic = normalizeText(query)
    .replace(/(有没有|是否|提到|涉及|包含|覆盖|找到|讲没讲|说没说到|我要的信息|那个信息|相关内容|有关内容|这篇|那篇|该论文|此文|论文里|文章中|pdf里)/g, '')
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, '')
    .trim();
  const vagueReference = strippedTopic.length < 4;
  const topicQuery = vagueReference && previousQuery ? previousQuery : query;
  const baseResult = scoreAndMatchPaper(paper, tokenizeQuery(topicQuery));

  if (paper.fullText) {
    const hits = searchPaperFullText(paper, topicQuery, 5);
    if (hits.snippets.length) {
      return {
        content: `<p>有。我在《${escapeHTML(paper.title)}》的已保存全文中找到了相关信息，下面按相关度列出命中片段。</p>${renderFullTextHits(hits)}<p class="answer-summary">当前版本是关键词与中英文术语扩展检索；同一意思如果换成了完全不同的说法，可能还需要你换一个词再查。</p>`,
        results: [{ ...baseResult, paper }],
      };
    }
    return {
      content: `<p>没有在《${escapeHTML(paper.title)}》的已保存全文中检索到这些关键词。</p><p>这表示“关键词没有命中”，不等于论文绝对没有讨论，因为可能存在完全不同措辞或代词指代。你可以换一个更具体的英文术语、变量名或研究任务再查。</p>`,
      results: [],
    };
  }

  if (paper.abstract) {
    const hits = searchPaperFullText({ ...paper, fullText: paper.abstract }, topicQuery, 3);
    if (hits.snippets.length) {
      return {
        content: `<p>摘要里有相关信息，但这篇记录没有保存 PDF 全文，所以目前不能确认论文正文是否也讨论了它。</p>${renderFullTextHits(hits, '摘要命中片段')}<p class="answer-summary">请重新导入这篇 PDF，导入成功后我会继续查全文。</p>`,
        results: [{ ...baseResult, paper }],
      };
    }
  }

  return {
    content: `<p>这篇记录没有可检索的 PDF 全文，目前无法判断论文正文里有没有你要的信息。</p><p>请重新导入 PDF，并确认导入结果里显示“全文可检索”，之后就可以按具体问题做有 / 没有判断。</p>`,
    results: [],
  };
}

function isContentQuestion(query) {
  const normalized = normalizeText(query);
  if (/(哪些论文|哪几篇|找出|列出|找一下)/.test(normalized)) return false;
  return /(什么|特点|相比|差异|关系|影响|是否|有没有|如何|为什么|怎么|结论|表现|结果)/.test(normalized);
}

function renderQuestionFullTextEvidence(query, results) {
  if (!isContentQuestion(query)) return '';
  const candidates = results.filter((result) => result.paper.fullText).slice(0, 2);
  const sections = [];
  for (const result of candidates) {
    const hits = searchPaperFullText(result.paper, query, 3);
    if (!hits.snippets.length) continue;
    sections.push(`<h4>${escapeHTML(result.paper.title)}</h4>${renderFullTextHits(hits, '这篇文章中的相关片段')}`);
  }
  if (!sections.length) return '';
  return `<div class="fulltext-answer"><strong class="fulltext-answer-title">全文中的直接相关片段</strong>${sections.join('')}<p>这些片段是全文检索结果，不是自动改写的结论；写作时请回到原文核对上下文。</p></div>`;
}

function answerQuestion(query, resultSet) {
  const { results } = resultSet;
  if (!state.papers.length) {
    return {
      content: '<p>文献库还是空的。先导入论文或把读后笔记录入进去，我才能从真实资料中检索并回答。</p>',
      results: [],
    };
  }

  if (!results.length) {
    return {
      content: '<p>没有找到能明确支持这个问题的已保存内容。</p><p>你可以换一个更接近论文标题、核心概念或你笔记用词的说法。我不会在证据不足时替你拼凑引用。</p>',
      results: [],
    };
  }

  const normalized = normalizeText(query);
  const asksCount = /(哪几篇|哪些|哪篇|几篇|列出|找出|查找|找一下)/.test(normalized);
  const asksL2Experience = /(二语|l2|second language)/.test(normalized)
    && /(经验|接触|输入|experience)/.test(normalized)
    && /(语音|感知|speech|perception|phonetic)/.test(normalized);
  const asksInfant = /(婴儿|婴幼儿|幼儿|infant|baby)/.test(normalized) && /(韵律|prosod)/.test(normalized);
  const asksStress = /(轻重音|重音|stress|prosod|韵律)/.test(normalized);
  const onlyWeakMetadata = results.every((result) => result.paper.needsPdf || (!result.paper.fullText && !(result.paper.notes?.length) && !(result.paper.evidence?.length)));

  let lead;
  if (asksInfant) {
    lead = `<p>本地库里目前只有和“婴儿 / 韵律”相关的在线候选，缺少能回答具体月龄和习得过程的全文。我不会根据论文标题推断结论，下面先触发在线扩展检索，并把能核对的论文列出来。</p>`;
  } else if (onlyWeakMetadata) {
    lead = `<p>本地命中的条目目前只有元数据或摘要，还不足以直接回答这个结论性问题。我会先说明证据边界，再补充在线候选；要得到可靠答案，需要把至少一篇相关全文导入文献库。</p>`;
  } else if (asksL2Experience) {
    lead = `<p>基于你已保存的论文和笔记，和“二语经验与二语语音感知”最相关的是下面 <span class="answer-count">${results.length} 篇</span>。它们支持的侧重点并不完全相同：理论模型、元音感知和感知适应可以分别用于不同段落；排在后面的条目也可能只提供相邻的母语经验或感知机制证据。</p>`;
  } else if (asksStress) {
    lead = `<p>你的库里和“轻重音 / 词汇重音”最相关的是下面 <span class="answer-count">${results.length} 篇</span>。其中既有对重音不敏感性的经典证据，也有重音线索参与词汇识别的研究。</p>`;
  } else if (asksCount) {
    lead = `<p>从你当前保存的标题、标签、笔记和证据片段来看，最相关的是下面 <span class="answer-count">${results.length} 篇</span>。我只列出实际命中的内容。</p>`;
  } else {
    lead = `<p>我在你的论文库中找到 <span class="answer-count">${results.length} 条</span>可用依据。下面按相关度排列，并标出它来自你的笔记、标注还是全文。</p>`;
  }

  const caveat = results.some((item) => item.paper.isDemo)
    ? '<p class="answer-summary">注意：带“演示”标记的条目用于体验功能，引用前请用你的真实论文和笔记替换，并核对原文。</p>'
    : '<p class="answer-summary">引用卡片中的摘录会标明来源层级；涉及具体页码和原文表述时，建议再打开论文核对。</p>';

  return { content: lead + caveat + renderQuestionFullTextEvidence(query, results), results };
}

function queryUsesContext(query) {
  return /(这篇|那篇|该论文|此文|它|此研究|论文里|文章中|pdf里|based on this|this paper|除了|其他语言|跨语言)/.test(normalizeText(query));
}

function latestContextPaper() {
  const citations = getLatestCitations();
  const paperId = citations[0]?.paperId;
  return state.papers.find((paper) => paper.id === paperId) || null;
}

function stableHash(value = '') {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) - hash) + value.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

function shouldSearchOnline(query, localResults) {
  if (state.searchMode === 'local') return false;
  const normalized = normalizeText(query);
  const explicit = /(帮我.{0,8}(搜索|找)|搜索.{0,12}(论文|文献|研究)|找.{0,12}(论文|文献|研究)|相关论文|相关文献|扩展检索|全网|文献综述|除了|还有哪些.{0,8}(语言|研究|证据)|其他语言)/.test(normalized);
  const crossLing = /(跨语言|cross.?linguistic|other languages|其他语言|除了.*(语言|french|法语))/.test(normalized);
  const asksForConclusion = /(什么时候|何时|几个月|几岁|为什么|如何|怎样|机制|判断标准|关系|影响有多大)/.test(normalized);
  const weakLocalEvidence = localResults.length === 0 || localResults.some((result) => {
    const paper = result.paper;
    return paper.needsPdf || (!paper.fullText && !(paper.notes?.length) && !(paper.evidence?.length));
  });
  return explicit || crossLing || (asksForConclusion && weakLocalEvidence);
}

function buildExternalSearchQuery(query, contextPaper = null) {
  const normalized = normalizeText(query);
  const chunks = [];
  let specialQuery = false;

  if (/(deaf|重音不敏感|stress deafness|destressing)/.test(normalized) && /(french|法语|其他语言|跨语言|languages)/.test(normalized)) {
    chunks.push('stress deafness cross-linguistic languages bilingual');
    specialQuery = true;
  } else if (/(婴儿|婴幼儿|幼儿|infant|baby)/.test(normalized) && /(韵律|prosod|重音|stress)/.test(normalized)) {
    chunks.push('infant prosody perception development acquisition');
    specialQuery = true;
  }

  const mappings = [
    [/婴儿|婴幼儿|幼儿/g, 'infant'],
    [/韵律/g, 'prosody prosodic'],
    [/感知/g, 'perception'],
    [/习得|学会|掌握/g, 'acquisition development'],
    [/什么时候|何时|几个月/g, 'age months development'],
    [/轻重音/g, 'lexical stress'],
    [/重音/g, 'stress'],
    [/词法重音|词汇重音/g, 'lexical stress'],
    [/二语|第二语言/g, 'second language'],
    [/母语/g, 'native language'],
    [/语音/g, 'speech'],
    [/跨语言/g, 'cross-linguistic'],
    [/语言/g, 'language'],
    [/不敏感|失聪|deafness/gi, 'stress deafness'],
    [/法语/gi, 'French'],
    [/中文|汉语/gi, 'Chinese'],
  ];

  let translated = normalized;
  for (const [pattern, replacement] of mappings) translated = translated.replace(pattern, ` ${replacement} `);
  translated = translated
    .replace(/(基于|这篇|该论文|此文|判断标准|是什么|除此之外|之外|还有|哪些|也出现|出现|帮我|请问|搜索|查找|找一下|论文|文献|研究|相关|关于|有什么|有哪些|什么时候|需要|可以|我想|给我|跟|有关|的|除了|请给出相应|请给出|给出)/g, ' ')
    .replace(/[?？。！!，,；;：:]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (translated) chunks.push(translated);

  if (contextPaper && !specialQuery && /(这篇|该论文|此文|它|此研究|based on this|this paper)/.test(normalized)) {
    chunks.push(contextPaper.title);
    chunks.push((contextPaper.tags || []).join(' '));
    if (contextPaper.abstract) chunks.push(contextPaper.abstract.slice(0, 260));
  } else if (contextPaper && !specialQuery && /(除了|还有|其他语言|跨语言)/.test(normalized)) {
    chunks.push(contextPaper.title);
  }

  return unique(chunks.filter(Boolean)).join(' ').slice(0, 900) || query;
}

function buildSearchLinks(query) {
  const encoded = encodeURIComponent(query);
  return [
    { label: 'Semantic Scholar', url: `https://www.semanticscholar.org/search?q=${encoded}&sort=relevance` },
    { label: 'OpenAlex', url: `https://openalex.org/works?search=${encoded}` },
    { label: 'Google Scholar', url: `https://scholar.google.com/scholar?q=${encoded}` },
    { label: 'Crossref', url: `https://search.crossref.org/?q=${encoded}` },
  ];
}

function reconstructOpenAlexAbstract(invertedIndex) {
  if (!invertedIndex || typeof invertedIndex !== 'object') return '';
  const words = [];
  for (const [word, positions] of Object.entries(invertedIndex)) {
    for (const position of positions || []) words[position] = word;
  }
  return words.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
}

function decodeHtmlEntities(value = '') {
  const textarea = document.createElement('textarea');
  textarea.innerHTML = String(value);
  return textarea.value;
}

function stripMarkup(value = '') {
  if (!value) return '';
  let text = String(value);
  try {
    text = new DOMParser().parseFromString(text, 'text/html').body.textContent || text;
  } catch {
    // Fall through to the regex cleanup below.
  }
  for (let index = 0; index < 2; index += 1) {
    text = decodeHtmlEntities(text).replace(/<[^>]+>/g, ' ');
  }
  return text.replace(/\s+/g, ' ').trim();
}

function normalizeDoi(value = '') {
  return String(value || '').replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, '').trim();
}

function externalCandidateKey(candidate) {
  const doi = normalizeDoi(candidate.doi);
  return doi ? `doi:${doi.toLowerCase()}` : `title:${normalizeText(candidate.title).replace(/\s+/g, '')}`;
}

function candidateToExternal(raw, provider) {
  const doi = normalizeDoi(raw.doi);
  const title = String(raw.title || '').trim();
  return {
    id: `ext-${stableHash(doi || title)}`,
    externalId: String(raw.externalId || ''),
    title,
    authors: raw.authors || [],
    year: raw.year || '',
    venue: raw.venue || '',
    doi,
    url: raw.url || (doi ? `https://doi.org/${doi}` : ''),
    abstract: raw.abstract || '',
    openAccessPdf: raw.openAccessPdf || '',
    citationCount: Number(raw.citationCount || 0),
    provider,
    providers: [provider],
    searchSource: raw.searchSource || '',
  };
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 6500) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function parseJsonResponse(response, provider) {
  if (!response.ok) {
    throw new Error(`${provider} 返回 ${response.status}`);
  }
  return response.json();
}

async function searchOpenAlex(query, limit = 7) {
  const params = new URLSearchParams({
    search: query,
    'per-page': String(limit),
    select: 'id,doi,title,publication_year,authorships,primary_location,open_access,abstract_inverted_index,cited_by_count',
  });
  const response = await fetchWithTimeout(`https://api.openalex.org/works?${params.toString()}`, {
    headers: { Accept: 'application/json' },
  });
  const data = await parseJsonResponse(response, 'OpenAlex');
  return (data.results || []).map((work) => candidateToExternal({
    externalId: work.id,
    title: work.title,
    authors: (work.authorships || []).map((authorship) => authorship.author?.display_name).filter(Boolean),
    year: work.publication_year,
    venue: work.primary_location?.source?.display_name || '',
    doi: work.doi,
    url: work.primary_location?.landing_page_url || work.doi,
    abstract: reconstructOpenAlexAbstract(work.abstract_inverted_index),
    openAccessPdf: work.open_access?.oa_url || '',
    citationCount: work.cited_by_count,
    searchSource: query,
  }, 'OpenAlex'));
}

async function searchCrossref(query, limit = 7) {
  const params = new URLSearchParams({
    'query.bibliographic': query,
    rows: String(limit),
  });
  const response = await fetchWithTimeout(`https://api.crossref.org/works?${params.toString()}`, {
    headers: { Accept: 'application/json' },
  });
  const data = await parseJsonResponse(response, 'Crossref');
  return (data.message?.items || []).map((item) => {
    const published = item.published?.['date-parts']?.[0];
    const pdfLink = (item.link || []).find((link) => /pdf/i.test(link['content-type'] || ''))?.['URL'];
    return candidateToExternal({
      externalId: item.DOI,
      title: Array.isArray(item.title) ? item.title[0] : item.title,
      authors: (item.author || []).map((author) => [author.given, author.family].filter(Boolean).join(' ')),
      year: published?.[0],
      venue: Array.isArray(item['container-title']) ? item['container-title'][0] : item['container-title'],
      doi: item.DOI,
      url: item.URL,
      abstract: stripMarkup(item.abstract),
      openAccessPdf: pdfLink,
      citationCount: item['is-referenced-by-count'],
      searchSource: query,
    }, 'Crossref');
  });
}

function externalCandidateRelevant(candidate, query) {
  const text = normalizeText(`${candidate.title} ${candidate.abstract || ''} ${candidate.venue || ''}`);
  if (/(stress deafness|cross-linguistic languages|重音不敏感|跨语言.*重音)/.test(normalizeText(query))) {
    const hasStress = /(stress|prosod|accent|重音|韵律)/.test(text);
    const hasLanguageContext = /(language|bilingual|speaker|listener|french|spanish|portuguese|dutch|german|finnish|hungarian|persian|korean|japanese|chinese|catalan|italian|deafness)/.test(text);
    return hasStress && hasLanguageContext;
  }
  if (/(infant prosody|infant.*perception|婴儿|韵律)/.test(normalizeText(query))) {
    const hasInfant = /(infant|baby|neonat|newborn|month|babies)/.test(text);
    const hasProsody = /(prosod|stress|speech|perception|rhythm|tonal)/.test(text);
    return hasInfant && hasProsody;
  }
  return true;
}

function rankExternalCandidates(candidates, query) {
  const terms = tokenizeQuery(query);
  return candidates.map((candidate) => {
    const titleScore = scoreField(candidate.title, terms, 6, 'title').score;
    const abstractScore = scoreField(candidate.abstract, terms, 3, 'abstract').score;
    const venueScore = scoreField(candidate.venue, terms, 1.5, 'venue').score;
    const citationBoost = Math.log10(candidate.citationCount + 1) * 0.35;
    return { ...candidate, relevanceScore: titleScore + abstractScore + venueScore + citationBoost };
  }).sort((a, b) => b.relevanceScore - a.relevanceScore || b.citationCount - a.citationCount);
}

async function searchExternalPapers(query, contextPaper) {
  const searchQuery = buildExternalSearchQuery(query, contextPaper);
  const cached = state.externalSearchCache.get(searchQuery);
  if (cached && Date.now() - cached.cachedAt < 10 * 60 * 1000) return cached.result;
  const settled = await Promise.allSettled([
    searchOpenAlex(searchQuery, 7),
    searchCrossref(searchQuery, 7),
  ]);
  const errors = [];
  const candidates = [];
  const byKey = new Map();

  for (const [index, result] of settled.entries()) {
    const provider = index === 0 ? 'OpenAlex' : 'Crossref';
    if (result.status === 'rejected') {
      errors.push(`${provider}：${result.reason?.message || '暂时不可用'}`);
      continue;
    }
    for (const candidate of result.value) {
      if (!candidate.title) continue;
      const key = externalCandidateKey(candidate);
      if (byKey.has(key)) {
        const existing = byKey.get(key);
        existing.providers = unique([...(existing.providers || []), provider]);
        existing.openAccessPdf ||= candidate.openAccessPdf;
        existing.abstract ||= candidate.abstract;
        if (candidate.citationCount > existing.citationCount) existing.citationCount = candidate.citationCount;
      } else {
        byKey.set(key, candidate);
        candidates.push(candidate);
      }
    }
  }

  const ranked = rankExternalCandidates(candidates, searchQuery)
    .filter((candidate) => candidate.title && candidate.title.length > 3)
    .filter((candidate) => externalCandidateRelevant(candidate, searchQuery))
    .slice(0, 7);
  const result = {
    query: searchQuery,
    candidates: ranked,
    errors,
    links: buildSearchLinks(searchQuery),
  };
  state.externalSearchCache.set(searchQuery, { cachedAt: Date.now(), result });
  return result;
}

function externalCandidateExists(candidate) {
  const doi = normalizeDoi(candidate.doi).toLowerCase();
  const title = normalizeText(candidate.title).replace(/\s+/g, '');
  return state.papers.some((paper) => {
    if (doi && normalizeDoi(paper.doi).toLowerCase() === doi) return true;
    return title.length > 8 && normalizeText(paper.title).replace(/\s+/g, '') === title;
  });
}

function rememberExternalCandidates(candidates) {
  for (const candidate of candidates) state.externalCandidates.set(candidate.id, candidate);
}

function findExternalCandidate(candidateId) {
  if (state.externalCandidates.has(candidateId)) return state.externalCandidates.get(candidateId);
  for (const chat of state.chats) {
    for (const message of chat.messages || []) {
      const candidate = (message.externalResults || []).find((item) => item.id === candidateId);
      if (candidate) {
        state.externalCandidates.set(candidateId, candidate);
        return candidate;
      }
    }
  }
  return null;
}

function externalCandidateToPaper(candidate) {
  const source = normalizeText(candidate.searchSource || '');
  const inferredTags = [];
  if (/(infant|婴儿)/.test(source)) inferredTags.push('婴儿');
  if (/(prosod|韵律)/.test(source)) inferredTags.push('韵律');
  if (/(perception|感知)/.test(source)) inferredTags.push('感知');
  if (/(stress|重音)/.test(source)) inferredTags.push('轻重音');
  if (/(cross-linguistic|跨语言)/.test(source)) inferredTags.push('跨语言');
  if (/(development|acquisition|习得)/.test(source)) inferredTags.push('发展');
  const conceptTags = Object.entries(CONCEPTS)
    .filter(([, terms]) => terms.some((term) => source.includes(normalizeText(term))))
    .map(([name]) => ({
      l2experience: '语言经验',
      speechperception: '语音感知',
      stress: '轻重音',
      proficiency: '语言水平',
    })[name]);
  const queryTags = unique([...inferredTags, ...conceptTags, '在线检索']);
  return {
    id: uid('paper'),
    title: candidate.title,
    authors: candidate.authors || [],
    year: candidate.year || '',
    venue: candidate.venue || '',
    doi: candidate.doi || '',
    tags: queryTags,
    abstract: candidate.abstract || '',
    notes: [],
    evidence: [],
    fullText: '',
    isExternal: true,
    needsPdf: true,
    openAccessPdf: candidate.openAccessPdf || '',
    sourceUrl: candidate.url || candidate.doi || '',
    provider: (candidate.providers || [candidate.provider]).filter(Boolean).join(' + '),
    citationCount: candidate.citationCount || 0,
    addedAt: nowISO(),
    importedFrom: '在线学术检索',
  };
}

function externalResultIntro(query, contextPaper, externalResult, localCount) {
  const normalized = normalizeText(query);
  const candidateCount = externalResult?.candidates?.length || 0;
  const context = contextPaper
    ? `<p>你刚才问到的是本地库里的 <strong>${escapeHTML(contextPaper.title)}</strong>。我会把这篇作为上下文，而不是把你引用的结论强行扩展到其他语言。</p>`
    : '';
  let scope = '';
  if (/(deaf|重音|stress|french|法语|其他语言|跨语言)/.test(normalized)) {
    scope = candidateCount
      ? '<p>在线扩展检索返回的候选里，优先查看标题中含有 cross-linguistic、bilingual、stress deafness 的跨语言或双语者研究。开放 PDF 可以直接尝试导入；只有元数据的条目先加入文献库，你再按题目补 PDF。</p>'
      : '<p>目前没有拿到可靠的在线候选。我保留了几个学术搜索入口，并给出英文检索式，避免用无关结果硬凑答案。</p>';
  } else if (/(婴儿|infant|韵律|prosod)/.test(normalized)) {
    scope = candidateCount
      ? '<p>这些是在线候选。若摘要里写明了月龄，我可以据此回答；如果只有题目和摘要、没有明确月龄，我不会替你推断“几个月一定可以习得”。把开放 PDF 导入后，我才能基于全文回答。</p>'
      : '<p>我暂时没有检索到可核验的在线结果。下面保留了学术搜索入口和英文检索式，你可以按题目寻找 PDF，再导入这里。</p>';
  } else {
    scope = candidateCount
      ? '<p>下面是在线候选论文。先加入元数据可以建立记忆索引；需要基于论证内容回答时，再补 PDF 全文。</p>'
      : '<p>在线数据源暂时没有返回可用候选。我保留了检索入口，后续可以直接继续找。</p>';
  }
  const localNote = localCount
    ? `<p>本地文献库已有 <span class="answer-count">${localCount}</span> 条命中依据，下面先列本地证据，再列在线候选。</p>`
    : '<p>你的本地文献库里暂时没有足够证据，所以这次把结果分为“在线找到的论文”和“需要你补 PDF 的论文”。</p>';
  const errorNote = externalResult?.errors?.length
    ? `<p class="external-warning">部分数据源暂时不可用：${escapeHTML(externalResult.errors.join('；'))}</p>`
    : '';
  return `<div class="external-answer-intro">${context}${localNote}${scope}${errorNote}</div>`;
}

function currentChat() {
  return state.chats.find((chat) => chat.id === state.activeChatId) || null;
}

async function createChat(render = true) {
  const chat = {
    id: uid('chat'),
    title: '新对话',
    createdAt: nowISO(),
    updatedAt: nowISO(),
    messages: [],
  };
  state.chats.unshift(chat);
  state.activeChatId = chat.id;
  await dbPut('chats', chat);
  if (render) {
    state.activeCitations = [];
    renderAll();
    showView('chat');
  }
  return chat;
}

async function saveChat(chat) {
  chat.updatedAt = nowISO();
  await dbPut('chats', chat);
}

async function ensureDatabase() {
  const [papers, chats, seeded] = await Promise.all([
    dbGetAll('papers'),
    dbGetAll('chats'),
    dbGet('meta', 'seeded-demo'),
  ]);
  state.papers = papers.sort((a, b) => new Date(b.addedAt || 0) - new Date(a.addedAt || 0));
  state.chats = chats.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));

  for (const chat of state.chats) {
    let recovered = false;
    for (const message of chat.messages || []) {
      if (message.pending) {
        message.pending = false;
        message.content = '<p>上一次在线检索被页面刷新或关闭中断，这轮没有完成。请重新发送问题，我会再次检索。</p>';
        recovered = true;
      }
    }
    if (recovered) await dbPut('chats', chat);
  }

  const seedPapers = IS_DEMO_MODE ? [...DEMO_PAPERS, PUBLIC_DEMO_PAPER] : DEMO_PAPERS;
  if (!papers.length && !seeded) {
    for (const paper of seedPapers) await dbPut('papers', paper);
    state.papers = [...seedPapers];
    await dbPut('meta', { key: 'seeded-demo', value: true, createdAt: nowISO() });
  }
  if (IS_DEMO_MODE && !state.papers.some((paper) => paper.id === PUBLIC_DEMO_PAPER.id)) {
    await dbPut('papers', PUBLIC_DEMO_PAPER);
    state.papers.unshift(PUBLIC_DEMO_PAPER);
  }

  if (!state.chats.length) {
    await createChat(false);
  } else {
    state.activeChatId = state.chats[0].id;
  }
}

function renderAll() {
  renderNavigation();
  renderRecentChats();
  renderSidebarTags();
  renderMessages();
  renderCitationPanel();
  renderCoverage();
  renderLibrary();
}

function renderNavigation() {
  els.chatCount.textContent = String(state.chats.length);
  els.paperCount.textContent = String(state.papers.length);
}

function renderRecentChats() {
  const chats = state.chats.slice(0, 8);
  els.recentList.innerHTML = chats.map((chat) => `
    <button class="recent-item ${chat.id === state.activeChatId ? 'active' : ''}" type="button" data-chat-id="${escapeHTML(chat.id)}">
      ${escapeHTML(chat.title || '新对话')}
    </button>
  `).join('');
}

function tagFrequency() {
  const counts = new Map();
  for (const paper of state.papers) {
    for (const tag of paper.tags || []) counts.set(tag, (counts.get(tag) || 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'zh-CN'));
}

function renderSidebarTags() {
  const tags = tagFrequency().slice(0, 12);
  els.sidebarTags.innerHTML = tags.length
    ? tags.map(([tag, count]) => `<button class="sidebar-tag" type="button" data-tag="${escapeHTML(tag)}">${escapeHTML(tag)} ${count}</button>`).join('')
    : '<span class="aside-empty">还没有主题标签</span>';
}

function renderMessages() {
  const chat = currentChat();
  if (!chat || !chat.messages.length) {
    const demoCount = state.papers.filter((paper) => paper.isDemo).length;
    els.messages.innerHTML = `
      <section class="welcome">
        <div class="welcome-mark" aria-hidden="true">
          <svg viewBox="0 0 24 24"><path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3V4Z"/><path d="M5 17.5A2.5 2.5 0 0 1 7.5 15H19M9 8h6M9 11h4"/></svg>
        </div>
        <h2>把读过的论文，变成写作时找得回的证据</h2>
        <p>我不会凭空回答。每个结论都会回到你保存的论文标题、读后笔记、标注片段或提取出的全文；本地证据不足时，也可以让我到 OpenAlex 和 Crossref 找候选论文。${demoCount ? `当前有 ${demoCount} 条演示文献，可直接试问。` : ''}</p>
        <div class="welcome-examples">
          <button class="welcome-example" type="button" data-prompt="请问做二语语音感知的时候，哪些论文认为 L2 语言经验很重要？">
            <span>查找观点</span>
            哪些论文认为 L2 语言经验会影响语音感知？
          </button>
          <button class="welcome-example" type="button" data-prompt="我有几篇论文标注了轻重音很重要，大概是哪几篇论文？">
            <span>回忆标注</span>
            我标注过哪些“轻重音很重要”的论文？
          </button>
          <button class="welcome-example" type="button" data-prompt="母语经验如何影响非母语语音加工？">
            <span>整理论据</span>
            母语经验影响非母语语音加工的依据有哪些？
          </button>
        </div>
      </section>
    `;
    return;
  }

  els.messages.innerHTML = chat.messages.map((message) => {
    if (message.role === 'user') {
      return `
        <article class="message user">
          <div class="message-avatar">我</div>
          <div class="message-body">
            <div class="user-bubble">${escapeHTML(message.content)}</div>
          </div>
        </article>
      `;
    }

    if (message.pending) {
      return `
        <article class="message assistant">
          <div class="message-avatar">文</div>
          <div class="message-body assistant-content">
            <div class="assistant-kicker">${escapeHTML(message.pendingLabel || '正在核对你的资料')}</div>
            <div class="loading-answer"><i></i><i></i><i></i></div>
          </div>
        </article>
      `;
    }

    const results = (message.citations || [])
      .map((citation) => {
        const paper = state.papers.find((item) => item.id === citation.paperId);
        return paper ? { ...citation, paper } : null;
      })
      .filter(Boolean);

    return `
      <article class="message assistant">
        <div class="message-avatar">文</div>
        <div class="message-body assistant-content">
          <div class="assistant-kicker">基于你的文献库</div>
          ${message.content || '<p>没有找到可核对的内容。</p>'}
          ${results.length ? `<div class="citation-list">${results.map((result, index) => renderCitationCard(result, index)).join('')}</div>` : ''}
          ${renderExternalSection(message.externalResults || [], message.externalLinks || [], message.externalQuery || '', message.externalErrors || [])}
        </div>
      </article>
    `;
  }).join('');
}

function renderCitationCard(result, index) {
  const paper = result.paper;
  const terms = result.matched || [];
  return `
    <article class="citation-card">
      <div class="citation-topline">
        <span class="citation-index">${index + 1}</span>
        <div>
          <h3 class="citation-title">${highlight(paper.title, terms)}</h3>
          <p class="citation-meta">${escapeHTML(formatAuthors(paper.authors))}${paper.year ? ` · ${paper.year}` : ''}${paper.venue ? ` · ${escapeHTML(paper.venue)}` : ''}</p>
        </div>
      </div>
      <blockquote class="citation-excerpt">
        <span class="excerpt-label">${escapeHTML(result.match?.label || '相关片段')}${result.match?.page ? ` · ${escapeHTML(result.match.page)}` : ''}</span>
        ${highlight(result.match?.text || paper.abstract || paper.title, terms)}
      </blockquote>
      <div class="citation-foot">
        <span class="match-label">${paper.isDemo ? '演示条目 · ' : paper.isExternal ? `${paper.needsPdf ? '在线元数据 / 待补 PDF' : '在线论文全文'} · ` : ''}匹配：${escapeHTML(terms.slice(0, 4).join(' / ') || '最近导入')}</span>
        <button class="card-link" type="button" data-paper-id="${escapeHTML(paper.id)}">查看原文与笔记</button>
      </div>
    </article>
  `;
}

function getLatestCitations() {
  const chat = currentChat();
  if (!chat) return [];
  for (let i = chat.messages.length - 1; i >= 0; i -= 1) {
    const message = chat.messages[i];
    if (message.role === 'assistant' && message.citations?.length) return message.citations;
  }
  return [];
}

function safeExternalUrl(value = '') {
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
  } catch {
    return '';
  }
}

function formatExternalAuthors(authors = []) {
  if (!authors.length) return '作者信息待补充';
  if (authors.length <= 3) return authors.join(', ');
  return `${authors.slice(0, 3).join(', ')} et al.`;
}

function renderExternalCandidateCard(candidate, index) {
  const exists = externalCandidateExists(candidate);
  const sourceUrl = safeExternalUrl(candidate.url || candidate.doi);
  const pdfUrl = safeExternalUrl(candidate.openAccessPdf);
  const providers = (candidate.providers || [candidate.provider]).filter(Boolean).join(' + ');
  const downloadSearchUrl = `https://scholar.google.com/scholar?q=${encodeURIComponent(candidate.title)}`;
  const abstract = candidate.abstract
    ? `${candidate.abstract.slice(0, 430)}${candidate.abstract.length > 430 ? '…' : ''}`
    : '该数据源没有提供摘要；可以先加入文献库，下载 PDF 后再补全文。';
  return `
    <article class="external-card" data-external-id="${escapeHTML(candidate.id)}">
      <div class="external-card-head">
        <span class="external-index">${index + 1}</span>
        <div>
          <h3>${escapeHTML(candidate.title)}</h3>
          <p>${escapeHTML(formatExternalAuthors(candidate.authors))}${candidate.year ? ` · ${candidate.year}` : ''}${candidate.venue ? ` · ${escapeHTML(candidate.venue)}` : ''}</p>
        </div>
      </div>
      <p class="external-abstract">${escapeHTML(abstract)}</p>
      <div class="external-meta-row">
        <span class="external-provider">${escapeHTML(providers || '在线学术检索')}</span>
        ${candidate.citationCount ? `<span>被引 ${Number(candidate.citationCount).toLocaleString('zh-CN')}</span>` : ''}
        ${candidate.doi ? `<span>DOI ${escapeHTML(candidate.doi)}</span>` : ''}
        <span class="${pdfUrl ? 'oa-yes' : 'oa-no'}">${pdfUrl ? '有开放 PDF' : '需自行寻找 PDF'}</span>
      </div>
      <div class="external-actions">
        <button class="btn btn-small ${exists ? '' : 'btn-primary'}" type="button" data-add-external="${escapeHTML(candidate.id)}" ${exists ? 'disabled' : ''}>${exists ? '已在文献库' : '加入元数据'}</button>
        ${pdfUrl ? `<button class="btn btn-small" type="button" data-import-external-pdf="${escapeHTML(candidate.id)}">尝试导入开放 PDF</button>` : ''}
        ${pdfUrl ? `<a class="external-link download-link" href="${escapeHTML(pdfUrl)}" target="_blank" rel="noreferrer">打开 PDF ↗</a>` : `<a class="external-link download-link" href="${escapeHTML(downloadSearchUrl)}" target="_blank" rel="noreferrer">查找 PDF ↗</a>`}
        ${sourceUrl ? `<a class="external-link" href="${escapeHTML(sourceUrl)}" target="_blank" rel="noreferrer">打开来源 ↗</a>` : ''}
      </div>
    </article>
  `;
}

function renderExternalSection(candidates, links, query, errors = []) {
  if (!candidates.length && !links.length) return '';
  const searchLinks = (links || []).map((link) => `<a href="${escapeHTML(link.url)}" target="_blank" rel="noreferrer">${escapeHTML(link.label)} ↗</a>`).join('');
  return `
    <section class="external-section">
      <div class="external-section-head">
        <div>
          <span class="eyebrow">在线扩展检索</span>
          <h3>找到 ${candidates.length} 篇候选论文</h3>
          ${query ? `<p class="external-query">检索式：${escapeHTML(query)}</p>` : ''}
        </div>
        ${candidates.length ? '<button class="text-button" type="button" data-add-all-external>加入前 5 篇元数据</button>' : ''}
      </div>
      ${errors.length ? `<p class="external-warning">${escapeHTML(errors.join('；'))}</p>` : ''}
      ${candidates.length ? `<div class="external-list">${candidates.map((candidate, index) => renderExternalCandidateCard(candidate, index)).join('')}</div>` : ''}
      ${searchLinks ? `<div class="external-links"><span>继续检索：</span>${searchLinks}</div>` : ''}
    </section>
  `;
}

function renderCitationPanel() {
  const citations = state.activeCitations.length ? state.activeCitations : getLatestCitations();
  state.activeCitations = citations;
  if (!citations.length) {
    els.citationPanel.innerHTML = '<p class="aside-empty">提问后，这里会列出回答实际使用的论文。点击即可回到论文、笔记和原文片段。</p>';
    return;
  }
  els.citationPanel.innerHTML = citations.map((citation, index) => {
    const paper = citation.paper || state.papers.find((item) => item.id === citation.paperId);
    if (!paper) return '';
    return `
      <article class="citation-mini">
        <span class="citation-mini-index">${index + 1}</span>
        <button type="button" data-paper-id="${escapeHTML(paper.id)}">
          <strong>${escapeHTML(paper.title)}</strong>
          <span>${escapeHTML(formatAuthors(paper.authors))}${paper.year ? ` · ${paper.year}` : ''}</span>
        </button>
      </article>
    `;
  }).join('');
}

function renderCoverage() {
  const evidenceCount = state.papers.reduce((sum, paper) => sum + (paper.evidence?.length || 0), 0);
  const noteCount = state.papers.reduce((sum, paper) => sum + (paper.notes?.length || 0), 0);
  const withFullText = state.papers.filter((paper) => paper.fullText?.trim()).length;
  els.coverageStats.innerHTML = `
    <div class="stat-card"><strong>${state.papers.length}</strong><span>篇论文</span></div>
    <div class="stat-card"><strong>${noteCount}</strong><span>条读后笔记</span></div>
    <div class="stat-card"><strong>${evidenceCount}</strong><span>条证据片段</span></div>
    <div class="stat-card"><strong>${withFullText}</strong><span>篇含全文</span></div>
  `;
  const pendingPdf = state.papers.filter((paper) => paper.needsPdf).length;
  const tags = tagFrequency().slice(0, 10);
  els.coverageTags.innerHTML = [
    pendingPdf ? `<span class="coverage-tag pending-tag">待补 PDF · ${pendingPdf}</span>` : '',
    ...tags.map(([tag, count]) => `<span class="coverage-tag">${escapeHTML(tag)} · ${count}</span>`),
  ].join('');
}

function paperMatchesLibraryQuery(paper, terms) {
  if (!terms.length) return true;
  const text = normalizeText(getAllPaperText(paper));
  return terms.some((term) => text.includes(term));
}

function renderLibrary() {
  const terms = tokenizeQuery(els.librarySearch.value || '');
  const papers = state.papers.filter((paper) => paperMatchesLibraryQuery(paper, terms));
  const noteCount = state.papers.reduce((sum, paper) => sum + (paper.notes?.length || 0), 0);
  const evidenceCount = state.papers.reduce((sum, paper) => sum + (paper.evidence?.length || 0), 0);
  const pendingPdf = state.papers.filter((paper) => paper.needsPdf).length;
  els.librarySummary.innerHTML = `
    <span class="summary-chip">共 ${state.papers.length} 篇</span>
    <span class="summary-chip">${noteCount} 条笔记</span>
    <span class="summary-chip">${evidenceCount} 条证据</span>
    ${pendingPdf ? `<span class="summary-chip pending-chip">${pendingPdf} 篇待补 PDF</span>` : ''}
    ${els.librarySearch.value ? `<span class="summary-chip">当前结果 ${papers.length} 篇</span>` : ''}
  `;

  if (!papers.length) {
    els.paperGrid.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V4H6.5A2.5 2.5 0 0 0 4 6.5v13Z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/></svg>
        <h3>${state.papers.length ? '没有匹配的论文' : '文献库还是空的'}</h3>
        <p>${state.papers.length ? '试试标题、作者或笔记中的关键词。' : '导入 PDF、粘贴论文全文，或者先录入一篇你读过的论文。'}</p>
        <button class="btn btn-primary" type="button" data-open-import>导入第一篇论文</button>
      </div>
    `;
    return;
  }

  els.paperGrid.innerHTML = papers.map((paper) => {
    const note = paper.notes?.[0]?.content || paper.abstract || '还没有读后笔记。打开论文后可以补充。';
    const firstTags = (paper.tags || []).slice(0, 2);
    return `
      <article class="paper-card" tabindex="0" role="button" data-paper-id="${escapeHTML(paper.id)}">
        <div class="paper-card-head">
          <h3>${highlight(paper.title, terms)}</h3>
          ${paper.isDemo ? '<span class="demo-dot">演示</span>' : ''}
          ${paper.isExternal ? '<span class="demo-dot external-dot">在线</span>' : ''}
          ${paper.isShowcase ? '<span class="demo-dot showcase-dot">本地 PDF</span>' : ''}
          ${paper.isShowcaseFallback ? '<span class="demo-dot showcase-dot">公开示例</span>' : ''}
        </div>
        <p class="paper-meta">${escapeHTML(formatAuthors(paper.authors))}${paper.year ? ` · ${paper.year}` : ''}</p>
        <p class="paper-note">${highlight(note, terms)}</p>
        <div class="paper-card-foot">
          ${firstTags.map((tag) => `<span class="paper-tag">${escapeHTML(tag)}</span>`).join('')}
          ${paper.needsPdf ? '<span class="paper-tag pending-tag">待补 PDF</span>' : ''}
          <span class="paper-date">${paper.fullText ? '全文可检索' : paper.abstract ? '摘要可检索' : '元数据'}</span>
        </div>
      </article>
    `;
  }).join('');
}

function showView(view) {
  state.activeView = view;
  for (const item of els.navItems) item.classList.toggle('active', item.dataset.view === view);
  const isChat = view === 'chat';
  els.chatView.hidden = !isChat;
  els.libraryView.hidden = isChat;
  els.viewTitle.textContent = isChat ? '问我读过什么' : '我的文献库';
  closeMobileSidebar();
  if (!isChat) renderLibrary();
}

function setSearchMode(mode) {
  state.searchMode = mode === 'local' ? 'local' : 'smart';
  for (const button of els.searchModeButtons) {
    button.classList.toggle('active', button.dataset.searchMode === state.searchMode);
  }
  if (els.composerHint) {
    els.composerHint.textContent = state.searchMode === 'smart'
      ? '先查你的资料；需要时再检索 OpenAlex / Crossref'
      : '回答只使用你的论文、笔记和标注片段';
  }
}

function showImport(tab = 'pdf') {
  els.importModal.hidden = false;
  switchImportTab(tab);
  document.body.style.overflow = 'hidden';
}

function closeImport() {
  els.importModal.hidden = true;
  document.body.style.overflow = '';
}

function switchImportTab(tab) {
  for (const button of els.importTabs) {
    const active = button.dataset.importTab === tab;
    button.classList.toggle('active', active);
    button.setAttribute('aria-selected', String(active));
  }
  for (const [name, pane] of Object.entries(els.importPanes)) {
    pane.classList.toggle('active', name === tab);
  }
}

function showReview(items, duplicates = []) {
  els.reviewModal.hidden = false;
  document.body.style.overflow = 'hidden';
  const imported = items.filter((item) => !item.error && !item.duplicate);
  const problems = [...items.filter((item) => item.error), ...duplicates];
  els.reviewBody.innerHTML = `
    <div class="review-summary">
      已导入 <strong>${imported.length}</strong> 篇；跳过重复 <strong>${duplicates.length}</strong> 篇；失败 <strong>${items.filter((item) => item.error).length}</strong> 篇。
    </div>
    ${items.map((item, index) => `
      <article class="review-item">
        <span class="review-number">${index + 1}</span>
        <div>
          <h3>${escapeHTML(item.title || item.fileName || '未命名文件')}</h3>
          <p>${item.error ? escapeHTML(item.error) : item.duplicate ? '文献库中已有相同 DOI 或标题，已跳过。' : `已保存 ${item.noteCount || 0} 条笔记、${item.evidenceCount || 0} 条证据${item.charCount ? `，全文 ${item.charCount.toLocaleString('zh-CN')} 字` : ''}。`}</p>
          ${item.warning ? `<p class="review-warning">${escapeHTML(item.warning)}</p>` : ''}
        </div>
      </article>
    `).join('') || '<p class="aside-empty">没有可显示的导入结果。</p>'}
  `;
}

function closeReview() {
  els.reviewModal.hidden = true;
  document.body.style.overflow = '';
}

function toast(message, type = 'normal') {
  const node = document.createElement('div');
  node.className = `toast ${type === 'error' ? 'error' : ''}`;
  node.textContent = message;
  els.toastRegion.appendChild(node);
  setTimeout(() => node.remove(), 3600);
}

function openPaperDrawer(paperId) {
  const paper = state.papers.find((item) => item.id === paperId);
  if (!paper) return;
  state.selectedPaperId = paperId;
  els.paperDrawer.hidden = false;
  els.drawerBackdrop.hidden = false;
  document.body.style.overflow = 'hidden';
  renderDrawer(paper);
}

function closePaperDrawer() {
  state.selectedPaperId = null;
  els.paperDrawer.hidden = true;
  els.drawerBackdrop.hidden = true;
  document.body.style.overflow = '';
}

function renderDrawer(paper) {
  const notes = paper.notes || [];
  const evidence = paper.evidence || [];
  const link = paper.doi
    ? (/^https?:\/\//i.test(paper.doi) ? paper.doi : `https://doi.org/${paper.doi}`)
    : '';
  els.drawerContent.innerHTML = `
    <div>
      <span class="eyebrow">${paper.isShowcaseFallback ? '合成公开演示论文' : paper.isShowcase ? '本地导入示例' : paper.isDemo ? '演示文献' : paper.isExternal ? '在线候选文献' : '已保存文献'}</span>
      <h2 class="drawer-title">${escapeHTML(paper.title)}</h2>
      <p class="drawer-meta">${escapeHTML(formatAuthors(paper.authors))}${paper.year ? ` · ${paper.year}` : ''}${paper.venue ? `<br>${escapeHTML(paper.venue)}` : ''}</p>
      <div class="drawer-links">
        ${link ? `<a href="${escapeHTML(link)}" target="_blank" rel="noreferrer">打开 DOI / 链接 ↗</a>` : ''}
        <span class="paper-tag">${paper.fullText ? `${paper.fullText.length.toLocaleString('zh-CN')} 字全文` : '未存全文'}</span>
      </div>
      <div class="drawer-tags">${(paper.tags || []).map((tag) => `<span class="paper-tag">${escapeHTML(tag)}</span>`).join('')}</div>
    </div>

    ${paper.needsPdf ? `
      <div class="pdf-callout">
        <strong>目前只有在线元数据或摘要，尚未保存 PDF 全文。</strong>
        <p>${paper.openAccessPdf ? `<a href="${escapeHTML(safeExternalUrl(paper.openAccessPdf))}" target="_blank" rel="noreferrer">打开开放 PDF ↗</a>，下载后可在“导入论文”中上传；如果浏览器允许跨站读取，也可以在搜索结果中点击“尝试导入开放 PDF”。` : '请按标题寻找 PDF，再通过“导入论文”加入全文。'}</p>
        ${paper.importError ? `<p class="review-warning">${escapeHTML(paper.importError)}</p>` : ''}
      </div>
    ` : ''}

    ${paper.abstract ? `
      <section class="drawer-section">
        <div class="drawer-section-head"><h3>摘要 / 概要</h3></div>
        <p class="detail-text">${escapeHTML(paper.abstract)}</p>
      </section>
    ` : ''}

    <section class="drawer-section">
      <div class="drawer-section-head"><h3>在这篇论文里查证</h3><span class="match-label">${paper.fullText ? '全文可检索' : '没有全文'}</span></div>
      ${paper.fullText ? `
        <form class="paper-query-form" data-query-paper="${escapeHTML(paper.id)}">
          <div class="paper-query-row">
            <input name="query" type="search" placeholder="例：粤语和普通话的重音感知有什么差异？">
            <button class="btn btn-primary" type="submit">查全文</button>
          </div>
          <div class="paper-query-results"></div>
        </form>
      ` : '<p class="aside-empty">当前只有摘要或元数据，无法查证论文正文。请重新导入 PDF 全文。</p>'}
    </section>

    <section class="drawer-section">
      <div class="drawer-section-head"><h3>读后笔记</h3><span class="match-label">${notes.length} 条</span></div>
      ${notes.length ? notes.map((note) => `
        <div class="note-card">
          ${escapeHTML(note.content || note)}
          <span class="note-date">${note.createdAt ? new Date(note.createdAt).toLocaleDateString('zh-CN') : ''}</span>
        </div>
      `).join('') : '<p class="aside-empty">还没有读后笔记。</p>'}
      <form class="add-note-form" data-add-note="${escapeHTML(paper.id)}">
        <textarea name="note" rows="3" placeholder="补充一条读后笔记，例如：这篇适合支持哪个论点？"></textarea>
        <button class="btn btn-secondary" type="submit">保存笔记</button>
      </form>
    </section>

    <section class="drawer-section">
      <div class="drawer-section-head"><h3>标注证据</h3><span class="match-label">${evidence.length} 条</span></div>
      ${evidence.length ? evidence.map((item) => `
        <article class="evidence-card">
          <div class="evidence-card-head">
            <strong>${item.sourceType === 'quote' ? '原文片段' : '阅读标注'}</strong>
            ${(item.tags || []).slice(0, 2).map((tag) => `<span class="evidence-tag">${escapeHTML(tag)}</span>`).join('')}
            ${item.page ? `<span class="evidence-page">${escapeHTML(item.page)}</span>` : ''}
          </div>
          <p class="evidence-text">${escapeHTML(item.text || '')}</p>
        </article>
      `).join('') : '<p class="aside-empty">还没有标注证据。导入 PDF 后，可以在以后版本中加入划词标注。</p>'}
    </section>

    ${paper.fullText ? `
      <section class="drawer-section">
        <div class="drawer-section-head"><h3>全文预览</h3><span class="match-label">全文已保存</span></div>
        <div class="fulltext-preview">${escapeHTML(paper.fullText.slice(0, 5000))}${paper.fullText.length > 5000 ? `\n\n…（这里只预览前 5,000 字；全部 ${paper.fullText.length.toLocaleString('zh-CN')} 字都已保存并用于检索）` : ''}</div>
      </section>
    ` : ''}

    <section class="drawer-section">
      <button class="btn btn-secondary" type="button" data-delete-paper="${escapeHTML(paper.id)}">从文献库删除</button>
    </section>
  `;
}

function prepareTextPaper(fileName, text, extra = {}) {
  const normalizedName = fileName.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ');
  const trimmed = String(text || '').replace(/\r\n/g, '\n').trim();
  const firstLine = trimmed.split('\n').map((line) => line.trim()).find((line) => line.length > 12 && line.length < 220);
  const rawMetadataTitle = String(extra.title || '').trim();
  const genericTitles = /^(untitled|untitled document|document|microsoft word|powerpoint presentation|pdf|无标题|未命名)$/i;
  const detectedTitle = (rawMetadataTitle && !genericTitles.test(rawMetadataTitle) ? rawMetadataTitle : '') || firstLine || normalizedName;
  const doiMatch = trimmed.match(/\b10\.\d{4,9}\/[-._;()/:A-Z0-9]+\b/i);
  return {
    id: uid('paper'),
    title: detectedTitle,
    authors: extra.authors || [],
    year: extra.year || '',
    venue: extra.venue || '',
    doi: extra.doi || (doiMatch ? doiMatch[0] : ''),
    tags: extra.tags || [],
    abstract: extra.abstract || '',
    notes: extra.notes || [],
    evidence: extra.evidence || [],
    fullText: trimmed.slice(0, 600000),
    isDemo: false,
    addedAt: nowISO(),
    importedFrom: extra.importedFrom || fileName,
  };
}

function isDuplicatePaper(paper) {
  const title = normalizeText(paper.title).replace(/\s+/g, '');
  return state.papers.some((existing) => {
    if (paper.doi && existing.doi && normalizeText(paper.doi) === normalizeText(existing.doi)) return true;
    return title.length > 8 && normalizeText(existing.title).replace(/\s+/g, '') === title;
  });
}

async function savePaper(paper) {
  if (isDuplicatePaper(paper)) return { duplicate: true, title: paper.title };
  state.papers.unshift(paper);
  await dbPut('papers', paper);
  return { paper };
}

async function extractPdf(file) {
  return extractPdfBuffer(await file.arrayBuffer());
}

async function ensurePdfWorkerAvailable() {
  const workerUrl = pdfjsLib.GlobalWorkerOptions.workerSrc;
  try {
    const response = await fetchWithTimeout(workerUrl, { method: 'HEAD', cache: 'no-store' }, 4500);
    if (!response.ok) throw new Error(`worker ${response.status}`);
  } catch {
    throw new Error('PDF_WORKER_SERVER_OFFLINE');
  }
}

function friendlyPdfImportError(error) {
  const message = error?.message || '未知错误';
  if (message === 'PDF_WORKER_SERVER_OFFLINE' || /fake worker|dynamically imported module|worker\.mjs|Failed to fetch/i.test(message)) {
    return 'PDF 解析服务没有连接。通常是启动页面后关闭了运行 server.py 的终端，或本地服务器已经停止。请重新双击 start.command，刷新本页面，再导入 PDF。';
  }
  return `读取失败：${message}`;
}

async function extractPdfBuffer(buffer) {
  await ensurePdfWorkerAvailable();
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buffer) });
  const pdf = await loadingTask.promise;
  const pages = [];
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    let pageText = '';
    let lastY = null;
    for (const item of content.items) {
      const y = item.transform?.[5];
      if (lastY !== null && Math.abs(y - lastY) > 4) pageText += '\n';
      pageText += item.str;
      if (item.hasEOL) pageText += '\n';
      lastY = y;
    }
    pages.push(`[[PAGE ${pageNumber}]]\n${pageText.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim()}`);
  }
  const metadata = await pdf.getMetadata().catch(() => ({ info: {} }));
  return {
    text: pages.join('\n\n').trim(),
    pageCount: pdf.numPages,
    title: metadata.info?.Title || '',
    author: metadata.info?.Author || '',
  };
}

async function importExternalCandidate(candidateId, includePdf = false) {
  const candidate = findExternalCandidate(candidateId);
  if (!candidate) {
    toast('候选论文已失效，请重新检索。', 'error');
    return;
  }
  if (externalCandidateExists(candidate)) {
    toast('这篇论文已经在文献库中。');
    return;
  }

  const paper = externalCandidateToPaper(candidate);
  const saveResult = await savePaper(paper);
  if (saveResult.duplicate) {
    toast('这篇论文已经在文献库中。');
    renderAll();
    return;
  }

  if (includePdf && candidate.openAccessPdf) {
    try {
      toast('正在尝试下载并解析开放 PDF…');
      const response = await fetchWithTimeout(candidate.openAccessPdf, { headers: { Accept: 'application/pdf' } }, 15000);
      if (!response.ok) throw new Error(`PDF 请求返回 ${response.status}`);
      const buffer = await response.arrayBuffer();
      const extracted = await extractPdfBuffer(buffer);
      if (!extracted.text || extracted.text.length < 80) throw new Error('PDF 中没有提取到足够的可复制文字');
      paper.fullText = extracted.text.slice(0, 600000);
      paper.abstract ||= extractAbstract(extracted.text);
      paper.needsPdf = false;
      paper.pdfImportedAt = nowISO();
      paper.pdfSource = candidate.openAccessPdf;
      await dbPut('papers', paper);
      toast('开放 PDF 已导入，现在可以检索全文。');
    } catch (error) {
      paper.importError = `开放 PDF 自动导入失败：${error.message || '浏览器无法跨站读取'}`;
      paper.needsPdf = true;
      await dbPut('papers', paper);
      toast('元数据已加入；开放 PDF 无法跨站读取，请打开来源下载后手动导入。', 'error');
    }
  } else {
    toast('论文元数据已加入，标记为“待补 PDF”。');
  }

  renderAll();
}

async function addAllExternalCandidates() {
  const candidates = [...state.externalCandidates.values()].slice(0, 5);
  let added = 0;
  for (const candidate of candidates) {
    if (externalCandidateExists(candidate)) continue;
    const result = await savePaper(externalCandidateToPaper(candidate));
    if (result.paper) added += 1;
  }
  renderAll();
  toast(added ? `已加入 ${added} 篇候选论文的元数据。` : '候选论文都已在文献库中。');
}

function extractAbstract(text) {
  const match = text.match(/(?:abstract|摘要)\s*[:：]?\s*([\s\S]{80,2400}?)(?=\n\s*(?:keywords?|关键词|1[.\s]+introduction|引言)\b)/i);
  return match ? match[1].replace(/\s+/g, ' ').trim().slice(0, 1800) : '';
}

async function handlePaperFiles(files) {
  const list = [...files];
  if (!list.length) return;
  const results = [];
  els.extractStatus.className = 'extract-status';
  for (const file of list) {
    const extension = file.name.split('.').pop().toLowerCase();
    if (extension === 'json') {
      const text = await file.text();
      const jsonResult = await importJsonPayload(text);
      results.push(...jsonResult);
      continue;
    }

    els.extractStatus.textContent = `正在读取 ${file.name}…`;
    try {
      let paper;
      let warning = '';
      if (extension === 'pdf') {
        const extracted = await extractPdf(file);
        if (!extracted.text || extracted.text.length < 80) {
          results.push({ fileName: file.name, title: file.name, error: '没有提取到足够的可复制文字，可能是扫描版 PDF。' });
          continue;
        }
        paper = prepareTextPaper(file.name, extracted.text, {
          title: extracted.title || '',
          authors: splitList(extracted.author || ''),
          abstract: extractAbstract(extracted.text),
          notes: [],
          evidence: [],
          importedFrom: file.name,
        });
        if (extracted.text.length >= 600000) warning = 'PDF 文本较长，超过 60 万字符的部分未保存；建议把关键段落另存为证据片段。';
      } else {
        const text = await file.text();
        if (!text.trim()) {
          results.push({ fileName: file.name, title: file.name, error: '文件内容为空。' });
          continue;
        }
        paper = prepareTextPaper(file.name, text, { importedFrom: file.name });
      }

      const saveResult = await savePaper(paper);
      if (saveResult.duplicate) {
        results.push({ fileName: file.name, title: paper.title, duplicate: true });
      } else {
        results.push({
          fileName: file.name,
          title: paper.title,
          noteCount: paper.notes.length,
          evidenceCount: paper.evidence.length,
          charCount: paper.fullText.length,
          warning,
        });
      }
    } catch (error) {
      console.error(error);
      results.push({ fileName: file.name, title: file.name, error: friendlyPdfImportError(error) });
    }
  }
  els.extractStatus.textContent = `处理完成：${results.filter((item) => !item.error && !item.duplicate).length} 篇已保存。`;
  if (results.some((item) => item.error)) els.extractStatus.classList.add('error');
  renderAll();
  if (results.length) showReview(results);
}

function normalizeImportedPaper(raw) {
  if (!raw || typeof raw !== 'object') throw new Error('条目不是有效对象');
  const title = String(raw.title || '').trim();
  if (!title) throw new Error('缺少论文标题');
  const notes = Array.isArray(raw.notes)
    ? raw.notes.map((note) => typeof note === 'string'
      ? { id: uid('note'), content: note, createdAt: nowISO() }
      : { id: note.id || uid('note'), content: String(note.content || note.text || ''), createdAt: note.createdAt || nowISO() })
      .filter((note) => note.content)
    : [];
  const evidence = Array.isArray(raw.evidence)
    ? raw.evidence.map((item) => typeof item === 'string'
      ? { id: uid('evidence'), text: item, sourceType: 'quote', tags: [] }
      : {
        id: item.id || uid('evidence'),
        text: String(item.text || item.quote || item.note || ''),
        page: String(item.page || ''),
        tags: Array.isArray(item.tags) ? item.tags.map(String) : splitList(item.tags || ''),
        sourceType: item.sourceType === 'quote' ? 'quote' : 'reading-note',
      })
      .filter((item) => item.text)
    : [];
  return {
    id: raw.id || uid('paper'),
    title,
    authors: Array.isArray(raw.authors) ? raw.authors.map(String) : splitList(raw.authors || ''),
    year: raw.year || '',
    venue: String(raw.venue || raw.journal || raw.publisher || ''),
    doi: String(raw.doi || raw.url || ''),
    tags: Array.isArray(raw.tags) ? raw.tags.map(String) : splitList(raw.tags || ''),
    abstract: String(raw.abstract || raw.summary || ''),
    notes,
    evidence,
    fullText: String(raw.fullText || raw.text || raw.content || '').slice(0, 600000),
    isDemo: false,
    addedAt: raw.addedAt || nowISO(),
    importedFrom: raw.importedFrom || 'JSON 导入',
  };
}

async function importJsonPayload(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch (error) {
    return [{ title: 'JSON 文件', error: `JSON 格式错误：${error.message}` }];
  }
  const entries = Array.isArray(data) ? data : Array.isArray(data.papers) ? data.papers : data.paper ? [data.paper] : [data];
  const results = [];
  for (const [index, raw] of entries.entries()) {
    try {
      const paper = normalizeImportedPaper(raw);
      const saveResult = await savePaper(paper);
      results.push(saveResult.duplicate
        ? { title: paper.title, duplicate: true }
        : {
          title: paper.title,
          noteCount: paper.notes.length,
          evidenceCount: paper.evidence.length,
          charCount: paper.fullText.length,
        });
    } catch (error) {
      results.push({ title: `第 ${index + 1} 条`, error: error.message });
    }
  }
  renderAll();
  return results;
}

function extractLanguageMentions(text = '') {
  const languageMap = [
    ['French', /french|français/i],
    ['Spanish', /spanish|español/i],
    ['Portuguese', /portuguese|português/i],
    ['Dutch', /dutch|nederlands/i],
    ['German', /german|deutsch/i],
    ['Finnish', /finnish|suomi/i],
    ['Hungarian', /hungarian|magyar/i],
    ['Persian', /persian|farsi/i],
    ['Amharic', /amharic/i],
    ['Arabic', /arabic/i],
    ['Hebrew', /hebrew/i],
    ['Polish', /polish/i],
    ['Turkish', /turkish/i],
    ['Russian', /russian/i],
    ['Korean', /korean/i],
    ['Japanese', /japanese/i],
    ['Chinese', /chinese|mandarin/i],
    ['English', /english/i],
    ['Italian', /italian|italiano/i],
    ['Catalan', /catalan/i],
  ];
  return languageMap.filter(([, pattern]) => pattern.test(text)).map(([name]) => name);
}

function extractAgeSnippet(abstract = '') {
  const normalized = String(abstract).replace(/\s+/g, ' ');
  const patterns = [
    /[^.]{0,110}\b\d{1,2}[-\s]?(?:month|months|month-old|month-olds)\b[^.]{0,150}\./i,
    /[^.]{0,110}\b(?:newborn|neonatal|neonate)\b[^.]{0,150}\./i,
  ];
  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match) return match[0].trim();
  }
  return '';
}

function summarizeExternalEvidence(candidates, query) {
  if (!candidates.length) return '';
  const normalized = normalizeText(query);
  if (/(deaf|重音|stress|french|法语|跨语言|其他语言)/.test(normalized)) {
    const items = candidates.map((candidate) => {
      const languages = extractLanguageMentions(`${candidate.title} ${candidate.abstract || ''}`);
      if (!languages.length) return '';
      return `<li><strong>${escapeHTML(candidate.title)}</strong> — 元数据/摘要中涉及 ${escapeHTML(languages.join('、'))}。</li>`;
    }).filter(Boolean).slice(0, 4);
    if (items.length) {
      return `<div class="evidence-summary"><strong>从在线元数据能直接读出的语言范围</strong><ul>${items.join('')}</ul><p>这只能说明候选论文涉及这些语言；各语言听者到底是否表现出重音不敏感，仍要打开摘要或导入全文核对。</p></div>`;
    }
    return '<div class="evidence-summary"><strong>目前还不能可靠回答“还有哪些语言”</strong><p>在线候选的标题和摘要没有稳定给出可核验的语言清单。不要用题目中的“跨语言”推断具体结论；导入最相关 PDF 后，我可以按全文逐篇回答。</p></div>';
  }

  if (/(婴儿|infant|baby|韵律|prosod)/.test(normalized)) {
    const items = candidates.map((candidate) => {
      const snippet = extractAgeSnippet(candidate.abstract || '');
      return snippet
        ? `<li><strong>${escapeHTML(candidate.title)}</strong>：${escapeHTML(snippet)}</li>`
        : '';
    }).filter(Boolean).slice(0, 4);
    if (items.length) {
      return `<div class="evidence-summary"><strong>摘要中出现的月龄/发育阶段证据</strong><ul>${items.join('')}</ul><p>这些是摘要层面的线索，正式写作时仍需回到实验方法和原文核对。</p></div>`;
    }
    return '<div class="evidence-summary"><strong>现在还不足以回答“几个月可以习得韵律”</strong><p>在线结果有相关题目，但摘要没有提供明确的婴儿月龄结论。先把最相关的开放 PDF 导入，我才能按全文中的任务、刺激和结果回答。</p></div>';
  }
  return '';
}

async function submitQuestion(rawQuery) {
  const query = String(rawQuery || '').trim();
  if (!query || state.isAnswering) return;
  const chat = currentChat();
  if (!chat) return;

  let contextPaper = queryUsesContext(query) ? latestContextPaper() : null;
  const localResultSet = searchPapers(query, 5);
  if (!contextPaper && isPaperCoverageQuestion(query)) contextPaper = localResultSet.results[0]?.paper || null;
  const paperCoverageQuestion = isPaperCoverageQuestion(query) && Boolean(contextPaper);
  const previousUserQuery = [...chat.messages].reverse().find((message) => message.role === 'user')?.content || '';
  const needsOnline = !paperCoverageQuestion && shouldSearchOnline(query, localResultSet.results);

  if (chat.title === '新对话' || !chat.title) chat.title = query.slice(0, 30);
  chat.messages.push({ id: uid('msg'), role: 'user', content: query, createdAt: nowISO() });
  const assistantId = uid('msg');
  chat.messages.push({
    id: assistantId,
    role: 'assistant',
    content: '',
    citations: [],
    externalResults: [],
    externalLinks: [],
    externalErrors: [],
    pending: true,
    pendingLabel: paperCoverageQuestion ? '正在检查这篇论文的已保存全文' : needsOnline ? '正在核对本地文献，并检索在线论文' : '正在核对你的资料',
    createdAt: nowISO(),
  });
  await saveChat(chat);
  state.isAnswering = true;
  els.chatInput.value = '';
  resizeChatInput();
  els.sendButton.disabled = true;
  renderAll();
  requestAnimationFrame(() => {
    els.chatScroll.scrollTop = els.chatScroll.scrollHeight;
  });

  const answer = paperCoverageQuestion
    ? answerPaperCoverage(contextPaper, query, previousUserQuery)
    : answerQuestion(query, localResultSet);
  const citations = answer.results.map((result) => ({
    paperId: result.paper.id,
    score: result.score,
    matched: result.matched,
    match: result.match,
  }));

  let externalResult = { query: '', candidates: [], errors: [], links: [] };
  if (needsOnline) {
    try {
      externalResult = await searchExternalPapers(query, contextPaper);
      rememberExternalCandidates(externalResult.candidates);
    } catch (error) {
      externalResult = {
        query: buildExternalSearchQuery(query, contextPaper),
        candidates: [],
        errors: [error.message || '在线检索失败'],
        links: buildSearchLinks(buildExternalSearchQuery(query, contextPaper)),
      };
    }
  }

  const latestChat = currentChat();
  const message = latestChat?.messages.find((item) => item.id === assistantId);
  if (!latestChat || !message) {
    state.isAnswering = false;
    els.sendButton.disabled = false;
    return;
  }

  message.pending = false;
  message.content = answer.content;
  if (needsOnline) {
    message.content += externalResultIntro(query, contextPaper, externalResult, localResultSet.results.length);
    message.content += summarizeExternalEvidence(externalResult.candidates || [], query);
  }
  message.citations = citations;
  message.externalResults = externalResult.candidates || [];
  message.externalLinks = externalResult.links || [];
  message.externalErrors = externalResult.errors || [];
  message.externalQuery = externalResult.query || '';
  state.activeCitations = citations;
  state.isAnswering = false;
  els.sendButton.disabled = false;
  await saveChat(latestChat);
  renderAll();
  requestAnimationFrame(() => {
    els.chatScroll.scrollTop = els.chatScroll.scrollHeight;
  });
}

function resizeChatInput() {
  els.chatInput.style.height = 'auto';
  els.chatInput.style.height = `${Math.min(els.chatInput.scrollHeight, 140)}px`;
}

function downloadJson() {
  const payload = {
    version: 1,
    app: '文脉 · 论文记忆助手',
    exportedAt: nowISO(),
    papers: state.papers,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `paper-memory-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
  toast('已导出全部论文、笔记与证据。');
}

function openMobileSidebar() {
  els.sidebar.classList.add('open');
  els.mobileScrim.hidden = false;
}

function closeMobileSidebar() {
  els.sidebar.classList.remove('open');
  els.mobileScrim.hidden = true;
}

function openAside() {
  els.aside.classList.add('open');
  els.asideToggle.setAttribute('aria-expanded', 'true');
}

function closeAside() {
  els.aside.classList.remove('open');
  els.asideToggle.setAttribute('aria-expanded', 'false');
}

function bindEvents() {
  els.newChatButton.addEventListener('click', () => createChat());
  els.menuButton.addEventListener('click', openMobileSidebar);
  els.sidebarClose.addEventListener('click', closeMobileSidebar);
  els.mobileScrim.addEventListener('click', closeMobileSidebar);
  els.asideToggle.addEventListener('click', () => {
    if (els.aside.classList.contains('open')) closeAside();
    else openAside();
  });
  els.asideClose.addEventListener('click', closeAside);

  for (const button of els.searchModeButtons) {
    button.addEventListener('click', () => setSearchMode(button.dataset.searchMode));
  }

  for (const item of els.navItems) {
    item.addEventListener('click', () => showView(item.dataset.view));
  }

  els.recentList.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-chat-id]');
    if (!button) return;
    state.activeChatId = button.dataset.chatId;
    state.activeCitations = [];
    renderAll();
    showView('chat');
  });

  els.sidebarTags.addEventListener('click', (event) => {
    const button = event.target.closest('[data-tag]');
    if (!button) return;
    els.librarySearch.value = button.dataset.tag;
    state.libraryQuery = button.dataset.tag;
    showView('library');
    renderLibrary();
  });

  els.chatForm.addEventListener('submit', (event) => {
    event.preventDefault();
    submitQuestion(els.chatInput.value);
  });

  els.chatInput.addEventListener('input', resizeChatInput);
  els.chatInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      els.chatForm.requestSubmit();
    }
  });

  const handlePromptClick = (event) => {
    const target = event.target.closest('[data-prompt]');
    if (!target) return;
    els.chatInput.value = target.dataset.prompt;
    submitQuestion(target.dataset.prompt);
  };
  els.quickPrompts.addEventListener('click', handlePromptClick);
  els.messages.addEventListener('click', async (event) => {
    const prompt = event.target.closest('[data-prompt]');
    if (prompt) {
      handlePromptClick(event);
      return;
    }
    const addExternal = event.target.closest('[data-add-external]');
    if (addExternal) {
      await importExternalCandidate(addExternal.dataset.addExternal, false);
      return;
    }
    const importExternalPdf = event.target.closest('[data-import-external-pdf]');
    if (importExternalPdf) {
      await importExternalCandidate(importExternalPdf.dataset.importExternalPdf, true);
      return;
    }
    const addAll = event.target.closest('[data-add-all-external]');
    if (addAll) {
      await addAllExternalCandidates();
      return;
    }
    const paperButton = event.target.closest('[data-paper-id]');
    if (paperButton) openPaperDrawer(paperButton.dataset.paperId);
  });

  els.citationPanel.addEventListener('click', (event) => {
    const button = event.target.closest('[data-paper-id]');
    if (button) openPaperDrawer(button.dataset.paperId);
  });

  els.viewLibraryButton.addEventListener('click', () => showView('library'));
  els.importTopButton.addEventListener('click', () => showImport('pdf'));
  els.importSideButton.addEventListener('click', () => showImport('manual'));
  els.importButton.addEventListener('click', () => showImport('pdf'));
  els.closeImportButton.addEventListener('click', closeImport);
  els.closeReviewButton.addEventListener('click', closeReview);

  els.importModal.addEventListener('click', (event) => {
    if (event.target === els.importModal) closeImport();
  });
  els.reviewModal.addEventListener('click', (event) => {
    if (event.target === els.reviewModal) closeReview();
  });

  for (const tab of els.importTabs) {
    tab.addEventListener('click', () => switchImportTab(tab.dataset.importTab));
  }

  els.paperFileInput.addEventListener('change', (event) => {
    handlePaperFiles(event.target.files);
    event.target.value = '';
  });

  for (const eventName of ['dragenter', 'dragover']) {
    els.dropzone.addEventListener(eventName, (event) => {
      event.preventDefault();
      els.dropzone.classList.add('dragging');
    });
  }
  for (const eventName of ['dragleave', 'drop']) {
    els.dropzone.addEventListener(eventName, (event) => {
      event.preventDefault();
      els.dropzone.classList.remove('dragging');
    });
  }
  els.dropzone.addEventListener('drop', (event) => handlePaperFiles(event.dataTransfer.files));

  els.manualForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const title = document.getElementById('manualTitle').value.trim();
    if (!title) return;
    const noteText = document.getElementById('manualNote').value.trim();
    const evidenceText = document.getElementById('manualEvidence').value.trim();
    const paper = {
      id: uid('paper'),
      title,
      authors: splitList(document.getElementById('manualAuthors').value),
      year: document.getElementById('manualYear').value.trim(),
      venue: document.getElementById('manualVenue').value.trim(),
      doi: document.getElementById('manualDoi').value.trim(),
      tags: splitList(document.getElementById('manualTags').value),
      abstract: document.getElementById('manualAbstract').value.trim(),
      notes: noteText ? [{ id: uid('note'), content: noteText, createdAt: nowISO() }] : [],
      evidence: evidenceText ? [{
        id: uid('evidence'),
        text: evidenceText,
        page: document.getElementById('manualPage').value.trim(),
        tags: splitList(document.getElementById('manualEvidenceTags').value),
        sourceType: 'reading-note',
      }] : [],
      fullText: document.getElementById('manualFullText').value.trim().slice(0, 600000),
      isDemo: false,
      addedAt: nowISO(),
      importedFrom: '手动录入',
    };
    const saveResult = await savePaper(paper);
    if (saveResult.duplicate) {
      showReview([{ title, duplicate: true }]);
      return;
    }
    els.manualForm.reset();
    closeImport();
    renderAll();
    toast('论文与笔记已保存。');
  });

  els.clearManualForm.addEventListener('click', () => els.manualForm.reset());

  els.jsonFileInput.addEventListener('change', async (event) => {
    const [file] = event.target.files;
    if (!file) return;
    const results = await importJsonPayload(await file.text());
    showReview(results);
    event.target.value = '';
  });

  els.importPastedJson.addEventListener('click', async () => {
    if (!els.jsonPaste.value.trim()) {
      toast('请先粘贴 JSON 内容。', 'error');
      return;
    }
    const results = await importJsonPayload(els.jsonPaste.value);
    showReview(results);
    els.jsonPaste.value = '';
  });

  els.downloadJsonButton.addEventListener('click', downloadJson);
  els.exportButton.addEventListener('click', downloadJson);

  els.clearChatsButton.addEventListener('click', async () => {
    if (!state.chats.length) return;
    if (!window.confirm('确定清空所有对话吗？论文和笔记不会被删除。')) return;
    await dbClear('chats');
    state.chats = [];
    await createChat(false);
    state.activeCitations = [];
    renderAll();
    showView('chat');
  });

  els.librarySearch.addEventListener('input', (event) => {
    state.libraryQuery = event.target.value;
    renderLibrary();
  });

  els.paperGrid.addEventListener('click', (event) => {
    if (event.target.closest('[data-open-import]')) {
      showImport('pdf');
      return;
    }
    const card = event.target.closest('[data-paper-id]');
    if (card) openPaperDrawer(card.dataset.paperId);
  });
  els.paperGrid.addEventListener('keydown', (event) => {
    const card = event.target.closest('[data-paper-id]');
    if (card && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      openPaperDrawer(card.dataset.paperId);
    }
  });

  els.closeDrawerButton.addEventListener('click', closePaperDrawer);
  els.drawerBackdrop.addEventListener('click', closePaperDrawer);
  els.drawerContent.addEventListener('submit', async (event) => {
    const queryForm = event.target.closest('[data-query-paper]');
    if (queryForm) {
      event.preventDefault();
      const paper = state.papers.find((item) => item.id === queryForm.dataset.queryPaper);
      const query = new FormData(queryForm).get('query')?.toString().trim();
      const resultNode = queryForm.querySelector('.paper-query-results');
      if (!paper || !query || !resultNode) return;
      if (!paper.fullText) {
        resultNode.innerHTML = '<p class="review-warning">这篇论文没有保存全文，无法查证正文。</p>';
        return;
      }
      const hits = searchPaperFullText(paper, query, 5);
      resultNode.innerHTML = hits.snippets.length
        ? renderFullTextHits(hits, '全文查证结果')
        : `<div class="no-results">没有命中这些关键词。可以换一个更具体的英文术语或变量名再查；关键词未命中不等于论文一定没有讨论。</div>`;
      return;
    }

    const form = event.target.closest('[data-add-note]');
    if (!form) return;
    event.preventDefault();
    const paper = state.papers.find((item) => item.id === form.dataset.addNote);
    const content = new FormData(form).get('note')?.toString().trim();
    if (!paper || !content) return;
    paper.notes = paper.notes || [];
    paper.notes.push({ id: uid('note'), content, createdAt: nowISO() });
    await dbPut('papers', paper);
    renderDrawer(paper);
    renderAll();
    toast('笔记已加入检索索引。');
  });

  els.drawerContent.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-delete-paper]');
    if (!button) return;
    const paper = state.papers.find((item) => item.id === button.dataset.deletePaper);
    if (!paper) return;
    if (!window.confirm(`确定删除《${paper.title}》及其全部笔记吗？`)) return;
    await dbDelete('papers', paper.id);
    state.papers = state.papers.filter((item) => item.id !== paper.id);
    state.activeCitations = state.activeCitations.filter((citation) => citation.paperId !== paper.id);
    closePaperDrawer();
    renderAll();
    toast('论文已删除。');
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    if (!els.reviewModal.hidden) closeReview();
    else if (!els.importModal.hidden) closeImport();
    else if (!els.paperDrawer.hidden) closePaperDrawer();
    else if (els.aside.classList.contains('open')) closeAside();
    else closeMobileSidebar();
  });
}

async function init() {
  bindEvents();
  try {
    document.body.classList.toggle('demo-mode', IS_DEMO_MODE);
    await ensureDatabase();
    await syncShowcasePaperFromMainDatabase();
    setSearchMode(state.searchMode);
    renderAll();
    showView('chat');
  } catch (error) {
    console.error(error);
    toast(`初始化失败：${error.message}`, 'error');
  }
}

init();
