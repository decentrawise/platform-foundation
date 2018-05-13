import muse from 'museblockchain-js';
import IPFS from '../Ipfs';     // Just for static


export default class Blockchain {

  static AppVersion = 'emanate/0.1';

  static MainAccount = 'emanate';

  static MainTag = 'emanate';
  static TagPrefix = 'emanate-';

  static PageItems = 10;
  static BenefWeight = 2500;    // 25%


  constructor(auth) {
    this.auth = auth;
  }

  getUserMetadata(name) {
    return new Promise((resolve, reject) => {
      muse.api.getAccounts([name], (err, users) => {
        if(err) {
          reject(err);
          return;
        }

        if(users.length > 0) {
          const user = users[0];
          var meta = user.json_metadata ? JSON.parse(user.json_metadata) : {profile: {}};
          user.profile = meta.profile;
          resolve(user);
        } else {
          reject(new Error('User not found on the blockchain'));
        }
      });
    });
  }

  getUserFollowing(name, last = 0) {
    return new Promise((resolve, reject) => {
      muse.api.getFollowing(name, last, 'blog', 100, (err, result) => {
        if(err) {
          reject(err);
          return;
        }

        resolve(result);
      });
    });
  }

  getAllUserFollowing(name) {
    return new Promise((resolve, reject) => {
      var getAll = (name, results = []) => {
        var last = results.length ? results[results.length - 1] : undefined;
        this.getUserFollowing(name, last)
          .then(res => {
            var all = results.concat(res);
            if(res.length === 100) {
              getAll(name, all);
            } else {
              resolve(all);
            }
          })
          .catch(reject);
      }
      getAll(name);
    });
  }

  getUserFollowers(name, last) {
    return new Promise((resolve, reject) => {
      muse.api.getFollowers(name, last, 'blog', 100, (err, result) => {
        if(err) {
          reject(err);
          return;
        }

        resolve(result);
      });
    });
  }

  getAllUserFollowers(name) {
    return new Promise((resolve, reject) => {
      var getAll = (name, results = []) => {
        var last = results.length ? results[results.length - 1] : undefined;
        this.getUserFollowers(name, last)
          .then(res => {
            var all = results.concat(res);
            if(res.length === 100) {
              getAll(name, all);
            } else {
              resolve(all);
            }
          })
          .catch(reject);
      }
      getAll(name);
    });
  }

  getUserFollowCount(name) {
    return new Promise((resolve, reject) => {
      muse.api.getFollowCount(name, (err, result) => {
        if(err) {
          reject(err);
          return;
        }

        resolve(result);
      });
    });
  }

  followUser(name) {
    return new Promise((resolve, reject) => {
      var user = this.auth.getAuthUser();
      var json = JSON.stringify(
          ['follow', {
            follower: user.name,
            following: name,
            what: ['blog']
          }]
        );

      muse.broadcast.customJson(
        this.auth.getAuthWif(),
        [], // Required_auths
        [user.name], // Required Posting Auths
        'follow', // Id
        json, //
        (err, result) => {
          if(err) {
            reject(err);
            return;
          }

          resolve(result);
        }
      );
    });
  }

  unfollowUser(name) {
    return new Promise((resolve, reject) => {
      var user = this.auth.getAuthUser();
      var json = JSON.stringify(
          ['follow', {
            follower: user.name,
            following: name,
            what: []
          }]
        );

      muse.broadcast.customJson(
        this.auth.getAuthWif(),
        [], // Required_auths
        [user.name], // Required Posting Auths
        'follow', // Id
        json, //
        (err, result) => {
          if(err) {
            reject(err);
            return;
          }

          resolve(result);
        }
      );
    });
  }

  postComment(baseComment, body) {
    return new Promise((resolve, reject) => {
      var user = this.auth.getAuthUser();
      var permlink = 're-'+ baseComment.permlink + '-' + new Date().toISOString().replace(/[^a-zA-Z0-9]+/g, '').toLowerCase();

      muse.broadcast.comment(
        this.auth.getAuthWif(),
        baseComment.author,
        baseComment.permlink,
        user.name,
        permlink,
        'Re: ' + baseComment.title,
        body,
        { tags: [Blockchain.MainTag], app: Blockchain.AppVersion },
        (err, result) => {
          if(err) {
            reject(err);
            return;
          }

          resolve(result);
        }
      );
    });
  }

