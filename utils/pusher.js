import Pusher from 'pusher';

export const pusher = new Pusher({
    appId: process.env.PUSHER_APP_ID,
    key: process.env.PUSHER_KEY,
    secret: process.env.PUSHER_SECRET,
    cluster: process.env.PUSHER_CLUSTER,
    useTLS: true,
});

export const triggerCompartidos = async (userId, event, data = {}) => {
    try {
        await pusher.trigger(`compartidos-${userId}`, event, data);
    } catch (err) {
        console.error(`Pusher error [${event}]:`, err.message);
    }
};
