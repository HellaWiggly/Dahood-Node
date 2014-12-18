var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var usercount = 0;
var users = new Array();
var clients = new Array();
var userListLock = false;

app.get('/app', function(req, res) {
    res.sendFile(__dirname+'/index.html');
});

io.sockets.on('connection', function(client) {
    while (userListLock) {}
    userListLock = true;
    usercount += 1;
    var userid = usercount;
    var name = "User" + usercount;
    var user = { userid: userid, name: name };
    users[userid] = user;
    clients[userid] = client;
    
    console.log(name + ' connected...');
    broadcastUserList();
    io.emit('server message', name + ' arrived.');
    userListLock = false;
    
    client.on('disconnect', function() {
        console.log(name + ' disconnected...');
        users[userid] = null;
        clients[userid] = null;
        broadcastUserList();
        io.emit('server message', name + ' left.');
    });
    
    client.on('name reg', function(data) {
        while (userListLock) {}
        userListLock = true;
        console.log(name + ' registers name as: ' + data);
        var success = true;
        if (data.indexOf(' ') == -1) {
            for (i = 0; i < users.length; i++) {
                if (users[i] != null) {
                    if (users[i].name == data) {
                        success = false;
                    }
                }
            }
        } else {
            success = false;
        }
        client.emit('name reg report', success);
        if (success) {
            io.emit('server message', name + ' is now known as ' + data + '.');
            name = data;
            user = { userid: userid, name: name };
            users[userid] = user;
            broadcastUserList();
        } else {
            console.log('Name registration for ' + user.name + ' failed.');
        }
        userListLock = false;
    });
    
    client.on('chat message', function(data) {
        console.log(name + ": " + data);
        if (data.substring(0,1) == '/') {
            data = data.substring(1);
            var command = data.substring(0, data.indexOf(' '));
            data = data.substring(data.indexOf(' ')+1);
            switch(command) {
                case 'w': whisper(user, data); break;
                case 'whisper': whisper(user, data); break;
                case 'pm': whisper(user, data); break;
                default: client.emit('server message', 'Command not recognised.');
            }
        } else {
            io.emit('user message', name + ": " + data);
        }
    });
});

function whisper(user, data) {
    if (data.indexOf(' ') == -1) {
        clients[user.userid].emit('server message', 'Enter a message.');
    } else {
        var recipient = data.substring(0, data.indexOf(' '));
        var message = data.substring(data.indexOf(' ')+1);
        var found = false;
        for (i = 0; i < users.length; i++) {
            if (users[i] != null) {
                if (users[i].name == recipient) {
                    found = true;
                    clients[i].emit('user whisper', user.name + ': ' + message);
                }
            }
        }
        if (!found) {
            clients[user.userid].emit('server message', 'User not found.');
        }
    }
}

function broadcastUserList() {
    io.emit('user list', { list: users });
}

http.listen(8000, function() {
    console.log('Server online...');
});