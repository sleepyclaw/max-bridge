module.exports = {
  apps: [{
    name: 'max-bridge',
    script: './server.js',
    cwd: '/home/grok/.openclaw/workspace/max-bridge',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
    },
    log_file: '/home/grok/.openclaw/workspace/max-bridge/bridge.log',
    out_file: '/home/grok/.openclaw/workspace/max-bridge/bridge-out.log',
    error_file: '/home/grok/.openclaw/workspace/max-bridge/bridge-error.log',
  }]
};
