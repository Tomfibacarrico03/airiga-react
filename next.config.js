// next.config.js

module.exports = {
    webpack: (config, { isServer }) => {
      // Fixes npm packages that depend on `timers` module
      if (!isServer) {
        config.resolve.fallback = {
          ...config.resolve.fallback,
          timers: require.resolve("timers-browserify"),
        };
      }
  
      return config;
    },
  };
  