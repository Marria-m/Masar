(function(){
'use strict';
var view=document.getElementById('view'), nav=document.getElementById('nav'), shell=document.querySelector('.shell');
try{ document.documentElement.lang='ar'; document.documentElement.dir='rtl'; }catch(e){}

/* ---------- saved progress ---------- */
var KEY='masar-v2';
var ST={name:'بطل',avatar:'🦁',stars:0,done:{},seen:{},sound:true};
try{ var raw=localStorage.getItem(KEY); if(raw){ var p=JSON.parse(raw); for(var k in p) ST[k]=p[k]; } }catch(e){}
function save(){ try{ localStorage.setItem(KEY,JSON.stringify(ST)); }catch(e){} }

/* ---------- helpers ---------- */
var timers=[];
function later(fn,ms){ timers.push(setTimeout(fn,ms)); }
function clearTimers(){ timers.forEach(clearTimeout); timers=[]; }
function shuffle(a){ a=a.slice(); for(var i=a.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)); var t=a[i]; a[i]=a[j]; a[j]=t; } return a; }
function rnd(a){ return a[Math.floor(Math.random()*a.length)]; }
function range(a,b){ var r=[]; for(var i=a;i<=b;i++) r.push(i); return r; }
function pickUnused(arr,S){ var av=arr.filter(function(x){ return S.used.indexOf(x)<0; }); if(!av.length) av=arr; var x=rnd(av); S.used.push(x); return x; }
function $(id){ return document.getElementById(id); }
function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function fmt(sec){ var m=Math.floor(sec/60), s=Math.floor(sec%60); return m+':'+(s<10?'0':'')+s; }

/* ---------- speech: the device's Arabic voice stands in for recorded audio ---------- */
var ttsOk=('speechSynthesis' in window)&&('SpeechSynthesisUtterance' in window), voice=null;
function pickVoice(){ try{ var vs=speechSynthesis.getVoices(); voice=vs.filter(function(v){return /^ar-EG/i.test(v.lang);})[0]||vs.filter(function(v){return /^ar/i.test(v.lang);})[0]||null; }catch(e){} }
if(ttsOk){ pickVoice(); try{ speechSynthesis.onvoiceschanged=pickVoice; }catch(e){} }
function stopSay(){ try{ if(ttsOk) speechSynthesis.cancel(); }catch(e){} }
function say(text){
  if(!ttsOk||!text||!ST.sound) return;
  try{
    speechSynthesis.cancel();
    var u=new SpeechSynthesisUtterance(text);
    u.lang=voice?voice.lang:'ar-EG'; if(voice) u.voice=voice;
    u.rate=0.75; u.pitch=1.05;
    speechSynthesis.speak(u);
  }catch(e){}
}
function voiceNote(){
  var msg='الصوت بيشتغل بعد أول ضغطة. ارفع صوت التليفون.';
  try{
    if(!ttsOk) msg='الصوت مش متاح على المتصفح ده، بس كل الشرح مكتوب قدامك.';
    else{ var vs=speechSynthesis.getVoices(); if(vs.length&&!voice) msg='التليفون ده مفيهوش صوت عربي، بس كل الشرح مكتوب قدامك.'; }
  }catch(e){}
  return '<p class="hint">🔊 '+msg+'</p>';
}

