(function(){
  const btn = document.getElementById('whoami');
  const panel = document.getElementById('whoami-panel');
  const close = panel.querySelector('.close-btn');

  function setOpen(open){
    panel.classList.toggle('open', open);
    panel.setAttribute('aria-hidden', !open);
    // lock scrolling when panel is closed
    document.body.classList.toggle('panel-locked', !open);
  }

  // initialize body lock based on initial panel state
  setOpen(!panel.hasAttribute('aria-hidden') || panel.getAttribute('aria-hidden') === 'false');

  btn.addEventListener('click', ()=> setOpen(!panel.classList.contains('open')));
  close.addEventListener('click', ()=> setOpen(false));

  // close when clicking outside panel
  document.addEventListener('click', (e)=>{
    if (!panel.classList.contains('open')) return;
    if (panel.contains(e.target) || btn.contains(e.target)) return;
    setOpen(false);
  });
})();
