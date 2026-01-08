import fp from 'fastify-plugin';
import FastifySensible from '@fastify/sensible';
export default fp(async function sensible(app) {
    app.register(FastifySensible);
});
