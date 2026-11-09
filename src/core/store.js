// Small persistence helper. Every read and write is wrapped: private windows,
// blocked storage or a full quota must never break the app.
