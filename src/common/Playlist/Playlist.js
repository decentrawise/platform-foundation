import { Observer } from 'tools';

export default class Playlist extends Observer {

  tags = ['house', 'dance'];

  query = null;
  params = null;

  sounds = [];
  stock = [
    {id:  0, author: 'prc', title: 'Julian Jordan - All Night', cover: 'cover0.jpg', file: 'Julian Jordan - All Night.mp3', peaks: 'peaks0.json', tags: this.tags, bpm: 128, key: 'G'},
    {id:  1, author: 'kolatz', title: 'Junior Jack feat. Shena - Dare Me (Stupidisco) (DAZZ 2k15 Remix)', cover: 'cover1.jpg', file: 'Junior Jack feat. Shena - Dare Me (Stupidisco) (DAZZ 2k15 Remix).mp3', peaks: 'peaks1.json', tags: this.tags, bpm: 128, key: 'A'},
    {id:  2, author: 'kolatz', title: 'Just Kiddin - Soul Drop (JackLNDN Remix)', cover: 'cover2.jpg', file: 'Just Kiddin - Soul Drop (JackLNDN Remix).mp3', peaks: 'peaks2.json', tags: this.tags, bpm: 128, key: 'Am'},
    {id:  3, author: 'kolatz', title: 'K-391 - Electrode', cover: 'cover3.jpg', file: 'K-391 - Electrode.mp3', peaks: 'peaks3.json', tags: this.tags, bpm: 128, key: 'C'},
    {id:  4, author: 'kolatz', title: 'Kaaze vs Calvin Harris - Karma x Sweet Nothing (Kaaze Edit)', cover: 'cover4.jpg', file: 'Kaaze vs Calvin Harris - Karma x Sweet Nothing (Kaaze Edit).mp3', peaks: 'peaks4.json', tags: this.tags, bpm: 128, key: 'D'},
    {id:  5, author: 'kolatz', title: 'Kamelia vs Ben E. King - Stand By Me (Savy Fontana Remix)', cover: 'cover5.jpg', file: 'Kamelia vs Ben E. King - Stand By Me (Savy Fontana Remix).mp3', peaks: 'peaks5.json', tags: this.tags, bpm: 110, key: 'G'},
    {id:  6, author: 'prc', title: 'Karim Mika vs Yeah Yeah Yeahs & A-Trak - Oh Shit! Heads Will Roll (Dannic Bootleg)', cover: 'cover6.jpg', file: 'Karim Mika vs Yeah Yeah Yeahs & A-Trak - Oh Shit! Heads Will Roll (Dannic Bootleg).mp3', peaks: 'peaks6.json', tags: this.tags, bpm: 128, key: 'G'},
    {id:  7, author: 'prc', title: 'Kaskade - Atmosphere (Bender\'s Late Night Ambient Remix)', cover: 'cover7.jpg', file: 'Kaskade - Atmosphere (Bender\'s Late Night Ambient Remix).mp3', peaks: 'peaks7.json', tags: this.tags, bpm: 128, key: 'A'},
    {id:  8, author: 'kolatz', title: 'Kenny Loggins - Danger Zone', cover: 'cover8.jpg', file: 'Kenny Loggins - Danger Zone.mp3', peaks: 'peaks8.json', tags: ['pop', '80s'], bpm: 124, key: 'C'},
    {id:  9, author: 'kolatz', title: 'Kerafix & Vultaire x DUUMIX - City of Brass', cover: 'cover9.jpg', file: 'Kerafix & Vultaire x DUUMIX - City of Brass.mp3', peaks: 'peaks9.json', tags: this.tags, bpm: 128, key: 'D'},
    {id: 10, author: 'kolatz', title: 'Klangkarussell - Netzwerk (Falls Like Rain) (Alex Brandt Remix)', cover: 'cover10.jpg', file: 'Klangkarussell - Netzwerk (Falls Like Rain) (Alex Brandt Remix).mp3', peaks: 'peaks10.json', tags: this.tags, bpm: 120, key: 'F'},
    {id: 11, author: 'kolatz', title: 'Korn - Word Up!', cover: 'cover11.jpg', file: 'Korn - Word Up!.mp3', peaks: 'peaks11.json', tags: ['rock', 'alternative'], bpm: 90, key: 'E'}
  ];

