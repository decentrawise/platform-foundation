// @flow
import React, { Component } from 'react';
import { Redirect, Switch, Route } from 'react-router-dom';
import SoundEngine from 'sound-engine';

import './Listen.css';
import Auth from '../../common/Auth';
import Blockchain from '../../common/Blockchain';
import Ipfs from '../../common/Ipfs';
import Playlist from '../../common/Playlist/';
import FooterPlayer from '../../components/FooterPlayer';
import TrackBrowser from '../../views/browsers/TrackBrowser';
import CoverBrowser from '../../views/browsers/CoverBrowser';


type Props = {
  auth: Auth
};

type State = {};

export default class Listen extends Component<Props, State> {
  state: State = {};

  bc: Blockchain;
  ipfs: Ipfs;
  soundengine: SoundEngine;
  playlist: Playlist;

  constructor(props: Props) {
    super(props);

    // Create the Blockchain service
    this.bc = new Blockchain(props.auth);

    // Create the Ipfs service
    this.ipfs = new Ipfs();

    // Create the SoundEngine and initialize it
    this.soundengine = new SoundEngine({
      mediaContainer: '#audio-player',
      normalize: true
    });

    this.playlist = new Playlist(this.bc, this.ipfs);
  }


  // Component lifecycle hooks

  componentDidMount() {
    // initialize SoundEngine
    this.soundengine.init();
  }


  // Render

  getTrackBrowser(query: string) {
    return (props: any) => <TrackBrowser {...props}
      auth={this.props.auth}
      soundengine={this.soundengine}
      playlist={this.playlist}
      query={query}
    />;
  }

  getCoverBrowser(query: string) {
    return (props: any) => <CoverBrowser {...props}
      auth={this.props.auth}
      soundengine={this.soundengine}
      playlist={this.playlist}
      query={query}
    />;
  }

  render() {
    return (
      <div className="Listen">
        <Switch>
          <Route path="/listen/tracks" name="Tracks" component={this.getTrackBrowser('tracks')}/>
          <Route path="/listen/albums" name="Albums" component={this.getCoverBrowser('albums')}/>
          <Route path="/listen/shows" name="Shows" component={this.getCoverBrowser('shows')}/>
          <Route path="/listen/playlists" name="Playlists" component={this.getCoverBrowser('playlists')}/>
          <Route path="/listen/charts" name="Charts" component={this.getCoverBrowser('chats')}/>
          <Redirect from="/listen" to="/listen/tracks"/>
        </Switch>
        <div id="audio-player" style={{display: 'none'}} />
        <FooterPlayer auth={this.props.auth} soundengine={this.soundengine} playlist={this.playlist} />
      </div>
    );
  }
}
