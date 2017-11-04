var Chat=function(socket){
    this.socket=socket;//绑定socket
}
//发送消息
Chat.prototype.sendMessage=function(room,text){
    var message={
        room:room,
        text:text
    };
    this.socket.emit('message',message);
};
//变更房间
Chat.prototype.changeRoom=function(room,pwd){
    this.socket.emit('join',{
        newRoom:room,pwd:pwd
    });
};
//kick some one
Chat.prototype.kickSomeOne=function(userid){
    this.socket.emit('kick',{
        userid:userid
    });
};
//处理聊天命令
Chat.prototype.processPrivate=function(command){
    var words=command.split(' ');
    var target = words[0].substring(1,words[0].length);
    var message={
        target:target,
        text:command.replace(/^@[a-zA-Z0-9]+\s+/,"")
    };
    console.log(message);
    this.socket.emit('privatemessage',message);
    return "Send a private message to " + target +" : " + message.text;
}
Chat.prototype.processCommand=function(command){
    var words=command.split(' ');
    //var command=words[0].substring(1,words[0].length).toLowerCase();
    var command=words[0].toLowerCase();
    var message=false;

    switch(command){
        case 'join':
            words.shift();
            var room=words.join(' ');
            this.changeRoom(room,"");
            break;
        case 'joinpwd':
            var pwd = words[2];
            var room=words[1];
            this.changeRoom(room,pwd);
            break;
        case 'kick':
            var userid = words[1]
            this.socket.emit('kick',userid);
            break;
        case 'ban':
            var name=words[1];
            this.socket.emit('ban',name);
            break;
        case 'nick':
            words.shift();
            var name=words.join(' ');
            this.socket.emit('nameAttempt',name);
            break;
        default:
            message='Unrecognized command.';
            break;
    }
    return message;
}; 