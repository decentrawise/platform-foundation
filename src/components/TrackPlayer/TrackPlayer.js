import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from 'react-bootstrap';
import { formatter, download } from 'tools';

import './TrackPlayer.css';
import Waveform from '../Waveform';


class TrackPlayer extends Component {

  constructor(props) {
    super(props);

    // Just be sure
    if(!this.props.sound) {
      throw new Error('No sound property passed');
    }

    // Get the auth service
    this.auth = this.props.auth;

    // Get the engines
    this.soundengine = this.props.soundengine;
    this.playlist = this.props.playlist;

    // Check initial state of likes and plays
    var liked = this.playlist.checkLiked(this.props.sound, this.auth.getAuthUser());
    var likes = this.props.sound.net_votes || 0;
    var plays = this.props.sound.plays || 0;

    this.state = {
      voting: false,
      liked,
      likes,
      plays,
      playing: false,
      pos: 0
    };

    // Bind event handlers
    this.handleSoundEnginePause = this.handleSoundEnginePause.bind(this);
    this.handleSoundEnginePlay = this.handleSoundEnginePlay.bind(this);
    this.handleSoundEngineProgress = this.handleSoundEngineProgress.bind(this);
    this.handleSoundEngineFinish = this.handleSoundEngineFinish.bind(this);
    this.handlePlaylistPlaySound = this.handlePlaylistPlaySound.bind(this);
    this.toggleLike = this.toggleLike.bind(this);
    this.playToggle = this.playToggle.bind(this);
    this.clickWaveform = this.clickWaveform.bind(this);
    this.clickLike = this.clickLike.bind(this);
    this.clickDownload = this.clickDownload.bind(this);
    this.clickBuy = this.clickBuy.bind(this);
  }


  // Event handlers

  handleSoundEnginePlay() {
    var cur = this.playlist.getCurrentSound();
    var playing = (cur && this.props.sound.id === cur.id);
    this.setState({
      playing
    });
    if(playing) {
      this.soundengine.on('audioprocess', this.handleSoundEngineProgress);
    }
  }

  handleSoundEnginePause() {
    this.setState({
      playing: false
    });
    this.soundengine.un('audioprocess', this.handleSoundEngineProgress);
  }

  handleSoundEngineProgress(time, duration) {
    const pos = (time / duration);
    if(this.state.pos !== pos) {
      this.setState({
        pos
      });
    }
  }

  handleSoundEngineFinish() {
    if(this.state.playing) {
      this.setState({
        playing: false,
        pos: 0
      });
    }
  }

  handlePlaylistPlaySound(sound) {
    var playing = (this.props.sound === sound);
    this.setState({
      playing
    });
  }

  toggleLike(sound) {
    if(sound.id !== this.props.sound.id) return;

    var liked = !this.state.liked;
    var likes = liked ? this.state.likes + 1 : this.state.likes - 1;
    this.setState({
      voting: false,
      liked,
      likes
    });
  }


  // UI event handlers

  playToggle() {
    var cur = this.playlist.getCurrentSound();
    if(cur && this.props.sound.id === cur.id) {
      if(!this.state.playing) {
        this.soundengine.play();
      } else {
        this.soundengine.pause();
      }
    } else {
      this.playlist.playSound(this.props.sound, this.state.pos);
      if(this.props.sound.file) {
        this.soundengine.load("./media/" + this.props.sound.file);
      } else if(this.props.sound.metadata && this.props.sound.metadata.audio.files.sound) {
        this.soundengine.load(this.playlist.getIpfsUrl(this.props.sound.metadata.audio.files.sound));
      }
    }
  }

  clickWaveform(pos) {
    var cur = this.playlist.getCurrentSound();
    if(cur && this.props.sound.id === cur.id) {
      this.soundengine.seekTo(pos);
      if(!this.state.playing) {
        this.soundengine.play();
      }
    } else {
      this.playlist.playSound(this.props.sound, pos);
      if(this.props.sound.file) {
        this.soundengine.load("./media/" + this.props.sound.file);
      } else if(this.props.sound.metadata && this.props.sound.metadata.audio.files.sound) {
        this.soundengine.load(this.playlist.getIpfsUrl(this.props.sound.metadata.audio.files.sound));
      }
    }
  }

