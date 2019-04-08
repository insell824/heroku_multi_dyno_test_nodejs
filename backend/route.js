let Queue = require("bull");
let REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";

// The maxium number of jobs each worker should process at once. This will need
// to be tuned for your application. If each job is mostly waiting on network 
// responses it can be much higher. If each job is CPU-intensive, it might need
// to be much lower.
let maxJobsPerWorker = 10;

var processNum = 0;

module.exports = function (cpuNumber){
  console.log("LAUNCH CPU:",cpuNumber);
  // Connect to the named work queue
  let workQueue = new Queue('work', REDIS_URL);
  
  workQueue.process(maxJobsPerWorker, async (job) => {
    processNum++;
    console.log('CPU:',cpuNumber,'ACT:'+processNum,'START JOB ID:', job.id);
    // This is an example job that just slowly reports on progress
    // while doing no work. Replace this with your own job logic.
    let progress = 0;
    //await busy(1000);
    while (progress < 100) {
      if(Math.random() < 0.05){
        //await sleep( Math.random()* 50 + 300);
        await sleep(50);
      }else if(Math.random() < 0.05){
        // 0ms
        //await busy(50);
      }else{
        await sleep(50);
        //await busy(50);
        //await busy( Math.random()* 50 + 50);
        
      }

      // throw an error 0.02% of the time
      if (Math.random() < 0.0002) {
        console.log("JOB ID:" + job.id + " is failed!");
        throw new Error("JOB ID:" + job.id + " is failed!")
        //job.retry();
      }
      progress += 1;
      if(progress%10 == 0){
        job.progress(progress)
      }
      

    }
    // A job can return values that will be stored in Redis as JSON
    // This return value is unused in this demo application.
    processNum--;
    console.log('CPU:',cpuNumber,'ACT:'+processNum,'END JOB ID:', job.id);
    return { value: "This will be stored" ,"inInfo":getInternalInfo(processNum)};
  });
  function getInternalInfo(activeNum){
    var dynoName = '';
    if(process.env.DYNO){
      dynoName = ', SERV:'+process.env.DYNO;
    }
    return "CPU:"+cpuNumber+", ACT:"+activeNum+dynoName;
  }
};




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