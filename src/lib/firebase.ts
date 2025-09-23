import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAnalytics, isSupported as analyticsIsSupported } from 'firebase/analytics';

const firebaseConfig = {
	apiKey: "AIzaSyABSyFUlTdRXxWnDoumNG8GaOcYBuG5hrY",
	authDomain: "khel-setu.firebaseapp.com",
	projectId: "khel-setu",
	storageBucket: "khel-setu.appspot.com",
	messagingSenderId: "73029910727",
	appId: "1:73029910727:web:dbabd6fd05ada8090d3ee2",
	measurementId: "G-RPG70B1M27"
};

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

export let analytics: ReturnType<typeof getAnalytics> | undefined;
if (typeof window !== 'undefined') {
	analyticsIsSupported()
		.then((supported) => {
			if (supported) {
				analytics = getAnalytics(firebaseApp);
			}
		})
		.catch(() => {});
}
