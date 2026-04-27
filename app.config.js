export default ({ config }) => {

  return {
    ...config,
    "name": "HOMS",
    "slug": "homs",
    "version": "1.0.0",
    "scheme": "homs",
    "orientation": "portrait",
    "icon": "./assets/HOMSlogo.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/HOMSlogo.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "android": {
      "adaptiveIcon": {
        "backgroundColor": "#FFFFFF",
        "foregroundImage": "./assets/HOMSlogo.png"
      },
      "package": "com.homs.app",
      "predictiveBackGestureEnabled": false,
      "config": {
        "googleMaps": {
          "apiKey": process.env.GOOGLE_MAP_API
        }
      }
    },
    "ios": {
      "bundleIdentifier": "com.homs.app",
      "supportsTablet": true
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "plugins": [
      "expo-font"
    ],
    "extra": {
      "GOONG_API_KEY": process.env.GOONG_API_KEY,
      "eas": {
        "projectId": "30597413-b365-4e7b-9adb-507a47bd25de"
      }
    }
  };
};

