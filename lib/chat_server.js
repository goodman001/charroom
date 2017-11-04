const 
    socketio=require('socket.io');

var io,
    guestNumber=1,  //用户编号
    nickNames={},   //socket id对应的nickname
    namesUsed={},   //所有已使用的nickname
    allRooms={},    //聊天室--人数
    allRoomsPwd={}, //chat room -- pwd
    currentRoom={},//sockid--聊天室
    roomUsers={};
module.exports.listen=function(server){
    io=socketio.listen(server);
    io.serveClient('log level',1);
    io.sockets.on('connection',function(socket){
        guestNumber=assignGuestName(socket,guestNumber,nickNames);
        joinRoom(socket,'Public','');
        handleMessageBroadcasting(socket,nickNames);
        handleKickOne(socket);
        handleBanRoom(socket);
        handleMessagePerson(socket);
        handleNameChangeAttempts(socket,nickNames,namesUsed);
        handleRoomJoining(socket);
        socket.on('rooms',function(){
            console.log(currentRoom[socket.id]);
            console.log(roomUsers);
            console.log(allRoomsPwd);
            socket.emit('rooms',JSON.stringify(allRooms),JSON.stringify(roomUsers[currentRoom[socket.id]]),JSON.stringify(allRoomsPwd),JSON.stringify(currentRoom[socket.id]),JSON.stringify(socket.id));
        });
        handleClientDisconnection(socket,nickNames,namesUsed);
    });
};
//新socket连入，自动分配一个昵称
function assignGuestName(socket,guesetNumber,nickNames){
    var name='Guest'+guestNumber;
    nickNames[socket.id]=name;
    socket.emit('nameResult',{
        success:true,
        name:name
    });
    namesUsed[name]=1;
    return guestNumber+1;
}
//加入某个聊天室
function joinRoom(socket,room,pwd){
    socket.join(room);
    var owner = "";
    var num=allRooms[room];
    if(num===undefined){
        allRooms[room]=1;
        allRoomsPwd[room] = pwd;
        currentRoom[socket.id]=room;
        owner = socket.id;
        socket.emit('joinResult',{room:room});
        socket.emit('message',{
            text:nickNames[socket.id]+' create a new room '+room+'.'
        });
    }
    else{
        allRooms[room]=num+1;
        currentRoom[socket.id]=room;
        socket.emit('joinResult',{room:room});
        socket.broadcast.to(room).emit('message',{
            text:nickNames[socket.id]+' has join '+room+'.'
        });
    }
    

    var usersinRoom=io.sockets.adapter.rooms[room];
    if(usersinRoom != undefined &&  usersinRoom != null && usersinRoom.length>0){
        var usersInRoomSummary='Users currently in '+room+' : ';
		var users = [];
        for(var index in usersinRoom.sockets){
			if(checkInArray(index,roomUsers[room]) == -1) {
				if(nickNames.hasOwnProperty(index)){
                    if(owner != ""){
					    roomUsers[room].push([index,nickNames[index],"owner"]);
                    }else{
                        roomUsers[room].push([index,nickNames[index],"member"]);
                    }
				}
			}else if(checkInArray(index,roomUsers[room]) == -2){
				console.log("not is array");
				if(nickNames.hasOwnProperty(index)){
                    roomUsers[room] = [];
                    if(owner != ""){
					    roomUsers[room].push([index,nickNames[index],"owner"]);
                    }else{
                        roomUsers[room].push([index,nickNames[index],"member"]);
                    }
				}
			}else{
                console.log("exist");
                if(nickNames.hasOwnProperty(index)){
                    if(owner != ""){
					    roomUsers[room][checkInArray(index,roomUsers[room])] = [index,nickNames[index],roomUsers[room][checkInArray(index,roomUsers[room])][2]];
                    }else{
                        roomUsers[room][checkInArray(index,roomUsers[room])] = [index,nickNames[index],roomUsers[room][checkInArray(index,roomUsers[room])][2]];
                    }
					//roomUsers[room][checkInArray(index,roomUsers[room])] = [index,nickNames[index]];
				}
            }
            if(index!=socket.id){
                usersInRoomSummary+=nickNames[index]+',';
            }
        }
		//console.log("room Users");
		//console.log(roomUsers[room]);
        socket.emit('message',{text:usersInRoomSummary}); 
    }
}
function handleKickOne(socket){
    socket.on('kick',function(userid){
        var users = roomUsers[currentRoom[socket.id]];
        var flag = -1;
        if(users != undefined && users != null){
            for(var i=0;i<users.length;i++){
                if(users[i][0] == userid){
                    flag = i;
                }
            }
        }
        if(flag >=0){
            var roomname = currentRoom[socket.id];
            roomUsers[currentRoom[socket.id]].splice(flag,1);
            --allRooms[currentRoom[socket.id]];
            delete currentRoom[userid];
            socket.emit('message',{
                text:nickNames[userid]+' has been kick from this room'
            });
            socket.broadcast.to(userid).emit('joinResult',{room:"no room"});
            socket.broadcast.to(userid).emit('message',{
                text:'You have been kick from '+roomname+'.'
            });
            
            
        }
    });
    
}
function handleBanRoom(socket){
    socket.on('ban',function(room){
        allRoomsPwd[room] = '#O#';
        socket.broadcast.to(room).emit('message',{
            text:room +' has been ban .'
        });
    });
}
//修改昵称
function handleNameChangeAttempts(socket,nickNames,namesUsed){
    socket.on('nameAttempt',function(name){
        if(name.indexOf('Guest')==0){
            socket.emit('nameResult',{
                success:false,
                message:'Names cannot begin with "Guest".'
            });
        }else{
            if(namesUsed[name]==undefined){
                var previousName=nickNames[socket.id];
                delete namesUsed[previousName];
                namesUsed[name]=1;
                nickNames[socket.id]=name;
                socket.emit('nameResult',{
                    success:true,
                    name:name
                });
                socket.broadcast.to(currentRoom[socket.id]).emit('message',{
                    text:previousName+' is now known as '+name+'.'
                });
            }else{
                socket.emit('nameResult',{
                    success:false,
                    message:'That name is already in use.'  
                });
            }
        }
    });                                                                        
}
//将某个用户的消息广播到同聊天室下的其他用户
function handleMessageBroadcasting(socket){
    socket.on('message',function(message){
        console.log('message:---'+JSON.stringify(message));
        socket.broadcast.to(message.room).emit('message',{
            text:nickNames[socket.id]+ ': '+message.text
        });
    });
}
/*private message*/
function handleMessagePerson(socket){
    socket.on('privatemessage',function(message){
        console.log('privatemessage:---'+JSON.stringify(message));
        targetid = -1;
        for(userid in nickNames){
            if(nickNames[userid] == message.target){
                targetid = userid;
                break;
            }
        }
        if(targetid != -1){
            socket.broadcast.to(targetid).emit('message',{
                text:nickNames[socket.id]+ ' send you a private message: '+message.text
            });
        }else{
            socket.emit('message',{
                text:nickNames[targetid]+ ' is off line.'
            });
        }
    });
}

