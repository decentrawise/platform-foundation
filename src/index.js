import React from 'react';
import ReactDOM from 'react-dom';
import { HashRouter, Route, Switch } from 'react-router-dom';
import { IntlProvider } from 'react-intl';

import i18n from './i18n';

import './index.css';
import App from './containers/App/';
import registerServiceWorker from './registerServiceWorker';


// Configure i18n
const locale = i18n.getCurrentLocale();
i18n.loadLocaleData();
const messages = i18n.getMessages();

ReactDOM.render((
  <IntlProvider locale={locale} key={locale} messages={messages[locale]} defaultLocale="en">
    <HashRouter>
      <Switch>
        <Route path="/" name="App" component={App}/>
      </Switch>
    </HashRouter>
  </IntlProvider>
), document.getElementById('root'))
registerServiceWorker();
