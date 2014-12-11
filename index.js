var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var usercount = 0;
var users = new Array();
var userListLock = false;

app.get('/', function(req, res) {
    res.sendFile(__dirname+'/index.html');
});

io.sockets.on('connection', function(client) {
    while (userListLock) {}
    usercount += 1;
    var userid = usercount;
    var name = "User" + usercount;
    var user = { userid: userid, name: name };
    users[userid] = user;
    
    console.log(name + ' connected...');
    broadcastUserList();
    io.emit('server message', name + ' arrived.');
    
    client.on('disconnect', function() {
        console.log(name + ' disconnected...');
        users[userid] = null;
        broadcastUserList();
        io.emit('server message', name + ' left.');
    });
    
    client.on('name reg', function(data) {
        if (!userListLock) {
            userListLock = true;
            console.log(name + ' registers name as: ' + data);
            var success = true;
            for (i = 0; i < users.length; i++) {
                if (users[i] != null) {
                    if (users[i].name == data) {
                        success = false;
                    }
                }
            }
            client.emit('name reg report', success);
            if (success) {
                io.emit('server message', name + ' is now known as ' + data + '.');
                name = data;
                user = { userid: userid, name: name };
                users[userid] = user;
                broadcastUserList();
            }
            userListLock = false;
        }
    });
    
    client.on('chat message', function(data) {
        console.log(name + ": " + data);
        io.emit('user message', name + ": " + data);
    });
});

function broadcastUserList() {
    io.emit('user list', { list: users });
}

http.listen(8080, function() {
    console.log('Server online...');
});