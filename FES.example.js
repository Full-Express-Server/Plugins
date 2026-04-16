module.exports = {
    author: "FES",
    description: "This is the example of a plugin.",
    enabled: true,
    name: "example",
    run: (payload) => {
        console.log("This log is coming from the plugin example.js! You can replace this code and create your own plugin.");
    },
};