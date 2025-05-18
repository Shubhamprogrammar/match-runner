import './App.css';
import Details from './components/details';
import Match from './components/match';

function App() {
  return (
    <div className="App">
      <Match />
      <Details />
      <footer className="footer">
        <div className="container">
          <p className="text-center text-white">© 2024 Cricket Match Tracker</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
