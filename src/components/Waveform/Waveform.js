import React, { Component } from 'react';
import PropTypes from 'prop-types';
import WaveformDrawer from 'waveform-drawer';


const EVENTS = [
  'error',
  'loading',
  'mouseup',
  'pause',
  'ready',
  'scroll',
  'seek',
  'zoom'
];

/**
 * @description Capitalise the first letter of a string
 */
function capitaliseFirstLetter(string) {
  return string
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

/**
 * @description Throws an error if the prop is defined and not an integer or not positive
 */
function positiveIntegerProptype(props, propName, componentName) {
  const n = props[propName];
  if (
    n !== undefined &&
    (typeof n !== 'number' || n !== parseInt(n, 10) || n < 0)
  ) {
    return new Error(`Invalid ${propName} supplied to ${componentName},
      expected a positive integer`);
  }

  return null;
}

const resizeThrottler = fn => () => {
  let resizeTimeout;

  if (!resizeTimeout) {
    resizeTimeout = setTimeout(() => {
      resizeTimeout = null;
      fn();
    }, 66);
  }
};

class Waveform extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isReady: false,
      pos: 0
    };

    this.loadPeaks = this.loadPeaks.bind(this);
    this.seekTo = this.seekTo.bind(this);
  }


  componentDidMount() {
    const options = Object.assign({}, this.props.options, {
      ...this.props,
      container: this.waveformdrawerEl
    });

    this._waveformdrawer = new WaveformDrawer(options);
    this._waveformdrawer.init();

    if (this.props.responsive) {
      this._handleResize = resizeThrottler(() => {
        // pause playback for resize operation
        if (this.props.playing) {
          this._waveformdrawer.pause();
        }

        // resize the waveform
        this._waveformdrawer.drawBuffer();

        // We allow resize before file isloaded, since we can get wave data from outside,
        // so there might not be a file loaded when resizing
        if (this.state.isReady) {
          // restore previous position
          this.seekTo(this.props.pos);
        }

        // restore playback
        if (this.props.playing) {
          this._waveformdrawer.play();
        }
      });
    }

    // file was loaded, wave was drawn
    this._waveformdrawer.on('ready', () => {
      this.setState({
        isReady: true,
        pos: this.props.pos
      });

      // set initial position
      if (this.props.pos) {
        this.seekTo(this.props.pos);
      }

      // set initial zoom
      if (this.props.zoom) {
        this._waveformdrawer.zoom(this.props.zoom);
      }
    });

    // waveform click
    this._waveformdrawer.on('click', (pos) => {
      this.props.onPosChange(pos);
    });

    // hook up events to callback handlers passed in as props
    EVENTS.forEach(e => {
      const propCallback = this.props[`on${capitaliseFirstLetter(e)}`];
      const waveformdrawer = this._waveformdrawer;
      if (propCallback) {
        this._waveformdrawer.on(e, (...originalArgs) => {
          propCallback({
            waveformdrawer,
            originalArgs
          });
        });
      }
    });

    // if peaks prop, load file
    if (this.props.peaks) {
      this.loadPeaks(this.props.peaks);
    }

    if (this.props.responsive) {
      window.addEventListener('resize', this._handleResize, false);
    }
  }

  // update waveformdrawer rendering manually
  componentWillReceiveProps(nextProps) {
    let newSource = false;
    let seekToInNewFile;

    // update peaks
    if (this.props.peaks !== nextProps.peaks) {
      this.setState({
        isReady: false
      });
      this.loadPeaks(nextProps.peaks);
      newSource = true;
    }

    // update position
    if (
      nextProps.pos !== undefined &&
      this.state.isReady &&
      nextProps.pos !== this.props.pos &&
      nextProps.pos !== this.state.pos
    ) {
      if (newSource) {
        seekToInNewFile = this._waveformdrawer.on('ready', () => {
          this.seekTo(nextProps.pos);
          seekToInNewFile.un();
        });
      } else {
        this.seekTo(nextProps.pos);
      }
    }

    // update zoom
    if (this.props.zoom !== nextProps.zoom) {
      this._waveformdrawer.zoom(nextProps.zoom);
    }

    // turn responsive on
    if (
      nextProps.responsive &&
      this.props.responsive !== nextProps.responsive
    ) {
      window.addEventListener('resize', this._handleResize, false);
    }

    // turn responsive off
    if (
      !nextProps.responsive &&
      this.props.responsive !== nextProps.responsive
    ) {
      window.removeEventListener('resize', this._handleResize);
    }
  }

  componentWillUnmount() {
    // remove listeners
    EVENTS.forEach(e => {
      this._waveformdrawer.un(e);
    });

    // destroy waveformdrawer instance
    this._waveformdrawer.destroy();

    if (this.props.responsive) {
      window.removeEventListener('resize', this._handleResize);
    }
  }

  // receives pixels and transforms this to the position as a float 0-1
  pixToPos(pix) {
    return 1 / this._waveformdrawer.getWidth() * pix;
  }

  // receives position as a float 0-1 and transforms this to pixels
  posToPix(pos) {
    return pos * this._waveformdrawer.getWidth();
  }

  // pos between 0-1 proportional position
  seekTo(pos) {
    if (this.props.options.autoCenter) {
      this._waveformdrawer.seekAndCenter(pos);
    } else {
      this._waveformdrawer.seekTo(pos);
    }
  }

  // pass peaks data to waveformdrawer
  loadPeaks(peaks) {
    if(typeof peaks === 'string' || peaks instanceof Array) {
      // bog-standard string is handled by load method and ajax call
      this._waveformdrawer.load(peaks);
    } else {
      throw new Error(`Waveform.loadPeaks expects prop peaks
        to be either string or array`);
    }
  }

  render() {
    const childrenWithProps = this.props.children
      ? React.Children.map(this.props.children, child =>
          React.cloneElement(child, {
            waveformdrawer: this._waveformdrawer,
            isReady: this.state.isReady
          })
        )
      : false;
    return (
      <div>
        <div
          ref={c => {
            this.waveformdrawerEl = c;
          }}
        />
        {childrenWithProps}
      </div>
    );
  }
}

