/**
 * Created by cheezburgah on 8/02/15.
 */

/**
 * uses background.js message passing as we do not have permission to access
 * chrome.storage.sync from this location
 * @param k -> key
 * @param cb -> obj with {key, value}
 */
var getValue = function(k, cb) {
    chrome.runtime.sendMessage({action: "get", key: k}, function(response) {
        console.log("value is " + JSON.stringify(response));
       if(!response.value){
           setValue(k, "true", function(){
               response.value = "true";
               cb(response);
           })
       }else {
           cb(response);
       }
    });
};

/**
 * uses background.js message passing as we do not have permission to access
 * chrome.storage.sync from this location
 * @param k -> key
 * @param v -> value
 * @param cb -> nothing
 */
var setValue = function(k, v, cb){
    chrome.runtime.sendMessage({action: "set", key: k, value: v}, function() {
        cb();
    });
};

/**
// function is used to create a button for the pop! settings
// @param string key -> the text of the button, what setting they will be toggling
// @param boolean result -> the color of the button, red = disabled & green = enabled
// returns a <button> tag
 */
var createButton = function(key, result){
    var btn = "<button class='pure-button";
    if(result == "true")
        btn = btn + " button-success";
    else if(result == "false")
        btn = btn + " button-error";
    btn = btn + "'>" + key + "</button> "
    return btn;
};

/**
// self executing anon function
// automatically populates the settings page based on the contents of settings.json
 */
(function(){
    // read the different types of settings
    $.getJSON ( "settings.json" , function(data) {
        $.each (data, function ( key, val ){
            for (var i in val) {
                getValue(val[i], function(result){
                    var button = createButton(result.key, result.value);
                    $("#" + key).append(button);
                });
            }
        });
    });
    // add toggles for all the buttons
    $(document.body).on('click', 'button', function(){
        var self = this;
        var key = $( self ).text();
        getValue(key, function(result){
            if(result.value == "true"){
                setValue(key, "false", function(){
                    $( self ).removeClass('button-success').addClass('button-error');
                });
            } else if(result.value == "false"){
                setValue(key, "true", function(){
                    $( self ).removeClass('button-error').addClass('button-success');
                });
            } else{
                console.log("Something unexpected happened! The result was neither true or false")
            }
        });
    });
    //when you click on save button the page closes
    $("#save").on('click', function(){
        window.close();
        chrome.runtime.sendMessage({action: "refresh"}, function(){});
    });
})();