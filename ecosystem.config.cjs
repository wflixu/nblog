module.exports = {
  apps: [
    {
      name: 'blog',
      port: '3456',
      exec_mode: 'cluster',
      instances: 'max',
      script: './.output/server/index.mjs'
    }
  ]
}