Waveform.propTypes = {
  playing: PropTypes.bool,
  pos: PropTypes.number,
  peaks: (props, propName, componentName) => {
    const prop = props[propName];
    if (
      prop &&
      typeof prop !== 'string' &&
      !(prop instanceof Array)
    ) {
      return new Error(`Invalid ${propName} supplied to ${componentName}
        expected either string or file/blob`);
    }

    return null;
  },

  zoom: PropTypes.number,
  responsive: PropTypes.bool,
  onPosChange: PropTypes.func,
  children: PropTypes.oneOfType([PropTypes.element, PropTypes.array]),
  options: PropTypes.shape({
    barWidth: (props, propName, componentName) => {
      const prop = props[propName];
      if (prop !== undefined && typeof prop !== 'number') {
        return new Error(`Invalid ${propName} supplied to ${componentName}
          expected either undefined or number`);
      }

      return null;
    },

    cursorColor: PropTypes.string,
    cursorWidth: positiveIntegerProptype,
    dragSelection: PropTypes.bool,
    fillParent: PropTypes.bool,
    height: positiveIntegerProptype,
    hideScrollbar: PropTypes.bool,
    interact: PropTypes.bool,
    loopSelection: PropTypes.bool,
    minPxPerSec: positiveIntegerProptype,
    pixelRatio: PropTypes.number,
    progressColor: PropTypes.string,
    scrollParent: PropTypes.bool,
    skipLength: PropTypes.number,
    waveColor: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.instanceOf(window.CanvasGradient)
    ]),
    autoCenter: PropTypes.bool
  })
};

Waveform.defaultProps = {
  playing: false,
  pos: 0,
  options: WaveformDrawer.defaultParams,
  responsive: true,
  onPosChange: () => {}
};

export default Waveform;
