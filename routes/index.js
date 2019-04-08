var express = require('express');
var router = express.Router();
var socketManager = require('../middleware/FrontSocketManager');
var queueManager = require('../middleware/FrontQueueManager');

router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/work', function (req, res, next) {
  res.render('work');
});



// Kick off a new job by adding it to the work queue
router.post('/job/:p', async (req, res) => {
  // This would be where you could pass arguments to the job
  // Ex: workQueue.add({ url: 'https://www.heroku.com' })
  // Docs: https://github.com/OptimalBits/bull/blob/develop/REFERENCE.md#queueadd
  //console.log(req.params.p);
  let job = await queueManager.q.add({ foo: 'bar' }, { priority:req.params.p*1 });
  emitNowCounts();
  res.json({ id: job.id });
});

// 
router.get('/jobwait', async (req, res) => {
  // This would be where you could pass arguments to the job
  // Ex: workQueue.add({ url: 'https://www.heroku.com' })
  // Docs: https://github.com/OptimalBits/bull/blob/develop/REFERENCE.md#queueadd
  let job = await queueManager.q.add();
  var listener = function(jobId, result) {
    if (jobId==job.id) {
      //console.log("COMP",jobId);
      queueManager.q.removeListener('global:completed',listener);
      queueManager.q.removeListener('global:failed',listenerFail);
      res.json({ id: job.id, status: 'success' });
    }
  }
  var listenerFail = function(jobId, result) {
    if (jobId==job.id) {
      //console.log("FAIL",jobId);
      queueManager.q.removeListener('global:completed',listener);
      queueManager.q.removeListener('global:failed',listenerFail);
      res.json({ id: job.id , status: 'failed'});
    }
  }
  queueManager.q.on('global:completed', listener);
  queueManager.q.on('global:failed', listenerFail);
});

// Allows the client to query the state of a background job
router.get('/job/:id', async (req, res) => {
  let id = req.params.id;
  let job = await queueManager.q.getJob(id);

  if (job === null) {
    res.status(404).end();
  } else {
    let state = await job.getState();
    let progress = job._progress;
    let reason = job.failedReason;
    res.json({ id, state, progress, reason });
  }
});

router.post('/jobs', (req, res) => {
  let ids = req.body.ids;
  if (ids == null || !Array.isArray(ids)) {
    res.status(404).end();
    return;
  }
  var resResult = {
    counts : { 
      waiting: 0,
      active: 0,
      completed: 0,
      failed: 0,
      delayed: 0,
      paused: 0
    },
    body: []
  };
  async function run() {
    resResult.counts = await queueManager.q.getJobCounts();
    for (var i = 0; i < ids.length; i++) {
      let job = await queueManager.q.getJob(ids[i]);
      if (job !== null) {
        let state = await job.getState();
        let progress = job._progress;
        let reason = job.failedReason;
        resResult.body.push({ id: ids[i], state, progress, reason, priority:job.opts.priority });
      }
    }
  }
  run().then(() => {
    res.json(resResult);
  });
});



socketManager.on('request jobs status',(socket,req)=>{
  (async ()=>{
    if(req && req.scope === null){
      var jobs = await queueManager.q.getJobs(['waiting', 'active', 'completed', 'failed', 'delayed']);
      var res = {
        body:[]
      };
      for(var i=0; i<jobs.length; i++){
        let job = jobs[i];
        let state = await job.getState();
        let reason = job.failedReason;
        res.body.push({ id: job.id, state, reason, priority:job.opts.priority });
      }
      socketManager.io.to(socket.id).emit('response jobs status', res);
    }
  })();
});

socketManager.on('request clear',async(socket,req)=>{
  await queueManager.q.clean(1000);
  emitNowCounts();
})



queueManager.on('global:progress', async (jobId, progress) => {
  socketManager.generalEmit('progress',{id:jobId, progress});
});

// You can listen to global events to get notified when jobs are processed
queueManager.on('global:completed', async (jobId, result) => {
  socketManager.generalEmit('complete',{id:jobId, progress:100});
  try{
    socketManager.workingResultEmit(jobId, JSON.parse(result));
  }catch(e){
    socketManager.workingResultEmit(jobId, result);
  }
  await emitNowCounts();
  //console.log(`Job ${jobId} is completed with result ${result}`);
});

queueManager.on('cleaned', function (job, type) {
  console.log('Cleaned %s %s jobs', job.length, type);
});

async function emitNowCounts(){
  var c = await queueManager.q.getJobCounts();
  socketManager.stdSetActivity(c);
  socketManager.stdEmit();
}
setInterval(emitNowCounts,1000);
module.exports = router;
