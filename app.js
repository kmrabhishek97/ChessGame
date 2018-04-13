
var mongojs = require('mongojs');
var db = mongojs('127.0.0.1:27017/chessGame', ['account']);

var express = require('express');
var app = express();
app.use(express.static('public'));
app.use(express.static('dashboard'));
var serv = require('http').Server(app);

var bodyParser = require('body-parser');
var multer = require('multer');
var upload = multer(); 
var session = require('express-session');
var cookieParser = require('cookie-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); 
app.use(upload.array());
app.use(cookieParser());
app.use(session({secret: "AjsbjGvFCdFYuIOJhJngNHjsDkd"}));

var jQuery = require('jquery');
var $ = require('jquery');

var lobbyUsers = {};
var users = {};
var activeGames = {};
var username1="";
var user=[];


app.get('/', function(req, res){
	res.sendFile(__dirname + '/client/index.html');
});


app.get('/game/',checkSignIn, function(req, res) {
 res.sendFile(__dirname + '/public/game.html');

});

app.get('/dashboard/', checkSignIn, function(req, res) {
 res.sendFile(__dirname + '/dashboard/dashboard.html');
});

app.get('/loggedin', function(req,res){
	res.sendFile(__dirname + '/client/loggedin.html');
});

app.get('/login', function(req,res){
	if(req.session.user){
		res.redirect('loggedin');
	}
	else{
		res.sendFile(__dirname + '/client/login.html');
	}
});

app.post('/login', function(req,res){
	var data={username:req.body.username,password:req.body.password};
	var flag=false;
	isValidPassword(data, function(result){
		if(result){
			for(var i=0;i<user.length;i++){
				if(user[i]==req.body.username)
				{
					flag=true;
					res.redirect('login');
					break;
				}
			}
			if(flag==false){
				user.push(data.username);
			//res.sendFile(__dirname+'/public/game.html');
			req.session.user=data;
			console.log('User logged in successfully!');
			res.redirect('game');
			}
		}
		else{
			//res.sendFile(__dirname+'/client/login.html');
			res.redirect('login');
		}
	});
});

app.get('/signup', function(req,res){
	res.sendFile(__dirname + '/client/signup.html');
});

app.post('/signup', function(req, res){
	var data={username:req.body.email,name:req.body.username,password:req.body.password};
	isUsernameTaken(data,function(result){
			if(result){
				console.log('Signup failed');
				res.redirect('signup');
			}
			else{
				addUser(data, function(){
					console.log('Signed up successfully');
					res.redirect('login');
				});
			}
		});
});

app.get('/loggedin', function(req,res){
	res.sendFile(__dirname + '/client/loggedin.html');
});

app.get('/logout', function(req,res){
	var i=user.indexOf(req.session.user.username);
	console.log(i);
	delete user[i];
	req.session.destroy(function(){
		console.log("User logged out!!");
	});
	res.redirect('login');
});

app.get('/css/font-awesome.min.css', function(req,res){
	res.sendFile(__dirname + '/client/css/font-awesome.min.css');
});
app.get('/css/animate.css', function(req,res){
	res.sendFile(__dirname + '/client/css/animate.css');
});
app.get('/css/bootstrap.min.css', function(req,res){
	res.sendFile(__dirname + '/client/css/bootstrap.min.css');
});
app.get('/css/main.css', function(req,res){
	res.sendFile(__dirname + '/client/css/main.css');
});


app.use('/client', express.static(__dirname + '/client'));

serv.listen(2000);
console.log('Server started');

var DEBUG = true;

var isValidPassword = function(data,cb){
	db.account.find({username:data.username,password:data.password},function(err,res){
		if(res.length > 0){
			username1 = data.username;
			cb(true);
		}
		else
			cb(false);
	});
}
var isUsernameTaken = function(data,cb){
	db.account.find({username:data.username},function(err,res){
		if(res.length > 0)
		{
			cb(true);
		}
		else
			cb(false);
	});
}
var addUser = function(data,cb){
	db.account.insert({username:data.username,name:data.name,password:data.password},function(err){
		cb();
	});
}

function checkSignIn(req,res,next){
	if(req.session.user){
		next();
	}
	else{
		var err=new Error("Not logged in!!!");
		console.log(req.session.user);
		next(err);//Error, trying to access unauthorized page
	}
}


var io=require('socket.io')(serv,{});
io.sockets.on('connection', function(socket){
	/*socket.on('signIn',function(data){
		isValidPassword(data,function(res){
			if(res){
				socket.emit('signInResponse',{success:true});
				console.log('Signed in');
			}
			else{
				socket.emit('signInResponse',{success:false});
			}
		});
	});
	
	socket.on('signUp', function(data){
		isUsernameTaken(data,function(res){
			if(res){
				socket.emit('signUpResponse',{success:false});
			}
			else{
				addUser(data, function(){
					socket.emit('signUpResponse',{success:true});
					console.log('Signed up successfully');
				});
			}
		});
	});*/
	
	socket.on('get-username', function(){
		socket.emit('receive-username',{name:username1});
	});
	
	
	
	console.log('new connection ' + socket);
    
    socket.on('login', function(userId) {
       doLogin(socket, userId);
    });

    function doLogin(socket, userId) {
        socket.userId = userId;  
     
        if (!users[userId]) {    
            console.log('creating new user');
            users[userId] = {userId: socket.userId, games:{}};
        } else {
            console.log('user found!');
            Object.keys(users[userId].games).forEach(function(gameId) {
                console.log('gameid - ' + gameId);
            });
        }
        
        socket.emit('login', {users: Object.keys(lobbyUsers), 
                              games: Object.keys(users[userId].games)});
        lobbyUsers[userId] = socket;
        
        socket.broadcast.emit('joinlobby', socket.userId);
    }
    
    socket.on('invite', function(opponentId) {
		io.sockets.emit("inviter-invitee-pair",{'inviter':socket.userId,'invitee':opponentId});
	});
		
	socket.on("invitation-accepted", function(data){
		//console.log("Invitation accepted..inviter "+data.inviter+"...invitee "+data.invitee);
		io.sockets.emit("transfer-inviter-invitee-pair-to-inviter",{'inviter':data.inviter,'invitee':data.invitee});
	});
	
	socket.on("invitation-rejected", function(data){
		//console.log("Invitation accepted..inviter "+data.inviter+"...invitee "+data.invitee);
		io.sockets.emit("inform-rejection-to-inviter",{'inviter':data.inviter,'invitee':data.invitee});
	});
	
	socket.on("undo-invite",function(data){
		io.sockets.emit("inform-undo-to-invitee",{'inviter':data.inviter,'invitee':data.invitee});
	});
	
	socket.on("start-game",function(data){
			console.log("Game started");
			opponentId=data.invitee;
			console.log('got an invite from: ' + socket.userId + ' --> ' + opponentId);
			socket.broadcast.emit('leavelobby', socket.userId);
			socket.broadcast.emit('leavelobby', opponentId);
		  
			socket.emit("your-opponent",opponentId);
			
			var game = {
				id: Math.floor((Math.random() * 100) + 1),
				board: null, 
				users: {white: socket.userId, black: opponentId}
			};
			
			socket.gameId = game.id;
			activeGames[game.id] = game;
			
			users[game.users.white].games[game.id] = game.id;
			users[game.users.black].games[game.id] = game.id;
	  
			console.log('starting game: ' + game.id);
			lobbyUsers[game.users.white].emit('joingame', {game: game, color: 'white'});
			lobbyUsers[game.users.black].emit('joingame', {game: game, color: 'black'});
			
			delete lobbyUsers[game.users.white];
			delete lobbyUsers[game.users.black];   
			
			socket.broadcast.emit('gameadd', {gameId: game.id, gameState:game});
		
	});
    
	
	socket.on("send-message", function(data){
		console.log("message received "+data.message+" from "+ socket.userId+" to "+data.receiver);
		io.sockets.emit("new-message",{msg:data.message, sender:socket.userId, receiver:data.receiver});
	});
    
     socket.on('resumegame', function(gameId) {
        console.log('ready to resume game: ' + gameId);
         
        socket.gameId = gameId;
        var game = activeGames[gameId];
        
        users[game.users.white].games[game.id] = game.id;
        users[game.users.black].games[game.id] = game.id;
  
        console.log('resuming game: ' + game.id);
        if (lobbyUsers[game.users.white]) {
            lobbyUsers[game.users.white].emit('joingame', {game: game, color: 'white'});
            delete lobbyUsers[game.users.white];
        }
        
        if (lobbyUsers[game.users.black]) {
            lobbyUsers[game.users.black] && 
            lobbyUsers[game.users.black].emit('joingame', {game: game, color: 'black'});
            delete lobbyUsers[game.users.black];  
        }
    });
    
    socket.on('move', function(msg) {
        socket.broadcast.emit('move', msg);
        activeGames[msg.gameId].board = msg.board;
        console.log(msg);
    });
	
	socket.on('transfer-move', function(data){
		if(data.moves!=null){
			console.log(data.moves.from+"------->"+data.moves.to+"----->"+data.receiver);
			io.sockets.emit("broadcast-move", {from:data.moves.from, to:data.moves.to, mover:socket.userId, receiver:data.receiver});
		}
		
	});
    
    socket.on('resign', function(msg) {
        console.log("resign: " + msg);
		
        delete users[activeGames[msg.gameId].users.white].games[msg.gameId];
        delete users[activeGames[msg.gameId].users.black].games[msg.gameId];
        delete activeGames[msg.gameId];
		
	io.sockets.emit("resign-match-delete-chat",{username:msg.userId,opponent:msg.opponent});
        socket.broadcast.emit('resign', msg);
    });
    

    socket.on('disconnect', function(msg) {
        
      console.log(msg);
      
      if (socket && socket.userId && socket.gameId) {
        console.log(socket.userId + ' disconnected');
        console.log(socket.gameId + ' disconnected');
      }
      
      delete lobbyUsers[socket.userId];
      
      socket.broadcast.emit('logout', {
        userId: socket.userId,
        gameId: socket.gameId
      });
    });
    
    /////////////////////
    // Dashboard messages 
    /////////////////////
    
    socket.on('dashboardlogin', function() {
        console.log('dashboard joined');
        socket.emit('dashboardlogin', {games: activeGames}); 
    });
	
});