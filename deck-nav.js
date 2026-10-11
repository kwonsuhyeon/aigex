/* =====================================================================
   deck-nav.js — 슬라이드 덱용 하단 내비게이션 바 (CSS 포함, 단일 파일)
   ---------------------------------------------------------------------
   기능
   - 진행 바 + 섹션 점: 점 클릭 → 해당 섹션 첫 슬라이드로 이동
   - 번호 입력 후 Enter → 바로 이동, ‹ › 버튼, 📌 고정
   - 기본 숨김. 마우스를 화면 하단으로 내리면 표시, 벗어나면 1초 뒤 숨김
   - 인쇄(PDF)에는 나오지 않음

   사용법 (자세한 설명은 README.md)
   1) 슬라이드 <section class="slide">에 data-nav="표시 이름" 을 붙인다.
      (섹션 시작 슬라이드에만. 없는 슬라이드는 앞 섹션에 포함)
   2) 슬라이드 컨트롤러 스크립트 아래에 한 줄:
      <script src="deck-nav/deck-nav.js"></script>
      컨트롤러는 전역 deck 객체에 show(n)/prev()/next()/i/slides 가 있어야 한다.
      (AI협업_평가지원서비스_착수보고.html / BuildWork_Profile 의 SlidePresentation 과 동일 구조)

   옵션 (스크립트 로드 전에 window.DECK_NAV = {...} 로 지정)
     deck      : 컨트롤러 객체 (기본 window.deck)
     sections  : [['이름', 시작번호(1-based)], ...]  → 지정 시 data-nav 대신 사용
     hideDelay : 숨김 지연 ms (기본 1000)
     accent    : 강조색 (기본 CSS 변수 --teal-bright, 없으면 #14A0A0)
     bg        : 바 배경색 (기본 rgba(6,20,40,.92))
     font      : 폰트 (기본 CSS 변수 --font, 없으면 시스템 sans-serif)
   ===================================================================== */
