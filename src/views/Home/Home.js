// @flow
import React, { Component } from 'react';
import { injectIntl, intlShape } from 'react-intl';

import './Home.css';


type Props = {

  intl: intlShape
};

type State = {
  muted: boolean
};

class Home extends Component<Props, State> {
  state = {
    muted: true
  };

  videoElem: ?HTMLVideoElement;


  fadeMute(muted: boolean, volume: ?number) {
    if(!this.videoElem) return;

    if(volume === undefined) {
      volume = muted ? 1 : 0;
      this.videoElem.volume = volume;
      if(!muted) this.videoElem.muted = muted;
      setTimeout(() => this.fadeMute(muted, volume), 20);
    } else {
      volume += muted ? -0.1 : 0.1;
      if(volume < 0 || volume > 1) {
        if(muted) this.videoElem.muted = muted;
        return;
      } else {
        this.videoElem.volume = volume;
        setTimeout(() => this.fadeMute(muted, volume), 20);
      }
    }
  }

  toggleMute() {
    const muted = !this.state.muted;

    //this.videoElem.muted = muted;
    setTimeout(() => this.fadeMute(muted), 0);

    this.setState({
      muted
    });
  }

  render() {
    return (
      <section className="Home animated fadeIn">
        <video playsInline autoPlay muted loop id="bgvideo" ref={elem => (this.videoElem = elem)}>
          <source src="./vid/background.mp4" type="video/mp4" />
        </video>
        <img src="./img/sound-mute.gif" alt="mute" id="bgvideo-mute"
          className={this.state.muted ? 'muted' : ''} onClick={this.toggleMute.bind(this)}
          title={this.state.muted ? this.props.intl.formatMessage({id:'home:unmute'}) :
                  this.props.intl.formatMessage({id:'home:mute'})}
        />
      </section>
    );
  }
}

export default injectIntl(Home);
