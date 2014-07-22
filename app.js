console.log('Server started.');
var express = require('express'),
	app = express(),
	server = require('http').createServer(app),
	io = require('socket.io').listen(server)
	users = {};

server.listen(3000);

//create a route
app.get('/', function(req, res){
	//show the index.html when get a request
	res.sendfile(__dirname +'/index.html');
});

//receive the event from client
io.sockets.on('connection', function(socket){
	socket.on('new user', function(data, callback){
		if(data in users){
			callback(false);
		} else{
			callback(true);
			socket.nickname = data;
			users[socket.nickname] = socket;
			updateNicknames();
		}
	});

	function updateNicknames(){
		io.sockets.emit('usernames', Object.keys(users));
	}
	//send message
	socket.on('send message', function(data, callback){
		//remove the whitespace
		var msg = data.trim();
		//if first three char is matched then whispering
		if(msg.substr(0,3) === '/w '){
			msg = msg.substr(3);
			//get the index of the space, after whisper name then space and then msg
			var ind = msg.indexOf(' ');
			if(ind !== -1){
				var name = msg.substring(0, ind);
				var msg = msg.substring(ind + 1 );
				if(name in users){
					users[name].emit('whisper', { msg:msg, nick:socket.nickname });
					//console.log('Whisper!');
				} else{
					callback('Error! Enter a valid user.');
				}
				
			} else{
				callback('Error! Please enter a message for your Whisper.');
			}
			
		} else{
			//broadcast the received msg to all including the sender
			io.sockets.emit('new message', { msg:msg, nick:socket.nickname });
			//broadcast the received msg to all except the sender
			//io.broadcast.emit('new message', data);
		}
		
	});


	//Whenever a user disconnect from the server then this events emit
	socket.on ('disconnect',function(data){
		if(!socket.nickname) return;
		//remove that clinet from the object
		delete users[socket.nickname];
		updateNicknames();
	});
});