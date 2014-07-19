var express = require('express'),
	app = express(),
	server = require('http').createServer(app),
	io = require('socket.io').listen(server);

server.listen(3000);

//create a route
app.get('/', function(req, res){
	//show the index.html when get a request
	res.sendfile(__dirname +'/index.html');
});

//receive the event from client
io.sockets.on('connection', function(socket){
	socket.on('send message', function(data){
		//broadcast the received msg to all including the sender
		io.sockets.emit('new message', data);
		//broadcast the received msg to all except the sender
		//io.broadcast.emit('new message', data);
	})
});