  clickLike() {
    if(this.state.voting) return;

    this.playlist.likeSound(this.props.sound, !this.state.liked);
    this.setState({
      voting: true
    });
  }

  clickDownload() {
    const dlGate = this.props.sound.metadata.audio.dlgate;

    if(dlGate && dlGate.length > 0) {
      window.open(dlGate, '_blank');
    } else {
      download(this.playlist.getIpfsUrl(this.props.sound.metadata.audio.files.sound, this.props.sound.metadata.audio.title));
    }
  }

  clickBuy() {
    const url = this.props.sound.metadata.audio.buyurl;

    if(url && url.length > 0) {
      window.open(url, '_blank');
    }
  }


  // Component lifecycle hooks

  componentDidMount() {
    // Event handlers for SoundEngine
    this.soundengine.on('play', this.handleSoundEnginePlay);
    this.soundengine.on('pause', this.handleSoundEnginePause);
    this.soundengine.on('finish', this.handleSoundEngineFinish);
    // and if this is the sound that is playing...
    var cur = this.playlist.getCurrentSound();
    if(cur && cur.id === this.props.sound.id) {
      var pos = this.soundengine.getCurrentPos();
      var playing = this.soundengine.isPlaying();
      if(playing) {
        this.soundengine.on('audioprocess', this.handleSoundEngineProgress);
      }
      this.setState({
        playing,
        pos
      });
    }

    // Event handlers for Playlist
    this.playlist.on('play-sound', this.handlePlaylistPlaySound);
    this.playlist.on('liked', this.toggleLike);
  }

  componentWillUnmount() {
    // Event handlers for SoundEngine
    this.soundengine.un('play', this.handleSoundEnginePlay);
    this.soundengine.un('pause', this.handleSoundEnginePause);
    this.soundengine.un('finish', this.handleSoundEngineFinish);
    // added on play
    this.soundengine.un('audioprocess', this.handleSoundEngineProgress);

    // Event handlers for Playlist
    this.playlist.un('play-sound', this.handlePlaylistPlaySound);
    this.playlist.un('liked', this.toggleLike);
  }

  // METADATA:
  // {
  //   "audio":{
  //     "title":"Kaskade - Atmosphere (Bender's Late Night Ambient Remix)",
  //     "desc":"Relax time... Nice vibe sound! :)",
  //     "type":"remix",
  //     "genre":"ambient",
  //     "tags":"chillout, relax, zen",
  //     "download":true,
  //     "dlgate":"",
  //     "buy":false,
  //     "buyurl":"",
  //     "files":{
  //       "sound":"QmZ8aLnbeLscuVvoGrt8gqzfSDuNSRdiUkVb943PPfaQnV",
  //       "cover":"QmYAW67iCMFy3oNCZmT5q7PNGJQ8bfmuytcHnuXGSYyGMu",
  //       "peaks":"QmWdk7jjghjrUFnSnHsPhg4mUsLsEXnUwFsZfHxs9itNzi"
  //     }
  //   },
  //   "tags":["dsound","dsound-remix","dsound-ambient","dsound-chillout","dsound-relax"],
  //   "app":"dsound/0.1"
  // }


  // Render

