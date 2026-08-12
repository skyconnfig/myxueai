// Verify CaptionEngine keyword identification (mirrors segmentCaption logic).
const TECH_KEYWORDS = new Set(['AI','GPT','LLM','API','SaaS','GPU','CPU','ROI','KPI','B2B','B2C','ML','DL','NLP','CV','VR','AR','PR','UX','UI','IT','DB','SQL','GPT4','GPT-4','AGI','AIGC','CRM','ERP','OA','BI'])
function segmentCaption(text, maxLen=4) {
  const cleaned = text.replace(/\s+/g,' ').trim(); if(!cleaned) return []
  const tokens = []
  const TOKEN_RE = /([A-Za-z][A-Za-z0-9\-]*[A-Za-z0-9])|(\d+(?:\.\d+)?%?)|([「『"]([^」』"]+)[」』"])|([\u4e00-\u9fff、，。！？；：]+)/g
  let m, buffer=''
  const flush=()=>{ if(!buffer) return; for(const p of splitCjk(buffer,maxLen)) { const k=isCjkKeyword(p); tokens.push({text:p,isKeyword:k,keywordType:k?'term':undefined}) } buffer='' }
  while((m=TOKEN_RE.exec(cleaned))!==null){
    if(m[1]){ flush(); const w=m[1]; const k=TECH_KEYWORDS.has(w.toUpperCase())||w.length>=2; tokens.push({text:w,isKeyword:k,keywordType:'english'}) }
    else if(m[2]){ flush(); tokens.push({text:m[2],isKeyword:true,keywordType:'number'}) }
    else if(m[3]){ flush(); tokens.push({text:m[4]??m[3].replace(/[「」『』""]/g,''),isKeyword:true,keywordType:'quoted'}) }
    else if(m[5]){ buffer+=m[5] }
  }
  flush()
  return tokens.filter(t=>t.text.trim().length>0)
}
function splitCjk(s,maxLen){ const SOFT=/[、，。！？；：]/; const st=s.replace(/[、，。！？；：]+$/g,''); if(!st) return []; const parts=st.split(SOFT).map(p=>p.trim()).filter(Boolean); if(parts.length<=1){ const out=[]; for(let i=0;i<st.length;i+=maxLen) out.push(st.slice(i,i+maxLen)); return out } return parts }
function isCjkKeyword(s){ const T=['未来','世界','智能','模型','数据','算法','效率','增长','收入','用户','产品','技术']; return T.some(t=>s.includes(t)) }

const tests = ['AI正在改变未来', '90%的人学不会', '关注我，做出你的第一个AI项目']
for (const t of tests) {
  const segs = segmentCaption(t)
  console.log(`\n"${t}" -> ${segs.length} tokens:`)
  segs.forEach(s => console.log(`  ${s.isKeyword?'★':' '} "${s.text}" (${s.keywordType??'text'})`))
}
console.log('\nSpec check: "AI正在改变未来" should yield AI / 正在改变 / 未来')
