module.exports = {
    apps: [
      {
        name: 'blog',
        port: '3456',
        exec_mode: 'cluster',
        instances: '1',
        script: './.output/server/index.mjs'
      }
    ]
  }
  