import muse from 'museblockchain-js';
import { Crypt } from 'tools';

// TODO: Remove! Export temporarilly for testing...
window.muse = muse;
muse.configure({
    "backend-address": "wss://wallet.museblockchain.com/blockchain",
    "chain-prefix": "MUSE",
    "chain-id": "1459ad9469d36835dbfda0d84ea7700fb6a3ee767c86c4f75de22fa0c40f6c61"
});


export default class Auth {

  authenticate(user, pass) {
    return new Promise((resolve, reject) => {
      muse.login(user, pass, (result) => {
        if(result === 1) {
          muse.api.getAccounts([user])
            .then((accounts) => {
              if(accounts && accounts[0]) {
                // User validated
                const userData = this.saveAuthUser(accounts[0], pass);
                resolve(userData);
              } else {
                reject(new Error('Invalid user'));
              }
            })
            .catch((err) => {
              reject(err);
            });
        } else {
          reject(new Error('Invalid credentials'));
        }
      });
    });
  }

  saveAuthUser(user, pass) {
    // Generate keys
    const keys = muse.auth.getPrivateKeys(user, pass);

    // Save user data we care about
    const userData = {
      id: user.id,
      name: user.name,
      keys: {
        public: keys.activePubkey,
        private: keys.active
      }
    };
    // Create token
    const s =  this.getSecret();
    const token = Crypt.encrypt(s, JSON.stringify(userData));
    // Get other users already logged in, if any
    const u = window.localStorage.getItem('u');
    const tokens = u ? JSON.parse(u) : [];
    tokens.push(token);
    // Store the users array
    window.localStorage.setItem('u', JSON.stringify(tokens));
    // Set the active user to this one
    window.localStorage.setItem('a', token);
    // Return user data except the keys
    delete userData.keys;
    return userData;
  }

  getSecret() {
    const createSecret = () => {
      const rnd = Math.round(Math.random() * 100000000).toString();
      const p1 = rnd.slice(0, 5);
      const p2 = rnd.slice(5);
      return p1 + p2 + p2 + p1 + p1 + p2;
    };

    var r = window.localStorage.getItem('r');
    if(!r) {
      r = createSecret();
      window.localStorage.setItem('r', r);
    }
    return r;
  }

  getAuthUserList(includeToken = false) {
    var users = [];

    const s = this.getSecret();
    const u = window.localStorage.getItem('u');
    const tokens = u ? JSON.parse(u) : [];
    if(tokens.length) {
      for(var i = 0; i < tokens.length; i++) {
        const json = Crypt.decrypt(s, tokens[i]);
        if(json) {
          var data = JSON.parse(json);
          // If include token then add it
          if(includeToken) data.token = tokens[i];
          // Add the user to the list except the keys
          delete data.keys;
          users.push(data)
        } else {
          // Token not valid, logout all
          this.logoutAll();
          return [];
        }
      }
    }
    return users;
  }

  getAuthUser() {
    const s =  this.getSecret();
    const token = window.localStorage.getItem('a');
    var data = null;
    if(token) {
      const json = Crypt.decrypt(s, token);
      if(json) {
        data = JSON.parse(json);
        // Remove the keys
        delete data.keys;
      } else {
        // Token not valid, logout all
        this.logoutAll();
        return [];
      }
    }
    return data;
  }

  getAuthWif() {
    const s =  this.getSecret();
    const token = window.localStorage.getItem('a');
    var wif = null;
    if(token) {
      const json = Crypt.decrypt(s, token);
      if(json) {
        var data = JSON.parse(json);
        // Get the private key wif
        wif = data.keys.private;
      } else {
        // Token not valid, logout all
        this.logoutAll();
        return null;
      }
    }
    return wif;
  }

  selectUser(id = null) {     // If null selects the first available (for logout)
    const ulist = this.getAuthUserList(true);
    var user;
    if(id != null) {
      user = ulist.find((user) => user.id === id);
    } else {
      user = ulist.length ? ulist[0] : null;
    }
    if(user) {
      window.localStorage.setItem('a', user.token);
      // Remove the token from user
      delete user.token;
    } else {
      window.localStorage.removeItem('a');
    }
  }

  isAuth() {
    return this.getAuthUser() != null;
  }

  logout() {
    const u = window.localStorage.getItem('u');
    const tokens = u ? JSON.parse(u) : [];
    const token = window.localStorage.getItem('a');
    // Remove user token
    tokens.splice(tokens.indexOf(token), 1);
    // Save it
    window.localStorage.setItem('u', JSON.stringify(tokens));
    // And select another logged in user, if any
    this.selectUser();
  }

  logoutAll() {
    window.localStorage.removeItem('a');
    window.localStorage.removeItem('u');
    window.localStorage.removeItem('r');
  }

}
