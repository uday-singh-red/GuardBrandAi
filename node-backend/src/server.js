const app = require('./app');
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});

// Ab server object par timeout set karo (10 Minutes)
server.setTimeout(10 * 60 * 1000);