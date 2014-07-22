var express = require('express'),
	app = express(),
	server = require('http').createServer(app),
	io = require('socket.io').listen(server)
	nicknames = [];

server.listen(3000);

//create a route
app.get('/', function(req, res){
	//show the index.html when get a request
	res.sendfile(__dirname +'/index.html');
});

//receive the event from client
io.sockets.on('connection', function(socket){
	socket.on('new user', function(data, callback){
		if(nicknames.indexOf(data) !=-1){
			callback(false);
		} else{
			callback(true);
			socket.nickname = data;
			nicknames.push(socket.nickname);
			updateNicknames();
		}
	});

	function updateNicknames(){
		io.sockets.emit('usernames', nicknames);
	}
	//send message
	socket.on('send message', function(data){
		//broadcast the received msg to all including the sender
		io.sockets.emit('new message', { msg:data, nick:socket.nickname });
		//broadcast the received msg to all except the sender
		//io.broadcast.emit('new message', data);
	});


	//Whenever a user disconnect from the server then this events emit
	socket.on ('disconnect',function(data){
		if(!socket.nickname) return;
		//remove that clinet from the array
		nicknames.splice(nicknames.indexOf(socket.nickname), 1);
		updateNicknames();
	});
});