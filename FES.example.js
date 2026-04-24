//THIS IS THE FES EXAMPLE PLUGIN, This format is required!

/**
 * **The Name of the plugin**
 * @type { String }
 */
const name = `example`;

/**
 * **The Author of the plugin**
 * @type { String }
 */
const author = `FES`;

/**
 * **The Description of the plugin**
 * @type { String }
 */
const description = `This is the example of a plugin.`;

/**
 * **Whether the plugin is enabled or not**
 * @type { Boolean }
 */
const enabled = true;

/**
 * **The Version of the plugin**
 * @type { Number }
 */
const version = 1;

/**
 * **The Plugin Permission**
 * @type { Array }
 */
const permissions = [ ];

/**
 * **The dependencies of the plugin**
 * @type { Array }
 */
const dependencies = [ ];

/**
 * ### run(exposed, payload);
 * 
 * Used to call the main function of the plugin
 * @param { Object? } exposed Anything that you want the plugin to have access to.
 * @param { Object? } payload Any information that you want the plugin to work with.
 * 
 * example:
 * ```js
 * let plugin = require(`./plugins/FES.example`);
 * plugin.run({ fs }, { saveThis: "ok" })
 *     .then(returned => { console.log(returned)})
 *     .catch(error => { console.error(error)});
 * ```
 * 
 * @returns { Promise }
 */
async function run(exposed, payload) {
    if (payload?.firstStart) return exposed.log("This log is coming from the plugin example.js! You can replace this code and create your own plugin.", { type: "info" });
    if (exposed.req.method === `POST`) return "This log is coming from the plugin example.js! You can replace this code and create your own plugin. This log is from a different payload, so it will run every time the plugins function is ran, not just on server start.";

}
module.exports = { author, description, dependencies, enabled, name, run, version };