/* ---------- concepts ---------- */
var CONCEPTS={

numbers:{domain:'math',title:'الأعداد من 1 إلى 10',sub:'نتعرف على شكل الرقم واسمه',icon:'🔢',rounds:5,
  idea:'يتعرف الطفل على شكل الرقم واسمه من خلال عرضه بحجم كبير، مع سماع اسمه عند الضغط عليه.',
  goal:'أن يتعرف الطفل على الأرقام من 1 إلى 10 ويميز شكل الرقم عند عرضه.',
  explain:function(root){
    var cur=0;
    function draw(){
      var t=cur?numTone(cur):'blue';
      root.innerHTML='<div class="stage tone-'+t+'">'+(cur
        ?'<div class="bignum">'+cur+'</div><div class="cap">ده رقم '+NUM[cur]+'</div><div class="dotsrow" aria-hidden="true">'+'<span class="dot"></span>'.repeat(cur)+'</div><button class="listen" data-say="ده رقم '+NUM[cur]+'">🔊 اسمع تاني</button>'
        :'<div class="prompt">اضغط على أي رقم</div><div class="bignum faint">؟</div>')+'</div>'+
        '<div class="numgrid">'+range(1,10).map(function(n){ return '<button class="numbtn tone-'+numTone(n)+(n===cur?' on':'')+'" data-n="'+n+'">'+n+'</button>'; }).join('')+'</div>';
    }
    root.onclick=function(e){ var b=e.target.closest('[data-n]'); if(!b) return; cur=+b.dataset.n; draw(); say(NUM[cur]); };
    draw();
  },
  frames:function(){ return range(1,10).map(function(n){ return {big:n,num:1,cap:'رقم '+NUM[n],sub:'●'.repeat(n),say:'ده رقم '+NUM[n]}; }); },
  make:function(S){
    var t=pickUnused(range(1,10),S);
    var others=shuffle(range(1,10).filter(function(x){return x!==t;})).slice(0,S.n-1);
    return {prompt:'أين الرقم '+t+'؟',say:'أين الرقم '+NUM[t]+'؟',correct:t,options:shuffle([t].concat(others)).map(function(x){return {k:x,v:x};})};
  }
},

quantity:{domain:'math',title:'الكميات وربط الرقم بالعدد',sub:'نعد الأشياء ونعرف رقمها',icon:'🍎',rounds:5,
  idea:'يتعلم الطفل أن الرقم يمثل كمية محددة من الأشياء، من خلال العد البصري وربط المجموعة بالرقم المناسب.',
  goal:'أن يربط الطفل بين العدد المكتوب والكمية التي يمثلها.',
  explain:function(root){
    var n=5,counted=0,busy=false;
    function draw(){
      root.innerHTML='<div class="stage"><div class="apples">'+range(1,n).map(function(i){ return '<span class="apple'+(i<=counted?' counted':'')+'">🍎<i>'+(i<=counted?i:'')+'</i></span>'; }).join('')+'</div>'+
        (counted===n?'<div class="bignum">'+n+'</div><div class="cap">'+APL(n)+'</div>':'<div class="prompt">اضغط وعدّ معانا</div>')+
        '<button class="listen" data-count="1">🔊 عدّ معايا</button></div>'+
        '<div class="chips">'+[2,3,4,5,6,7].map(function(k){ return '<button class="chip'+(k===n?' on':'')+'" data-q="'+k+'" aria-label="'+k+' تفاحات">'+k+'</button>'; }).join('')+'</div>';
    }
    root.onclick=function(e){
      var q=e.target.closest('[data-q]');
      if(q){ clearTimers(); stopSay(); busy=false; n=+q.dataset.q; counted=0; draw(); return; }
      if(e.target.closest('[data-count]')){
        if(busy) return; busy=true; counted=0; draw();
        range(1,n).forEach(function(i){ later(function(){ counted=i; draw(); say(NUM[i]); if(i===n){ later(function(){ busy=false; say(APL(n)); },900); } },800*i); });
      }
    };
    draw();
  },
  frames:function(){ return range(1,5).map(function(n){ return {big:'🍎'.repeat(n),multi:n>1,cap:String(n),sub:APL(n),say:APL(n)}; }); },
  make:function(S){
    var t=pickUnused(range(1,9),S);
    var near=[t-2,t-1,t+1,t+2].filter(function(x){return x>=1&&x<=10;});
    var others=shuffle(near).slice(0,S.n-1);
    return {prompt:'كم تفاحة أمامك؟',say:'كم تفاحة أمامك؟',correct:t,
      stage:'<div class="apples">'+'<span class="apple">🍎</span>'.repeat(t)+'</div>',
      options:shuffle([t].concat(others)).map(function(x){return {k:x,v:x};})};
  }
},

living:{domain:'science',title:'الكائنات الحية',sub:'إنسان وحيوان ونبات',icon:'🌱',rounds:4,
  idea:'يتعرف الطفل على الكائنات الحية من خلال صور الإنسان والحيوان والنبات، ويميزها عن الأشياء غير الحية.',
  goal:'أن يميز الطفل أمثلة للكائنات الحية من الأشياء غير الحية.',
  explain:function(root){
    function tile(x,live){ return '<button class="tile'+(live?' live':'')+'" data-live="'+(live?1:0)+'" data-n="'+x.n+'"><span class="te">'+x.e+'</span><span class="tn">'+x.n+'</span><small>'+x.k+'</small></button>'; }
    root.innerHTML='<div class="stage"><div class="prompt">الإنسان والحيوان والنبات كائنات حية</div><button class="listen" data-say="الإنسان والحيوان والنبات كائنات حية">🔊 اسمع</button></div>'+
      '<h2 class="gh good">كائنات حية</h2><div class="tiles">'+LIVING.map(function(x){return tile(x,true);}).join('')+'</div>'+
      '<h2 class="gh">أشياء غير حية</h2><div class="tiles">'+NONLIVING.map(function(x){return tile(x,false);}).join('')+'</div>';
    root.onclick=function(e){
      var b=e.target.closest('[data-n]'); if(!b) return;
      root.querySelectorAll('.tile').forEach(function(t){ t.classList.remove('on'); });
      b.classList.add('on');
      say(b.dataset.n+(b.dataset.live==='1'?' كائن حي':' ليس كائنا حيا'));
    };
  },
  frames:function(){ return LIVING.map(function(x){ return {big:x.e,cap:x.n,sub:'كائن حي'+(x.k?' · '+x.k:''),say:x.n+' كائن حي'}; }).concat([{big:'⚽',cap:'الكرة',sub:'ليست كائنا حيا',say:'الكرة ليست كائنا حيا'}]); },
  make:function(S){
    var l=pickUnused(LIVING,S);
    var others=shuffle(NONLIVING).slice(0,S.n-1);
    return {prompt:'اختار الكائن الحي',say:'اختر الكائن الحي',correct:l.n,options:shuffle([l].concat(others)).map(function(x){return {k:x.n,v:x.e,l:x.n};})};
  }
},

senses:{domain:'science',title:'الحواس الخمس',sub:'كل حاسة وعضوها',icon:'👀',rounds:5,
  idea:'يتعرف الطفل على الحواس الخمس وأعضاء الجسم المرتبطة بها، مع توضيح وظيفة كل حاسة بمثال مألوف.',
  goal:'أن يربط الطفل كل حاسة بالعضو ووظيفته الأساسية.',
  explain:function(root){
    root.innerHTML='<div class="srows">'+SENSES.map(function(s,i){
      return '<button class="srow" data-i="'+i+'"><span class="semo">'+s.e+'</span><span class="stext"><b>'+s.s+'</b><small>'+s.o+' · '+s.v+'</small><em hidden>'+s.ex+'</em></span><span aria-hidden="true">🔊</span></button>';
    }).join('')+'</div>';
    root.onclick=function(e){
      var b=e.target.closest('[data-i]'); if(!b) return;
      root.querySelectorAll('.srow').forEach(function(r){ r.classList.remove('on'); r.querySelector('em').hidden=true; });
      b.classList.add('on'); b.querySelector('em').hidden=false;
      var s=SENSES[+b.dataset.i]; say(s.s+'. '+s.o+'. '+s.v+'. '+s.ex);
    };
  },
  frames:function(){ return SENSES.map(function(s){ return {big:s.e,cap:s.s,sub:s.o+' · '+s.v,say:s.s+'. '+s.o+'. '+s.ex}; }); },
  make:function(S){
    var s=pickUnused(SENSES,S);
    var others=shuffle(SENSES.filter(function(x){return x!==s;})).slice(0,S.n-1);
    return {prompt:s.q,say:s.q,correct:s.o,options:shuffle([s].concat(others)).map(function(x){return {k:x.o,v:x.e,l:x.o};})};
  }
},

hygiene:{domain:'life',title:'النظافة الشخصية',sub:'أدوات النظافة وغسل اليدين',icon:'🧼',rounds:4,
  idea:'يتعرف الطفل على أدوات النظافة الشخصية واستخداماتها، ويتدرب على بعض العادات اليومية المناسبة.',
  goal:'أن يتعرف الطفل على أدوات النظافة واستخداماتها اليومية.',
  explain:function(root){
    root.innerHTML='<div class="stage tone-orange" id="hcap"><div class="prompt">اضغط على أي أداة</div></div>'+
      '<div class="tiles">'+HYG.map(function(t){ return '<button class="tile" data-h="'+t.id+'"><span class="te">'+t.e+'</span><span class="tn">'+t.n+'</span></button>'; }).join('')+'</div>'+
      '<h2 class="gh">خطوات غسل اليدين</h2>'+
      '<ol class="steps">'+HSTEPS.map(function(s,i){ return '<li><span class="sn">'+(i+1)+'</span><span class="se">'+s.e+'</span><span>'+s.t+'</span></li>'; }).join('')+'</ol>'+
      '<button class="listen wide" data-say="'+HSTEPS.map(function(s){return s.t;}).join('. ')+'">🔊 اسمع الخطوات</button>';
    root.onclick=function(e){
      var b=e.target.closest('[data-h]'); if(!b) return;
      var t=HYG.filter(function(x){return x.id===b.dataset.h;})[0];
      root.querySelectorAll('.tile').forEach(function(x){ x.classList.remove('on'); });
      b.classList.add('on');
      $('hcap').innerHTML='<div class="te big">'+t.e+'</div><div class="cap">'+t.n+'</div><div class="prompt">'+t.use+'</div>';
      say(t.n+'. '+t.use);
    };
  },
  frames:function(){ return HSTEPS.map(function(s,i){ return {big:s.e,cap:s.t,sub:'الخطوة '+(i+1)+' من '+HSTEPS.length,say:s.t}; }); },
  make:function(S){
    if(!S.order) S.order=shuffle(HYG);
    var t=S.order[S.i];
    var others=shuffle(HYG.filter(function(x){return x!==t;})).slice(0,S.n-1);
    return {prompt:t.q,say:t.q,correct:t.id,options:shuffle([t].concat(others)).map(function(x){return {k:x.id,v:x.e,l:x.n};})};
  }
},

food:{domain:'life',title:'الطعام والشراب',sub:'نفرق بين ما نأكله وما نشربه',icon:'🍽️',rounds:5,
  idea:'يميز الطفل بين بعض أنواع الطعام والشراب، ويتعرف على أمثلة لعادات تناول صحية.',
  goal:'أن يصنف الطفل أمثلة مألوفة إلى طعام وشراب.',
  explain:function(root){
    function tile(x){ return '<button class="tile" data-n="'+x.n+'"><span class="te">'+x.e+'</span><span class="tn">'+x.n+'</span></button>'; }
    root.innerHTML='<div class="stage"><div class="prompt">الطعام نأكله، والشراب نشربه</div><button class="listen" data-say="الطعام نأكله. والشراب نشربه">🔊 اسمع</button></div>'+
      '<h2 class="gh">طعام نأكله</h2><div class="tiles">'+FOODS.map(tile).join('')+'</div>'+
      '<h2 class="gh">شراب نشربه</h2><div class="tiles">'+DRINKS.map(tile).join('')+'</div>';
    root.onclick=function(e){
      var b=e.target.closest('[data-n]'); if(!b) return;
      root.querySelectorAll('.tile').forEach(function(t){ t.classList.remove('on'); });
      b.classList.add('on'); say(b.dataset.n);
    };
  },
  frames:function(){ return FOODS.concat(DRINKS).map(function(x){ return {big:x.e,cap:x.n,sub:x.t==='food'?'طعام نأكله':'شراب نشربه',say:x.n+(x.t==='food'?'. طعام نأكله':'. شراب نشربه')}; }); },
  make:function(S){
    if(!S.order) S.order=shuffle(FOODS.concat(DRINKS)).slice(0,5);
    var x=S.order[S.i];
    return {prompt:'ده طعام ولا شراب؟',say:x.n+'. هل هذا طعام أم شراب؟',correct:x.t,cls:'opt-word',
      stage:'<div class="te big">'+x.e+'</div><div class="cap">'+x.n+'</div>',
      options:[{k:'food',v:'طعام'},{k:'drink',v:'شراب'}]};
  }
},

letters:{domain:'lang',title:'الحروف العربية',sub:'نتعرف على الحرف وصورته',icon:'أ',rounds:5,
  idea:'يتعرف الطفل على شكل الحرف العربي واسمه، ويربطه بصورة لكلمة تبدأ به.',
  goal:'أن يتعرف الطفل على أشكال بعض الحروف العربية ويميزها بصريا.',
  explain:function(root){
    var cur=0;
    function draw(){
      var L=LETTERS[cur];
      root.innerHTML='<div class="stage tone-rose"><div class="bigletter">'+L.l+'</div><div class="dotsrow"><span class="te big">'+L.e+'</span><span class="cap">'+L.w+'</span></div><button class="listen" data-say="حرف '+L.n+'. '+L.w+'">🔊 اسمع الحرف</button></div>'+
        '<div class="lgrid">'+LETTERS.map(function(x,i){ return '<button class="lbtn'+(i===cur?' on':'')+'" data-l="'+i+'">'+x.l+'</button>'; }).join('')+'</div>';
    }
    root.onclick=function(e){ var b=e.target.closest('[data-l]'); if(!b) return; cur=+b.dataset.l; draw(); say('حرف '+LETTERS[cur].n+'. '+LETTERS[cur].w); };
    draw();
  },
  frames:function(){ return LETTERS.map(function(L){ return {big:L.l,cap:'حرف '+L.n,sub:L.w+' '+L.e,say:'حرف '+L.n+'. '+L.w}; }); },
  make:function(S){
    var L=pickUnused(LETTERS,S);
    var others=shuffle(LETTERS.filter(function(x){return x!==L;})).slice(0,S.n-1);
    return {prompt:'أين حرف '+L.n+'؟',say:'أين حرف '+L.n+'؟',correct:L.l,
      hintHtml:'<div class="te big">'+L.e+'</div><div class="cap">'+L.w+'</div>',
      options:shuffle([L].concat(others)).map(function(x){return {k:x.l,v:x.l};})};
  }
},

sounds:{domain:'lang',title:'الأصوات اللغوية',sub:'نسمع الصوت ونختار الصورة',icon:'🔊',rounds:5,
  idea:'ينتبه الطفل إلى صوت الحرف في بداية الكلمة، ويربط الصوت بصورة تبدأ به.',
  goal:'أن يميز الطفل صوتا لغويا بسيطا ويربطه بكلمة مألوفة تبدأ به.',
  explain:function(root){
    var cur=-1;
    function draw(){
      var L=LETTERS[cur];
      root.innerHTML='<div class="stage tone-rose">'+(cur<0
        ?'<div class="prompt">اضغط على صوت واسمعه</div><div class="te big">🔊</div>'
        :'<div class="te big">'+L.e+'</div><div class="cap">'+L.w+'</div><div class="prompt">صوت '+L.snd+' في أول كلمة '+L.w+'</div><button class="listen" data-say="'+L.snd+'">🔊 اسمع الصوت</button>')+'</div>'+
        '<div class="lgrid">'+LETTERS.map(function(x,i){ return '<button class="lbtn'+(i===cur?' on':'')+'" data-s="'+i+'">'+x.snd+'</button>'; }).join('')+'</div>';
    }
    root.onclick=function(e){
      var b=e.target.closest('[data-s]'); if(!b) return;
      cur=+b.dataset.s; draw(); say(LETTERS[cur].snd);
      var w=LETTERS[cur].w; later(function(){ say(w); },1400);
    };
    draw();
  },
  frames:function(){ return LETTERS.map(function(L){ return {big:L.e,cap:L.w,sub:'صوت '+L.snd,say:L.snd+'. '+L.w}; }); },
  make:function(S){
    var L=pickUnused(LETTERS,S);
    var others=shuffle(LETTERS.filter(function(x){return x!==L;})).slice(0,S.n-1);
    return {prompt:'اسمع الصوت، واختار الصورة اللي اسمها يبدأ بيه',say:L.snd,correct:L.l,
      stage:'<button class="listen" data-say="'+L.snd+'">🔊 الصوت</button>',
      hintHtml:'<button class="listen" data-say="'+L.snd+'">🔊 الصوت</button><div class="bigletter">'+L.l+'</div>',
      options:shuffle([L].concat(others)).map(function(x){return {k:x.l,v:x.e,l:x.w};})};
  }
}
};

