fetch('https://plantayraiz.com.br').then(r=>r.text()).then(html=>{
  const match = html.match(/src="(\/assets\/index-[^"]+\.js)"/);
  if(match) {
    fetch('https://plantayraiz.com.br'+match[1]).then(r=>r.text()).then(js=>{
      console.log(js.includes('tkxxoghzhvhjzdoomgss') ? 'OLD DB (tkxxoghzhvhjzdoomgss)' : 'Not Old');
      console.log(js.includes('shmbwdjuddvquszwkvuq') ? 'NEW DB (shmbwdjuddvquszwkvuq)' : 'Not New');
    });
  } else { console.log('no match'); }
});