  processMetadata(sound) {
    var processed = sound;

    // Parse the metadata
    processed.metadata = JSON.parse(processed.json_metadata);

    // Maintain backward compatibility with 'sound' metadata field
    if(processed.metadata.sound) {
      processed.metadata.audio = processed.metadata.sound;
    }

    return processed;
  }

  getSoundsFeed(last) {
    return new Promise((resolve, reject) => {
      var query = {tag: Blockchain.MainTag, limit: Blockchain.PageItems};
      if(last) {
        query.start_author = last.author;
        query.start_permlink = last.permlink;
        query.limit++;      // start doesn't count
      }
      muse.api.getDiscussionsByChildren(query, (err, posts) => {
        if(err) {
          reject(err);
          return;
        }

        if(last) posts.shift();     // Remove first == last

        // Process the metadata
        var postsProcessed = posts.map(post => this.processMetadata(post));

        // Filter only the posts with audio tag
        var sounds = postsProcessed.filter(post => post.metadata.audio !== undefined);

        resolve(sounds);
      });
    });
  }

  getSoundsTrending(category, last) {
    return new Promise((resolve, reject) => {
      var tag = Blockchain.MainTag;
      if(category) tag = Blockchain.TagPrefix + category;
      var query = {tag, limit: Blockchain.PageItems};
      if(last) {
        query.start_author = last.author;
        query.start_permlink = last.permlink;
        query.limit++;      // start doesn't count
      }
      muse.api.getDiscussionsByTrending(query, (err, posts) => {
        if(err) {
          reject(err);
          return;
        }

        if(last) posts.shift();     // Remove first == last

        // Process the metadata
        var postsProcessed = posts.map(post => this.processMetadata(post));

        // Filter only the posts with audio tag
        var sounds = postsProcessed.filter(post => post.metadata.audio !== undefined);

        resolve(sounds);
      });
    });
  }

  getSoundsHot(category, last) {
    return new Promise((resolve, reject) => {
      var tag = Blockchain.MainTag;
      if(category) tag = Blockchain.TagPrefix + category;
      var query = {tag, limit: Blockchain.PageItems};
      if(last) {
        query.start_author = last.author;
        query.start_permlink = last.permlink;
        query.limit++;      // start doesn't count
      }
      muse.api.getDiscussionsByHot(query, (err, posts) => {
        if(err) {
          reject(err);
          return;
        }

        if(last) posts.shift();     // Remove first == last

        // Process the metadata
        var postsProcessed = posts.map(post => this.processMetadata(post));

        // Filter only the posts with audio tag
        var sounds = postsProcessed.filter(post => post.metadata.audio !== undefined);

        resolve(sounds);
      });
    });
  }

  getSoundsNew(category, last) {
    return new Promise((resolve, reject) => {
      var tag = Blockchain.MainTag;
      if(category) tag = Blockchain.TagPrefix + category;
      var query = {tag, limit: Blockchain.PageItems};
      if(last) {
        query.start_author = last.author;
        query.start_permlink = last.permlink;
        query.limit++;      // start doesn't count
      }
      muse.api.getDiscussionsByCreated(query, (err, posts) => {
        if(err) {
          reject(err);
          return;
        }

        if(last) posts.shift();     // Remove first == last

        // Process the metadata
        var postsProcessed = posts.map(post => this.processMetadata(post));

        // Filter only the posts with audio tag
        var sounds = postsProcessed.filter(post => post.metadata.audio !== undefined);

        resolve(sounds);
      });
    });
  }

  getSoundsForUser(user, last) {
    return new Promise((resolve, reject) => {
      var query = {tag: user, limit: 100};
      if(last) {
        query.start_author = last.author;
        query.start_permlink = last.permlink;
      }
      muse.api.getDiscussionsByBlog(query, (err, posts) => {
        if(err) {
          reject(err);
          return;
        }

        if(last) posts.shift();     // Remove first == last

        // Process the metadata
        var postsProcessed = posts.map(post => this.processMetadata(post));

        // Filter only the posts with audio tag
        var sounds = postsProcessed.filter(post => post.metadata.audio !== undefined);

        var soundsUser = sounds.filter(p => p.category === Blockchain.MainTag);

        resolve(soundsUser);
      });
    });
  }

