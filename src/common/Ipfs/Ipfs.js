import { Observer } from 'tools';
// import IpfsApi from 'ipfs-api';

export default class Ipfs extends Observer {

  static Gateways = [
    {host: '127.0.0.1', port: '8080', protocol: 'http'},
    {host: 'gateway.ipfs.io', port: '', protocol: 'https'},
    {host: 'ipfs.io', port: '', protocol: 'https'},
    {host: 'earth.i.ipfs.io', port: '', protocol: 'https'},
    {host: 'mercury.i.ipfs.io', port: '', protocol: 'https'},
    {host: 'scrappy.i.ipfs.io', port: '', protocol: 'https'},
    {host: 'chappy.i.ipfs.io', port: '', protocol: 'https'},
    {host: 'gateway.ipfsstore.it', port: '8443', protocol: 'https'}
  ];

  static APIs = [
    {host: '127.0.0.1', port: '5001', protocol: 'http'},
    {host: 'gateway.ipfsstore.it', port: '8443', protocol: 'https'}
  ];

  static getFileIndex(file) {
    const last = file.charCodeAt(file.length - 1);
    const min = 1;
    const max = Ipfs.Gateways.length - 1;
    return Math.round(min + last % max);
  }

  static getExternalGateway(file) {
    var i = Ipfs.getFileIndex(file);     // Between 1 and length (exclude 0 which is local)
    var gw = Ipfs.Gateways[i];
    return gw.protocol + '://' + gw.host + (gw.port ? ':' + gw.port : '') + '/ipfs/';
  }

  static getExternalUrl(file) {
    return Ipfs.getExternalGateway(file) + file;
  }

  localGW = false;

  apiNode = null;

  localGWCheckerInterval = null;


  // constructor() {
  //   super();
  //
  //   // Schedule first run of local GW check in 3 seconds
  //   setTimeout(this.localGWChecker.bind(this), 3000);
  //
  //   // Add local GW check timer every 30s
  //   this.localGWCheckerInterval = setInterval(this.localGWChecker.bind(this), 30000);
  // }

  connectApi(local = false) {
    if(local || this.localGW) {
      // Attempt to connect to local node, if any...
      this.apiNode = Ipfs.APIs[0];
    } else {
      // Attempt to connect to ipfsstore public
      this.apiNode = Ipfs.APIs[1];
    }
    this.ipfs = window.IpfsApi(this.apiNode);
  }

  localGWChecker() {
    this.connectApi(true);
    this.ipfs.repo.stat()
      .then(res => {
        if(!this.localGW) {   // Got online
          this.localGW = true;
          this.fireEvent('online', this.apiNode);
        }
      })
      .catch(err => {
        if(this.localGW) {    // Got offline
          this.localGW = false;
          this.fireEvent('offline', this.apiNode);
        }
      });
  }

  getUrl(file, external = false) {
    var prefix;
    if(!external && this.localGW) {
      var gw = Ipfs.Gateways[0];
      prefix = gw.protocol + '://' + gw.host + (gw.port ? ':' + gw.port : '') + '/ipfs/';
    } else {
      prefix = Ipfs.getExternalGateway(file);
    }
    return prefix + file;
  }

  pinIfWeCan(file) {
    if(this.localGW) {
      this.connectApi(true);
      this.ipfs.pin.add(file);    // Intentionally ignore the returned promise
    }
  }

  getStatus() {
    this.connectApi(true);
    return this.ipfs.repo.stat();
  }

  fileAdd(data) {
    this.connectApi();
    const buffer = Buffer.from(data);   // data should be an ArrayBuffer
    return this.ipfs.files.add(buffer);
  }
}
