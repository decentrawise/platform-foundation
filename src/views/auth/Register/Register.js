// @flow
import React, { Component } from 'react';
import {
  Grid, Row, Col, Panel,
  Form, FormGroup, InputGroup, FormControl,
  ButtonToolbar, Button
} from 'react-bootstrap';
import { injectIntl, intlShape, FormattedMessage } from 'react-intl';

import './Register.css';


type Props = {
  intl: intlShape
};

type State = {};

class Register extends Component<Props, State> {
  state = {};

  render() {
    const headerRegister = (
      <h1>
        <FormattedMessage id="register" />
      </h1>
    );

    const formRegister = (
      <Form>
        <FormGroup>
          <InputGroup>
            <InputGroup.Addon><i className="register-icon fa fa-user" /></InputGroup.Addon>
            <FormControl type="text" placeholder={this.props.intl.formatMessage({id:'register:username'})} />
          </InputGroup>
        </FormGroup>
        <FormGroup>
          <InputGroup>
            <InputGroup.Addon><i className="register-icon fa fa-envelope" /></InputGroup.Addon>
            <FormControl type="text" placeholder={this.props.intl.formatMessage({id:'register:email'})} />
          </InputGroup>
        </FormGroup>
        <FormGroup>
          <InputGroup>
            <InputGroup.Addon><i className="register-icon fa fa-key" /></InputGroup.Addon>
            <FormControl type="password" placeholder={this.props.intl.formatMessage({id:'register:password'})} />
            <InputGroup.Button>
              <Button><FormattedMessage id="register:generate" /></Button>
            </InputGroup.Button>
          </InputGroup>
        </FormGroup>
        <FormGroup>
          <InputGroup>
            <InputGroup.Addon><i className="register-icon fa fa-check" /></InputGroup.Addon>
            <FormControl type="password" placeholder={this.props.intl.formatMessage({id:'register:confirm'})} />
          </InputGroup>
        </FormGroup>
        <FormGroup>
          <ButtonToolbar className="pull-right">
            <Button bsStyle="primary"><FormattedMessage id="signin" /></Button>
            <Button><FormattedMessage id="cancel" /></Button>
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
              <Panel header={headerRegister}>
                {formRegister}
              </Panel>
            </Col>
            <Col md={3} />
          </Row>
        </Grid>
      </div>
    );
  }
}

export default injectIntl(Register);
