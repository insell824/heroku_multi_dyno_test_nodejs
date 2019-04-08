let Queue = require('bull');
let REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
let workQueue = new Queue('work', REDIS_URL);
workQueue.setMaxListeners(100);

setInterval(()=>{
  workQueue.clean(40 * 1000);
  workQueue.clean(40 * 1000,'failed');
},10*1000)



var QueueManager = function (){
  this.q = workQueue;
  this.init = function (){
    
  }


  this.on = function (e,c){
    workQueue.on(e, c);
  }

}

var queueManager = new QueueManager();
module.exports = queueManager;