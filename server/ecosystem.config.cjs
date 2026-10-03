const os = require("node:os");

module.exports = {
  apps: [{
    name: "admin-hub-games-online",
    script: "build/index.js",
    time: true,
    watch: false,
    instances: Math.max(1, os.cpus().length),
    exec_mode: "fork",
    wait_ready: true,
    env_production: {
      NODE_ENV: "production"
    }
  }]
};
