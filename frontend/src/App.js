import logo from './logo.svg';
import './App.css';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';

const Healthcheck = () => {
  const env = window._env_;

  return (
    JSON.stringify({
      is_healthy: !!env ? true : false
    })
  );
}

function App() {    
  return (
    <Router>
      <div>
        <Switch>
            <Route path="/healthcheck">
                <Healthcheck />
            </Route>

            <Route path="/">
              <div className="App">
                <header className="App-header">
                  <img src={logo} className="App-logo" alt="logo" />
                  <p>
                    Edit <code>src/App.js</code> and save to reload.
                  </p>
                  <a
                    className="App-link"
                    href="https://reactjs.org"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Learn React
                  </a>
                </header>
              </div>
            </Route>
        </Switch>
      </div>
    </Router>
  );
}

export default App;
