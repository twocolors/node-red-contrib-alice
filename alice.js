module.exports = function(RED) {
  //Sevice node, Alice-Service (credential)
  function AliceService(config) {
    RED.nodes.createNode(this,config);
    var firebase = require('firebase');
    var checkInterval;
    var fb;
    const INTERVAL = 30000; // Интервал проверок (мс) 
    const email = this.credentials.email;
    const password = this.credentials.password;
    const firebaseConfig = {
      apiKey: "AIzaSyDQUn6EhNOgSAV15do8DKwwx3KHDyvLGJc",
      authDomain: "node-red-alice-4462f.firebaseapp.com",
      databaseURL: "https://node-red-alice-4462f.firebaseio.com",
      projectId: "node-red-alice-4462f",
      storageBucket: "node-red-alice-4462f.appspot.com",
      messagingSenderId: "1049686868440",
      appId: "1:1049686868440:web:e5f5ef6a70ead338b6f2ad",
      measurementId: "G-MD0L6R9N79"
    };

    try {
      fb = firebase.initializeApp(firebaseConfig,this.id); 
    } catch (error) {
      if (error.code == 'app/duplicate-app'){
        this.debug("Dublicated firebase app");
        fb = firebase.app(this.id);
      }else{
        this.error(error);
      }
    }
    
    // this.authStateSubs =  fb.auth().onAuthStateChanged(u=>{
    //   clearInterval(checkInterval);
    //   if (u){
    //     this.emit("online");
    //     this.checkInterval = setInterval(()=>{
    //       fb.auth().signOut();
    //       this.signIn();
    //     },10000);
    //   }else{
    //     this.emit("offline");
    //   }
    // });

    this.signIn = ()=>{
      fb.auth().signInWithEmailAndPassword(email, password)
      .then(u=>{
        this.emit('online');
        // if (!checkInterval){
        //   checkInterval = setInterval(()=>{
        //     this.signIn();
        //   },INTERVAL);
        // };
      })
      .catch(err=>{
        this.error(err.message);
        this.emit('offline');
      });
    }

    this.signIn();
    
    this.getRef = function(deviceid){
      var user = fb.auth().currentUser;
      return fb.firestore().collection('users').doc(user.uid).collection('devices').doc(deviceid)
    };

    this.getTime = ()=>{
      return firebase.firestore.Timestamp.now();
    }

    this.on('close',(done)=>{
      clearInterval(checkInterval);
      setTimeout(()=>{
        this.emit('offline');
        fb.auth().signOut();
        fb.delete().finally(r=>{done()});
      },500)
    });

  };
  RED.nodes.registerType("alice-service",AliceService,{
    credentials: {
        email: {type:"text"},
        password: {type:"password"}
    }
  });
  
// ***************************** Alice DEVICE ****************************
  function AliceDevice(config){
    RED.nodes.createNode(this,config);
    this.service = RED.nodes.getNode(config.service);
    this.name = config.name;
    this.description = config.description,
    this.room = config.room;
    this.dtype = config.dtype;
    this.initState = false;
    this.ref = null;
    this.capabilites = {};

    this.init = ()=>{
      this.ref = this.service.getRef(this.id);
      this.ref.set({
        name: config.name,
        description: config.description,
        room: config.room,
        type: config.dtype
      })
      .then(ref=>{
        return this.ref.collection('capabilities').get()
          .then(snapshot=>{
            snapshot.forEach(doc=>{
              let d = doc.data();
              let capab = d.type + "." + d.parameters.instance
              this.capabilites[capab] = doc.id;
            })
            return this.ref;
          })
      })
      .then(ref=>{
        this.initState = true;
        this.status({fill:"green",shape:"dot",text:"online"});
        this.emit("online");
      });
    }

    this.startObserver = ()=>{
      this.observer = this.ref.collection('capabilities')
      .where('state.updated', '>', new Date())
      .onSnapshot(querySnapshot=>{
        querySnapshot.docChanges().forEach(change => {
          let doc = change.doc.data();
          if ((change.type === 'added' || change.type === 'modified') && doc.state.updatedfrom != "node-red") {
            this.emit(change.doc.id,doc.state.value, doc.state)
          }
        });
      }, err=>{
        this.error(err);
      })
    };
    this.getRef=(capId)=>{
      return this.ref.collection('capabilities').doc(capId);
    }

    this.getTime=()=>{
      return this.service.getTime();
    }
    
    this.isDubCap=(capId,type,instance)=>{
      let capab = type+"."+instance;
      if (this.capabilites[capab] && this.capabilites[capab]!=capId){
        return true;
      }else{
        this.capabilites[capab] = capId;
        return false
      }
    };

    this.service.on("online",()=>{
      if (!this.initState){
        this.init()
      }else{
        this.ref = this.service.getRef(this.id);
        this.emit("online");
      }
      if (this.observer) this.observer();
      this.startObserver();
    });
    
    this.service.on("offline",()=>{
      this.emit("offline");
      this.ref = null;
      if (this.observer)this.observer();
      this.status({fill:"red",shape:"dot",text:"offline"});
    })

    this.on('close', (removed, done)=>{
      this.observer();
      if (removed){
        this.ref.delete();
        done();
      }else{
        done();
      }
    });
  };
  RED.nodes.registerType("alice-device",AliceDevice);


// *********************** Alice capabilites ***********************************
// ************** ON/OFF *******************
  function AliceOnOff(config){
    RED.nodes.createNode(this,config);
    this.device = RED.nodes.getNode(config.device);
    this.name = config.name;
    this.ctype = 'devices.capabilities.on_off';
    this.instance = 'on';
    this.initState = false;
    this.ref = null;

    this.init = ()=>{
      this.ref = this.device.getRef(this.id);
      let capab = {
        type: this.ctype,
        retrievable: true,
        parameters: {
          instance: this.instance,
        },
        state: {
          value: false,
          updatedfrom:"node-red",
          updated: this.device.getTime()
        }
      };
      if (!this.device.isDubCap(this.id,capab.type, capab.parameters.instance)){
        this.ref.set(capab)
          .then(ref=>{
            this.status({fill:"green",shape:"dot",text:"online"});
            this.initState = true;
          });
      }else{
        this.status({fill:"red",shape:"dot",text:"error"});
        this.error("Dublicated capability on same device!");
      }
    };

    this.device.on("online",()=>{
      if (!this.initState){
        this.init();
      }else{
        this.ref = this.device.getRef(this.id);
        this.status({fill:"green",shape:"dot",text:"online"});
      }
    });

    this.device.on("offline",()=>{
      this.ref = null;
      this.status({fill:"red",shape:"dot",text:"offline"});
    });

    this.device.on(this.id,(val)=>{
      this.send({
        payload: val
      });
    })

    this.on('input', (msg, send, done)=>{
      if (typeof msg.payload != 'boolean'){
        this.error("Wrong type! msg.payload must be boolean.");
        if (done) {done();}
        return;
      }
      if (!this.ref){
        this.error("Device offline");
        this.status({fill:"red",shape:"dot",text:"offline"});
        if (done) {done();}
        return;
      };
      this.ref.update({
        state:{
          value: msg.payload,
          updatedfrom: "node-red",
          updated: this.device.getTime()
        }
      }).then(ref=>{
        if (done) {done();}
      }).catch(err=>{
        this.error("err.message");
      })
    });

    this.on('close', function(removed, done) {
      if (removed) {
        this.ref.delete().then(res=>{
                done()
              }).catch(err=>{
                this.error(err.message);
                done();
              })
      }else{
        done();
      }
    });
  }  
  RED.nodes.registerType("On_Off",AliceOnOff);

  // ************** Toggle *******************
  function AliceToggle(config){
    RED.nodes.createNode(this,config);
    this.device = RED.nodes.getNode(config.device);
    this.name = config.name;
    this.ctype = 'devices.capabilities.toggle';
    this.instance = config.instance;
    this.initState = false;
    this.ref = null;

    this.init = ()=>{
      this.ref = this.device.getRef(this.id);
      let capab = {
        type: this.ctype,
        retrievable: true,
        parameters: {
          instance: this.instance,
        },
        state: {
          value: false,
          updatedfrom:"node-red",
          updated: this.device.getTime()
        }
      };
      if (!this.device.isDubCap(this.id,capab.type, capab.parameters.instance)){
        this.ref.set(capab)
          .then(ref=>{
            this.status({fill:"green",shape:"dot",text:"online"});
            this.initState = true;
          });
      }else{
        this.status({fill:"red",shape:"dot",text:"error"});
        this.error("Dublicated capability on same device!");
      }
    };

    this.device.on("online",()=>{
      if (!this.initState){
        this.init();
      }else{
        this.ref = this.device.getRef(this.id);
        this.status({fill:"green",shape:"dot",text:"online"});
      }
    });

    this.device.on("offline",()=>{
      this.ref = null;
      this.status({fill:"red",shape:"dot",text:"offline"});
    });

    this.device.on(this.id,(val)=>{
      this.send({
        payload: val
      });
    })

    this.on('input', (msg, send, done)=>{
      if (typeof msg.payload != 'boolean'){
        this.error("Wrong type! msg.payload must be boolean.");
        if (done) {done();}
        return;
      }
      if (!this.ref){
        this.error("Device offline");
        this.status({fill:"red",shape:"dot",text:"offline"});
        if (done) {done();}
        return;
      };
      this.ref.update({
        state:{
          value: msg.payload,
          updatedfrom: "node-red",
          updated: this.device.getTime()
        }
      }).then(ref=>{
        if (done) {done();}
      }).catch(err=>{
        this.error("err.message");
      })
    });

    this.on('close', function(removed, done) {
      if (removed) {
        this.ref.delete().then(res=>{
                done()
              }).catch(err=>{
                this.error(err.message);
                done();
              })
      }else{
        done();
      }
    });
  }  
  RED.nodes.registerType("Toggle",AliceToggle);

  // ************** Color  *******************
  function AliceColor(config){
    RED.nodes.createNode(this,config);
    this.device = RED.nodes.getNode(config.device);
    this.name = config.name;
    this.ctype = 'devices.capabilities.color_setting';
    this.instance = 'color_model';
    this.scheme = config.scheme;
    this.initState = false;
    this.ref = null;

    this.init = ()=>{
      this.ref = this.device.getRef(this.id);
      var value = 0;
      if (this.scheme=="hsv"){
        value = {
          h:0,
          s:0,
          v:0
        };
      };
      let capab = {
        type: this.ctype,
        retrievable: true,
        parameters: {
          instance: this.scheme,//this.instance,
          color_model: this.scheme
        },
        state: {
          value: value,
          updatedfrom:"node-red",
          updated: this.device.getTime()
        }
      };
      if (!this.device.isDubCap(this.id,capab.type, null/*capab.parameters.instance*/)){
        this.ref.set(capab)
          .then(ref=>{
            this.status({fill:"green",shape:"dot",text:"online"});
            this.initState = true;
          });
      }else{
        this.status({fill:"red",shape:"dot",text:"error"});
        this.error("Dublicated capability on same device!");
      }
    };

    this.device.on("online",()=>{
      if (!this.initState){
        this.init();
      }else{
        this.ref = this.device.getRef(this.id);
        this.status({fill:"green",shape:"dot",text:"online"});
      }
    });

    this.device.on("offline",()=>{
      this.ref = null;
      this.status({fill:"red",shape:"dot",text:"offline"});
    });

    this.device.on(this.id,(val)=>{
      this.send({
        payload: val
      });
    })

    this.on('input', (msg, send, done)=>{
      const value = msg.payload;
      if (typeof value != 'number' && typeof value !='object'){
        this.error("Wrong type! msg.payload must be Integer or Object.");
        if (done) {done();}
        return;
      }
      if (!this.ref){
        this.error("Device offline");
        this.status({fill:"red",shape:"dot",text:"offline"});
        if (done) {done();}
        return;
      };
      this.ref.update({
        state:{
          value: value,
          updatedfrom: "node-red",
          updated: this.device.getTime()
        }
      }).then(ref=>{
        if (done) {done();}
      }).catch(err=>{
        this.error("err.message");
      })
    });

    this.on('close', function(removed, done) {
      if (removed) {
        this.ref.delete().then(res=>{
                done()
              }).catch(err=>{
                this.error(err.message);
                done();
              })
      }else{
        done();
      }
    });
  }  
  RED.nodes.registerType("Color",AliceColor);

};

