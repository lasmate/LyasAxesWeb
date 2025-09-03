// Simple i18n runtime for this site.
// Usage:
// - Mark translatable elements with data-i18n="key".
// - Provide translations in scripts/translations.js as window.TRANSLATIONS = { lang: { key: value } }
// - This script inserts a visible toggle button (top-right) which cycles languages.

(function(){
	const LS_KEY = 'site_lang';
	const DEFAULT = document.documentElement.lang || 'en';

	// build available languages from translations + default
	function getAvailable(){
		const langs = new Set([DEFAULT]);
		if(window.TRANSLATIONS) Object.keys(window.TRANSLATIONS).forEach(l=>langs.add(l));
		return Array.from(langs);
	}

	function getTranslations(lang){
		return (window.TRANSLATIONS && window.TRANSLATIONS[lang]) || {};
	}

	// store originals so we can restore when switching back to DEFAULT
	const ORIGINALS = new WeakMap();

	function captureOriginals(){
		document.querySelectorAll('[data-i18n], [data-i18n-html]').forEach(el=>{
			if(ORIGINALS.has(el)) return;
			ORIGINALS.set(el, {
				html: el.innerHTML,
				// capture first text node value if present
				firstTextNode: (function(){
					for(const n of el.childNodes){
						if(n.nodeType === Node.TEXT_NODE) return n.nodeValue;
					}
					return null;
				})()
			});
		});
	}

	function getFirstTextNode(el){
		for(const n of el.childNodes){
			if(n.nodeType === Node.TEXT_NODE) return n;
		}
		return null;
	}

	function translateElement(el, lang){
		const map = getTranslations(lang);
	// allow either data-i18n (plain text) or data-i18n-html (html content) as the key source
	const key = el.getAttribute('data-i18n') || el.getAttribute('data-i18n-html');
		if(!key) return;
		const val = map[key];

		// If a translation exists for this key -> apply it
		if(typeof val === 'string'){
			if(el.hasAttribute('data-i18n-html')){
				el.innerHTML = val;
			} else if(el.children && el.children.length > 0){
				// preserve child elements (links); only replace first text node
				const tnode = getFirstTextNode(el);
				if(tnode) tnode.nodeValue = val;
				else el.insertBefore(document.createTextNode(val), el.firstChild);
			} else {
				el.textContent = val;
			}
			return;
		}

		// No translation for target language: if lang === DEFAULT restore original content
		if(lang === DEFAULT){
			const orig = ORIGINALS.get(el);
			if(!orig) return;
			if(el.hasAttribute('data-i18n-html')){
				el.innerHTML = orig.html;
			} else if(el.children && el.children.length > 0){
				const tnode = getFirstTextNode(el);
				if(tnode && orig.firstTextNode !== null) tnode.nodeValue = orig.firstTextNode;
				else if(orig.html) el.innerHTML = orig.html; // fallback
			} else {
				if(orig.firstTextNode !== null) el.textContent = orig.firstTextNode;
				else if(orig.html) el.innerHTML = orig.html;
			}
		}
	}

	function translatePage(lang){
		document.querySelectorAll('[data-i18n], [data-i18n-html]').forEach(el=> translateElement(el, lang));
		document.documentElement.lang = lang;
	}

	function setLang(lang){
		if(!lang) return;
		localStorage.setItem(LS_KEY, lang);
		translatePage(lang);
		// update select if present
		const sel = document.getElementById('lang-select');
		if(sel) sel.value = lang;
	}

	function getLang(){
		const stored = localStorage.getItem(LS_KEY);
		if(stored) return stored;
		return DEFAULT;
	}

	function createDropdown(){
		if(document.getElementById('lang-select')) return;
		const wrap = document.createElement('div');
		wrap.id = 'lang-toggle-wrapper';
		wrap.style.position = 'fixed';
		wrap.style.top = '12px';
		wrap.style.right = '12px';
		wrap.style.zIndex = 999999;

		const sel = document.createElement('select');
		sel.id = 'lang-select';
		sel.setAttribute('aria-label','Language selector');
		sel.style.padding = '6px 8px';
		sel.style.borderRadius = '6px';
		sel.style.background = 'rgba(0,0,0,0.6)';
		sel.style.color = '#fff';
		sel.style.border = '1px solid rgba(255,255,255,0.12)';
		sel.style.fontSize = '14px';

		const langs = getAvailable();
		langs.forEach(l=>{
			const opt = document.createElement('option');
			opt.value = l;
			opt.textContent = l.toUpperCase();
			sel.appendChild(opt);
		});

		sel.value = getLang();
		sel.addEventListener('change', ()=> setLang(sel.value));

		wrap.appendChild(sel);
		document.body.appendChild(wrap);
	}

	function init(){
		if(!window.TRANSLATIONS) window.TRANSLATIONS = {};
		captureOriginals();
		const lang = getLang();
		translatePage(lang);
		createDropdown();
	}

	if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
	else init();

	// expose small API
	window.i18n = { setLang, getLang, translatePage };

})();

