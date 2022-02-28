export const waitForICEGatheringComplete = async (pc: RTCPeerConnection) => {
    return new Promise<void>((resolve) => {
        if (pc.iceGatheringState === 'complete') {
            console.log('gather complete');
            resolve();
        } else {
            const checkState = () => {
                if (pc.iceGatheringState === 'complete') {
                    pc.removeEventListener('icegatheringstatechange', checkState);
                    resolve();
                }
            };
            pc.addEventListener('icegatheringstatechange', checkState);
        }
    });
};

export const waitForLeastICEGathering = async (pc: RTCPeerConnection, waitTimeout: number, leastICEAmount: number) => {
    return new Promise<void>((resolve, reject) => {
        let relayCount = 0;

        const timeout = setTimeout(() => {
            console.log('gathering timeout');
            pc.removeEventListener('icecandidate', checkRelay);
            if (relayCount > 0) {
                resolve();
            } else {
                reject(new Error('Make WebRTC connection failed, please try again later.'));
            }
        }, waitTimeout);

        const checkRelay = (evt: RTCPeerConnectionIceEvent) => {
            const chromeRelayCondition = evt.candidate?.type === 'relay';
            const fireFoxRelayCondition = evt.candidate?.candidate?.indexOf('relay') !== -1;
            if (chromeRelayCondition || fireFoxRelayCondition) {
                relayCount += 1;
                console.log('found relay candidate', relayCount);
                if (relayCount >= leastICEAmount) {
                    console.log('found 2 relay candidates');
                    pc.removeEventListener('icecandidate', checkRelay);
                    clearTimeout(timeout);
                    resolve();
                }
            }
        };
        pc.addEventListener('icecandidate', checkRelay);
    });
};

export const waitForRTCConnectted = async (pc: RTCPeerConnection) => {
    return new Promise<void>((resolve, reject) => {
        const maxTicks = 30000 / 100;
        let ticks = 0;

        const intervalId = setInterval(() => {
            if (pc.connectionState === 'connected') {
                clearInterval(intervalId);
                resolve();
            } else if (ticks > maxTicks) {
                clearInterval(intervalId);
                reject(new Error('Connection Timeout'));
            }
            ticks += 1;
        }, 100);
    });
};
