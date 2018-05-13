// @flow
import Web3 from 'web3';


export default class MetaMask {

  web3: Web3;

  constructor() {
    if (typeof this.web3 !== 'undefined') {
      this.web3 = new Web3(this.web3.currentProvider);
    } else {
      // set the provider you want from Web3.providers
      this.web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
    }
  }


  getBalance() {
    var coinbase = this.web3.eth.coinbase;
    var balance = this.web3.eth.getBalance(coinbase).toNumber();

    return balance;
  }

  // watchBalance() {
  //   var coinbase = web3.eth.coinbase;
  //   var originalBalance = web3.eth.getBalance(coinbase).toNumber();
  //   document.getElementById('coinbase').innerText = 'coinbase: ' + coinbase;
  //   document.getElementById('original').innerText = ' original balance: ' + originalBalance + '    watching...';
  //   web3.eth.filter('latest').watch(function() {
  //     var currentBalance = web3.eth.getBalance(coinbase).toNumber();
  //     document.getElementById("current").innerText = 'current: ' + currentBalance;
  //     document.getElementById("diff").innerText = 'diff:    ' + (currentBalance - originalBalance);
  //   });
  // }

}