var FD=3200; /* seconds per video frame, in ms */
function toneOf(k){ return DOM[CONCEPTS[k].domain].tone; }
function doneCount(){ return ALL.filter(function(k){return ST.done[k];}).length; }
function seenCount(){ return ALL.filter(function(k){return ST.seen[k];}).length; }
function nextConcept(){ for(var i=0;i<ALL.length;i++){ if(!ST.done[ALL[i]]) return ALL[i]; } return ALL[0]; }
function vdur(k){ return fmt(CONCEPTS[k].frames().length*FD/1000); }

/* ---------- shared pieces ---------- */
function top(title,back){
  return '<header class="top">'+(back?'<button class="back" data-go="'+back+'" aria-label="رجوع">→</button>':'')+'<h1>'+title+'</h1><div class="stars" id="stars">⭐ '+ST.stars+'</div></header>';
}
function crow(k){
  var C=CONCEPTS[k];
  return '<button class="crow tone-'+toneOf(k)+'" data-go="c-'+k+'"><span class="cicon">'+C.icon+'</span><span class="ctext"><b>'+C.title+'</b><small>'+C.sub+'</small></span><span class="cst">'+(ST.done[k]?'✓ ⭐'+ST.done[k]:'<i class="go">‹</i>')+'</span></button>';
}
function vthumb(k){
  var C=CONCEPTS[k];
  return '<div class="vthumb tone-'+toneOf(k)+'"><span class="vi">'+C.icon+'</span><span class="pl">▶</span><span class="dur">'+vdur(k)+'</span></div>';
}
function vcard(k){
  var C=CONCEPTS[k];
  return '<button class="vcard" data-go="v-'+k+'">'+vthumb(k)+'<b>'+C.title+'</b><small>'+DOM[C.domain].name+(ST.seen[k]?' · ✓ شاهدته':'')+'</small></button>';
}
function vrow(k){
  var C=CONCEPTS[k];
  return '<button class="vrow" data-go="v-'+k+'">'+vthumb(k)+'<span class="ctext"><b>'+C.title+'</b><small>'+DOM[C.domain].name+' · '+vdur(k)+'</small>'+(ST.seen[k]?'<span class="seen">✓ شاهدته</span>':'')+'</span></button>';
}

