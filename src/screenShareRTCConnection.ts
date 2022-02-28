/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable max-len */
/* eslint-disable no-console */
/* eslint-disable import/prefer-default-export */
// import { sendControlMessage } from '../services/connectToRemote';
import { io } from "socket.io-client";
import { waitForICEGatheringComplete, waitForLeastICEGathering, waitForRTCConnectted } from './connectionUtils';
import { getShareScreenStream } from './getShareScreenStream';

let screenShareStream: MediaStream;
let screenshareConnection: RTCPeerConnection;
let socket: any;


const createScreenOffer = async (pc: RTCPeerConnection): Promise<any> => {
    console.log('create share screen offer');
    return pc.createOffer().then((sessionDescription) => {
        return pc.setLocalDescription(sessionDescription);
    });
};

const sendOffer = (pc: RTCPeerConnection) => {
    const offer = pc.localDescription;
    const message = { type: 'offer', id: 'screen-share', data: { sdp: offer?.sdp, type: offer?.type } };
    socket.emit('rtcOffer', message);
};

const initializePeerConnection = (rtcConfig: RTCConfiguration): RTCPeerConnection => {
    const pc = new RTCPeerConnection({ ...rtcConfig, iceCandidatePoolSize: 10 });

    // register some listeners to help debugging
    pc.addEventListener('icegatheringstatechange', () => {
        console.log(`icegatheringstatechange -> ${pc.iceGatheringState}`);
    }, false);

    pc.addEventListener('iceconnectionstatechange', () => {
        console.log(`iceconnectionstatechange -> ${pc.iceConnectionState}`);
    }, false);

    pc.addEventListener('signalingstatechange', () => {
        console.log(`signalingstatechange -> ${pc.signalingState}`);
    }, false);

    pc.addEventListener('icecandidate', (evt) => {
        console.log('ss local ice candidate', evt.candidate);
        if (evt.candidate != null) {
            if (pc.signalingState === 'stable') {
                const message = {
                    candidate: evt.candidate.candidate, type: 'candidate', id: evt.candidate.sdpMid, label: evt.candidate.sdpMLineIndex,
                };
                console.log(message);
            } else {
                console.log('stashing ice candidate');
            }
        }
    });

    return pc;
};

export const connectSocket = (stream: MediaStream) => {
    socket = io('http://localhost:8080');
    socket.emit('tabping');
    console.log('send tabping');
    socket.on('rtcConfig', async (data: any) => {
        console.log('receive rtc config');
        createScreenSharePeerConnection(stream, data, () => {});
    });

    socket.on('rtcAnswer', (data: any) => {
        screenshareConnection.setRemoteDescription(data);
    });
};

const createScreenSharePeerConnection = async (screenShareStream: MediaStream ,rtcConfig: RTCConfiguration, stopShareCallback: (ev: Event) => void): Promise<RTCPeerConnection> => {
    screenshareConnection = initializePeerConnection({ ...rtcConfig, iceTransportPolicy: 'relay' });

    screenShareStream.getTracks().forEach((track: MediaStreamTrack) => {
        screenshareConnection.addTrack(track, screenShareStream);
        track.onended = (e: Event) => {
            screenshareConnection.close();
            stopShareCallback(e);
        };
    });

    await createScreenOffer(screenshareConnection);
    await waitForLeastICEGathering(screenshareConnection, 10000, 2);
    sendOffer(screenshareConnection);

    try {
        await waitForRTCConnectted(screenshareConnection);
    } catch {
        screenshareConnection.close();

        screenshareConnection = initializePeerConnection(rtcConfig);
        screenShareStream.getTracks().forEach((track: MediaStreamTrack) => {
            screenshareConnection.addTrack(track, screenShareStream);
            track.onended = (e: Event) => {
                screenshareConnection.close();
                stopShareCallback(e);
            };
        });

        await createScreenOffer(screenshareConnection);
        await waitForICEGatheringComplete(screenshareConnection);
        sendOffer(screenshareConnection);
    }

    return screenshareConnection;
};

