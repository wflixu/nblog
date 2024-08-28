module.exports = {
  apps: [
    {
      name: 'blog',
      port: '3456',
      exec_mode: 'cluster',
      instances: 'max',
      script: 'node ./.output/server/index.mjs'
    }
  ]
}

