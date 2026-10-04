chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    // Check if the page has finished loading and matches Gemini
    if (changeInfo.status === 'complete' && tab.url && tab.url.includes("gemini.google.com")) {
        
        // Send a message to the content script running inside this tab
        chrome.tabs.sendMessage(tabId, { 
            action: "PAGE_LOADED",
            url: tab.url 
        }).catch((err) => {
            // Safe catch in case the content script is still bootstrapping
            console.log("ChatMan: Content script not yet listening.", err);
        });
    }
});