const socket = require('socket.io');


var SocketManager = function (){
  // constractor
  var event = require('events').EventEmitter;
  var em = new event;

  this.io;
  this.init = function (server){
    this.io = socket(server);
    this.io.on('connection',function(socket){
      console.log('connected');
      socket.on('general',function(data){
        if(data && data.event){
          em.emit(data.event,socket,data);
        }
      });
    });
  }

  var stdEmitData = {
    activity : {}
  }
  this.stdEmit = function (){
    this.io.sockets.emit('std', stdEmitData)
  }
  this.stdSetActivity = function (data){
    stdEmitData.activity = data;
  }

  this.workingResultEmit = function(jobId, result){
    this.io.sockets.emit('workingResult', {id:jobId,result})
  }
  
  this.generalEmit = function(name,data){
    this.io.sockets.emit(name, data);
  }

  this.on = function(name,callback){
    em.on(name,callback);
  }

}

var socketManager = new SocketManager();
module.exports = socketManager;