  history = [];

  random = false;

  current = null;


  constructor(blockchain, ipfs) {
    super();

    this.bc = blockchain;
    this.ipfs = ipfs;
  }


  getIpfsUrl(file) {
    return this.ipfs.getUrl(file);
  }

  getRandom() {
    return this.random;
  }

  setRandom(random) {
    this.random = random;
  }

  toggleRandom() {
    this.random = !this.random;
    return this.random;
  }

  getCurrentSound() {
    return this.current;
  }

  getPrevSound() {
    if(!this.current) {
      if(this.sounds.length === 0) return null;

      var s;
      if(this.random) {
        s = this.sounds[Math.floor(Math.random() * this.sounds.length)];
      } else {
        s = this.sounds[0];
      }
      this.history.push(s);
      return s;
    }

    var h = this.history.indexOf(this.history.find((s) => s.id === this.current.id));
    if(h === -1) {    // This is safeguard only... Shouldn't happen
      h = this.history.length;
      this.history.push(this.current);
    }

    // Are we at the beging of history?
    if(h === 0) {
      if(this.random) {
        // Get a list of unplayed sounds, if any
        const avail = this.sounds.filter((s) => this.history.indexOf(s) === -1);
        if(avail.length === 0) return null;
        // Select a random from those
        const rnd = Math.floor(Math.random() * avail.length);
        // Add the new sound to history and return it
        this.history.unshift(avail[rnd]);
        return avail[rnd];
      } else {
        // Get the previous position, if any
        const pos = this.sounds.indexOf(this.sounds.find((s) => s.id === this.current.id)) - 1;
        if(pos === -1) return null;
        // If the sound was already in the history, remove it
        const h = this.history.indexOf(this.sounds[pos]);
        if(h !== -1) this.history.splice(h, 1);
        // Add the new sound to history and return it
        this.history.unshift(this.sounds[pos]);
        return this.sounds[pos];
      }
    } else {    // History navigations is straight
      return this.history[h - 1];
    }
  }

  getNextSound() {
    if(!this.current) {
      if(this.sounds.length === 0) return null;

      var s;
      if(this.random) {
        s = this.sounds[Math.floor(Math.random() * this.sounds.length)];
      } else {
        s = this.sounds[0];
      }
      this.history.push(s);
      return s;
    }

    var h = this.history.indexOf(this.history.find((s) => s.id === this.current.id));
    if(h === -1) {
      h = this.history.length;
      this.history.push(this.current);
    }

    // Are we at the end of history?
    if(h === (this.history.length - 1)) {
      if(this.random) {
        // Get a list of unplayed sounds, if any
        const avail = this.sounds.filter((s) => this.history.indexOf(s) === -1);
        if(avail.length === 0) return null;
        // Select a random from those
        const rnd = Math.floor(Math.random() * avail.length);
        // Add the new sound to history and return it
        this.history.push(avail[rnd]);
        return avail[rnd];
      } else {
        // Get the next position, if any
        var pos = this.sounds.indexOf(this.sounds.find((s) => s.id === this.current.id)) + 1;
        if(pos === (this.sounds.length)) return null;
        // If the sound was already in the history, remove it
        const h = this.history.indexOf(this.sounds[pos]);
        if(h !== -1) this.history.splice(h, 1);
        // Add the new sound to history and return it
        this.history.push(this.sounds[pos]);
        return this.sounds[pos];
      }
    } else {    // History navigations is straight
      return this.history[h + 1];
    }
  }

