let throng = require('throng');
let Queue = require("bull");
let route_ = require('../backend/route');
// Connect to a local redis intance locally, and the Heroku-provided URL in production
let REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";

// Spin up multiple processes to handle jobs to take advantage of more CPU cores
// See: https://devcenter.heroku.com/articles/node-concurrency for more info
let workers = process.env.WEB_CONCURRENCY || 3;

// The maxium number of jobs each worker should process at once. This will need
// to be tuned for your application. If each job is mostly waiting on network 
// responses it can be much higher. If each job is CPU-intensive, it might need
// to be much lower.
//let maxJobsPerWorker = 2;



function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
function busy(ms){
  return new Promise((resolve)=>{
    var reqTime = new Date().getTime();
    while(reqTime + ms > new Date().getTime()){

    }
    resolve();
  });
}

function start() {
  console.log("起動");
  // Connect to the named work queue
  let workQueue = new Queue('work', REDIS_URL);
  setInterval(async ()=>{
    var c = await workQueue.getJobCounts();
    console.log('ACTIVE:',c.active);
  },1000);
  workQueue.process(maxJobsPerWorker, async (job) => {
    console.log('START JOB ID:', job.id);
    // This is an example job that just slowly reports on progress
    // while doing no work. Replace this with your own job logic.
    let progress = 0;

    while (progress < 100) {
      if(Math.random() < 0.05){
        //await sleep( Math.random()* 50 + 300);
        await sleep(50);
      }else if(Math.random() < 0.05){
        // 0ms
        await busy(50);
      }else{
        await busy(50);
        //await busy( Math.random()* 50 + 50);
      }

      // // throw an error 0.05% of the time
      // if (Math.random() < 0.0005) {
      //   console.log("JOB ID:" + job.id + " is failed!");
      //   throw new Error("JOB ID:" + job.id + " is failed!")
      // }
      progress += 1;
      job.progress(progress)

    }
    // A job can return values that will be stored in Redis as JSON
    // This return value is unused in this demo application.
    console.log('END JOB ID:', job.id);
    return { value: "This will be stored" };
  });
}

// Initialize the clustered worker process
// See: https://devcenter.heroku.com/articles/node-concurrency for more info
throng({ workers, start:(id)=>{
  route_(id);
} });