/* ---------- tab screens ---------- */
function homeScreen(){
  var nk=nextConcept(), N=CONCEPTS[nk], dn=doneCount(), total=ALL.length;
  view.innerHTML=
    '<div class="hello"><button class="avatar" data-go="me" aria-label="ملفي">'+ST.avatar+'</button><div class="htxt"><small>أهلا يا</small><b>'+esc(ST.name)+'</b></div><div class="stars" id="stars">⭐ '+ST.stars+'</div></div>'+
    '<div class="hero tone-'+toneOf(nk)+'"><div class="htext"><small>'+(dn?'كمّل من هنا':'يلا نبدأ')+'</small><b>'+N.title+'</b><button class="pill" data-go="c-'+nk+'">ابدأ</button></div><div class="hico" aria-hidden="true">'+N.icon+'</div></div>'+
    '<div class="prog"><div class="row"><span>تقدمك</span><span>'+dn+' من '+total+'</span></div><div class="pbar"><i style="width:'+Math.round(dn/total*100)+'%"></i></div></div>'+
    '<div class="sech"><h2>المجالات</h2></div>'+
    '<div class="grid2">'+DOMAINS.map(function(d){
      var n=d.concepts.filter(function(c){return ST.done[c];}).length;
      return '<button class="dcard tone-'+d.tone+'" data-go="d-'+d.id+'"><span class="dicon">'+d.icon+'</span><span><span class="dname">'+d.name+'</span><br><span class="dcount">'+n+' من '+d.concepts.length+'</span></span></button>';
    }).join('')+'</div>'+
    '<div class="sech"><h2>فيديوهات</h2><button data-go="videos">عرض الكل</button></div>'+
    '<div class="hs">'+ALL.slice(0,5).map(vcard).join('')+'</div>'+
    voiceNote();
}

