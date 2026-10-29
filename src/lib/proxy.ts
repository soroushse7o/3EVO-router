export async function healthCheck(url: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => { clearTimeout(timeoutId); reject(new Error("Request timed out")); }, 5000);
    fetch(url).then(response => { clearTimeout(timeoutId); resolve(response.status >= 200 && response.status < 300); }).catch(error => { clearTimeout(timeoutId); reject(error); });
  });
}
