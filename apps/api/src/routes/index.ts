import {Router} from 'express'; import auth from './auth.js'; import music from './music.js'; import playlists from './playlists.js'; import artists from './artists.js'; import subscriptions from './subscriptions.js';
const r=Router(); r.use('/auth',auth); r.use('/music',music); r.use('/playlists',playlists); r.use('/artists',artists); r.use('/subscriptions',subscriptions); export default r;