function learnScreen(){
  view.innerHTML=top('المفاهيم','')+DOMAINS.map(function(d){
    return '<div class="rows tone-'+d.tone+'"><div class="dhead"><span>'+d.icon+'</span>'+d.name+'</div>'+d.concepts.map(crow).join('')+'</div>';
  }).join('');
}

var vfilter='all';
function videosScreen(){
  var list=ALL.filter(function(k){ return vfilter==='all'||CONCEPTS[k].domain===vfilter; });
  view.innerHTML=top('الفيديوهات','')+
    '<div class="fchips"><button class="fchip'+(vfilter==='all'?' on':'')+'" data-vf="all">الكل</button>'+DOMAINS.map(function(d){ return '<button class="fchip'+(vfilter===d.id?' on':'')+'" data-vf="'+d.id+'">'+d.name+'</button>'; }).join('')+'</div>'+
    '<div class="vlist">'+list.map(vrow).join('')+'</div>';
}

function meScreen(){
  var lvl=Math.floor(ST.stars/10)+1, into=ST.stars%10, C=2*Math.PI*58, off=C*(1-into/10);
  var BADGES=[
    {e:'⭐',n:'أول نجمة',ok:ST.stars>=1},{e:'🌟',n:'10 نجوم',ok:ST.stars>=10},{e:'👑',n:'25 نجمة',ok:ST.stars>=25},
    {e:'🏅',n:'أنهيت مفهوم',ok:doneCount()>=1},{e:'🎬',n:'شاهدت فيديو',ok:seenCount()>=1},
    {e:'🏆',n:'أنهيت مجال',ok:DOMAINS.some(function(d){return d.concepts.every(function(c){return ST.done[c];});})}
  ];
  view.innerHTML=top('ملفي','')+
    '<div class="pcard"><div class="ring"><svg viewBox="0 0 128 128" aria-hidden="true"><circle cx="64" cy="64" r="58" fill="none" stroke="var(--line)" stroke-width="8"/><circle id="ringp" cx="64" cy="64" r="58" fill="none" stroke="var(--orange)" stroke-width="8" stroke-linecap="round" stroke-dasharray="'+C.toFixed(1)+'" stroke-dashoffset="'+off.toFixed(1)+'"/></svg><div class="avbig" id="avbig">'+ST.avatar+'</div></div>'+
    '<div class="lvl">المستوى '+lvl+' · '+into+' من 10 نجوم</div>'+
    '<label for="nm" class="hint">اسمك</label><input class="nameinp" id="nm" maxlength="12" value="'+esc(ST.name)+'" placeholder="اكتب اسمك" autocomplete="off">'+
    '<div class="stats"><div class="stat"><b>'+ST.stars+'</b><small>نجمة</small></div><div class="stat"><b>'+doneCount()+'</b><small>مفهوم</small></div><div class="stat"><b>'+seenCount()+'</b><small>فيديو</small></div></div></div>'+
    '<div class="label">اختار شخصيتك</div><div class="avs">'+AVATARS.map(function(a){ return '<button class="avb'+(a===ST.avatar?' on':'')+'" data-av="'+a+'" aria-label="شخصية">'+a+'</button>'; }).join('')+'</div>'+
    '<div class="label">إنجازاتك</div><div class="badges">'+BADGES.map(function(b){ return '<div class="badge'+(b.ok?'':' lock')+'"><span class="be">'+b.e+'</span>'+b.n+'</div>'; }).join('')+'</div>'+
    '<div class="label">الإعدادات</div>'+
    '<button class="setrow" data-sound="1" role="switch" aria-checked="'+(ST.sound?'true':'false')+'"><span>صوت الشرح</span><span class="sw'+(ST.sound?' on':'')+'" id="sw"></span></button>'+
    '<div id="rst"><button class="setrow danger" data-reset="1">مسح التقدم والبدء من جديد</button></div>'+
    voiceNote()+'<p class="about">مسار · نسخة تجريبية للعرض</p>';
}