  render() {
    var user = this.auth.getAuthUser();

    var type = this.props.sound.tags[0];
    var genre = this.props.sound.tags[1];
    // var type = this.props.sound.metadata.audio.type || this.props.sound.metadata.sound.type;
    // var genre = this.props.sound.metadata.audio.genre || this.props.sound.metadata.sound.genre;

    var i = 0;
    var tags = [type, genre].map((tag) => {
      return (
        <Link key={i++} to={this.playlist.getCategoryLink(tag.substring(0, 15))}>
          <Badge className="track-player-tag">#{tag.substring(0, 15)}</Badge>
        </Link>
      );
    });

    var cover;
    if(this.props.sound.cover) {
      cover = <div className="cover-image" style={{backgroundImage: 'url(./media/' + this.props.sound.cover + ')'}} />;
    } else if(this.props.sound.metadata && this.props.sound.metadata.audio.files.cover) {
      cover = <div className="cover-image" style={{backgroundImage: 'url(' + this.playlist.getIpfsUrl(this.props.sound.metadata.audio.files.cover) + ')'}} />;
    // if(this.props.sound.metadata.audio.files.cover) {
    //   cover = <div className="cover-image" style={{backgroundImage: 'url(' + this.playlist.getIpfsUrl(this.props.sound.metadata.audio.files.cover) + ')'}} />
    } else {
      cover = <div className="cover-image" />
    }

    var authorUrl = this.props.sound ? '/@' + this.props.sound.author : '';
    var soundUrl = this.props.sound ? '/@' + this.props.sound.author + '/' + this.props.sound.permlink : '';

    var duration;
    if(this.props.sound.metadata && this.props.sound.metadata.audio.duration) {
      duration = <span className="player-duration">{formatter.time(this.props.sound.metadata.audio.duration)}</span>
    }

    var button = this.state.playing ? <i className="fa fa-pause" /> : <i className="fa fa-play" />;

    var btnPlay, btnLike;
    if(!user) {
      btnPlay = (<button className="bottom-player-btn disabled">{button} {formatter.number(this.state.plays)}</button>);
      btnLike = (<button className="bottom-player-btn disabled"><i className="fa fa-heart" /> {formatter.number(this.state.likes)}</button>);
    } else {
      btnPlay = (<button className="bottom-player-btn" onClick={this.playToggle}>{button} {formatter.number(this.state.plays)}</button>);
      btnLike = this.state.liked ?
        (<button onClick={this.clickLike} className="bottom-player-btn active"><i className="fa fa-heart" /> {formatter.number(this.state.likes)}</button>) :
        (<button onClick={this.clickLike} className="bottom-player-btn"><i className="fa fa-heart" /> {formatter.number(this.state.likes)}</button>);
    }

    var btnDownloadBuy;
    if(this.props.sound.metadata && this.props.sound.metadata.audio.download) {
      btnDownloadBuy = <button onClick={this.clickDownload} className="bottom-player-btn d-md-down-none"><i className="fa fa-download" /> Download</button>
    } else if(this.props.sound.metadata && this.props.sound.metadata.audio.buy) {
      btnDownloadBuy = <button onClick={this.clickBuy} className="bottom-player-btn d-md-down-none"><i className="fa fa-shopping-basket" /> Buy</button>
    }

    var title = '';
    if(this.props.sound.title) {
      title = this.props.sound.title.substring(0,100);
    } else if(this.props.sound.metadata && this.props.sound.metadata.audio.title) {
      title = this.props.sound.metadata.audio.title.substring(0, 100);
    }

    var peaks = '';
    if(this.props.sound.peaks) {
      peaks = './media/' + this.props.sound.peaks;
    } else if(this.props.sound.metadata && this.props.sound.metadata.audio.files.peaks) {
      peaks = this.playlist.getIpfsUrl(this.props.sound.metadata.audio.files.peaks);
    }

    return (
      <div className="row-fluid">
        <div className="col-sm-12">
          <article className="track-player">
            <div className="player-area">
              <div className="top-player-area">
                <div className="track-player-sound">
                  <div className="track-player-author">
                    <Link to={authorUrl}>{'@' + this.props.sound.author}</Link>
                    <span className="from-now">{formatter.dateFromNow(this.props.sound.created || new Date())}</span>
                  </div>
                  <div className="track-player-title">
                    <Link to={soundUrl}>
                      {title}
                    </Link>
                    {duration}
                  </div>
                </div>
                <div className="track-player-info">
                  {(this.props.sound.bpm ? formatter.number(this.props.sound.bpm) : '--') + ' BPM'}
                  <i className="fa fa-music" /> {this.props.sound.key || '--'}
                </div>
              </div>
              <div className="track-player-wave">
                <Waveform
                  peaks={peaks}
                  pos={this.state.pos} onPosChange={this.clickWaveform}
                  options={{barWidth: 0, progressColor: '#333', cursorColor: 'rgba(0,0,0,0.0)'}}
                />
              </div>
              <div className="bottom-player-area">
                {btnPlay}
                {btnLike}
                {btnDownloadBuy}
                <div className="bottom-player-tags">
                  {tags}
                </div>
              </div>
            </div>
            <Link to={soundUrl}>
              {cover}
            </Link>
          </article>
        </div>
      </div>
    )
  }
}

export default TrackPlayer;
