'use strict';

var Pusher = require('pusher-js/node')
  , connections = {}
  , concurrent = 0;

var APP_KEY = process.argv[2];

//console.log(process.argv);

Pusher.logToConsole = true;

Pusher.log = function(msg) {
  console.log(msg);
};

process.on('message', function message(task) {
  console.log('TASK: ' + task);
  var now = Date.now();

  //
  // Write a new message to the socket. The message should have a size of x
  //
  //if ('write' in task) {
  //  Object.keys(connections).forEach(function write(id) {
  //    write(connections[id], task, id);
  //  });
  //}

  //
  // Shut down every single socket.
  //
  //if (task.shutdown) {
  //  Object.keys(connections).forEach(function shutdown(id) {
  //    connections[id].close();
  //  });
  //}

  // End of the line, we are gonna start generating new connections.
  if (!task.url) return;

  var socket = new Pusher(APP_KEY, {
      wsHost: task.url,
      //authEndpoint: "http://example.com/pusher/auth",
      //wsHost, wsPort, wssPort, httpHost, httpPort, httpsPort
      enabledTransports: ["ws"],//ws, wss, xhr_streaming, xhr_polling, sockjs
      cluster: 'eu',
      disableStats: true,
      encrypted: true
  });
  
  ++concurrent;
  connections[task.id] = socket;  
  
  socket.bind('error',
    function(data) {
      process.send({ type: 'error', message: data, id: task.id, concurrent: --concurrent });
      delete connections[task.id];    
    }
  );  
  
  //socket.bind('connection_established', function(data) { } );  
  
  var my_channel = socket.subscribe('benchmark');  
  
  my_channel.bind_all(function(eventName, data) {
    if (eventName == "pusher:subscription_succeeded") {
      process.send({ type: 'open', duration: Date.now() - now, id: task.id, concurrent: concurrent });
      
    } else {
      console.log("Received event on channel benchmark with name", eventName, "and data", data);
      process.send({
        type: 'message', latency: Date.now() - socket.last, concurrent: concurrent,
        id: task.id
      });          
    }

  });

  //socket.unsubscribe('my-channel');
  
  
  //var socket = new Socket(task.url, {
  //  protocolVersion: protocol
  //});

  //socket.on('open', function open() {
  //  process.send({ type: 'open', duration: Date.now() - now, id: task.id, concurrent: concurrent });
  //  write(socket, task, task.id);

    // As the `close` event is fired after the internal `_socket` is cleaned up
    // we need to do some hacky shit in order to tack the bytes send.
  //});

/*
  socket.on('message', function message(data) {
    process.send({
      type: 'message', latency: Date.now() - socket.last, concurrent: concurrent,
      id: task.id
    });

    // Only write as long as we are allowed to send messages
    if (--task.messages) {
      write(socket, task, task.id);
    } else {
      socket.close();
    }
  });

  socket.on('close', function close() {
    var internal = socket._socket || {};

    process.send({
      type: 'close', id: task.id, concurrent: --concurrent,
      read: internal.bytesRead || 0,
      send: internal.bytesWritten || 0
    });

    delete connections[task.id];
  });

  socket.on('error', function error(err) {
    process.send({ type: 'error', message: err.message, id: task.id, concurrent: --concurrent });

    socket.close();
    delete connections[task.id];
  });
*/
  // Adding a new socket to our socket collection.

});