//加入/创建某个聊天室
function handleRoomJoining(socket){
    socket.on('join',function(room){
        if (currentRoom.hasOwnProperty(socket.id)){
            var temp=currentRoom[socket.id];
            for(var key in roomUsers){
                var flag = checkInArray(socket.id,roomUsers[key]);
                console.log("flag:" + flag);
                if(flag >=0) {
                    roomUsers[key].splice(flag,1);
                }
                if(roomUsers[key].length == 0){
                    delete roomUsers[key];
                }
            }

            delete currentRoom[socket.id];
            socket.leave(temp);
            var num=--allRooms[temp];
            if(num==0){
                delete allRooms[temp];
                delete allRoomsPwd[temp];
            }
        }
        
        joinRoom(socket,room.newRoom,room.pwd);
    });
}
//socket断线处理
function handleClientDisconnection(socket){
    socket.on('disconnect',function(){
        console.log("xxxx disconnect");
        var temp = currentRoom[socket.id];
        var flag = checkInArray(socket.id,roomUsers[temp]);
        if(flag >=0) {
                roomUsers[temp].splice(flag,1);
        }
        if(roomUsers[temp].length == 0){
                delete roomUsers[temp];
        }
        allRooms[temp]--;
        if(allRooms[temp]==0){
            delete allRooms[temp];
            delete allRoomsPwd[temp];
        }
        delete namesUsed[nickNames[socket.id]];
        delete nickNames[socket.id];
        delete currentRoom[socket.id];
    })
}
function checkInArray(index,arr){     
    try{
        // 遍历是否在数组中   
        for(var i=0,k=arr.length;i<k;i++){   
            if(index==arr[i][0]){  
                return i;       
            }   
        }   
    }
    catch(e){
        return -2;
    }
    // 如果不在数组中就会返回false   
    return -1;   
}  