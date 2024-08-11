module.exports = {
    apps : [
        {
          name: "dmitec-to-thingsboard",
          script: "./app-cron.js",
          watch: true,
          node_args : '--env-file .env'
        }
    ]
  }