/* ---------- detail screens ---------- */
function domainScreen(id){
  var d=DOM[id];
  view.innerHTML=top(d.name,'home')+
    '<div class="chero tone-'+d.tone+'"><div class="big" aria-hidden="true">'+d.icon+'</div><b>'+d.name+'</b><small>'+d.concepts.filter(function(c){return ST.done[c];}).length+' من '+d.concepts.length+' مفاهيم</small></div>'+
    '<div class="rows">'+d.concepts.map(crow).join('')+'</div>';
}

function conceptScreen(key){
  var C=CONCEPTS[key], d=DOM[C.domain];
  view.innerHTML=top(C.title,'d-'+C.domain)+
    '<div class="chero tone-'+d.tone+'"><div class="big" aria-hidden="true">'+C.icon+'</div><b>'+C.title+'</b><small>'+C.sub+'</small></div>'+
    '<div class="actions"><button class="btn alt" data-go="v-'+key+'">🎬 فيديو الشرح</button><button class="btn" data-go="a-'+key+'">🎯 النشاط</button></div>'+
    '<div class="label">اضغط وجرّب</div><div id="ex" style="display:flex;flex-direction:column;gap:16px;min-width:0"></div>'+
    '<div class="info"><h3>فكرة الشرح</h3><p>'+C.idea+'</p></div><div class="info"><h3>هدف التعلم</h3><p>'+C.goal+'</p></div>'+
    '<button class="cta" data-go="a-'+key+'">ابدأ النشاط</button>';
  C.explain($('ex'));
}

