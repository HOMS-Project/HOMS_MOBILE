export default ({ config }) => {

  return {
    ...config,
    "name": "homs",
    "slug": "homs",
    "version": "1.0.0",
    "scheme": "homs",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "android": {
      "adaptiveIcon": {
        "backgroundColor": "#E6F4FE",
        "foregroundImage": "./assets/android-icon-foreground.png",
        "backgroundImage": "./assets/android-icon-background.png",
        "monochromeImage": "./assets/android-icon-monochrome.png"
      },
      "predictiveBackGestureEnabled": false,
      "config": {
        "googleMaps": {
          "apiKey": process.env.GOOGLE_MAPS_API_KEY
        }
      }
    },
    "ios": {
      "supportsTablet": true,
      "config": {
        "googleMapsApiKey": process.env.GOOGLE_MAPS_API_KEY
      }
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "plugins": [
      "expo-font"
    ]
  };
};
