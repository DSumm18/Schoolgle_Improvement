import {bindDemoControls,isDemo} from './demo-session.js';
bindDemoControls();
const params = new URLSearchParams(location.search);
const game = params.get('game');
try {
  if(params.get('view')==='example'){
    await import('./example-record.js');
  } else if (game === 'nile' || (!game && params.get('view') === 'teachers')) {
    document.title = 'Nile Quest · Schoolgle Worlds';
    await import('./main.js');
    const home = document.querySelector('.brand');
    if (home) { home.href = isDemo()?'?demo=1':'./index.html'; home.onclick = null; home.title = 'Choose another adventure — your progress stays saved'; }
  } else if (game === 'plot') {
    await import('./plot.js');
  } else if (game === 'fire') {
    await import('./fire.js');
  } else {
    await import('./portal.js');
  }
  if(isDemo()){
    document.title = 'Alex (fictional pupil) · '+document.title;
    const label=document.querySelector('.top-caption,.plot-title,.library-note');
    if(label)label.textContent='ALEX · FICTIONAL TEST PUPIL · SEPARATE SAVE';
    document.querySelectorAll('a[href="./index.html"]').forEach(a=>a.href='?demo=1');
    document.querySelectorAll('a[href^="?game="]').forEach(a=>{const u=new URL(a.href);u.searchParams.set('demo','1');a.href=u.href;});
  }
} catch (error) {
  console.error(error);
  document.querySelector('#app').innerHTML = '<main style="padding:3rem;font:20px system-ui"><h1>The adventure could not load</h1><p>Your saved discoveries have not been cleared. Please reload to try again.</p><a href="./index.html">Choose an adventure</a></main>';
}
