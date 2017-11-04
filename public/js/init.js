if(window.WebSocket){
    console.log('This browser supports WebSocket');
}else{
    console.log('This browser does not supports WebSocket');
}
var socket=io.connect();
$(document).ready(function(){
    var chatApp=new Chat(socket);
    socket.on('nameResult',function(result){
        var message;
        if(result.success){
            message='You are known as '+result.name+'.';
        }else{
            message=result.message;
        }
        console.log("nameResult:---"+message);
        $('#messages').append(divSystemContentElement(message));
        $('#nickName').text(result.name);
    });

    socket.on('joinResult',function(result){
        console.log('joinResult:---'+result);
        $('#room').text(result.room);
        $('#messages').append(divSystemContentElement('Room changed.'));
    });

    socket.on('message',function(message){
        console.log('message:---'+message);
        var newElement=$('<div></div>').text(message.text);
        $('#messages').append(newElement);
        $('#messages').scrollTop($('#messages').prop('scrollHeight'));
    });

    socket.on('rooms',function(rooms,users,roomspwd,currentroom,currentuserid){
        console.log('rooms:---'+rooms);
        rooms=JSON.parse(rooms);
		roomspwd=JSON.parse(roomspwd);
        currentroom=JSON.parse(currentroom);
        currentuserid = JSON.parse(currentuserid);
        users=JSON.parse(users);
        $('#user-list').empty();
        var flagowner = 0;
        for(var i=0;i<users.length;i++){
            if(users[i][0] == currentuserid && users[i][2] == "owner" ){
                flagowner = 1;// current users is owner
            }
        }
        $('#room-list').empty();
        for(var room in rooms){
			if(roomspwd[room] == ""){
                if(room == currentroom){
                    if(flagowner == 1 && currentroom !="Public"){
                        $('#room-list').append('<div class="active"><i class="fa fa-users" aria-hidden="true"></i><span id="'+ room +'span" >'+ room +'('+rooms[room]+')</span><button class="bandiv" id="'+ room +'">ban</button></div>');
                    }else{
                        $('#room-list').append('<div class="active"><i class="fa fa-users" aria-hidden="true"></i><span id="'+ room +'span" >'+ room +'('+rooms[room]+')</span></div>');
                    }
                }else{
            	    $('#room-list').append('<div ><i class="fa fa-users" aria-hidden="true"></i><span id="'+ room +'span" >'+ room +'('+rooms[room]+')</span><button class="nopwddiv" id="'+ room +'">join</button></div>');
                }
			}else if(roomspwd[room] != "#O#" && roomspwd[room] != ""){
				if(room == currentroom){
                    if(flagowner == 1 && currentroom !="Public"){
                        $('#room-list').append('<div  class="pwddiv active"><i class="fa fa-lock" aria-hidden="true"></i><span id="'+ room +'span" >'+ room +'('+rooms[room]+')</span><button class="bandiv" id="'+ room +'">ban</button></div>');
                    }else{
                        $('#room-list').append('<div  class="pwddiv active"><i class="fa fa-lock" aria-hidden="true"></i><span id="'+ room +'span" >'+ room +'('+rooms[room]+')</span></div>');
                    }
                }else{
                    $('#room-list').append('<div  class="pwddiv"><i class="fa fa-lock" aria-hidden="true"></i><span id="'+ room +'span" >'+ room +'('+rooms[room]+')</span> <input id="'+ room +'pwd" type="pwd" /> <button class="pwddiv" id="'+ room +'">join</button> </div>');
                }
			}else if(roomspwd[room] == "#O#"){
                if(room == currentroom){
                    $('#room-list').append('<div class="bandiv active"><i class="fa fa-hand-paper-o" aria-hidden="true"></i><span id="'+ room +'span" >'+ room +'('+room +')banned</span></div>');
                }else{
				    $('#room-list').append('<div class="bandiv"><i class="fa fa-hand-paper-o" aria-hidden="true"></i><span id="'+ room +'span" >'+ room +'('+room +')banned</span></div>');
                }
			}
        }
        $('#room-list div button').click(function(){
			var roomname = $(this).attr('id');
			var divname = $(this).attr('class');
			console.log(roomname);
			console.log(divname);
			if(divname == "nopwddiv"){
				chatApp.processCommand('join ' + roomname);
			}else if(divname == "pwddiv"){
				if($("#"+roomname + "pwd").val() !=""){
					if($("#"+roomname + "pwd").val() == roomspwd[roomname]  ){
						chatApp.processCommand('joinpwd ' + roomname + " " + roomspwd[roomname]);
					}
					else{
						$('#messages').append(divSystemContentElement("Chat room pwd is wrong"));
					}
				}else{
					 $('#messages').append(divSystemContentElement("Chat room pwd is wrong"));
				}
			}else if(divname == "bandiv"){
                chatApp.processCommand('ban '+ roomname);
            }
            //chatApp.processCommand('/join '+$(this).text().split(':')[0]);
            //$('#send-message').focus();
        });
        console.log('users:---'+users);
        
        for(var i=0;i<users.length;i++){
            console.log(users[i]);
            if(users[i][0] == currentuserid ){
                $('#user-list').append('<div><i class="fa fa-user-o" aria-hidden="true"></i><span>'+ users[i][1] +'('+ users[i][2] +') </span></div>');
            }else{
                if(flagowner == 1 ){
                    $('#user-list').append('<div><i class="fa fa-user-o" aria-hidden="true"></i><span>'+ users[i][1] +'('+ users[i][2] +') </span><button id="'+ users[i][0] +'">kick</button></div>');
                }else{
                    $('#user-list').append('<div><i class="fa fa-user-o" aria-hidden="true"></i><span>'+ users[i][1] +'('+ users[i][2] +') </span></div>');
                }
            }
           
        }
        $('#user-list div button').click(function(){
            var userid = $(this).attr('id');
            chatApp.processCommand('kick ' + userid);
            console.log(userid);
        });
    });
    setInterval(function(){
        socket.emit('rooms');
    },3000);

    $('#send-message').focus();
    $('#send-button').click(function(){
        processUserInput(chatApp,socket);
        $('#send-message').focus();
    });
	$('#send-name').focus();
	$('#send-room-nopwd').click(function(){
        //processCreateRoomNoPwd(chatApp,socket);
		console.log("hahah");
		processCreateRoomNoPwd(chatApp,socket);
        $('#send-name').focus();
    });
	$('#send-room-pwd').click(function(){
        //processCreateRoomNoPwd(chatApp,socket);
		console.log($('#send-name').val());
		processCreateRoomPwd(chatApp,socket);
    });
});