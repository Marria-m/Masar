/* MASAR content: domains, concepts' raw material, avatars, video files. Edit text and lists here. */
/* ---------- content ---------- */
var NUM=['','واحد','اثنان','ثلاثة','أربعة','خمسة','ستة','سبعة','ثمانية','تسعة','عشرة'];
var TONES=['blue','green','orange','rose'];
function numTone(n){ return TONES[(n-1)%4]; }
function APL(n){ return n===1?'تفاحة واحدة':n===2?'تفاحتان':NUM[n]+' تفاحات'; }
var PRAISE=['أحسنت!','برافو!','شاطر!','ممتاز!','جميل جدا!'];
var AVATARS=['🦁','🐼','🦊','🐰','🐯','🐸','🦄','🐬'];

var TOWEL='<svg viewBox="0 0 64 64" width="1em" height="1em" aria-hidden="true"><rect x="10" y="6" width="44" height="46" rx="6" fill="#8fd0e8"/><rect x="10" y="18" width="44" height="6" fill="#ffffff" opacity=".85"/><rect x="10" y="29" width="44" height="6" fill="#ffffff" opacity=".85"/><path d="M16 52v8M24 52v8M32 52v8M40 52v8M48 52v8" stroke="#8fd0e8" stroke-width="3.5" stroke-linecap="round"/></svg>';

var LIVING=[{e:'🧒',n:'الإنسان',k:''},{e:'🐱',n:'القطة',k:'حيوان'},{e:'🌳',n:'الشجرة',k:'نبات'},{e:'🌻',n:'الزهرة',k:'نبات'}];
var NONLIVING=[{e:'⚽',n:'الكرة',k:''},{e:'🪑',n:'الكرسي',k:''},{e:'🚗',n:'السيارة',k:''},{e:'📖',n:'الكتاب',k:''}];
var SENSES=[
  {s:'البصر',o:'العين',v:'نرى',e:'👁️',q:'بنشوف بإيه؟',ex:'نرى الألوان بعيوننا'},
  {s:'السمع',o:'الأذن',v:'نسمع',e:'👂',q:'بنسمع بإيه؟',ex:'نسمع الأغاني بآذاننا'},
  {s:'الشم',o:'الأنف',v:'نشم',e:'👃',q:'بنشم بإيه؟',ex:'نشم الورد بأنفنا'},
  {s:'التذوق',o:'اللسان',v:'نتذوق',e:'👅',q:'بنتذوق بإيه؟',ex:'نتذوق الحلوى بلساننا'},
  {s:'اللمس',o:'الجلد',v:'نلمس ونشعر',e:'✋',q:'بنلمس بإيه؟',ex:'نلمس الأشياء بجلدنا'}
];
var HYG=[
  {id:'soap',e:'🧼',n:'الصابون',use:'نغسل أيدينا بالصابون',q:'بماذا نغسل أيدينا؟'},
  {id:'brush',e:'🪥',n:'فرشاة الأسنان',use:'ننظف بها أسناننا',q:'بماذا ننظف أسناننا؟'},
  {id:'paste',e:'🧴',n:'المعجون',use:'نضعه على الفرشاة',q:'ماذا نضع على الفرشاة؟'},
  {id:'towel',e:TOWEL,n:'المنشفة',use:'ننشف بها أيدينا',q:'بماذا ننشف أيدينا؟'}
];
var HSTEPS=[{e:'💦',t:'نبلل أيدينا بالماء'},{e:'🧼',t:'نضع الصابون'},{e:'👏',t:'نفرك أيدينا جيدا'},{e:'🚰',t:'نشطف بالماء'},{e:TOWEL,t:'ننشف أيدينا'}];
var FOODS=[{e:'🍎',n:'تفاحة',t:'food'},{e:'🍞',n:'خبز',t:'food'},{e:'🍚',n:'أرز',t:'food'},{e:'🥚',n:'بيضة',t:'food'}];
var DRINKS=[{e:'💧',n:'ماء',t:'drink'},{e:'🥛',n:'لبن',t:'drink'},{e:'🧃',n:'عصير',t:'drink'},{e:'🍵',n:'شاي',t:'drink'}];
var LETTERS=[
  {l:'أ',n:'ألف',w:'أرنب',e:'🐰',snd:'أَ'},{l:'ب',n:'باء',w:'بطة',e:'🦆',snd:'بَ'},{l:'ت',n:'تاء',w:'تفاحة',e:'🍎',snd:'تَ'},
  {l:'ج',n:'جيم',w:'جمل',e:'🐪',snd:'جَ'},{l:'د',n:'دال',w:'دجاجة',e:'🐔',snd:'دَ'},{l:'س',n:'سين',w:'سمكة',e:'🐟',snd:'سَ'}
];

var DOMAINS=[
  {id:'math',name:'المجال الرياضي',icon:'123',tone:'blue',concepts:['numbers','quantity']},
  {id:'science',name:'العلوم والبيئة',icon:'🌱',tone:'green',concepts:['living','senses']},
  {id:'life',name:'الحياة اليومية',icon:'🧼',tone:'orange',concepts:['hygiene','food']},
  {id:'lang',name:'المجال اللغوي',icon:'أ',tone:'rose',concepts:['letters','sounds']}
];
var DOM={}; DOMAINS.forEach(function(d){ DOM[d.id]=d; });
var ALL=['numbers','quantity','living','senses','hygiene','food','letters','sounds'];

/* To use a real video, add its file next to this page and list it here, e.g. numbers:'videos/numbers.mp4' */
var VIDEO_FILES={};
