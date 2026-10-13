const {
  AndroidConfig,
  withAndroidColors,
  withAndroidStyles,
} = require("@expo/config-plugins");

const WINDOW_BACKGROUND = "@drawable/ic_launcher_background";
const SPLASH_BACKGROUND = "#ffffff";

const withStartupSplash = (config) => {
  config = withAndroidStyles(config, (cfg) => {
    for (const parent of [
      AndroidConfig.Styles.getAppThemeGroup(),
      { name: "Theme.App.SplashScreen" },
    ]) {
      cfg.modResults = AndroidConfig.Styles.setStylesItem({
        xml: cfg.modResults,
        parent,
        item: {
          _: WINDOW_BACKGROUND,
          $: { name: "android:windowBackground" },
        },
      });
    }
    return cfg;
  });

  config = withAndroidColors(config, (cfg) => {
    cfg.modResults = AndroidConfig.Colors.assignColorValue(cfg.modResults, {
      name: "splashscreen_background",
      value: SPLASH_BACKGROUND,
    });
    return cfg;
  });

  return config;
};

module.exports = withStartupSplash;
