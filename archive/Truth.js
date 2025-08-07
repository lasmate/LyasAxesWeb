const cover = document.getElementById('cover')
const filling = document.getElementById('filling')

window.addEventListener('scroll', () => {
  let scrollY = window.scrollY
  let bottomHeight = window.innerHeight
  
  if(scrollY / bottomHeight <= 1){
    one.style.opacity = 1 - ( scrollY / bottomHeight )
    cover.style.position = 'fixed'
    filling.style.display = 'none'
  }
  else{
    cover.style.position = null
    filling.style.display = 'block'
  }
})