  getSoundData(author, permlink) {
    return new Promise((resolve, reject) => {
      muse.api.getContent(author, permlink, (err, sound) => {
        if(err) {
          reject(err);
          return;
        }

        // Process the metadata
        sound = this.processMetadata(sound);

        resolve(sound);
      });
    });
  }

  getSoundComments(author, permlink) {
    return new Promise((resolve, reject) => {
      muse.api.getContentReplies(author, permlink, (err, comments) => {
        if(err) {
          reject(err);
          return;
        }
        resolve(comments);
      });
    });
  }

  voteSound(sound, state) {
    var user = this.auth.getAuthUser();
    return new Promise((resolve, reject) => {
      muse.broadcast.vote(this.auth.getAuthWif(), user.name, sound.author, sound.permlink, (state ? 10000 : 0), (err, result) => {
        if(err) {
          reject(err);
          return;
        }
        resolve(result);
      });
    });
  }

  repostSound(sound) {
    var user = this.auth.getAuthUser();
    return new Promise((resolve, reject) => {
      const json = JSON.stringify(['reblog', {
        account: user.name,
        author: sound.author,
        permlink: sound.permlink
      }]);

      muse.broadcast.customJson(this.auth.getAuthWif(), [], [user.name], 'follow', json, (err, result) => {
        if(err) {
          reject(err);
          return;
        }
        resolve(result);
      });
    });
  }

  flagSound(sound, state) {
    var user = this.auth.getAuthUser();
    return new Promise((resolve, reject) => {
      muse.broadcast.vote(this.auth.getAuthWif(), user.name, sound.author, sound.permlink, (state ? -10000 : 0), (err, result) => {
        if(err) {
          reject(err);
          return;
        }
        resolve(result);
      });
    });
  }

  generatePermlink(data) {
    return data.title.toLowerCase().replace(/[-. ]+/g, " ").replace(/[^a-z0-9 ]/g, "").trim().replace(/\s/g, "-");
  }

  generateCommentPermlink(data) {
    var timestamp = new Date().toISOString().replace(/[^a-zA-Z0-9]+/g, '').toLowerCase();
    return 're-' + data.title.toLowerCase().replace(/[-. ]+/g, " ").replace(/[^a-z0-9 ]/g, "").trim().replace(/\s/g, "-") + '-' + timestamp;
  }

  computeTags(data) {
    var tags = [];
    tags.push(Blockchain.MainTag);
    tags.push('music');
    tags.push(Blockchain.TagPrefix + data.type);

    var other = data.tags.split(', ');
    other.unshift(data.genre);
    other.map(tag => {
      if(tag !== Blockchain.MainTag) {
        if(!tag.startsWith(Blockchain.TagPrefix)) {
          tag = Blockchain.TagPrefix + tag;
        }
        tags.push(tag);
      }
      return null;
    });

    return tags.slice(0, 5);
  }

  // {
  //   "video":{
  //     "info":{
  //       "title":"Lemmy Kilmister Farewell - Wacken Open Air 2016",
  //       "snaphash":"QmbucgjzQgsnj4H94dZZeuKVez6pYYZy8eYQgdspBoY5L9",
  //       "author":"wackinger",
  //       "permlink":"zwrpr1dl"
  //     },
  //     "content":{
  //       "videohash":"QmSLmQJgxcmFZZgD4JK3KNYf4WEoV3NcddNF5ttJCLG3eu",
  //       "description":"Tribute to Lemmy Kilmister - recorded live on WOA 2016",
  //       "tags":["dtube","dtube-Lemmy","dtube-Kilmister","dtube-Farewell","dtube--"]
  //     },
  //     "_id":"9cdb9bfe96cfeb94c6d1a9180c47cb87"
  //   },
  //   "tags":["dtube","dtube-Lemmy","dtube-Kilmister","dtube-Farewell","dtube--"],
  //   "app":"dtube/0.2"
  // }
  computeMetadata(data, files) {
    var tags = this.computeTags(data);

    var audio = {
      ...data,
      files
    };

    return JSON.stringify({
      audio: audio,
      tags: tags,
      app: Blockchain.AppVersion
    });
  }