  getSoundsList(query, params = null) {
    setTimeout(() => {
      this.sounds = this.stock.slice(0, 6)
      this.fireEvent('sounds', this.sounds);
    }, 3000);

    // if(query === this.query && params === this.params) {
    //   return this.sounds;
    // } else {
    //   this.history = [];
    //   if(this.current) this.history.push(this.current);
    //   this.query = query;
    //   this.params = params;
    //   this.sounds = [];
    // }
    //
    // var action;
    // switch(this.query) {
    //   default:
    //   case 'feed':
    //     action = this.bc.getSoundsFeed();
    //     break;
    //   case 'trending':
    //     action = this.bc.getSoundsTrending(params.category);
    //     break;
    //   case 'hot':
    //     action = this.bc.getSoundsHot(params.category);
    //     break;
    //   case 'new':
    //     action = this.bc.getSoundsNew(params.category);
    //     break;
    //   case 'user':
    //     action = this.bc.getSoundsForUser(this.params.user);
    //     break;
    // }
    //
    // action
    //   .then(sounds => {
    //     // Store the metadata
    //     this.sounds = sounds;
    //
    //     this.fireEvent('sounds', this.sounds);
    //   })
    //   .catch(err => {
    //     console.log('Error getting sounds:', err)
    //     this.fireEvent('sounds-error', err);
    //   });
  }

  getNextSoundsList() {
    setTimeout(() => {
      if(this.sounds.length < 12) {
        this.sounds = this.sounds.concat(this.stock.slice(6))
        this.fireEvent('next-sounds', this.stock.slice(6));
      } else {
        this.fireEvent('next-sounds', []);
      }
    }, 3000);

    // if(this.sounds.length === 0) return;
    //
    // const last = this.sounds[this.sounds.length - 1];
    //
    // var action;
    // switch(this.query) {
    //   default:
    //   case 'feed':
    //     action = this.bc.getSoundsFeed(last);
    //     break;
    //   case 'trending':
    //     action = this.bc.getSoundsTrending(this.params.category, last);
    //     break;
    //   case 'hot':
    //     action = this.bc.getSoundsHot(this.params.category, last);
    //     break;
    //   case 'new':
    //     action = this.bc.getSoundsNew(this.params.category, last);
    //     break;
    //   case 'user':
    //     action = this.bc.getSoundsForUser(this.params.user, last);
    //     break;
    // }
    //
    // action
    //   .then(sounds => {
    //     this.sounds = this.sounds.concat(sounds);
    //     this.fireEvent('next-sounds', sounds);
    //   })
    //   .catch(err => {
    //     console.log('Error getting sounds:', err);
    //     this.fireEvent('sounds-error', err);
    //   });
  }

  playSound(sound, pos) {
    this.current = sound;
    if(this.history.indexOf(sound) === -1) this.history.push(sound);

    setTimeout(() => this.fireEvent('play-sound', sound, pos), 0);
  }

  checkLiked(sound, user) {
    if(!sound || !user || !sound.active_votes) return false;
    var liked = (sound.active_votes.find((v) => v.voter === user.name && v.weight > 0) !== undefined);
    // If we voted this let's pin it, if not already
    if(liked) {
      this.ipfs.pinIfWeCan(sound.metadata.audio.files.sound);
      this.ipfs.pinIfWeCan(sound.metadata.audio.files.peaks);
      this.ipfs.pinIfWeCan(sound.metadata.audio.files.cover);
    }
    return liked;
  }

  likeSound(sound, state) {
    if(!sound) return;
    // If we are voting this let's pin it, if not already
    if(state) {
      this.ipfs.pinIfWeCan(sound.metadata.audio.files.sound);
      this.ipfs.pinIfWeCan(sound.metadata.audio.files.peaks);
      this.ipfs.pinIfWeCan(sound.metadata.audio.files.cover);
    }
    this.bc.likeSound(sound, state)
      .then((res) => {
        this.fireEvent('liked', sound);
      })
      .catch(err => {
        console.log('Error voting:', err);
        this.fireEvent('liking-error', err);
      });
  }

  getCategoryLink(tag) {
    var query = this.query;
    if(!query || query === 'feed' || query === 'user') {
      query = 'trending';
    }

    return '/' + tag + '/' + query;
  }

  getIpfsStatus() {
    return this.ipfs.getStatus();
  }
}
