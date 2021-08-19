import React from 'react';
import { BrowserRouter as Router, Route  } from 'react-router-dom';

import Home from './Home';
import Chat from './Chat';

interface Props {}
interface State {}

export default class App extends React.Component<Props, State> {
    public render() {
        return (
            <React.Fragment>
                <Router>
                    <Route exact path="/group/:chatID" render={(props: any) => <Chat {...props} />} />
                    <Route exact path="/" render={(props: any) => <Home {...props} />} />
                </Router>
            </React.Fragment>
        )
    }
}