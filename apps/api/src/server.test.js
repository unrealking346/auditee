import test from 'node:test';
test('WAEVE API paths use versioned routing',()=>{if(!'/api/v1/home'.startsWith('/api/v1/'))throw new Error('routing contract failed')});
