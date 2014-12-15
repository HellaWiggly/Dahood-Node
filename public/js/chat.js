var socket = io();
$('#login-form').submit(function(){
    socket.emit('name reg', $('#login-form input').val());
    $('#login-form input').val('');
    return false;
});
$('#chat-form').submit(function(){
    socket.emit('chat message', $('#chat-form input').val());
    $('#chat-form input').val('');
    return false;
})
socket.on('user list', function(data) {
    $('#user-list').empty();
    var list = data.list;
    for (i = 1; i < list.length; i++) {
        if (list[i] != null) {
            var user = list[i];
            $('#user-list').append(
                $('<li>', {id: ('userlist' + user.userid)}).text(user.name)
            );
        }
    }
});
socket.on('name reg report', function(data) {
    if (data) {
        $('#login-form').addClass('hidden');
        $('#chat-form').removeClass('hidden');
    } else {
        alert('Name is taken or contains a space, choose something else!');
    }
});
socket.on('user message', function(data) {
    $('#message-list').append($('<li>', {class: 'user-message'}).text(data));
});
socket.on('server message', function(data) {
    $('#message-list').append($('<li>', {class: 'server-message'}).text(data));
});
socket.on('user whisper', function(data) {
    $('#message-list').append($('<li>', {class: 'user-whisper'}).text(data).append($('<span>').text('private')));
});