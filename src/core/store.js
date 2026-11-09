// Small persistence helper. Every read and write is wrapped: private windows,
// blocked storage or a full quota must never break the app.
// Its own key, so the beach cabin (v1) and this forest cabin never share settings on one origin.
const KEY = 'studycabin:v2';

