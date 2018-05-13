// @flow
import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { ProgressBar } from 'react-bootstrap';
import SoundEngine from 'sound-engine';
import { formatter } from 'tools';

import './FooterPlayer.css';
import Auth from '../../common/Auth';
import Playlist from '../../common/Playlist';


type Props = {
  auth: any,
  soundengine: any,
  playlist: any
};

type State = {
  sound: any,
  liked: boolean,
  random: any,
  playing: boolean,
  duration: number,
  time: number,
  loading: boolean,
  liking: boolean,
};

export default class FooterPlayer extends Component<Props, State> {
  state: State;

  auth: Auth;
  soundengine: SoundEngine;
  playlist: Playlist;

  constructor(props: Props) {
    super(props);

    // Get the auth service
    this.auth = this.props.auth;

    // Get the engines
    this.soundengine = this.props.soundengine;
    this.playlist = this.props.playlist;

    const random = this.playlist.getRandom();

    // Initial state
    this.state = {
      sound: null,
      liked: false,
      random,
      playing: false,
      duration: 0,
      time: 0,
      loading: false,
      liking: false,
    };

    // Bind methods
    this.play = this.play.bind(this);
    this.pause = this.pause.bind(this);
    this.seekTo = this.seekTo.bind(this);
    this.stop = this.stop.bind(this);
    this.isPlaying = this.isPlaying.bind(this);
    this.isLoading = this.isLoading.bind(this);

    // Bind events
    this.handleReady = this.handleReady.bind(this);
    this.handlePlay = this.handlePlay.bind(this);
    this.handlePause = this.handlePause.bind(this);
    this.handleProgress = this.handleProgress.bind(this);
    this.handleFinish = this.handleFinish.bind(this);
    this.handlePlaylistPlaySound = this.handlePlaylistPlaySound.bind(this);
    this.toggleLike = this.toggleLike.bind(this);

    // Bind UI event handlers
    this.togglePlay = this.togglePlay.bind(this);
    this.prevTrack = this.prevTrack.bind(this);
    this.nextTrack = this.nextTrack.bind(this);
    this.toggleRandom = this.toggleRandom.bind(this);
    this.clickLike = this.clickLike.bind(this);

    // Event handlers for SoundEngine
    this.soundengine.on('ready', this.handleReady);
    this.soundengine.on('audioprocess', this.handleProgress);
    this.soundengine.on('seek', this.handleProgress);
    this.soundengine.on('play', this.handlePlay);
    this.soundengine.on('pause', this.handlePause);
    this.soundengine.on('finish', this.handleFinish);

    // Event handlers for Playlist
    this.playlist.on('play-sound', this.handlePlaylistPlaySound);
    this.playlist.on('liked', this.toggleLike);
  }


  // Player API

  play = function() {
    if(this.state.loading) return;

    if(this.state.sound && !this.state.playing) {
      this.soundengine.play();
    }
  }

  pause = function() {
    if(this.state.loading) return;

    if(this.state.sound && this.state.playing) {
      this.soundengine.pause();
    }
  }

  setCurrentTime = function(time: number) {
    if(this.state.loading) return;

    if(this.state.sound) {
      this.soundengine.setCurrentTime(time);
    }
  }

  seekTo = function(pos: number) {
    if(this.state.loading) return;

    if(this.state.sound) {
      this.soundengine.seekTo(pos);
    }
  }

  stop = function() {
    if(this.state.loading) return;

    if(this.state.sound && this.state.playing) {
      this.soundengine.stop();
    }
  }

  isPlaying = function() {
    return this.state.playing;
  }

  isLoading = function() {
    return this.state.loading;
  }


  // Helpers to time vs pos

  timeToPos = function(time: number) {
    return time / this.soundengine.getDuration();
  }

  posToTime = function(pos: number) {
    return Math.round(pos * this.soundengine.getDuration());
  }


  // Events handler for SoundEngine

  handleReady = function() {
    // Store the time data
    var duration = Math.round(this.soundengine.getDuration());
    const playerTime = this.soundengine.getCurrentTime();
    const currentTime = this.state.pos ? this.posToTime(this.state.pos) : this.state.time;
    var time;
    if(playerTime < currentTime - 5 || playerTime > currentTime + 5) {
      time = currentTime;
      this.soundengine.setCurrentTime(time);
    } else {
      time = playerTime;
    }
    this.setState({
      ...this.state,
      duration,
      time,
      loading: false,
      pos: 0
    });

    // And play sound if needed
    if(this.state.playing && !this.soundengine.isPlaying()) {
      this.soundengine.play();
    }
  }

  handlePlay = function() {
    this.setState({
      ...this.state,
      playing: true
    });
  }

  handlePause = function() {
    if(this.state.loading) return;

    var time = this.soundengine.getCurrentTime();

    this.setState({
      ...this.state,
      playing: false,
      time
    });
  }

  handleProgress = function(time: number) {
    if(this.state.loading) return;

    var duration = this.state.duration;      // Needed for streaming audio sometimes the duration
    if(duration === 0) duration = this.soundengine.getDuration();      // is not available at start
    this.setState({
      ...this.state,
      time: time,
      duration
    });
  }

  handleFinish = function() {
    // Force reposition track
    this.soundengine.seekTo(0);

    if(this.nextTrack() === null) {
      this.setState({
        ...this.state,
        playing: false,
        time: 0
      });
    }
  }

