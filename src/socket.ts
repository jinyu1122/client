import { io } from "socket.io-client";

let socket: any;
let pc: RTCPeerConnection;
let config: any = null;

export const connectSocket = () => {
    socket = io('http://52.176.55.106:8080');
    socket.on('testpong', () => {
        console.log('testpong');
    });

    socket.emit('testping');

    socket.on('offer', (data: any) => {
        console.log('test offer:', data);
        handleOffer(data);
    });

    socket.on('config', (data: any) => {
        console.log('get config', data);
        config = data;
    });

    socket.on('candidate', async (data: any) => {
        console.log('get ice from caller');
        if (data?.candidate) {
            await pc.addIceCandidate(data);
        }
    });
}


async function createPeerConnection() {
    pc = new RTCPeerConnection(config);
    pc.onicecandidate = e => {
        console.log('ice:', e?.candidate);
        socket.emit('iceFromCallee', e.candidate);
    };
    const remoteVideo = document.getElementById('remote-video') as HTMLVideoElement;
    pc.ontrack = e => remoteVideo.srcObject = e.streams[0];
  }

const handleOffer = async (offer: RTCSessionDescription) => {
    if (pc) { return; }
    await createPeerConnection();
    await (pc as RTCPeerConnection).setRemoteDescription(offer);

    const answer = await (pc as RTCPeerConnection).createAnswer();

    socket.emit('answer', {type: 'answer', sdp: answer.sdp})
    await (pc as RTCPeerConnection).setLocalDescription(answer);
}

