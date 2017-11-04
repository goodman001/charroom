function divEscapedContentElement(message){
    return $('<div></div>').text(message);
}
function linkContentElement(user){
    return $('<a></a>').text(user[1]);
}
function divSystemContentElement(message){
    return $('<div></div>').html('<i>'+message+'</i>');
}
function processUserInput(chatApp,socket){
    var message=$('#send-message').val();
    var systemMessage;
    var patt = new RegExp(/^[@]{1}[a-zA-Z0-9]+\s+\S+/);
    var n = patt.test(message);
    console.log(n);
    if( n== true && $('#room').text() !="no room"){
        systemMessage=chatApp.processPrivate(message);
        if(systemMessage){
            $('#messages').append(divSystemContentElement(systemMessage));
        }
    }else if($('#room').text() !="no room"){
        chatApp.sendMessage($('#room').text(),message);
        $('#messages').append(divSystemContentElement(message));
        $('#messages').scrollTop($('#messages').prop('scrollHeight'));
    }
    $('#send-message').val('');
}
function processCreateRoomNoPwd(chatApp,socket){
    var message=$('#send-name').val();
    console.log(message);
    if(message == null || message == ""){
        $('#messages').append(divSystemContentElement("Create room failure! Room name must be not empty!"));
    }else{
        var cmd = "join "+ message
        var systemMessage;
        systemMessage=chatApp.processCommand(cmd);
        if(systemMessage){
            $('#messages').append(divSystemContentElement(systemMessage));
        }
    }
    $('#send-name').val('');
}
function processCreateRoomPwd(chatApp,socket){
    var message=$('#send-name').val();
    var pwd = $('#send-pwd').val();
    console.log(message);
    console.log(pwd);
    if(message == null || message == "" || pwd == null || pwd == ""){
        $('#messages').append(divSystemContentElement("Create room failure! Room name or password must be not empty!"));
    }else{
        var cmd = "joinpwd "+ message + " " + pwd;
        var systemMessage;
        systemMessage=chatApp.processCommand(cmd);
        if(systemMessage){
            $('#messages').append(divSystemContentElement(systemMessage));
        }
    }
    $('#send-name').val('');
    $('#send-pwd').val('');
}