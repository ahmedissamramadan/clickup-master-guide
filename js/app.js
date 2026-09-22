/* ClickUp Master Guide: interaction layer */
(function () {
  'use strict';

  var doc = document, root = doc.documentElement;

  /* ---------- Language system ---------- */
  var STRINGS = {
    en: {
      title: 'ClickUp Master Guide: The Complete, In-Depth ClickUp Guide (2026)',
      desc: 'A complete, in-depth guide to ClickUp: hierarchy, tasks, views, automations, docs, dashboards, AI, pricing, and best practices: all in one page.'
    },
    ar: {
      title: 'الدليل الشامل لـ ClickUp: شرح كامل وتفصيلي (2026)',
      desc: 'دليل كامل ومفصّل لأداة ClickUp لإدارة المشروعات: الهيكل، المهام، طرق العرض، الأتمتة، المستندات، لوحات المعلومات، الذكاء الاصطناعي، الأسعار، وأفضل الممارسات: كل ذلك في صفحة واحدة.'
    }
  };

  function setDir(lang) {
    root.setAttribute('lang', lang);
    root.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
  }

  function applyLang(lang, updateUrl) {
    root.setAttribute('data-lang', lang);
    setDir(lang);
    doc.title = STRINGS[lang].title;
    var m = doc.querySelector('meta[name="description"]');
    if (m) m.setAttribute('content', STRINGS[lang].desc);
    doc.querySelectorAll('.lang-switch button').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-lang-btn') === lang);
    });
    try {
      localStorage.setItem('cu-guide-lang', lang);
      if (updateUrl) {
        var u = new URL(location.href);
        u.searchParams.set('lang', lang);
        history.replaceState(null, '', u);
      }
    } catch (e) { /* storage unavailable */ }
    // rebuild TOC labels, glossary grid, and search index in the new language
    if (typeof renderAllTOCs === 'function') renderAllTOCs();
    if (typeof renderGlossaryGrid === 'function') renderGlossaryGrid('');
    if (typeof buildSearchIndex === 'function') buildSearchIndex();
    // keep open FAQ items sized correctly after font metrics change
    doc.querySelectorAll('.faq-item.open').forEach(function (it) {
      var a = it.querySelector('.faq-a');
      if (a) a.style.maxHeight = a.scrollHeight + 'px';
    });
  }

  function initLang() {
    var saved = null, urlLang = null;
    try {
      urlLang = new URLSearchParams(location.search).get('lang');
      saved = localStorage.getItem('cu-guide-lang');
    } catch (e) { }
    var initial = urlLang || saved || 'ar';
    applyLang(initial, false);
    doc.querySelectorAll('.lang-switch button').forEach(function (b) {
      b.addEventListener('click', function () { applyLang(b.getAttribute('data-lang-btn'), true); });
    });
  }

  /* ---------- Header state ---------- */
  function initHeader() {
    var header = doc.querySelector('.site-header');
    var toTop = doc.getElementById('toTop');
    var progress = doc.getElementById('progress');

    function onScroll() {
      var y = window.scrollY || 0;
      header.classList.toggle('scrolled', y > 8);
      if (toTop) toTop.classList.toggle('show', y > 700);
      if (progress) {
        var h = doc.documentElement.scrollHeight - window.innerHeight;
        progress.style.width = (h > 0 ? (y / h) * 100 : 0) + '%';
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    if (toTop) toTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ---------- Table of contents ---------- */
  var SECTION_IDS = ['what-is-clickup', 'hierarchy', 'tasks', 'views', 'simulator', 'custom-fields', 'automations', 'ai-brain', 'docs-whiteboards', 'dashboards-goals', 'time-sprints', 'integrations-security', 'get-started', 'best-practices', 'mistakes', 'pricing', 'comparisons', 'glossary', 'faq'];

  var TOC_LABELS = {
    en: {
      'what-is-clickup': '01 · What is ClickUp',
      'hierarchy': '02 · The Hierarchy',
      'tasks': '03 · Tasks',
      'views': '04 · Views',
      'simulator': '05 · Live Simulator',
      'custom-fields': '06 · Custom Fields',
      'automations': '06 · Automations',
      'ai-brain': '07 · ClickUp Brain',
      'docs-whiteboards': '08 · Docs & Whiteboards',
      'dashboards-goals': '09 · Dashboards & Goals',
      'time-sprints': '10 · Time & Sprints',
      'integrations-security': '11 · Integrations & Security',
      'get-started': '12 · First 15 Minutes',
      'best-practices': '13 · Best Practices',
      'mistakes': '14 · Common Mistakes',
      'pricing': '15 · Pricing',
      'comparisons': '16 · Comparisons',
      'glossary': '17 · Glossary',
      'faq': '18 · FAQ'
    },
    ar: {
      'what-is-clickup': '01 · ما هو ClickUp',
      'hierarchy': '02 · الهيكل الهرمي',
      'tasks': '03 · المهام',
      'views': '04 · طرق العرض',
      'simulator': '05 · المحاكاة الحية',
      'custom-fields': '06 · الحقول المخصصة',
      'automations': '06 · الأتمتة',
      'ai-brain': '07 · ClickUp Brain',
      'docs-whiteboards': '08 · المستندات والسبورات',
      'dashboards-goals': '09 · اللوحات والأهداف',
      'time-sprints': '10 · الوقت والسبرنتات',
      'integrations-security': '11 · التكاملات والأمان',
      'get-started': '12 · أول 15 دقيقة',
      'best-practices': '13 · أفضل الممارسات',
      'mistakes': '14 · الأخطاء الشائعة',
      'pricing': '15 · الأسعار',
      'comparisons': '16 · المقارنات',
      'glossary': '17 · المسرد',
      'faq': '18 · الأسئلة الشائعة'
    }
  };

  function currentLang() { return root.getAttribute('data-lang') || 'ar'; }

  function renderTOC(nav) {
    if (!nav) return;
    var lang = currentLang();
    nav.innerHTML = '';
    SECTION_IDS.forEach(function (id) {
      var a = doc.createElement('a');
      a.href = '#' + id;
      a.setAttribute('data-sec', id);
      a.textContent = TOC_LABELS[lang][id] || id;
      a.addEventListener('click', function () { closeDrawer(); });
      nav.appendChild(a);
    });
  }

  function renderAllTOCs() {
    doc.querySelectorAll('.toc nav, .toc-drawer nav').forEach(renderTOC);
  }

  function initTOC() {
    renderAllTOCs();

    // active section highlighting
    var heads = SECTION_IDS.map(function (id) { return doc.getElementById(id); }).filter(Boolean);
    if (!('IntersectionObserver' in window) || !heads.length) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var id = en.target.id;
        doc.querySelectorAll('.toc nav a[data-sec], .toc-drawer nav a[data-sec]').forEach(function (a) {
          a.classList.toggle('active', a.getAttribute('data-sec') === id);
        });
      });
    }, { rootMargin: '-25% 0px -65% 0px' });
    heads.forEach(function (h) { io.observe(h); });
  }

  /* ---------- TOC drawer (mobile) ---------- */
  function closeDrawer() {
    var d = doc.querySelector('.toc-drawer');
    if (d) d.classList.remove('open');
  }

  function initDrawer() {
    var btn = doc.querySelector('.toc-toggle');
    var drawer = doc.querySelector('.toc-drawer');
    if (!btn || !drawer) return;
    btn.addEventListener('click', function () { drawer.classList.add('open'); });
    drawer.addEventListener('click', function (e) { if (e.target === drawer) closeDrawer(); });
    doc.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeDrawer(); });
  }

  /* ---------- Glossary ---------- */
  var GLOSSARY = [
    { en: 'Workspace', ar: 'مساحة العمل', d_ar: 'أعلى مستوى في ClickUp: كل شيء داخل شركتك يعيش داخله، وعادة تكون واحدة لكل شركة.', d_en: 'The top-level container: everything in your company lives inside it, usually one per company.' },
    { en: 'Space', ar: 'المساحة', d_ar: 'أكبر تقسيم داخل مساحة العمل، يمثل فريقًا أو قسمًا له إعداداته وصلاحياته الخاصة.', d_en: 'The biggest division inside a workspace: a team or department with its own settings and permissions.' },
    { en: 'Folder', ar: 'المجلد', d_ar: 'مجموعة قوائم تتبع مشروعًا واحدًا داخل المساحة، وتُرشح عند انتهائه.', d_en: 'A group of Lists belonging to one project inside a Space; archived when the project ends.' },
    { en: 'List', ar: 'القائمة', d_ar: 'وحدة العمل الفعلية التي تعيش فيها المهام، وأصغر شيء يمكن مشاركته مباشرة.', d_en: 'The actual working unit where tasks live, and the smallest thing you can share directly.' },
    { en: 'Task', ar: 'المهمة', d_ar: 'وحدة عمل واحدة قابلة للتعيين: لها منفذ وتاريخ وأولوية وحالة ووصف.', d_en: 'A single assignable unit of work with an assignee, date, priority, status, and description.' },
    { en: 'Subtask', ar: 'المهمة الفرعية', d_ar: 'مهمة أصغر داخل مهمة رئيسية، تتداخل حتى مستويين وتتصرف كمهمة كاملة.', d_en: 'A smaller task inside a parent task, nesting up to two levels and behaving like a real task.' },
    { en: 'Checklist', ar: 'قائمة التحقق', d_ar: 'خطوات بسيطة داخل المهمة، كل عنصر قابل للإسناد والتقدم يظهر كنسبة.', d_en: 'Simple steps inside a task; each item can be assigned and progress shows as a percentage.' },
    { en: 'Status', ar: 'الحالة', d_ar: 'مرحلة المهمة الحالية (للتنفيذ، قيد التنفيذ، مكتملة) وقابلة للتخصيص لكل قائمة.', d_en: 'The current stage of a task (To Do, In Progress, Complete), customizable per List.' },
    { en: 'Assignee', ar: 'المنفّذ', d_ar: 'الشخص المسؤول عن تنفيذ المهمة، ويمكن تعيين أكثر من شخص في الخطط المدفوعة.', d_en: 'The person responsible for the task; multiple assignees are possible on paid plans.' },
    { en: 'Priority', ar: 'الأولوية', d_ar: 'أهمية المهمة بأربع مستويات: عاجل، مرتفع، عادي، منخفض.', d_en: 'Task importance on four levels: Urgent, High, Normal, Low.' },
    { en: 'Watcher', ar: 'المراقب', d_ar: 'شخص مشترك في إشعارات المهمة ليصلعه كل تحديث دون أن يكون منفذًا.', d_en: 'Someone subscribed to task notifications, receiving every update without being the assignee.' },
    { en: 'Dependency', ar: 'الاعتمادية', d_ar: 'علاقة تجعل مهمة تنتظر أخرى قبل البدء، وتنزاح تواريخها تلقائيًا عند التأخير.', d_en: 'A link making one task wait on another; dates shift automatically when the blocker moves.' },
    { en: 'Custom Field', ar: 'الحقل المخصص', d_ar: 'عمود بيانات تُعرّفه بنفسك (نص، رقم، قائمة منسدلة...) يحول القائمة لقاعدة بيانات.', d_en: 'A data column you define (text, number, dropdown...) that turns a List into a database.' },
    { en: 'View', ar: 'طريقة العرض', d_ar: 'طريقة رؤية نفس المهام: قائمة، لوحة، تقويم، خط زمني، جدول...', d_en: 'A way of seeing the same tasks: list, board, calendar, timeline, table...' },
    { en: 'Board (Kanban)', ar: 'اللوحة (كانبان)', d_ar: 'عرض بأعمدة تمثل الحالات، تسحب فيه بطاقات المهام بينها.', d_en: 'A view with columns representing statuses; you drag task cards between them.' },
    { en: 'Gantt Chart', ar: 'مخطط جانت', d_ar: 'خط زمني بأشرطة يُظهر المهام واعتمادياتها والمسار الحرج للمشروع.', d_en: 'A timeline of bars showing tasks, their dependencies, and the project critical path.' },
    { en: 'Timeline', ar: 'الخط الزمني', d_ar: 'عرض زمني بالمهام على مدى الأسابيع والشهور لتخطيط التسلسل.', d_en: 'A date-based view of tasks across weeks and months for sequencing work.' },
    { en: 'Workload', ar: 'عبء العمل', d_ar: 'عرض يوضح حجم عمل كل شخص مقابل سعته لموازنة التوزيع (خطط Business+).', d_en: 'A view of each person\u2019s workload against capacity for balancing (Business+).' },
    { en: 'Automation', ar: 'الأتمتة', d_ar: 'قاعدة تُنفذ إجراءات تلقائيًا: عندما يحدث شيء، وإذا تحقق شرط، فافعل شيئًا.', d_en: 'A rule that runs actions automatically: when something happens, if a condition is met, do something.' },
    { en: 'Template', ar: 'القالب', d_ar: 'هيكل جاهز يعاد استخدامه للمهام والقوائم والمساحات بدل البناء من الصفر.', d_en: 'A reusable structure for tasks, Lists, and Spaces instead of building from scratch.' },
    { en: 'ClickUp Brain', ar: 'الذكاء الاصطناعي', d_ar: 'طبقة AI مدفوعة تكتب وتلخص وتترجم وتجيب عن أسئلة مساحة عملك.', d_en: 'The paid AI layer that writes, summarizes, translates, and answers questions about your workspace.' },
    { en: 'Dashboard', ar: 'لوحة المعلومات', d_ar: 'صفحة تتجمع فيها رسوم وأرقام من بيانات مهامك الحية للمتابعة.', d_en: 'A page assembling charts and numbers from your live task data for tracking.' },
    { en: 'Goal (OKR)', ar: 'الهدف', d_ar: 'هدف يتتبع تقدمه تلقائيًا من المهام أو الأرقام بنمط OKR.', d_en: 'An objective whose progress auto-tracks from tasks or numbers, OKR-style.' },
    { en: 'Doc', ar: 'المستند', d_ar: 'مستند تعاوني داخل ClickUp يمكنه توليد مهام من نصه والربط بالويكي.', d_en: 'A collaborative document inside ClickUp that can spawn tasks and link wiki-style.' },
    { en: 'Whiteboard', ar: 'السبورة', d_ar: 'لوحة رسم حرية بأشكال وملاحظات لاصقة ومهام قابلة للسحب.', d_en: 'A freeform canvas with shapes, sticky notes, and draggable tasks.' },
    { en: 'Time Tracking', ar: 'تتبع الوقت', d_ar: 'مؤقت أصلي داخل المهام يسجل الوقت الفعلي مقابل التقديرات.', d_en: 'Native timers inside tasks recording actual time against estimates.' },
    { en: 'Sprint', ar: 'السبرنت', d_ar: 'دورة عمل قصيرة ثابتة (عادة أسبوعان) تستخدمها الفرق التقنية الرشيقة.', d_en: 'A short fixed work cycle (usually two weeks) used by agile teams.' },
    { en: 'Guest', ar: 'الضيف', d_ar: 'شخص خارج فريقك تمنحه وصولًا لقوائم محددة فقط، ومجاني ضمن الحدود.', d_en: 'Someone outside your team given access to specific Lists only, free within limits.' },
    { en: 'Member', ar: 'العضو', d_ar: 'شخص بكامل الوصول لمساحة العمل ويُحسب في فاتورة الاشتراك.', d_en: 'A person with full workspace access, counted in your subscription bill.' },
    { en: 'Everything Level', ar: 'مستوى الكل', d_ar: 'شاشة تجمع كل المساحات في مكان واحد للبحث والمراجعة الشاملة.', d_en: 'A screen pooling all Spaces together for search and overall review.' },
    { en: 'Recurring Task', ar: 'المهمة المتكررة', d_ar: 'مهمة تعيد إنشاء نفسها بجدولة: يوميًا، أسبوعيًا، أو نمط مخصص.', d_en: 'A task that recreates itself on a schedule: daily, weekly, or a custom pattern.' },
    { en: 'Form View', ar: 'عرض النموذج', d_ar: 'نموذج قابل للمشاركة يحوّل ردود المرسلين إلى مهام في قائمتك.', d_en: 'A shareable form that turns submitter responses into tasks in your List.' }
  ];

  function glossaryPopHTML(g) {
    var lang = currentLang();
    var title = lang === 'ar' ? (g.en + ' = ' + g.ar) : (g.en + ' / ' + g.ar);
    var body = lang === 'ar' ? g.d_ar : g.d_en;
    return '<b>' + title + '</b>' + body;
  }

  function renderGlossaryGrid(filter) {
    var grid = doc.getElementById('glossaryGrid');
    if (!grid) return;
    var lang = currentLang();
    var f = (filter || '').trim().toLowerCase();
    var items = GLOSSARY.filter(function (g) {
      if (!f) return true;
      return g.en.toLowerCase().indexOf(f) > -1 || g.ar.indexOf(f) > -1 || g.d_ar.indexOf(f) > -1 || g.d_en.toLowerCase().indexOf(f) > -1;
    });
    grid.innerHTML = '';
    if (!items.length) {
      var empty = doc.createElement('div');
      empty.className = 'g-empty';
      empty.textContent = lang === 'ar' ? 'لا نتائج مطابقة. جرّب كلمة أخرى.' : 'No matching terms. Try another word.';
      grid.appendChild(empty);
      return;
    }
    items.forEach(function (g) {
      var div = doc.createElement('div');
      div.className = 'g-term';
      div.innerHTML = '<div class="gt-en">' + g.en + '</div><div class="gt-ar">' + g.ar + '</div><div class="gt-desc">' + (lang === 'ar' ? g.d_ar : g.d_en) + '</div>';
      grid.appendChild(div);
    });
  }

  function wireGlossaryInline() {
    var terms = {};
    GLOSSARY.forEach(function (g) { terms[g.en.toLowerCase()] = g; });
    doc.querySelectorAll('.lang-en p, .lang-en li, .lang-ar p, .lang-ar li').forEach(function (el) {
      var html = el.innerHTML;
      var changed = false;
      Object.keys(terms).forEach(function (key) {
        var g = terms[key];
        var re = new RegExp('\\b(' + key.replace(/[^a-z ]/g, '') + ')\\b(?![^<]*>)', 'gi');
        if (re.test(html) && html.indexOf('gw-pop') === -1) {
          html = html.replace(re, function (m) {
            changed = true;
            return '<span class="gw" tabindex="0">' + m + '<span class="gw-pop">' + glossaryPopHTML(g) + '</span></span>';
          });
        }
      });
      if (changed) el.innerHTML = html;
    });
    // touch support: tap toggles
    doc.addEventListener('click', function (e) {
      var gw = e.target.closest('.gw');
      doc.querySelectorAll('.gw.open').forEach(function (o) { if (o !== gw) o.classList.remove('open'); });
      if (gw) gw.classList.toggle('open');
    });
  }

  function initGlossary() {
    var input = doc.getElementById('glossarySearch');
    if (input) {
      input.addEventListener('input', function () { renderGlossaryGrid(input.value); });
    }
    renderGlossaryGrid('');
    wireGlossaryInline();
  }

  /* ---------- Search modal ---------- */
  var SECTIONS_INDEX = []; // {id, labelEn, labelAr, text}

  function buildSearchIndex() {
    SECTIONS_INDEX = [];
    SECTION_IDS.forEach(function (id) {
      var sec = doc.getElementById(id);
      if (!sec) return;
      // index per language: strip the other language's blocks and hidden UI remnants
      ['ar', 'en'].forEach(function (lang) {
        var c2 = sec.cloneNode(true);
        c2.querySelectorAll('.lang-' + (lang === 'ar' ? 'en' : 'ar') + ', .gw-pop, .search-hint').forEach(function (n) { n.remove(); });
        var text = (c2.textContent || '').replace(/\s+/g, ' ').trim();
        SECTIONS_INDEX.push({ id: id, lang: lang, label: TOC_LABELS[lang][id] || id, text: text });
      });
    });
  }

  function snippetFor(entry, q) {
    var lower = entry.text.toLowerCase();
    var idx = lower.indexOf(q);
    if (idx === -1) idx = 0;
    var start = Math.max(0, idx - 70);
    var raw = entry.text.slice(start, start + 190);
    var esc = raw.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    var re = new RegExp('(' + q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig');
    return esc.replace(re, '<mark>$1</mark>');
  }

  function runSearch(q) {
    var box = doc.getElementById('searchResults');
    var hint = doc.getElementById('searchHint');
    if (!box) return;
    var lang = currentLang();
    q = q.trim();
    if (hint) {
      hint.textContent = q ? (lang === 'ar' ? 'نتائج داخل هذه الصفحة' : 'Results within this page') : (lang === 'ar' ? 'اكتب كلمتين على الأقل' : 'Type at least two characters');
    }
    if (q.length < 2) { box.innerHTML = ''; return; }
    var ql = q.toLowerCase();
    var hits = SECTIONS_INDEX.filter(function (e) { return e.lang === lang && e.text.toLowerCase().indexOf(ql) > -1; });
    box.innerHTML = '';
    if (!hits.length) {
      var empty = doc.createElement('div');
      empty.className = 'sr-empty';
      empty.textContent = lang === 'ar' ? 'لا نتائج في الدليل لهذه الكلمة.' : 'No results in the guide for that term.';
      box.appendChild(empty);
      return;
    }
    hits.slice(0, 8).forEach(function (e) {
      var b = doc.createElement('button');
      b.type = 'button';
      b.className = 'sr-item';
      b.innerHTML = '<span class="sr-sec">' + e.label + '</span><div class="sr-text">' + snippetFor(e, ql) + '...</div>';
      b.addEventListener('click', function () {
        closeSearch();
        var el = doc.getElementById(e.id);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      box.appendChild(b);
    });
  }

  function openSearch() {
    var m = doc.getElementById('searchModal');
    var i = doc.getElementById('searchInput');
    if (!m) return;
    m.classList.add('open');
    m.setAttribute('aria-hidden', 'false');
    if (i) { i.value = ''; runSearch(''); setTimeout(function () { i.focus(); }, 30); }
  }

  function closeSearch() {
    var m = doc.getElementById('searchModal');
    if (m) { m.classList.remove('open'); m.setAttribute('aria-hidden', 'true'); }
  }

  function initSearch() {
    var btn = doc.getElementById('searchBtn');
    var modal = doc.getElementById('searchModal');
    var input = doc.getElementById('searchInput');
    if (btn) btn.addEventListener('click', openSearch);
    if (modal) modal.addEventListener('click', function (e) { if (e.target === modal) closeSearch(); });
    if (input) input.addEventListener('input', function () { runSearch(input.value); });
    doc.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) { e.preventDefault(); openSearch(); }
      if (e.key === 'Escape') closeSearch();
    });
  }


  /* ---------- Live ClickUp Simulator ---------- */
  var SIM_STATUSES = ['To Do', 'In Progress', 'In Review', 'Complete'];
  var SIM_PEOPLE = [
    { id: 'a1', name: 'Sarah' },
    { id: 'a2', name: 'Omar' },
    { id: 'a3', name: 'Lina' }
  ];
  var SIM_DEFAULT = [
    { title: { en: 'Design launch banner (1200x628)', ar: 'تصميم بانر الإطلاق' }, st: 0, pr: 2, who: 'a1', due: 16 },
    { title: { en: 'Write announcement post', ar: 'كتابة منشور الإعلان' }, st: 0, pr: 3, who: 'a2', due: 17 },
    { title: { en: 'Record demo video', ar: 'تسجيل فيديو العرض' }, st: 1, pr: 1, who: 'a1', due: 18 },
    { title: { en: 'Prepare pricing page copy', ar: 'إعداد نص صفحة الأسعار' }, st: 1, pr: 2, who: 'a3', due: 19 },
    { title: { en: 'QA the landing page', ar: 'فحص صفحة الهبوط' }, st: 2, pr: 2, who: 'a2', due: 21 },
    { title: { en: 'Email list announcement', ar: 'بريد الإعلان للقائمة' }, st: 3, pr: 3, who: 'a3', due: 14 }
  ];
  var simState = [];
  var simSeq = 0;
  var simViewMode = 'board';
  var simTimer = null;

  function simLang() { return currentLang(); }

  function simSeed() {
    simState = SIM_DEFAULT.map(function (t, i) {
      return { id: 'sim' + (++simSeq), title: { en: t.title.en, ar: t.title.ar }, st: t.st, pr: t.pr, who: t.who, due: t.due };
    });
  }

  function simT(titleObj) { return simLang() === 'ar' ? titleObj.ar : titleObj.en; }

  function simChip(pr) {
    var map = {
      en: ['Urgent', 'High', 'Normal', 'Low'],
      ar: ['عاجل', 'مرتفع', 'عادي', 'منخفض']
    };
    var cls = ['p1', 'p2', 'p3', 'p4'][pr];
    return '<span class="sim-chip ' + cls + '">' + map[simLang()][pr] + '</span>';
  }

  function simAvatar(who) {
    var person = SIM_PEOPLE.filter(function (x) { return x.id === who; })[0] || SIM_PEOPLE[0];
    return '<span class="sim-assignee ' + person.id + '" title="' + person.name + '">' + person.name.charAt(0) + '</span>';
  }

  function simCardHTML(t) {
    return '<div class="t-title">' + simT(t.title) + '</div><div class="t-meta">' + simChip(t.pr) + simAvatar(t.who) + '</div>';
  }

  function simDoneChip() {
    return '<span class="sim-chip done">' + (simLang() === 'ar' ? 'مكتملة' : 'Done') + '</span>';
  }

  /* ----- renderers ----- */
  function renderSimSide() {
    var side = doc.getElementById('simSide');
    if (!side) return;
    var title = simLang() === 'ar' ? 'القوائم' : 'Lists';
    var lists = [
      { name: { en: 'Product Launch', ar: 'إطلاق المنتج' }, count: simState.length },
      { name: { en: 'Content Calendar', ar: 'تقويم المحتوى' }, count: 0 },
      { name: { en: 'Bugs & Fixes', ar: 'الأخطاء والإصلاحات' }, count: 0 }
    ];
    var html = '<div class="ss-title">' + title + '</div>';
    lists.forEach(function (l, i) {
      html += '<div class="sim-list-item' + (i === 0 ? ' active' : '') + '"><span class="dot" style="background:' + ['#6C4FE0', '#0e9f8a', '#d97917'][i] + '"></span>' + simT(l.name) + (i === 0 ? '<span class="count">' + l.count + '</span>' : '') + '</div>';
    });
    side.innerHTML = html;
  }

  function renderSimList() {
    var el = doc.getElementById('simViewList');
    if (!el) return;
    var head = '<div class="sim-lv-row" style="border-bottom-width:2px;font-weight:600;color:var(--ink-3);font-size:11px;letter-spacing:.06em;text-transform:uppercase;">'
      + '<span></span><span>' + (simLang() === 'ar' ? 'المهمة' : 'Task') + '</span>'
      + '<span style="text-align:end">' + (simLang() === 'ar' ? 'الأولوية' : 'Priority') + '</span>'
      + '<span style="text-align:end">' + (simLang() === 'ar' ? 'الحالة' : 'Status') + '</span></div>';
    var rows = simState.map(function (t) {
      var done = t.st === 3;
      return '<div class="sim-lv-row' + (done ? ' done' : '') + '" data-id="' + t.id + '">'
        + '<span class="lv-check" role="checkbox" aria-checked="' + done + '" tabindex="0">✓</span>'
        + '<span class="t-title">' + simT(t.title) + ' ' + simAvatar(t.who) + '</span>'
        + '<span>' + simChip(t.pr) + '</span>'
        + '<span class="lv-status">' + SIM_STATUSES[t.st] + '</span></div>';
    }).join('');
    el.innerHTML = '<div class="sim-listview">' + head + rows + '</div>';
  }

  function renderSimBoard() {
    var el = doc.getElementById('simViewBoard');
    if (!el) return;
    var cols = SIM_STATUSES.map(function (st, si) {
      var cards = simState.filter(function (t) { return t.st === si; }).map(function (t) {
        return '<div class="sim-card" draggable="true" data-id="' + t.id + '">' + simCardHTML(t) + '</div>';
      }).join('');
      return '<div class="sim-col" data-st="' + si + '">'
        + '<div class="sim-col-head"><span>' + st + '</span><span class="cc-count">' + simState.filter(function (t) { return t.st === si; }).length + '</span></div>'
        + '<div class="sim-cards">' + (cards || '') + '</div></div>';
    }).join('');
    el.innerHTML = '<div class="sim-board">' + cols + '</div>';
    wireSimDnD();
  }

  function renderSimCal() {
    var el = doc.getElementById('simViewCal');
    if (!el) return;
    var lang = simLang();
    var days = lang === 'ar' ? ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس'] : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu'];
    var month = lang === 'ar' ? 'سبتمبر 2026' : 'September 2026';
    var cells = '';
    for (var d = 14; d <= 23; d++) {
      var evs = simState.filter(function (t) { return t.due === d; });
      var isToday = d === 21;
      cells += '<div class="sim-cal-cell' + (isToday ? ' today' : '') + '"><div class="d">' + d + '</div>'
        + evs.map(function (t) {
          return '<div class="ev' + (t.st === 3 ? ' done' : '') + '">' + simT(t.title) + '</div>';
        }).join('') + '</div>';
    }
    el.innerHTML = '<div style="font-size:12.5px;font-weight:600;color:var(--ink-2);margin-bottom:8px;">' + month + '</div>'
      + '<div class="sim-cal-head">' + days.map(function (x) { return '<div>' + x + '</div>'; }).join('') + '</div>'
      + '<div class="sim-cal-grid">' + cells + '</div>';
  }

  function renderSimTable() {
    var el = doc.getElementById('simViewTable');
    if (!el) return;
    var lang = simLang();
    var th = '<tr><th>' + (lang === 'ar' ? 'المهمة' : 'Task') + '</th><th>' + (lang === 'ar' ? 'الحالة' : 'Status') + '</th><th>' + (lang === 'ar' ? 'الأولوية' : 'Priority') + '</th><th>' + (lang === 'ar' ? 'المسؤول' : 'Assignee') + '</th><th>' + (lang === 'ar' ? 'الاستحقاق' : 'Due') + '</th></tr>';
    var rows = simState.map(function (t) {
      var person = SIM_PEOPLE.filter(function (x) { return x.id === t.who; })[0];
      return '<tr><td style="color:var(--ink);font-weight:500">' + simT(t.title) + '</td><td>' + SIM_STATUSES[t.st] + '</td><td>' + simChip(t.pr) + '</td><td>' + person.name + '</td><td class="due">Sep ' + t.due + '</td></tr>';
    }).join('');
    el.innerHTML = '<table class="sim-table">' + th + rows + '</table>';
  }

  function renderSimAll() {
    renderSimSide();
    renderSimList();
    renderSimBoard();
    renderSimCal();
    renderSimTable();
  }

  /* ----- drag & drop ----- */
  var simDragged = null;

  function wireSimDnD() {
    doc.querySelectorAll('.sim-card').forEach(function (card) {
      card.addEventListener('dragstart', function () {
        simDragged = card.getAttribute('data-id');
        card.classList.add('dragging');
      });
      card.addEventListener('dragend', function () {
        card.classList.remove('dragging');
        simDragged = null;
      });
    });
    doc.querySelectorAll('.sim-col').forEach(function (col) {
      col.addEventListener('dragover', function (e) { e.preventDefault(); col.classList.add('dragover'); });
      col.addEventListener('dragleave', function () { col.classList.remove('dragover'); });
      col.addEventListener('drop', function (e) {
        e.preventDefault();
        col.classList.remove('dragover');
        if (!simDragged) return;
        var st = parseInt(col.getAttribute('data-st'), 10);
        var t = simState.filter(function (x) { return x.id === simDragged; })[0];
        if (t && t.st !== st) {
          t.st = st;
          renderSimAll();
          if (st === 3) simFireAutomation(t);
        }
      });
    });
  }

  function simFireAutomation(t) {
    var banner = doc.getElementById('simAutoBanner');
    if (!banner) {
      banner = doc.createElement('div');
      banner.className = 'sim-auto-banner hide';
      banner.id = 'simAutoBanner';
      var main = doc.querySelector('.sim-main');
      main.insertBefore(banner, main.firstChild);
    }
    var lang = simLang();
    banner.innerHTML = '<span class="ab-icon">⚡</span><span>'
      + (lang === 'ar'
        ? 'انطلقت أتمتة: «عند اكتمال المهمة، أُشعر الفريق وأُغلق المهمة تلقائيًا» على مهمة «' + simT(t.title) + '».'
        : 'Automation fired: "when a task is completed, notify the team and close it" on "' + simT(t.title) + '".')
      + '</span>';
    banner.classList.remove('hide');
    clearTimeout(simTimer);
    simTimer = setTimeout(function () { banner.classList.add('hide'); }, 6000);
  }

  /* ----- interactions ----- */
  function initSimulator() {
    var section = doc.getElementById('simulator');
    if (!section) return;
    simSeed();

    doc.querySelectorAll('#simTabs button').forEach(function (b) {
      b.addEventListener('click', function () {
        doc.querySelectorAll('#simTabs button').forEach(function (x) { x.classList.remove('active'); });
        b.classList.add('active');
        simViewMode = b.getAttribute('data-view');
        var viewIds = { list: 'simViewList', board: 'simViewBoard', calendar: 'simViewCal', table: 'simViewTable' };
        Object.keys(viewIds).forEach(function (v) {
          var el = doc.getElementById(viewIds[v]);
          if (el) el.classList.toggle('active', v === simViewMode);
        });
      });
    });

    var form = doc.getElementById('simAddForm');
    var input = doc.getElementById('simAddInput');
    if (form && input) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var val = input.value.trim();
        if (!val) return;
        simState.push({ id: 'sim' + (++simSeq), title: { en: val, ar: val }, st: 0, pr: 3, who: 'a2', due: 21 });
        input.value = '';
        renderSimAll();
      });
    }

    var listEl = doc.getElementById('simViewList');
    if (listEl) {
      listEl.addEventListener('click', function (e) {
        var chk = e.target.closest('.lv-check');
        if (!chk) return;
        var row = chk.closest('.sim-lv-row');
        var id = row.getAttribute('data-id');
        var t = simState.filter(function (x) { return x.id === id; })[0];
        if (!t) return;
        t.st = t.st === 3 ? 0 : 3;
        renderSimAll();
        if (t.st === 3) simFireAutomation(t);
      });
    }

    var resetBtn = doc.getElementById('simReset');
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        simSeed();
        var banner = doc.getElementById('simAutoBanner');
        if (banner) banner.classList.add('hide');
        renderSimAll();
      });
    }

    renderSimAll();
  }

  /* ---------- FAQ accordion ---------- */
  function initFAQ() {
    doc.querySelectorAll('.faq-q').forEach(function (q) {
      q.addEventListener('click', function () {
        var item = q.closest('.faq-item');
        var panel = item.querySelector('.faq-a');
        var isOpen = item.classList.contains('open');
        // close siblings within same group
        var group = item.parentElement;
        group.querySelectorAll('.faq-item.open').forEach(function (o) {
          o.classList.remove('open');
          var pa = o.querySelector('.faq-a');
          if (pa) pa.style.maxHeight = null;
          var ob = o.querySelector('.faq-q');
          if (ob) ob.setAttribute('aria-expanded', 'false');
        });
        if (!isOpen) {
          item.classList.add('open');
          panel.style.maxHeight = panel.scrollHeight + 'px';
          q.setAttribute('aria-expanded', 'true');
        }
      });
    });
  }

  /* ---------- Reveal on scroll ---------- */
  function initReveal() {
    var els = doc.querySelectorAll('.section, .stats-band');
    if (!('IntersectionObserver' in window)) {
      els.forEach(function (e) { e.classList.add('in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    els.forEach(function (e) { io.observe(e); });
  }

  /* ---------- Footer year ---------- */
  function initYear() {
    doc.querySelectorAll('[data-year]').forEach(function (el) {
      el.textContent = new Date().getFullYear();
    });
  }

  /* ---------- Boot ---------- */
  function boot() {
    initLang();
    initHeader();
    initTOC();
    initDrawer();
    initGlossary();
    initSearch();
    initSimulator();
    initFAQ();
    initReveal();
    initYear();
  }

  if (doc.readyState === 'loading') {
    doc.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
