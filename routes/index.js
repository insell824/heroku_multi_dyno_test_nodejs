var express = require('express');
var router = express.Router();

let Queue = require('bull');

let REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
let workQueue = new Queue('work', REDIS_URL);

router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/work', function (req, res, next) {
  res.render('work');
});

var count = 0;
router.get('/test', (req, res, next) => {
  var reqTime = new Date().getTime();
  count++;
  var i = count;
  console.log("REQ", i);

  var f = function () {
    var r = (reqTime + 5000 > new Date().getTime());
    if (!r) {
      console.log("RES", i);
      res.send("RES:" + i);
    } else {
      new Promise(resolve => {
        setTimeout(() => {
          resolve();
          f();
        }, 200)
      });
    }
  };
  process.nextTick(f);
});

// Kick off a new job by adding it to the work queue
router.post('/job', async (req, res) => {
  // This would be where you could pass arguments to the job
  // Ex: workQueue.add({ url: 'https://www.heroku.com' })
  // Docs: https://github.com/OptimalBits/bull/blob/develop/REFERENCE.md#queueadd
  let job = await workQueue.add();
  res.json({ id: job.id });
});

// Allows the client to query the state of a background job
router.get('/job/:id', async (req, res) => {
  let id = req.params.id;
  let job = await workQueue.getJob(id);

  if (job === null) {
    res.status(404).end();
  } else {
    let state = await job.getState();
    let progress = job._progress;
    let reason = job.failedReason;
    res.json({ id, state, progress, reason });
  }
});

// You can listen to global events to get notified when jobs are processed
workQueue.on('global:completed', (jobId, result) => {
  console.log(`Job completed with result ${result}`);
});

module.exports = router;
