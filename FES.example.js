module.exports = {
    author: "FES",
    description: "This is the example of a plugin.",
    enabled: true,
    name: "example",
    run: (exposed, payload) => {
        if (payload?.firstStart) exposed.log("This log is coming from the plugin example.js! You can replace this code and create your own plugin.", { type: "info" });
        else exposed.log("This log is coming from the plugin example.js! You can replace this code and create your own plugin. This log is from a different payload, so it will run every time the plugins function is ran, not just on server start.");
    },
    version: 1
};