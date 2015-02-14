/**
 * Created by cheezburgah on 10/02/15.
 */

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === 'get')
        getValue(request.key, sendResponse);
    if(request.action === 'set')
        setValue(request.key, request.value, sendResponse);
    if(request.action === 'all')
        getAll(sendResponse);
    if(request.action == 'refresh')
        sendRefresh();
    return true;
});

var setValue = function(k, v, sendResponse){
    var obj = {};
    obj[k] = v;
    chrome.storage.sync.set(obj,function(){
        sendResponse("done");
    });
};

var getValue = function(k, sendResponse){
    chrome.storage.sync.get(k, function(item){
        var r = {"key" : k, "value" : item[k]};
        sendResponse(r);
    })
};

var getAll = function(sendResponse){
    chrome.storage.sync.get(function(data){
        sendResponse(data);
    });
};

var sendRefresh = function(){
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        console.log("sent refresh to tab " + tabs[0].id);
        chrome.tabs.sendMessage(tabs[0].id, {action: "refresh"}, function(response) {});
    });
};

function checkForValidUrl(tabId, changeInfo, tab) {
    console.log(tab.url);
    if(/^https?:\/\/(www.)?broadcasthe.net[\s\S]*$/.test(tab.url))
        chrome.pageAction.show(tabId);
};

chrome.tabs.onUpdated.addListener(checkForValidUrl);