var vplay=null;
function videoScreen(key){
  var C=CONCEPTS[key], d=DOM[C.domain], F=C.frames(), i=0, playing=false, ended=false, file=VIDEO_FILES[key];
  var others=ALL.filter(function(k){return k!==key;}).slice(0,3);
  view.innerHTML=top('فيديو','videos')+
    '<div class="player tone-'+d.tone+'" id="pl">'+(file?'<video controls playsinline preload="metadata" src="'+esc(file)+'"></video>':'')+'</div>'+
    (file?'':'<div class="ctrls"><button class="cbtn" id="pp" data-vp="1" aria-label="تشغيل">▶</button><div class="tl"><div class="pbar"><i id="vb" style="width:0%"></i></div><span id="vt">0:00 / '+vdur(key)+'</span></div><button class="cbtn alt" data-vr="1" aria-label="من الأول">↺</button></div>')+
    '<div><h2 style="font-size:1.3rem">'+C.title+'</h2><p class="hint" style="text-align:start">'+d.name+'</p></div>'+
    '<div class="info"><h3>في الفيديو</h3><p>'+C.idea+'</p></div>'+
    '<div class="actions"><button class="btn alt" data-go="c-'+key+'">📖 الشرح</button><button class="btn" data-go="a-'+key+'">🎯 النشاط</button></div>'+
    (file?'':'<p class="note">دي فيديوهات تجريبية بتعرض الشرح خطوة خطوة، وبتتبدل بفيديوهات حقيقية.</p>')+
    '<div class="sech"><h2>فيديوهات تانية</h2></div><div class="vlist">'+others.map(vrow).join('')+'</div>';
  if(file){ var v=view.querySelector('video'); if(v) v.addEventListener('ended',function(){ ST.seen[key]=true; save(); }); return; }

  function show(first){
    var f=F[i], pl=$('pl'); if(!pl) return;
    var cls='vbig'+(f.num?' num':f.multi?' multi':'');
    pl.innerHTML='<div class="'+cls+' pop" aria-hidden="true">'+f.big+'</div><div class="vcap pop">'+f.cap+'</div><div class="vsub">'+f.sub+'</div>';
    $('vb').style.width=Math.round((i+1)/F.length*100)+'%';
    $('vt').textContent=fmt(i*FD/1000)+' / '+vdur(key);
    if(!first) say(f.say);
  }
  function setPP(){ var b=$('pp'); if(b){ b.textContent=playing?'⏸':(ended?'↺':'▶'); b.setAttribute('aria-label',playing?'إيقاف':'تشغيل'); } }
  function tick(){
    later(function(){
      if(!playing) return;
      if(i<F.length-1){ i++; show(); tick(); }
      else{ playing=false; ended=true; ST.seen[key]=true; save(); $('vt').textContent=vdur(key)+' / '+vdur(key)+' ✓'; setPP(); }
    },FD);
  }
  function start(){ if(ended){ i=0; ended=false; } playing=true; show(); setPP(); tick(); }
  function pause(){ playing=false; clearTimers(); stopSay(); setPP(); }
  vplay={
    toggle:function(){ if(playing) pause(); else start(); },
    restart:function(){ clearTimers(); stopSay(); i=0; ended=false; start(); }
  };
  /* resting frame: first slide, paused, so the page is complete before the child presses play */
  show(true);
}

function activityScreen(key){
  var C=CONCEPTS[key];
  var S={i:0,total:C.rounds,n:2,streak:0,used:[],stars:0,order:null,r:null,wrong:0,done:false};

  function paint(){
    var r=S.r;
    view.innerHTML=top('النشاط','c-'+key)+
      '<div class="pdots">'+range(1,S.total).map(function(k){ return '<span class="pd'+(k<=S.i?' done':'')+(k===S.i+1?' cur':'')+'"></span>'; }).join('')+'</div>'+
      '<div class="qcard"><div class="qtext">'+r.prompt+'</div><button class="listen" data-say="'+r.say+'">🔊 اسمع</button><div class="qstage" id="qstage">'+(r.stage||'')+'</div></div>'+
      '<div class="opts" style="--n:'+r.options.length+'">'+r.options.map(function(o){
        return '<button class="opt '+(r.cls||'')+'" data-k="'+o.k+'"><span class="ov">'+o.v+'</span>'+(o.l?'<span class="ol">'+o.l+'</span>':'')+'</button>';
      }).join('')+'</div><div class="fb" id="fb" aria-live="polite"></div><button class="cta" id="nx" hidden>التالي</button>';
    view.scrollTop=0;
    later(function(){ say(r.say); },300);
  }
  function next(){ if(S.i>=S.total) return finish(); S.r=C.make(S); S.wrong=0; S.done=false; paint(); }
  function finish(){
    ST.done[key]=Math.max(ST.done[key]||0,S.stars); save();
    view.innerHTML=top('أحسنت!','c-'+key)+
      '<div class="stage tone-orange"><div class="starsbig" aria-hidden="true">'+'<span>⭐</span>'.repeat(S.total)+'</div><div class="bignum small">أحسنت!</div><p class="cap">جمعت '+S.stars+' نجوم</p></div>'+
      '<button class="cta" id="again">العب تاني</button>'+
      (ALL.indexOf(key)<ALL.length-1?'<button class="cta alt" data-go="c-'+ALL[ALL.indexOf(key)+1]+'">المفهوم اللي بعده</button>':'')+
      '<button class="cta alt" data-go="home">الرئيسية</button>';
    say('أحسنت! جمعت '+S.stars+' نجوم');
  }
  screenClick=function(e){
    if(e.target.closest('#again')){ activityScreen(key); return; }
    if(e.target.closest('#nx')){ S.i++; next(); return; }
    var b=e.target.closest('.opt');
    if(!b||!S.r||S.done||b.classList.contains('miss')) return;
    var r=S.r, fb=$('fb'), opts=Array.prototype.slice.call(view.querySelectorAll('.opt'));
    if(String(b.dataset.k)===String(r.correct)){
      S.done=true; ST.stars++; S.stars++; save();
      opts.forEach(function(o){ o.classList.remove('hint'); if(o!==b) o.classList.add('dim'); });
      b.classList.add('good');
      var msg=rnd(PRAISE); fb.textContent='✔ '+msg; say(msg);
      var st=$('stars'); if(st) st.textContent='⭐ '+ST.stars;
      if(S.wrong===0){ S.streak++; if(S.streak>=2&&S.n<3) S.n=3; } else { S.streak=0; if(S.wrong>=2) S.n=2; }
      var nx=$('nx'); nx.textContent=(S.i+1>=S.total)?'خلصنا':'التالي'; nx.hidden=false;
      nx.scrollIntoView({block:'nearest'});
    }else{
      S.wrong++; b.classList.add('miss');
      fb.textContent='حاول تاني، إنت تقدر'; say('حاول مرة أخرى');
      if(S.wrong>=2){
        opts.forEach(function(o){ if(String(o.dataset.k)===String(r.correct)) o.classList.add('hint'); });
        if(r.hintHtml) $('qstage').innerHTML=r.hintHtml;
      }
    }
  };
  next();
}