  // <center>
  //   <a href='https://dtube.video/#!/v/jaamaan123/6s5k9zsn'>
  //   <img src='https://mercury.i.ipfs.io/ipfs/Qmdb91BoZfgfz8CZBBPBX8STGcRyRr9Sh3TjAv5ZgHS19D'>
  //   </a>
  // </center>
  // <hr>
  // Amsterdam at the start of Damrak people walking by in front of central station.
  // A nice time-lapse of a busy crossing to show the dynamics of Amsterdam city traffic.
  // Lots of different traffic in a small space :)
  // <hr>
  // <a href='https://dtube.video/#!/v/jaamaan123/6s5k9zsn'>► Watch on DTube</a><br />
  // <a href='https://mercury.i.ipfs.io/ipfs/QmPy4r7qEg1RAh61vwYLuqrMFwfhkt8HErhZnvaTBowZ2q'>► Watch Source (IPFS)</a>
  computeBody(data, files, user, permlink) {
    var sound = IPFS.getExternalUrl(files.sound);
    var cover = IPFS.getExternalUrl(files.cover);
    return `<center><a href="https://dsound.audio/#/@${user.name}/${permlink}"><img src="${cover}" width="400px"></a></center>
      <hr>${data.desc}<hr>
      <a href="https://dsound.audio/#/@${user.name}/${permlink}">► Listen on DSound</a><br>
      <a href="${sound}">► Listen from source (IPFS)</a>`;
  }

  // data: {
  //   title: '',
  //   desc: '',
  //   type: '',
  //   genre: '',
  //   tags: '',
  //   download: true,
  //   dlgate: '',
  //   buy: false,
  //   buyurl: ''
  // }
  // files: {
  //   sound: '',
  //   cover: '',
  //   peaks: ''
  // }
  publishSound(data, files) {
    return new Promise((resolve, reject) => {
      var user = this.auth.getAuthUser();
      // If no user get out
      if(!user) return reject(new Error('No user logged-in'));

      var permlink = this.generatePermlink(data);
      var metadata = this.computeMetadata(data, files);
      var body = this.computeBody(data, files, user, permlink);

      var operations = [
        ['comment',
          {
            parent_author: '',
            parent_permlink: Blockchain.MainTag,
            author: user.name,
            permlink: permlink,
            title: data.title,
            body: body,
            json_metadata : metadata
          }
        ],
        ['comment_options', {
          author: user.name,
          permlink: permlink,
          max_accepted_payout: '1000000.000 SBD',
          percent_steem_dollars: 10000,
          allow_votes: true,
          allow_curation_rewards: true,
          extensions: [
            [0, {
              beneficiaries: [ { account: Blockchain.MainAccount, weight: Blockchain.BenefWeight } ]
            }]
          ]
        }]
      ];

      muse.broadcast.send({ operations: operations, extensions: [] }, { posting: this.auth.getAuthWif() }, (err) => {
        if(err) {
          console.error(err);
          reject(err)
        } else {
          resolve();
        }
      });
    });
  }

  updateSound(original, data, files) {
    return new Promise((resolve, reject) => {
      var user = this.auth.getAuthUser();
      // If no user get out
      if(!user) return reject(new Error('No user logged-in'));

      var metadata = this.computeMetadata(data, files);
      var body = this.computeBody(data, files, user, original.permlink);

      var operations = [
        ['comment',
          {
            parent_author: '',
            parent_permlink: original.parent_permlink,
            author: original.author,
            permlink: original.permlink,
            title: data.title,
            body: body,
            json_metadata : metadata
          }
        ],
        ['comment_options', {
          author: original.author,
          permlink: original.permlink,
          max_accepted_payout: '1000000.000 SBD',
          percent_steem_dollars: 10000,
          allow_votes: true,
          allow_curation_rewards: true,
          extensions: []
        }]
      ];

      muse.broadcast.send({ operations: operations, extensions: [] }, { posting: this.auth.getAuthWif() }, (err) => {
        if(err) {
          console.error(err);
          reject(err)
        } else {
          resolve();
        }
      });
    });
  }

}
