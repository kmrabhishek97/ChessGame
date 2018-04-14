
(function () {
    
    WinJS.UI.processAll().then(function () {
      
      var socket, serverGame;
      var username, playerColor;
      var game, board;
      var usersOnline = [];
      var myGames = [];
	  var myOpponent="";
      socket = io();
      //////////////////////////////
      // Socket.io handlers
      ////////////////////////////// 
      
      socket.on('login', function(msg) {
            usersOnline = msg.users;
            updateUserList();
            
            myGames = msg.games;
            updateGamesList();
      });
      
      socket.on('joinlobby', function (msg) {
        addUser(msg);
      });
      
       socket.on('leavelobby', function (msg) {
        removeUser(msg);
      });
      
      socket.on('gameadd', function(msg) {
      });
      
      socket.on('resign', function(msg) {
            if (msg.gameId == serverGame.id) {

              socket.emit('login', username);

              $('#page-lobby').show();
              $('#page-game').hide();
			  $('#frame').hide();
            }            
      });
                  
      socket.on('joingame', function(msg) {
        console.log("joined as game id: " + msg.game.id );   
        playerColor = msg.color;
        initGame(msg.game);
        
        $('#page-lobby').hide();
        $('#page-game').show();
		$('#frame').show();
		//$('#page-game').style.display='inline';
        
      });
        
      socket.on('move', function (msg) {
        if (serverGame && msg.gameId === serverGame.id) {
           game.move(msg.move);
           board.position(game.fen());
        }
      });
     
      
      socket.on('logout', function (msg) {
        removeUser(msg.username);
      });
	  
	  socket.on('receive-username', function(data){
		username = data.name; 
		if (username.length > 0) {
			
            $('#userLabel').text(username);
            socket.emit('login', username);
			
        } 
	  });
		socket.on("your-opponent",function(data){
			myOpponent=data;
			//socket.emit("opponent",myOpponent);
		});
		
		socket.on("new-message",function(data){
			//alert("message sent from "+data.sender+" to "+data.receiver);
			//alert("Your username "+username+" and your opponent "+myOpponent);
			if(data.sender===username && data.receiver===myOpponent){
				//alert("This if is not working");
				//alert("message sent from "+data.sender+" to "+data.receiver);
				//$('#chat').append("<b>You"+"</b> : "+data.msg+"<br/>");
				
				
				$('<li class="replies"><p>' + data.msg + '</p></li>').appendTo($('.messages ul'));
				//$('.contact.active .preview').html('<span>You: </span>' + message);
				$(".messages").animate({ scrollTop: $('.content').height() }, "fast");
				
				//$('#messagelist').append('<li class="replies"><p>'+data.msg + '</p></li>');
			}
			else if(data.sender===myOpponent && data.receiver===username){
				//$('#chat').append("<b>"+data.sender+"</b> : "+data.msg+"<br/>");
				
				$('<li class="sent"><p>' + data.msg + '</p></li>').appendTo($('.messages ul'));
				//$('.contact.active .preview').html('<span>You: </span>' + message);
				$(".messages").animate({ scrollTop: $('.content').height() }, "fast");
				
				
				//$('#messagelist').append('<li class="sent"><p>'+ data.msg + '</p></li>');

			}
		});
		
		socket.on('inviter-invitee-pair',function(data){
			if(data.invitee===username){
				// invitee_seconds=10000;
				// timer_invitee=setInterval(function(){
					// //$("#timer").val(''+seconds/1000);
					// document.getElementById('timer').innerHTML=''+invitee_seconds/1000;
					// invitee_seconds=invitee_seconds-1000;
					// if(invitee_seconds==0){
						// clearInterval(timer_invitee);
					// }
				// },1000);
				$.confirm({
					'title'		: 'Invitation from '+data.inviter,
					'message'	: data.inviter+" invited you to play chess",
					'buttons'	: {
							'Play Now': 
							{
								'class'	: 'blue',
								'action': function(){
									myOpponent=data.inviter;
									//alert("you clicked accept...your opponent "+myOpponent);
									socket.emit("invitation-accepted",{"inviter":data.inviter,"invitee":data.invitee});	
								}
							},
							'Decline': 
							{
									'class'	: 'gray',
									'action': function(){
										//alert("you clicked decline");
										socket.emit("invitation-rejected",{"inviter":data.inviter,"invitee":data.invitee});
										// clearInterval(timer_invitee);
										// clearInterval(timer_inviter);
										//invitee_seconds=10000;
									}	// Nothing to do in this case. You can as well omit the action property.
								}
							}
					// open:function(event, ui){
						// setTimeout(function(){
							// $.confirm.hide();
						// },5000);
					// }
				});
				// setTimeout(function(){
					// $.confirm.hide();
				// },10000);
				
			}
			else if(data.inviter===username){
				$.confirm({
					'title'		: "Awaiting Opponent's Response",
					'message'	: "Please wait while "+data.invitee+" responds.",
					'buttons'	: {
						'Undo Invite': 
							{
								'class'	: 'blue',
								'action': function(){
									socket.emit("undo-invite",{"inviter":data.inviter,"invitee":data.invitee});
								}
							}
						}
				});
				// setTimeout(function(){
					// $.confirm.hide();
				// },10000);
				// inviter_seconds=10000;
				// timer_inviter=setInterval(function(){
					// //$("#timer").val(''+seconds/1000);
					// document.getElementById('timer').innerHTML=''+inviter_seconds/1000;
					// inviter_seconds=inviter_seconds-1000;
					// if(inviter_seconds==0){
						// clearInterval(timer_inviter);
					// }
				// },1000);
			}
		});
		
		socket.on('inform-rejection-to-inviter',function(data){
			if(data.inviter===username){
				// clearInterval(timer_inviter);
				// clearInterval(timer_invitee);
				// inviter_seconds=10000;
				$.confirm.hide();
			}
		});
		
		socket.on("transfer-inviter-invitee-pair-to-inviter",function(data){
			if(data.inviter===username){
				$.confirm.hide();
				socket.emit("start-game",{"inviter":data.inviter,"invitee":data.invitee});
			}
		});
		
		socket.on("inform-undo-to-invitee",function(data){
			if(data.invitee===username){
				$.confirm.hide();
			}
		});
			
		socket.on("resign-match-delete-chat",function(data){
			if((data.username===username && data.opponent===myOpponent)){
					//$.confirm.hide();
					$.confirm({
						'title'		: "You Lose",
						'message'	: "You have lost the game to "+myOpponent,
						'buttons'	: {
							
						}
					});
					// var w = window.open('','','width=100,height=100');
					// w.document.write('You Lose');
					// w.focus();
					setTimeout(function() {
						//alert("You lose");
						//w.close();
						$.confirm.hide();
						socket.emit('login', username);
						$('#page-game').hide();
						$('#page-lobby').show();
					}, 5000);
					
					document.getElementById("messagelist").innerHTML="";
					document.getElementById("opponentmoves").innerHTML="<h3>Your Opponent</h3>";
					document.getElementById("yourmoves").innerHTML="<h3>You<h3>";
				}
				
			else if((data.username===myOpponent && data.opponent===username)){
				$.confirm({
					'title'		: "Congratulations!!!",
					'message'	: myOpponent+" has left the game.<br/><br/>You Win",
					'buttons'	: {
						
					}
				});
				setTimeout(function() {
					$.confirm.hide();
					//socket.emit('login', username);
					$('#page-game').hide();
					$('#page-lobby').show();
				}, 5000);
				document.getElementById("messagelist").innerHTML="";
				document.getElementById("opponentmoves").innerHTML="<h3>Your Opponent</h3>";
				document.getElementById("yourmoves").innerHTML="<h3>You<h3>";
			}
		});
		
		
		socket.on("broadcast-move", function(data){
			if(data.mover===username && data.receiver===myOpponent){
				//alert("You moved "+data.from+"----->"+data.to);
				$('#yourmoves').append(data.from+"------>"+data.to+"<br/>");
				
			}
			else if(data.mover===myOpponent && data.receiver===username){
				//alert("Your opponent "+data.receiver+" moved "+data.from+"----->"+data.to);
				$('#opponentmoves').append(data.from+"------>"+data.to+"<br/>");
			}
		});
      
      //////////////////////////////
      // Menus
      ////////////////////////////// 
      $(document).ready(function() {
		  
		  socket.emit('get-username');		 
        
	  });
	  
	  
	  
	  $('#send').on('click',function(){
			//alert("ready to send message");
			if(!($('.message-input input').val()==="")){
				socket.emit('send-message',{message:$('.message-input input').val(),receiver:myOpponent});
				//alert("message sent");
				$('.message-input input').val('');
			}
			
		});
		
		$(window).on('keydown', function(e) {
		  if (e.which == 13) {
			if(!($('.message-input input').val()==="")){
				socket.emit('send-message',{message:$('.message-input input').val(),receiver:myOpponent});
				//alert("message sent");
				$('.message-input input').val('');
			}
			return false;
		  }
		});
	  
	  
      
      $('#game-back').on('click', function() {
        socket.emit('login', username);
        
        $('#page-game').hide();
        $('#page-lobby').show();
      });
      
      $('#game-resign').on('click', function() {
		//document.getElementById("chat").innerHTML="";
		$.confirm({
					'title'		: 'Warning',
					'message'	: "If you quit, you will lose the game...",
					'buttons'	: {
							'Quit Game': 
							{
								'class'	: 'blue',
								'action': function(){
									// $.confirm.hide();
									socket.emit('resign', {userId: username, gameId: serverGame.id,opponent:myOpponent});	
								}
							},
							'Cancel': 
							{
									'class'	: 'gray',
									'action': function(){
										
									}	// Nothing to do in this case. You can as well omit the action property.
								}
							}
				});
        
      });
      
      var addUser = function(userId) {
        usersOnline.push(userId);
        updateUserList();
      };
    
     var removeUser = function(userId) {
          for (var i=0; i<usersOnline.length; i++) {
            if (usersOnline[i] === userId) {
                usersOnline.splice(i, 1);
            }
         }
         
         updateUserList();
      };
      
      var updateGamesList = function() {
        document.getElementById('gamesList').innerHTML = '';
        myGames.forEach(function(game) {
          $('#gamesList').append($('<button>')
                        .text('#'+ game)
                        .on('click', function() {
                          socket.emit('resumegame',  game);
                        }));
        });
      };
      
      var updateUserList = function() {
        document.getElementById('userList').innerHTML = '';
        usersOnline.forEach(function(user) {
          $('#userList').append($('<button>')
                        .text(user)
                        .on('click', function() {
                          socket.emit('invite',  user);
                        }));
        });
      };
           
      //////////////////////////////
      // Chess Game
      ////////////////////////////// 
      
      var initGame = function (serverGameState) {
        serverGame = serverGameState; 
        
          var cfg = {
            draggable: true,
            showNotation: false,
            orientation: playerColor,
            position: serverGame.board ? serverGame.board : 'start',
            onDragStart: onDragStart,
            onDrop: onDrop,
            onSnapEnd: onSnapEnd
          };
               
          game = serverGame.board ? new Chess(serverGame.board) : new Chess();
          board = new ChessBoard('game-board', cfg);
      }
       
      // do not pick up pieces if the game is over
      // only pick up pieces for the side to move
      var onDragStart = function(source, piece, position, orientation) {
        if (game.game_over() === true ||
            (game.turn() === 'w' && piece.search(/^b/) !== -1) ||
            (game.turn() === 'b' && piece.search(/^w/) !== -1) ||
            (game.turn() !== playerColor[0])) {
          return false;
        }
      };  
      
    
      
      var onDrop = function(source, target) {
        // see if the move is legal
        var move = game.move({
          from: source,
          to: target,
          promotion: 'q', // NOTE: always promote to a queen for example simplicity
		  receiver:myOpponent,
        });
		// alert(myOpponent);
		// alert(move.from+"-->"+move.to+"---------"+myOpponent);
		socket.emit("transfer-move", {moves: move, receiver:myOpponent});
        // illegal move
        if (move === null) { 
          return 'snapback';
        } else {
           socket.emit('move', {move: move, gameId: serverGame.id, board: game.fen()});
        }
      
      };
      
      // update the board position after the piece snap 
      // for castling, en passant, pawn promotion
      var onSnapEnd = function() {
        board.position(game.fen());
      };
    });
})();