/* ---------- router ---------- */
var screenClick=null;
function setNav(tab,hidden){
  nav.hidden=!!hidden;
  Array.prototype.forEach.call(nav.querySelectorAll('.tab'),function(b){ var on=b.dataset.tab===tab; b.classList.toggle('on',on); if(on) b.setAttribute('aria-current','page'); else b.removeAttribute('aria-current'); });
}
function render(){
  clearTimers(); stopSay(); screenClick=null; vplay=null;
  var h=(location.hash||'').replace('#',''), kind=h.split('-')[0], id=h.split('-').slice(1).join('-');
  if(kind==='d'&&DOM[id]){ domainScreen(id); setNav('home'); }
  else if(kind==='c'&&CONCEPTS[id]){ conceptScreen(id); setNav('learn'); }
  else if(kind==='a'&&CONCEPTS[id]){ activityScreen(id); setNav('learn',true); }
  else if(kind==='v'&&CONCEPTS[id]){ videoScreen(id); setNav('videos'); }
  else if(h==='learn'){ learnScreen(); setNav('learn'); }
  else if(h==='videos'){ videosScreen(); setNav('videos'); }
  else if(h==='me'){ meScreen(); setNav('me'); }
  else{ homeScreen(); setNav('home'); }
  view.scrollTop=0;
}
function go(h){ if(location.hash==='#'+h) render(); else location.hash=h; }

shell.addEventListener('click',function(e){
  var g=e.target.closest('[data-go]'); if(g){ go(g.dataset.go); return; }
  var s=e.target.closest('[data-say]'); if(s){ say(s.dataset.say); return; }
  var vf=e.target.closest('[data-vf]'); if(vf){ vfilter=vf.dataset.vf; videosScreen(); return; }
  if(e.target.closest('[data-vp]')){ if(vplay) vplay.toggle(); return; }
  if(e.target.closest('[data-vr]')){ if(vplay) vplay.restart(); return; }
  var av=e.target.closest('[data-av]');
  if(av){
    ST.avatar=av.dataset.av; save();
    $('avbig').textContent=ST.avatar;
    Array.prototype.forEach.call(view.querySelectorAll('.avb'),function(b){ b.classList.toggle('on',b===av); });
    return;
  }
  if(e.target.closest('[data-sound]')){
    ST.sound=!ST.sound; save(); if(!ST.sound) stopSay();
    $('sw').classList.toggle('on',ST.sound); e.target.closest('[data-sound]').setAttribute('aria-checked',ST.sound?'true':'false');
    if(ST.sound) say('الصوت شغال');
    return;
  }
  if(e.target.closest('[data-reset]')){
    $('rst').innerHTML='<div class="info"><p>هتتمسح كل النجوم والإنجازات. متأكدة؟</p></div><div class="confirm"><button class="btn alt" data-resetno="1">لا، ارجع</button><button class="btn" data-resetyes="1">أيوه، امسح</button></div>';
    return;
  }
  if(e.target.closest('[data-resetno]')){ meScreen(); return; }
  if(e.target.closest('[data-resetyes]')){ ST.stars=0; ST.done={}; ST.seen={}; save(); meScreen(); return; }
  if(screenClick) screenClick(e);
});
shell.addEventListener('input',function(e){
  if(e.target.id==='nm'){ ST.name=e.target.value.trim()||'بطل'; save(); }
});
window.addEventListener('hashchange',render);
render();
})();
