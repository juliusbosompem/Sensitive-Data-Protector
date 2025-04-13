document.addEventListener("DOMContentLoaded", function () {
  const toggle = document.getElementById("toggleScanning");

  chrome.storage.sync.get("scanningEnabled", function (data) {
    toggle.checked = data.scanningEnabled ?? true;
  });

  toggle.addEventListener("change", function () {
    chrome.storage.sync.set({ scanningEnabled: toggle.checked });

    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, { scanningEnabled: toggle.checked });
    });
  });
});