(function(){
  const opt=Object.assign({hideDelay:1000},window.DECK_NAV||{});
  const D=opt.deck||window.deck||(typeof deck!=='undefined'?deck:null);  // const/let로 선언된 전역 deck도 인식
  if(!D||!D.slides||typeof D.show!=='function'){console.warn('[deck-nav] 전역 deck 컨트롤러를 찾지 못했습니다.');return;}

  /* ---------- 섹션 목록 ---------- */
  let sections=opt.sections;
  if(!sections){
    sections=[];
    D.slides.forEach((s,k)=>{if(s.dataset.nav)sections.push([s.dataset.nav,k+1]);});
    if(!sections.length){sections=D.slides.map((s,k)=>[String(k+1),k+1]);}
  }

  /* ---------- 스타일 ---------- */
  const accent=opt.accent||'var(--teal-bright,#14A0A0)';
  const bg=opt.bg||'rgba(6,20,40,.92)';
  const font=opt.font||"var(--font,'Pretendard','Noto Sans KR',sans-serif)";
  const css=`
.dn-bar{position:fixed;left:0;right:0;bottom:0;z-index:900;font-family:${font};transform:translateY(100%);transition:transform .35s cubic-bezier(.16,1,.3,1);pointer-events:none}
.dn-bar.show{transform:none;pointer-events:auto}
.dn-hot{position:fixed;left:0;right:0;bottom:0;height:56px;z-index:899}
.dn-bar .dn-prog{height:4px;background:rgba(255,255,255,.15)}
.dn-bar .dn-prog i{display:block;height:100%;width:0;background:${accent};transition:width .4s cubic-bezier(.16,1,.3,1)}
.dn-bar .dn-in{display:flex;align-items:center;gap:6px;padding:10px 24px 14px;background:${bg};backdrop-filter:blur(8px);border-top:1px solid rgba(255,255,255,.08)}
.dn-bar .dn-secs{display:flex;flex:1;justify-content:center;gap:4px;overflow-x:auto}
.dn-bar .dn-sec{display:flex;flex-direction:column;align-items:center;gap:6px;padding:6px 14px;border-radius:10px;cursor:pointer;color:rgba(255,255,255,.55);font-size:13px;white-space:nowrap;border:none;background:none;font-family:inherit;transition:color .2s,background .2s}
.dn-bar .dn-sec::before{content:"";width:10px;height:10px;border-radius:50%;background:rgba(255,255,255,.3);transition:background .2s,transform .2s}
.dn-bar .dn-sec:hover{color:#fff;background:rgba(255,255,255,.08)}
.dn-bar .dn-sec.on{color:#fff;font-weight:700}
.dn-bar .dn-sec.on::before{background:${accent};transform:scale(1.3);box-shadow:0 0 0 4px rgba(255,255,255,.15)}
.dn-bar .dn-sec.done::before{background:${accent};opacity:.55}
.dn-bar .dn-count{color:rgba(255,255,255,.7);font-size:13px;letter-spacing:.05em;min-width:64px;text-align:right}
.dn-bar .dn-count input{width:38px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);border-radius:6px;color:#fff;font:inherit;text-align:center;padding:3px 0;outline:none}
.dn-bar .dn-arrow{background:none;border:1px solid rgba(255,255,255,.2);color:#fff;border-radius:8px;width:34px;height:34px;cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center;font-family:inherit}
.dn-bar .dn-arrow:hover{background:rgba(255,255,255,.12)}
.dn-bar .dn-pin{background:none;border:none;color:rgba(255,255,255,.5);cursor:pointer;font-size:14px;width:30px;height:30px;border-radius:6px;margin-left:8px}
.dn-bar .dn-pin.on{color:${accent};background:rgba(255,255,255,.08)}
.dn-bar .dn-pin:hover{color:#fff}
@media print{.dn-bar,.dn-hot{display:none!important}}`;
  const style=document.createElement('style');style.textContent=css;document.head.appendChild(style);

  /* ---------- DOM ---------- */
  const hot=document.createElement('div');hot.className='dn-hot';
  const bar=document.createElement('nav');bar.className='dn-bar';bar.setAttribute('aria-label','슬라이드 이동');
  bar.innerHTML=`<div class="dn-prog"><i></i></div>
<div class="dn-in">
  <button class="dn-arrow dn-prev" title="이전 (←)">&lsaquo;</button>
  <div class="dn-secs"></div>
  <button class="dn-arrow dn-next" title="다음 (→)">&rsaquo;</button>
  <div class="dn-count"><input type="text" inputmode="numeric" title="번호 입력 후 Enter"> / <span class="dn-total"></span></div>
  <button class="dn-pin" title="바 고정/해제">&#128204;</button>
</div>`;
  document.body.appendChild(hot);document.body.appendChild(bar);

  const $=sel=>bar.querySelector(sel);
  const prog=$('.dn-prog i'),secs=$('.dn-secs'),input=$('.dn-count input'),pin=$('.dn-pin');
  $('.dn-total').textContent=D.slides.length;
  sections.forEach(([name,start])=>{
    const b=document.createElement('button');b.className='dn-sec';b.textContent=name;
    b.addEventListener('click',()=>D.show(start-1));secs.appendChild(b);
  });

  /* ---------- 표시/숨김 ---------- */
  let pinned=false,timer=null;
  const reveal=stay=>{bar.classList.add('show');clearTimeout(timer);if(!stay)hideLater();};
  const hideLater=()=>{clearTimeout(timer);if(pinned)return;
    timer=setTimeout(()=>{if(!bar.matches(':hover')&&document.activeElement!==input)bar.classList.remove('show');},opt.hideDelay);};
  hot.addEventListener('mouseenter',()=>reveal());
  bar.addEventListener('mouseenter',()=>reveal(true));
  bar.addEventListener('mouseleave',()=>hideLater());
  pin.addEventListener('click',()=>{pinned=!pinned;pin.classList.toggle('on',pinned);pinned?reveal(true):hideLater();});

  /* ---------- 조작 ---------- */
  $('.dn-prev').addEventListener('click',()=>D.prev());
  $('.dn-next').addEventListener('click',()=>D.next());
  input.addEventListener('focus',()=>input.select());
  input.addEventListener('keydown',e=>{e.stopPropagation();
    if(e.key==='Enter'){const n=parseInt(input.value,10);if(!isNaN(n))D.show(n-1);input.blur();}
    if(e.key==='Escape')input.blur();});

  /* ---------- 상태 갱신 ---------- */
  const update=()=>{
    const i=D.i,n=D.slides.length;
    prog.style.width=((i+1)/n*100)+'%';
    if(document.activeElement!==input)input.value=i+1;
    let cur=-1;sections.forEach(([,st],k)=>{if(i+1>=st)cur=k;});
    [...secs.children].forEach((b,k)=>{b.classList.toggle('on',k===cur);b.classList.toggle('done',k<cur);});
  };
  const _show=D.show.bind(D);D.show=n=>{_show(n);update();};
  update();
  window.deckNav={reveal,hide:()=>bar.classList.remove('show'),update,sections};
})();
