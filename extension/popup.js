const statusEl = document.getElementById("status");
const btn = document.getElementById("capture");

btn?.addEventListener("click", () => {
  statusEl.textContent = "Đang capture…";
  chrome.runtime.sendMessage({ type: "CAPTURE_TAB" }, (res) => {
    if (chrome.runtime.lastError) {
      statusEl.textContent = chrome.runtime.lastError.message;
      return;
    }
    if (res?.ok) {
      statusEl.textContent = `OK — streamId: ${String(res.streamId).slice(0, 12)}…`;
    } else {
      statusEl.textContent = res?.error || "Capture thất bại";
    }
  });
});
