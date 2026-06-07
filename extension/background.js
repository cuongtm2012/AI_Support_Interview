/** @type {chrome.runtime.Port | null} */
let appPort = null;

chrome.runtime.onConnectExternal.addListener((port) => {
  appPort = port;
  port.onDisconnect.addListener(() => {
    appPort = null;
  });
});

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === "CAPTURE_TAB") {
    void captureActiveTab()
      .then((streamId) => sendResponse({ ok: true, streamId }))
      .catch((e) =>
        sendResponse({ ok: false, error: e instanceof Error ? e.message : "Capture failed" })
      );
    return true;
  }
  return false;
});

async function captureActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) throw new Error("No active tab");

  return new Promise((resolve, reject) => {
    chrome.tabCapture.getMediaStreamId({ targetTabId: tab.id }, (streamId) => {
      if (chrome.runtime.lastError || !streamId) {
        reject(new Error(chrome.runtime.lastError?.message || "tabCapture denied"));
        return;
      }
      resolve(streamId);
    });
  });
}

export {};
