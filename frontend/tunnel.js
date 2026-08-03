import localtunnel from 'localtunnel';

(async () => {
  try {
    const tunnel = await localtunnel({ port: 8001 });
    console.log('================================================');
    console.log('LIVE ONLINE PUBLIC URL:', tunnel.url);
    console.log('================================================');
    
    tunnel.on('close', () => {
      console.log('Tunnel closed');
    });
  } catch (err) {
    console.error('Tunnel error:', err);
  }
})();
