export function rtkCompress(text: string): string {
  try {
    let out = text.replace(/\x1b\[[0-9;]*m/g, "");
    const lines = out.split("\n");
    const collapsed: string[] = [];
    let prev = "", count = 1;
    for (const l of lines) {
      if (l === prev) {
        count++;
      } else {
        if (count > 1) collapsed.push(`${prev} (×${count})`);
        else if (prev !== undefined) collapsed.push(prev);
        prev = l;
        count = 1;
      }
    }
    if (count > 1) collapsed.push(`${prev} (×${count})`);
    else if (prev !== undefined) collapsed.push(prev);
    out = collapsed.join("\n");
    return out;
  } catch {
    return text;
  }
}
