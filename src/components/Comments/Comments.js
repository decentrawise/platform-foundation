import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { Form, FormGroup, Input } from 'reactstrap';
import { toast } from 'react-toastify';
import formatter from '../../common/util/formatter';
import xss from '../../common/util/xss';
import showdown from 'showdown';


export default class Comments extends Component {

  constructor(props) {
    super(props);

    // Get the auth service
    this.auth = this.props.auth;
    this.steem = this.props.steem;

    // Compute the net votes
    var upVotes = 0, downVotes = 0;
    if(this.props.comment.net_votes >= 0) {
      upVotes = this.props.comment.net_votes;
    } else {
      downVotes = this.props.comment.net_votes * -1;
    }

    this.state = {
      root: false,
      author: null,
      voting: false,
      upVotes,
      downVotes,
      replyOpen: false,
      reply: '',
      children: []
    };

    // Bind event handlers
    this.onProfilePictureError = this.onProfilePictureError.bind(this);
    this.toggleReply = this.toggleReply.bind(this);
    this.onChangeReply = this.onChangeReply.bind(this);
    this.onReplySubmit = this.onReplySubmit.bind(this);
    this.onUpVote = this.onUpVote.bind(this);
    this.onDownVote = this.onDownVote.bind(this);
  }


  // UI event handlers

  onProfilePictureError(e) {
    e.target.src = './img/doe.png';
  }

  toggleReply() {
    var replyOpen = !this.state.replyOpen;

    this.setState({
      replyOpen
    });
  }

  onChangeReply(e) {
    this.setState({
      reply: e.target.value
    });
  }

  onReplySubmit(e) {
    e.preventDefault();

    this.steem.postComment(this.props.comment, xss.removeHtml(this.state.reply))
      .then(res => {
        // Reload the children to update
        this.loadChildren();
      })
      .catch(err => {
        toast.error('Error posting comment. Please check your connection...');
      })

    this.setState({
      replyOpen: false,
      reply: ''
    });
  }

  onUpVote() {
    if(this.state.voting) return;

    this.steem.voteSound(this.props.comment, true)
      .then(res => {
        this.setState({
          voting: false,
          upVotes: this.state.upVotes + 1
        });
      })
      .catch(err => {
        toast.error('Error voting on comment. Please check your connection...')
        this.setState({
          voting: false
        });
      })

    this.setState({
      voting: true
    });
  }

  onDownVote() {
    if(this.state.voting) return;

    this.steem.flagSound(this.props.comment, true)
      .then(res => {
        this.setState({
          voting: false,
          upVotes: this.state.downVotes + 1
        });
      })
      .catch(err => {
        toast.error('Error voting on comment. Please check your connection...')
        this.setState({
          voting: false
        });
      })

    this.setState({
      voting: true
    });
  }


  // Methods

  loadChildren() {
    this.steem.getSoundComments(this.props.comment.author, this.props.comment.permlink)
      .then((children) => {
        this.setState({
          children
        });
      })
      .catch(err => {
        console.log('Error updating child comments:', err);
      });
  }

  // Component lifecycle hooks

  componentDidMount() {
    // Are we root comment? If so show the comment box only
    var root = (this.props.comment.id === this.props.comment.root_comment);
    this.setState({
      root
    });

    // Load author data, if not root comment
    if(!root) {
      this.steem.getUserMetadata(this.props.comment.author)
        .then((author) => {
          this.setState({
            author
          });
        })
    }

    // Load children if any
    if(this.props.comment.children > 0) {
      this.loadChildren();
    }
  }

  componentDidUpdate() {
    if(this.state.replyOpen && this.reply) {
      this.reply.focus()
    }
  }

  componentWillUnmount() {
  }


