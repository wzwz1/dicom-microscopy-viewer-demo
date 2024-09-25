import * as DICOMMicroscopyViewer from 'dicom-microscopy-viewer';
import * as DICOMwebClient from 'dicomweb-client';

function loadGoogleIdentityServicesLibraryIfNeeded() {
    if (typeof google !== 'undefined' && google.accounts && google.accounts.oauth2) {
        return; // Library is already loaded
    }

    // Create a script element to load the Google Identity Services script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    document.head.appendChild(script);
}

loadGoogleIdentityServicesLibraryIfNeeded();


/**
 * Get access token for the user.
 * @return {!Promise<string>}
 */
function getAccessToken() {
    // Import oauth2 library from google, if not already loaded.

    return new Promise((resolve, reject) => {
        console.log('Initializing OAuth client');

        const client = google.accounts.oauth2.initTokenClient({
            client_id: 'CLIENT_ID',
            scope: "https://www.googleapis.com/auth/cloud-platform",
            callback: (tokenResponse) => {
                if (tokenResponse && tokenResponse.access_token) {
                    console.log('OAuth initialized');
                    resolve(tokenResponse.access_token);
                } else {
                    reject(new Error('Login failed'));
                }
            },
        });

        client.callback = (res) => {
            if (res.error) {
                console.error('Error during OAuth callback:', res);
                reject(res.error);
            } else {
                resolve(res.access_token);
            }
        };

        client.requestAccessToken();
    });
}

const DATACOMMONS = {
    url: 'https://proxy.imaging.datacommons.cancer.gov/current/viewer-only-no-downloads-see-tinyurl-dot-com-slash-3j3d9jyp/dicomWeb',
    retrieveOptions: {
        studyInstanceUID: '2.25.339079652118011480966947516338286615501',
        seriesInstanceUID: '1.3.6.1.4.1.5962.99.1.1270712533.1568310047.1714962696405.4.0'
    },
    login: false
};

const STORE=DATACOMMONS;

function startViewer() {
    if (typeof DICOMMicroscopyViewer !== 'undefined' && typeof DICOMwebClient !== 'undefined') {
        const dicomWebClient = new DICOMwebClient.api.DICOMwebClient({
            url: STORE.url,
            headers: bearerToken && {
                'Authorization': 'Bearer ' + bearerToken
            } || {}
        });
        const retrieveOptions = STORE.retrieveOptions;

        dicomWebClient.retrieveSeriesMetadata(retrieveOptions).then((metadata) => {
            const volumeImages = [];

            metadata.forEach(m => {
                // Adding placeholders to avoid missing data
                if (!m["00480008"]) {
                    m["00480008"] = {
                        "vr": "SQ",
                        "Value": [
                            {
                                "0040072A": { "vr": "DS", "Value": [0.0] },
                                "0040073A": { "vr": "DS", "Value": [0.0] },
                                "0040074A": { "vr": "DS", "Value": [0.0] }
                            }
                        ]
                    };
                }

                const image = new DICOMMicroscopyViewer.metadata.VLWholeSlideMicroscopyImage({ metadata: m });
                if (image.ImageType && image.ImageType.length >= 3) {
                    const imageFlavor = image.ImageType[2];
                    if (imageFlavor === 'VOLUME' || imageFlavor === 'THUMBNAIL') {
                        volumeImages.push(image);
                    }
                } else {
                    console.warn('ImageType is undefined or has fewer than 3 elements', image.ImageType);
                }
            });

            console.log('Filtered volume images:', volumeImages);

            if (volumeImages.length === 0) {
                console.error('No valid volume images found');
                return;
            }

            // Construct viewer instance
            
            const viewer = new DICOMMicroscopyViewer.api.VLWholeSlideMicroscopyImageViewer({
              client: dicomWebClient,
              metadata: volumeImages
            });


            // Render viewer instance in the "viewport" HTML element
            viewer.render({ container: document.getElementById('viewer') });
        }).catch(err => {
            console.error('Error retrieving series metadata:', err);
        });
    } else {
        console.error('Libraries not loaded properly.');
    }
}


let bearerToken = '';
export function start() {
    if (STORE.login) {
        getAccessToken().then((token) => {
            bearerToken = token;
            startViewer();
        });
    } else {
        startViewer();
    }
}

window.start = start;