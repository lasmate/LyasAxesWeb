// Simple i18n runtime for this site.
// Usage:
// - Mark translatable elements with data-i18n="key".
// - Provide translations in scripts/translations.js as window.TRANSLATIONS = { lang: { key: value } }
// - This script inserts a visible toggle button (top-right) which cycles languages.

(function(){
	const LS_KEY = 'site_lang';
	const DEFAULT = document.documentElement.lang || 'en';
	const AVAILABLE = ['en', 'fr']; // extendable

	function getTranslations(lang){
		return (window.TRANSLATIONS && window.TRANSLATIONS[lang]) || {};
	}

	function translatePage(lang){
		const map = getTranslations(lang);
		document.querySelectorAll('[data-i18n]').forEach(el => {
			const key = el.getAttribute('data-i18n');
			if(!key) return;
			const val = map[key];
			if(typeof val === 'string'){
				if(el.hasAttribute('data-i18n-html')) el.innerHTML = val;
				else el.textContent = val;
			}
		});
		document.documentElement.lang = lang;
	}

	function setLang(lang){
		if(!lang) return;
		localStorage.setItem(LS_KEY, lang);
		translatePage(lang);
	}

	function getLang(){
		const stored = localStorage.getItem(LS_KEY);
		if(stored) return stored;
		return DEFAULT;
	}

		function createButton(){
			if(document.getElementById('lang-toggle-wrapper')) return;
			const wrap = document.createElement('div');
			wrap.id = 'lang-toggle-wrapper';
			wrap.style.position = 'fixed';
			wrap.style.top = '12px';
			wrap.style.right = '12px';
			wrap.style.zIndex = 999999;
			wrap.style.display = 'flex';
			wrap.style.gap = '6px';
			wrap.style.alignItems = 'center';

			function makeLangBtn(code){
				const b = document.createElement('button');
				b.type = 'button';
				b.className = 'lang-toggle-btn';
				b.dataset.lang = code;
				b.textContent = code.toUpperCase();
				b.style.padding = '6px 8px';
				b.style.borderRadius = '6px';
				b.style.border = '1px solid rgba(255,255,255,0.12)';
				b.style.background = 'rgba(0,0,0,0.45)';
				b.style.color = '#fff';
				b.style.cursor = 'pointer';
				b.style.fontSize = '13px';
				b.addEventListener('click', ()=>{
					setLang(code);
					updateActive();
				});
				return b;
			}

			const btns = AVAILABLE.map(makeLangBtn);
			btns.forEach(b=> wrap.appendChild(b));

			function updateActive(){
				const cur = getLang();
				wrap.querySelectorAll('.lang-toggle-btn').forEach(b=>{
					if(b.dataset.lang === cur){
						b.style.background = '#fff';
						b.style.color = '#000';
						b.style.fontWeight = '700';
					} else {
						b.style.background = 'rgba(0,0,0,0.45)';
						b.style.color = '#fff';
						b.style.fontWeight = '400';
					}
				});
			}

			document.body.appendChild(wrap);
			updateActive();
		}

	function init(){
		// ensure translations object exists
		if(!window.TRANSLATIONS) window.TRANSLATIONS = {};
		const lang = getLang();
		translatePage(lang);
		createButton();
	}

	if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
	else init();

	// expose small API
	window.i18n = { setLang, getLang, translatePage };

})();

