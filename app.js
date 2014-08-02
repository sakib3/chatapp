console.log('Server started.');
var express = require('express'),
	app = express(),
	server = require('http').createServer(app),
	io = require('socket.io').listen(server),
	mongoose = require('mongoose'),
	users = {};

server.listen(3000);

//connect to database
mongoose.connect('mongodb://localhost/chat', function(err){
	if (err) {
		console.log(err);
	} else{
		console.log('Connected to the mongodb');
	}
});
//define schema for mongo document
var chatSchema = mongoose.Schema({
    atricleid: { type: String, default: "bike" },
	nick: String,
    to: { type: String, default: "all" },
	msg: String,
	created: { type: Date, default: Date.now }
});

//define collection in mongo document
var Chat = mongoose.model('Message', chatSchema);

//create a route
app.get('/', function(req, res){
	//show the index.html when get a request
	res.sendfile(__dirname +'/index.html');
});

//receive the event from client
io.sockets.on('connection', function(socket){

    Chat.find({},function(err,docs){
        if(err) throw err;
        console.log('Sending old msg!');
        socket.emit('load old msgs', docs);
    });

    //limit the query: get last 8 conversation
    //var query = Chat.find({});
    //query.sort('-created').limit(8).exec(function(err,docs){});

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
        //console.log(msg);
		//if first three char is matched then whispering
		if(msg.substr(0,1) === '#'){
			msg = msg.substr(1);
			//get the index of the space, after whisper name then space and then msg
			var ind = msg.indexOf(' ');
			if(ind !== -1){
				var name = msg.substring(0, ind);
				var msg = msg.substring(ind + 1 );
				if(name in users){
                    var newMsg = new Chat({ msg:msg, to:name, nick:socket.nickname });

                    newMsg.save(function(err){
                        if(err)
                            throw err;

                        //unicast the received msg to the receiver
                        users[name].emit('new message', { msg:msg, to:name,nick:socket.nickname });
                        //unicast the received msg to the sender to have his copy
                        users[socket.nickname].emit('new message', { msg:msg, to:name,nick:socket.nickname });

                        //broadcast the received msg to all including the sender
                        //io.sockets.emit('new message', { msg:msg, nick:socket.nickname });
                    });
					//console.log('Whisper!');
				} else{
					callback('Error! Enter a valid user.');
				}
				
			} else{
				callback('Error! Please enter a message for your Whisper.');
			}
			
		} else{
            callback('Error! Please select a user.');
			
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