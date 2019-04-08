// Store for all of the jobs in progress
let jobs = {};
let counts = { 
  waiting: 0,
  active: 0,
  completed: 0,
  failed: 0,
  delayed: 0,
  paused: 0
};

// Kick off a new job by POST-ing to the server
async function addJob(priority) {
  let res = await fetch('/job/'+priority, { method: 'POST' });
  let job = await res.json();
  jobs[job.id] = { id: job.id, state: "queued" };
  render();
}

// Fetch updates for each job
async function updateJobs() {
  for (let id of Object.keys(jobs)) {
    let res = await fetch(`/job/${id}`);
    let result = await res.json();
    if (!!jobs[id]) {
      jobs[id] = result;
    }
    render();
  }
}
async function updateJobsOneSend() {
  var obj = { ids:[] };
  for (let id of Object.keys(jobs)) {
    if(jobs[id].state == 'completed' || jobs[id].state == 'failed'){
      // ignore
    }else{
      obj.ids.push(id);
    }
  }
  
    const method = "POST";
    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    };
    let res = await fetch("/jobs", { method, headers, body:JSON.stringify(obj) });
    let result = await res.json();
    for(let item of result.body){
      if (!!jobs[item.id]) {
        jobs[item.id] = item;
      }
    }
    counts = result.counts;
    render();
  if(obj.ids.length > 0){
    setTimeout(updateJobsOneSend,200);
  }else{
    setTimeout(updateJobsOneSend,800);
  }
}

// Delete all stored jobs
function clear() {
  var newJobs = {};
  for (let id of Object.keys(jobs)) {
    if(jobs[id].state == 'completed' || jobs[id].state == 'failed'){
      // ignore
    }else{
      newJobs[id] = { id, state: jobs[id].state };
    }
  }
  jobs = newJobs;
  //jobs = {};
  render();
}

// Update the UI
function render() {
  let s = "";
  for (let id of Object.keys(jobs)) {
    s += renderJob(jobs[id]);
  }

  // For demo simplicity this blows away all of the existing HTML and replaces it,
  // which is very inefficient. In a production app a library like React or Vue should
  // handle this work
  document.querySelector("#job-summary").innerHTML = s;

  document.querySelector("#counter-summary").innerHTML = 
    document.querySelector("#counter-template")
    .innerHTML
    .replace('{{waiting}}', counts.waiting)
    .replace('{{active}}', counts.active)
    .replace('{{completed}}', counts.completed)
    .replace('{{failed}}', counts.failed)
    .replace('{{delayed}}', counts.delayed)
    .replace('{{paused}}', counts.paused);
}

// Renders the HTML for each job object
function renderJob(job) {
  let progress = job.progress || 0;
  let color = "bg-light-purple";

  if (job.state === "completed") {
    color = "bg-purple";
    progress = 100;
  } else if (job.state === "failed") {
    color = "bg-dark-red";
    progress = 100;
  }

  return document.querySelector('#job-template')
    .innerHTML
    .replace('{{id}}', job.id)
    .replace('{{state}}', job.state)
    .replace('{{color}}', color)
    .replace('{{progress}}', progress)
    .replace('{{priority}}', job.priority);
}

// Attach click handlers and kick off background processes
window.onload = function () {
  document.querySelector("#add-job1").addEventListener("click", ()=>{addJob(1)});
  document.querySelector("#add-job2").addEventListener("click", ()=>{addJob(10)});
  document.querySelector("#clear").addEventListener("click", clear);
  setTimeout(updateJobsOneSend,200);
  //setInterval(updateJobsOneSend, 200);
};