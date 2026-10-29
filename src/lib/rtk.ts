export function rtkCompress(text:string):string {
  // strip ANSI
  let out = text.replace(/\x1b\[[0-9;]*m/g,"");
  // collapse repeated lines
  const lines = out.split("\n");
  const collapsed: string[] = [];
  let prev="", count=1;
  for(const l of lines){
    if(l===prev){ count++; }
    else { if(count>1) collapsed.push(`${prev} (×${count})`); else if(prev) collapsed.push(prev); prev=l; count=1; }
  }
  if(count>1) collapsed.push(`${prev} (×${count})`); else if(prev) collapsed.push(prev);
  out = collapsed.join("\n");
  // cap size
  const MAX=4000;
  if(out.length>MAX){ out = out.slice(0,MAX/2)+"\n[… omitted by RTK …]\n"+out.slice(-MAX/2); }
  return out;
}
