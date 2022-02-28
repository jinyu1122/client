import { useState } from "react";
import { getShareScreenStream } from "./getShareScreenStream";
import { connectSocket } from "./screenShareRTCConnection";

function App() {
  const [connected, setConntected] = useState(false);
  const btnClicked = async () => {
    const stream = await getShareScreenStream();
    connectSocket(stream);
    setConntected(true);
  };
  
  return (
    <div className="App">
      { 
      !connected && 
      <button onClick={btnClicked} style={{ width: 100, height: 50}} >Share Screen</button>
      }
      {
        connected && <h1>Share screen succeed. Keep this window open.</h1>
      }
    </div>
  );
}

export default App;
