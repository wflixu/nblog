module.exports = {
    apps: [
      {
        name: 'blog',
        port: '3456',
        exec_mode: 'cluster',
        instances: '1',
        env_production: {
          NODE_ENV: 'production',
          PORT: 3456,
        },
        script: './.output/server/index.mjs'
      }
    ]
  }
  