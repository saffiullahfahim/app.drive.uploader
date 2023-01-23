const doGet = () => {
  return ContentService.createTextOutput(ScriptApp.getOAuthToken())
}