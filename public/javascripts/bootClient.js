let animarr = ['waiting', 'active', 'delayed', 'paused'];
let stateArr = {
  waiting: {
    activity: {
      title: '待機',
      icon: '<div class="sp sp-circle float-right"></div>',
      styles: [
        'card',
        'text-white',
        'bg-warning'
      ]
    },
    progressStyles: [
      'progress-bar',
      'progress-bar-striped',
      'progress-bar-animated',
      'bg-warning'
    ]
  },
  active: {
    activity: {
      title: '実行中',
      icon: '<div class="sp sp-circle float-right"></div>',
      styles: [
        'card',
        'text-white',
        'bg-primary'
      ]
    },
    progressStyles: [
      'progress-bar',
      'progress-bar-striped',
      'progress-bar-animated',
      'bg-primary'
    ]
  },
  completed: {
    activity: {
      title: '完了',
      icon: '<div class="float-right"><i class="fas fa-check"></i></div>',
      styles: [
        'card',
        'text-white',
        'bg-success'
      ]
    },
    progressStyles: [
      'progress-bar',
      'bg-success'
    ]
  },
  failed: {
    activity: {
      title: '失敗',
      icon: '<div class="float-right"><i class="fas fa-times"></i></div>',
      styles: [
        'card',
        'text-white',
        'bg-danger'
      ]
    },
    progressStyles: [
      'progress-bar',
      'bg-danger'
    ]
  },
  delayed: {
    activity: {
      title: '遅延',
      icon: '<div class="sp sp-circle float-right"></div>',
      styles: [
        'card',
        'text-white',
        'bg-dark'
      ]
    },
    progressStyles: [
      'progress-bar',
      'progress-bar-striped',
      'progress-bar-animated',
      'bg-dark'
    ]
  },
  paused: {
    activity: {
      title: '一時停止',
      icon: '',
      styles: [
        'card',
        'text-white',
        'bg-secondary'
      ]
    },
    progressStyles: [
      'progress-bar',
      'progress-bar-striped',
      'bg-secondary'
    ]
  },
  stuck:{
    progressStyles: [
      'progress-bar',
      'progress-bar-striped',
      'progress-bar-animated',
      'bg-danger'
    ]
  }
};
var socket;
var app = new Vue({
  el: '#vue-app',
  data: {
    activity: {},
    lastUpdated: [],
    restNum: 7,
    processing: {}
  },
  computed: {
    lastUpdatedRest: function () {
      let rest = this.restNum - this.lastUpdated.length;
      return rest > 0 ? rest : 0;
    },
    overviewActivity: function () {
      var res = [];
      for (let k of Object.keys(this.activity)) {
        res.push({
          title: stateArr[k].activity.title,
          cardClass: stateArr[k].activity.styles,
          number: this.activity[k],
          icon: stateArr[k].activity.icon,
          showIcon: this.activity[k] > 0,
        });
      }
      return res;
    }
  },
  mounted: function () {
    socket = io.connect();
    socket.on('std', function (data) {
      this.activity = data.activity;
      this.requestJobsStatus();
    }.bind(this));
    socket.on('workingResult', function (data) {
      this.lastUpdated.unshift(data);
      if (this.restNum < this.lastUpdated.length) {
        this.lastUpdated.splice(this.lastUpdated.length - 1, this.lastUpdated.length - this.restNum);
      }
      this.requestJobsStatus();
    }.bind(this));
    socket.on('response jobs status', async function (data) {
      for (var i = 0; i < data.body.length; i++) {
        var isView = true;
        if(this.processing['J' + data.body[i].id]){
          if(this.processing['J' + data.body[i].id].state !== data.body[i].state){
            this.processing['J' + data.body[i].id] = data.body[i];
            try{
              this.processing['J' + data.body[i].id].progressClass = stateArr[data.body[i].state].progressStyles;
            }catch(e){
              console.log(data.body[i].state);
              console.log(e);
            }
            
            this.processing['J' + data.body[i].id].isView = isView;
          }
        }else{
          // NEW
          this.processing['J' + data.body[i].id] = data.body[i];
          this.processing['J' + data.body[i].id].progressClass = stateArr[data.body[i].state].progressStyles;
          this.processing['J' + data.body[i].id].isView = isView;
        }
        if(this.processing['J' + data.body[i].id].state !== 'active'){
          this.processing['J' + data.body[i].id].progress = 100;
        }
        if(this.processing['J' + data.body[i].id].state === 'completed'){
          if(this.processing['J' + data.body[i].id].time){
            if(this.processing['J' + data.body[i].id].time.getTime()+5000 < new Date().getTime() ){
              this.processing['J' + data.body[i].id].isView = false;
            }
          }else{
            this.processing['J' + data.body[i].id].time = new Date();
          }
        }
      }
      this.$forceUpdate();
      await Vue.nextTick();
      for (let k of Object.keys(this.processing)) {
        if(this.processing[k].progress !== undefined){
          $('#card-' + k + ' .progress-bar').css('width', this.processing[k].progress + '%');
        }
      }
    }.bind(this));
    socket.on('progress', function (job) {
      if (this.processing['J' + job.id] ) {
        $('#card-J' + job.id + ' .progress-bar').css('width', job.progress + '%');
      }
    }.bind(this));
    socket.on('complete', function (job) {
      if (this.processing['J' + job.id]) {
        
      }
    }.bind(this));
    this.requestJobsStatus();
  },
  methods: {
    addJob: async function (priority) {
      let res = await fetch('/job/' + priority, { method: 'POST' });
      this.requestJobsStatus();
    },
    requestJobsStatus: function () {
      socket.emit('general', {
        event: 'request jobs status',
        scope: null,
      });
    },
    clearCompleted: function () {
      this.processing = {};
      socket.emit('general', {
        event: 'request clear'
      });
    },
    test: function () {
      this.requestJobsStatus();
    }
  }
})