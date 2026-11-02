self.localZoomEvents = [];
chrome.tabs.onZoomChange.addListener(event => {
  self.localZoomEvents.push({timestamp: new Date().toISOString(), ...event});
});
self.getLocalZoom = async tabId => {
  const tab = await chrome.tabs.get(tabId);
  const url = new URL(tab.url);
  if (url.protocol !== 'http:' || !['127.0.0.1', 'localhost'].includes(url.hostname)) {
    throw new Error('Native zoom helper is restricted to local HTTP test tabs.');
  }
  return {
    tabId,
    url: tab.url,
    zoomFactor: await chrome.tabs.getZoom(tabId),
    zoomSettings: await chrome.tabs.getZoomSettings(tabId),
    timestamp: new Date().toISOString()
  };
};
self.setLocalZoom = async ({tabId, factor}) => {
  const before = await self.getLocalZoom(tabId);
  if (![1, 2].includes(factor)) throw new Error('This test only permits factors 1 and 2.');
  await chrome.tabs.setZoomSettings(tabId, {mode: 'automatic', scope: 'per-tab'});
  await chrome.tabs.setZoom(tabId, factor);
  return {before, after: await self.getLocalZoom(tabId)};
};
chrome.runtime.onInstalled.addListener(() => {});
