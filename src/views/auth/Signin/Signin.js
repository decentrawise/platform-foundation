// @flow
import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import {
  Grid, Row, Col, Panel,
  Form, FormGroup, InputGroup, FormControl,
  ButtonToolbar, Button, Alert, HelpBlock
} from 'react-bootstrap';
import { toast } from 'react-toastify';
import { injectIntl, intlShape, FormattedMessage, FormattedHTMLMessage } from 'react-intl';

import './Signin.css';
import Auth from '../../../common/Auth';


type Props = {
  history: Any,

  auth: Auth,

  intl: intlShape
};

type State = {
  username: string,
  validUsername: boolean,
  password: string,
  validPassword: boolean,
  validForm: boolean
};

class Signin extends Component<Props, State> {
  state = {
    username: '',
    validUsername: true,
    password: '',
    validPassword: true,
    validForm: false
  };

  refUsername = null;


  constructor(props: Props) {
    super(props);

    this.changeUsername = this.changeUsername.bind(this);
    this.changePassword = this.changePassword.bind(this);
    this.checkValidForm = this.checkValidForm.bind(this);
    this.clickSignin = this.clickSignin.bind(this);
    this.clickBack = this.clickBack.bind(this);
  }

  changeUsername = function(e) {
    const username = e.target.value;
    var valid = (username && /^[0-9a-zA-Z._]{3,}$/.test(username));

    this.setState({
      username,
      validUsername: valid
    });

    setTimeout(this.checkValidForm, 0);
  }

  changePassword = function(e) {
    const password = e.target.value;
    var valid = (password && /^.{10,}$/.test(password));

    this.setState({
      password,
      validPassword: valid
    });

    setTimeout(this.checkValidForm, 0);
  }

  checkValidForm = function() {
    if(this.state.validUsername && this.state.validPassword) {
      this.setState({
        validForm: true
      });
    } else {
      this.setState({
        validForm: false
      });
    }
  }

  clickSignin = function() {
    const user = this.state.username.trim();
    const pass = this.state.password.trim();

    const usersLoggedIn = this.props.auth.getAuthUserList();

    // Check if new user
    if(usersLoggedIn.find((u) => u.name === user) === undefined) {
      // Login
      this.props.auth.authenticate(user, pass)
        .then((userData) => {
          // Show toast
          toast.success(this.props.intl.formatMessage({id:'signin:welcome'}, {name: userData.name}));

          // Get in
          if(usersLoggedIn.length) {
            this.props.history.goBack();
          } else {
            this.props.history.push('/browse');
          }
        })
        .catch((err) => {
          toast.error(err.message);
        });
    } else {
      toast.warning(this.props.intl.formatMessage({id:'signin:alreadyin'}));

      // Go back
      this.props.history.goBack();
    }
  }

  clickBack = function() {
    this.props.history.goBack();
  }

  render() {
    const headerSignin = (
      <div>
        <span className="panel-header">
          <FormattedMessage id="signin" />
        </span>
        <Link to="/auth/register" className="panel-header-link pull-right">
          <FormattedMessage id="register:new" />
        </Link>
      </div>
    );

    const formSignin = (
      <Form>
        <FormGroup controlId="formUsername" validationState={this.state.validUsername ? null : 'warning'} >
          <InputGroup>
            <InputGroup.Addon><i className="signin-icon fa fa-user" /></InputGroup.Addon>
            <FormControl type="text" placeholder={this.props.intl.formatMessage({id:'signin:username'})}
              onChange={this.changeUsername} onBlur={this.changeUsername}
            />
          </InputGroup>
          <FormControl.Feedback />
          <HelpBlock className={this.state.validUsername ? 'hidden' : ''}><FormattedMessage id="signin:username-help" /></HelpBlock>
        </FormGroup>
        <FormGroup controlId="formPassword" validationState={this.state.validPassword ? null : 'warning'}>
          <InputGroup>
            <InputGroup.Addon><i className="signin-icon fa fa-key" /></InputGroup.Addon>
            <FormControl type="password" placeholder={this.props.intl.formatMessage({id:'signin:password'})}
            onChange={this.changePassword} onBlur={this.changePassword} />
          </InputGroup>
          <FormControl.Feedback />
        </FormGroup>
        <FormGroup>
          <Alert><FormattedHTMLMessage id="alert:passwords" /></Alert>
        </FormGroup>
        <FormGroup>
          <ButtonToolbar className="pull-right">
            <Button onClick={this.clickSignin} bsStyle="primary" disabled={!this.state.validForm}><FormattedMessage id="signin" /></Button>
            <Button onClick={this.clickBack}><FormattedMessage id="back" /></Button>
          </ButtonToolbar>
        </FormGroup>
      </Form>
    );

    return (
      <div className="Signin">
        <Grid fluid>
          <Row>
            <Col md={3} />
            <Col md={6}>
              <Panel header={headerSignin}>
                {formSignin}
              </Panel>
            </Col>
            <Col md={3} />
          </Row>
        </Grid>
      </div>
    );
  }
}

export default injectIntl(Signin);
