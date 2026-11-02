export function createStreamController({ onDisconnect, onError, provider, model, reqTag = "" }) {
  const controller = new AbortController();
  let ended = false;

  const cleanup = (reason) => {
    if (ended) return;
    ended = true;
    try { onDisconnect && onDisconnect(reason); } catch {}
  };

  controller.signal.addEventListener("abort", () => cleanup("client-abort"), { once: true });
  controller.signal.addEventListener("error", () => cleanup("error"), { once: true });

  return {
    signal: controller.signal,
    handleComplete() {
      cleanup("complete");
    },
    handleError(reason) {
      cleanup(reason || "error");
      onError && onError();
    },
  };
}