  // {
  //   abs_rshares:"290966070415"
  //   active:"2017-09-03T05:24:30"
  //   active_votes:[]
  //   allow_curation_rewards:true
  //   allow_replies:true
  //   allow_votes:true
  //   author:"btcmillionaire"
  //   author_reputation:"2834176962470"
  //   author_rewards:0
  //   beneficiaries:[]
  //   body:"Awesome to see you on dtube! Always a step ahead!"
  //   body_length:0
  //   cashout_time:"2017-09-10T05:24:30"
  //   category:"dtube"
  //   children:0
  //   children_abs_rshares:0
  //   created:"2017-09-03T05:24:30"
  //   curator_payout_value:"0.000 SBD"
  //   depth:1
  //   id:11807167
  //   json_metadata:"{"app":"dtube"}"
  //   last_payout:"1970-01-01T00:00:00"
  //   last_update:"2017-09-03T05:24:30"
  //   max_accepted_payout:"1000000.000 SBD"
  //   max_cashout_time:"1969-12-31T23:59:59"
  //   net_rshares:"290966070415"
  //   net_votes:2
  //   parent_author:"dollarvigilante"
  //   parent_permlink:"dxvf6y75"
  //   pending_payout_value:"1.025 SBD"
  //   percent_steem_dollars:10000
  //   permlink:"xsz1db7k5"
  //   promoted:"0.000 SBD"
  //   reblogged_by:[]
  //   replies:[]
  //   reward_weight:10000
  //   root_comment:11798651
  //   root_title:"Bitcoin Hits All-Time High and Smashes Through $5,000 As The Rothschilds Get Out Of The Stock Market"
  //   title:"xsz1db7k5"
  //   total_payout_value:"0.000 SBD"
  //   total_pending_payout_value:"0.000 STEEM"
  //   total_vote_weight:539630
  //   url:"/dtube/@dollarvigilante/dxvf6y75#@btcmillionaire/xsz1db7k5"
  //   vote_rshares:"290966070415"
  // }

  // Render

  render() {
    const converter = new showdown.Converter();

    var commentAvatar;
    if(!this.state.root) {
      var avatar = './img/doe.png';
      if(this.state.author && this.state.author.profile && this.state.author.profile.profile_image) {
        avatar = this.state.author.profile.profile_image;
      }
      commentAvatar = (
        <div className="comment-avatar">
          <Link to={'/@' + this.props.comment.author}>
            <img src={avatar} alt="" onError={this.onProfilePictureError} />
          </Link>
        </div>
      );
    }

    var commentDetails;
    if(!this.state.root) {
      commentDetails = (
        <div className="comment-main">
          <div className="comment-post-time">
            <Link to={'/@' + this.props.comment.author}>@{this.props.comment.author}</Link>
            <span className="post-time"> commented {formatter.dateFromNow(this.props.comment.created)}</span>
          </div>
          <div className="comment-body"
            dangerouslySetInnerHTML={{__html: xss.filterHtml(converter.makeHtml(this.props.comment.body)) }} />
          <div className="comment-actions">
            <button onClick={this.onUpVote} className="action">
              <i className="fa fa-thumbs-up" /> {formatter.number(this.state.upVotes)}
            </button>
            <button onClick={this.onDownVote} className="action">
              <i className="fa fa-thumbs-down" /> {formatter.number(this.state.downVotes)}
            </button>
            <span className="action">
            {'$' + formatter.sbd(this.props.comment.pending_payout_value)}
            </span>
            <button onClick={this.toggleReply} className="action reply">
              Reply
            </button>
          </div>
        </div>
      );
    }


    // Compose a list of the children
    var childComments = this.state.children.map(comment => <Comments key={comment.id} {...this.props} comment={comment} />);

    return (
      <div className="comment-item">
        {commentAvatar}
        <div className="comment-main">
          {commentDetails}
          <div className="comment-reply" style={{display: (this.state.root || this.state.replyOpen) ? 'block' : 'none'}}>
            <Form onSubmit={this.onReplySubmit}>
              <FormGroup>
                <Input type="text" name="reply" getRef={(input) => (this.reply = input)}
                  onChange={this.onChangeReply} value={this.state.reply}
                  className="form-reply" placeholder="Write your comment"
                />
              </FormGroup>
            </Form>
          </div>
          {childComments}
        </div>
      </div>
    );
  }
}
