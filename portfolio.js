(() => {
  let content = JSON.parse(document.getElementById('page-content').textContent);
  let language = 'zh';

  function setLang(lang) {
    if (!['zh', 'en'].includes(lang)) return;
    language = lang;
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
    try { localStorage.setItem('portfolio-language', lang); } catch {}
    document.querySelectorAll('[data-copy]').forEach(element => {
      element.textContent = content[element.dataset.copy][lang];
    });
    document.querySelectorAll('[id^="lang-"]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.id === `lang-${lang}`));
    });
    document.dispatchEvent(new CustomEvent('portfolio:language', { detail: lang }));
  }

  window.setLang = setLang;
  window.portfolio = {
    get content() { return content; },
    get language() { return language; },
    replaceContent(next) { content = next; setLang(language); },
  };
  let preferred = 'zh';
  try { preferred = localStorage.getItem('portfolio-language') || 'zh'; } catch {}
  setLang(['zh', 'en'].includes(preferred) ? preferred : 'zh');
})();