  handlePlaylistPlaySound = function(sound: any, pos: number) {
    // Check initial state of liked
    var liked = this.playlist.checkLiked(sound, this.auth.getAuthUser());

    this.setState({
      ...this.state,
      sound,
      liked,
      playing: true,
      duration: 0,
      time: 0,
      pos,
      loading: true,
      liking: false
    });
  }

  toggleLike = function(sound: any) {
    if(!this.state.sound || sound.id !== this.state.sound.id) return;

    var liked = !this.state.liked;
    this.setState({
      ...this.state,
      liking: false,
      liked
    });
  }


  // UI Events

  togglePlay = function() {
    if(this.state.loading) return;

    if(this.state.sound) {
      this.soundengine.playPause();
    } else {
      this.nextTrack();
    }
  }

  prevTrack = function() {
    if(this.state.loading) return;
    // Get previous sound, if any
    const prevSound = this.playlist.getPrevSound();
    if(!prevSound) return;
    // Play the previous sound
    this.playlist.playSound(prevSound, 0);
    if(prevSound.file) {
      this.soundengine.load("./media/" + prevSound.file);
    } else if(prevSound.metadata && prevSound.metadata.audio.files.sound) {
      this.soundengine.load(this.playlist.getIpfsUrl(prevSound.metadata.audio.files.sound));
    }
  }

  nextTrack = function() {
    if(this.state.loading) return;
    // Get next sound, if any
    const nextSound = this.playlist.getNextSound();
    if(!nextSound) return;
    // Play the next sound
    this.playlist.playSound(nextSound, 0);
    if(nextSound.file) {
      this.soundengine.load("./media/" + nextSound.file);
    } else if(nextSound.metadata && nextSound.metadata.audio.files.sound) {
      this.soundengine.load(this.playlist.getIpfsUrl(nextSound.metadata.audio.files.sound));
    }
    // Check if there is no next sound
    if(this.playlist.getNextSound() === null) {
      // Ask for next tracks from Playlist
      this.playlist.getNextSoundsList();
    }
  }

  toggleRandom = function() {
    var random = this.playlist.toggleRandom();
    this.setState({
      ...this.state,
      random
    });
  }

  clickLike = function() {
    if(this.state.voting) return;

    this.playlist.likeSound(this.state.sound, !this.state.liked);
    this.setState({
      ...this.state,
      liking: true
    });
  }


  // Render

  render() {
    var user = this.auth.getAuthUser();

    var cover;
    if(this.state.sound && this.state.sound.cover) {
      cover = <div className="cover-thumb d-md-down-none" style={{backgroundImage: 'url(./media/' + this.state.sound.cover + ')'}} />
    } else if(this.state.sound && this.state.sound.metadata.audio.files.cover) {
      cover = <div className="cover-thumb d-md-down-none" style={{backgroundImage: 'url(' + this.playlist.getIpfsUrl(this.state.sound.metadata.audio.files.cover) + ')'}} />
    } else {
      cover = <div className="cover-thumb d-md-down-none" />
    }

    var play;
    if(this.state.playing) {
      play = <button className="footer-player-btn" onClick={this.togglePlay}><i className="fa fa-pause fa-lg" /></button>
    } else {
      play = <button className="footer-player-btn" onClick={this.togglePlay}><i className="fa fa-play fa-lg" /></button>
    }

    var random;
    if(this.state.random) {
      random = <button className="footer-player-btn active" onClick={this.toggleRandom}><i className="fa fa-random fa-lg" /></button>;
    } else {
      random = <button className="footer-player-btn" onClick={this.toggleRandom}><i className="fa fa-random fa-lg" /></button>;
    }

    var loading = this.state.loading;
    var progMax = loading ? 100 : this.state.duration;
    var progValue = loading ? 100 : this.state.time;

    var curSoundUrl = this.state.sound ? '/@' + this.state.sound.author + '/' + this.state.sound.permlink : '';

    var btnLike;
    if(!this.state.sound || !user) {
      btnLike = (<button className="footer-player-btn disabled"><i className="fa fa-heart fa-lg" /></button>);
    } else {
      if(this.state.liked) {
        btnLike = (<button onClick={this.clickLike} className="footer-player-btn active"><i className="fa fa-heart fa-lg" /></button>);
      } else {
        btnLike = (<button onClick={this.clickLike} className="footer-player-btn"><i className="fa fa-heart fa-lg" /></button>);
      }
    }

    return (
      <footer className="app-footer">
        <div className="container-fluid">
          <div className="row">
            <button className="footer-player-btn" onClick={this.prevTrack}><i className="fa fa-step-backward fa-lg" /></button>
            {play}
            <button className="footer-player-btn" onClick={this.nextTrack}><i className="fa fa-step-forward fa-lg" /></button>
            {random}
            <div className="play-time d-sm-down-none">{formatter.time(this.state.time)}</div>
            <ProgressBar className="footer-player-prg d-sm-down-none" now={progValue} max={progMax} active={loading} />
            <div className="duration d-sm-down-none">{formatter.time(this.state.duration)}</div>
            <Link to={curSoundUrl}>
              {cover}
            </Link>
            {btnLike}
            <div className="spacer d-md-down-none" />
          </div>
        </div>
      </footer>
    )
  }
}
