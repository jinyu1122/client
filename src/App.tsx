import { connectSocket } from "./socket";

function App() {
  const btnClicked = () => {
    connectSocket();
  };
  
  return (
    <div className="App">
      <button onClick={btnClicked} style={{ width: 100, height: 50}} >Connect</button>
      <video id="remote-video" autoPlay playsInline />
    </div>
  );
}

export default App;
