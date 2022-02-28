/* eslint-disable import/prefer-default-export */
export async function getShareScreenStream(): Promise<MediaStream> {
    return navigator.mediaDevices.getDisplayMedia({
        audio: false,
        video: {
            frameRate: { ideal: 5, max: 5 },
        },
    });
}
