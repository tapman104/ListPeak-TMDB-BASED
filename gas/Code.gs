const STORE_KEY = 'listpeak_data';

function doGet(e) {
  const raw = PropertiesService.getUserProperties().getProperty(STORE_KEY);
  const data = raw ? JSON.parse(raw) : { settings: null, watchlist: null };
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const body = JSON.parse(e.postData.contents);
  PropertiesService.getUserProperties().setProperty(STORE_KEY, JSON.stringify(body));
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
