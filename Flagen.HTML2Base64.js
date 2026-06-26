/**
 * **The Name of the plugin**
 * @type { String }
 */
const name = `HTML2Base64`;

/**
 * **The Author of the plugin**
 * @type { String }
 */
const author = `Flagen`;

/**
 * **The Description of the plugin**
 * @type { String }
 */
const description = `The HTML2Base64 plugin is a powerful tool that allows you to convert HTML content into a Base64-encoded PNG image. It leverages the capabilities of headless browsers like Chrome or Edge to render the HTML and capture a screenshot, which is then encoded into Base64 format for easy use in web applications, emails, or other contexts where image data needs to be embedded directly. This plugin is ideal for developers looking to automate the process of generating images from dynamic HTML content without the need for manual intervention.`;

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
    if (payload?.firstStart) return;
    const fsp = require("node:fs/promises");
    const fs = require("node:fs");
    const path = require("node:path");
    const os = require("node:os");
    const { spawn } = require("node:child_process");

    function getBrowserPath() {
        const possiblePaths = [
            // Windows Chrome
            "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
            "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",

            // Windows Edge
            "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
            "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",

            // macOS Chrome
            "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",

            // macOS Edge
            "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",

            // Linux
            "/usr/bin/google-chrome",
            "/usr/bin/chromium",
            "/usr/bin/chromium-browser",
            "/snap/bin/chromium"
        ];

        return possiblePaths.find((browserPath) => {
            try {
                fs.accessSync(browserPath);
                return true;
            } catch {
                return false;
            }
        });
    }

    function runCommand(command, args) {
        return new Promise((resolve, reject) => {
            const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"] });
            let stderr = "";

            child.stderr.on("data", chunk => { stderr += chunk.toString(); });
            child.on("error", reject);
            child.on("close", code => { if (code === 0) resolve(); else reject(new Error(`Browser exited with code ${code}\n${stderr}`)); });
        });
    }

    function filePathToFileUrl(filePath) {
        let resolved = path.resolve(filePath).replace(/\\/g, "/");
        if (!resolved.startsWith("/")) resolved = "/" + resolved;
        return "file://" + resolved;
    }

    /**
     * Turns raw HTML or a URL into a PNG using Chrome/Edge headless.
     *
     * @param {Object} options
     * @param {string} [options.html] Raw HTML string.
     * @param {string} [options.url] URL to capture.
     * @param {string} [options.outputPath] PNG output path.
     * @param {number} [options.width=1280] Screenshot width.
     * @param {number} [options.height=720] Screenshot height.
     * @param {number} [options.delay=500] Milliseconds to wait before screenshot.
     */
    async function htmlToPng({
        html,
        url,
        outputPath = "./output.png",
        width = 1280,
        height = 720,
        delay = 500
    }) {
        if (!html && !url) throw new Error("You must provide either html or url.");
        const browserPath = getBrowserPath();

        if (!browserPath) throw new Error("Could not find Chrome, Chromium, or Edge installed on this machine.");

        await fsp.mkdir(path.dirname(path.resolve(outputPath)), { recursive: true });

        let target = url;
        let tempFile = null;

        if (html) {
            const tempDir = await fsp.mkdtemp(path.join(os.tmpdir(), "fes-html-render-"));
            tempFile = path.join(tempDir, "render.html");
            await fsp.writeFile(tempFile, html, "utf8");
            target = filePathToFileUrl(tempFile);
        }

        const args = [ "--headless=new", "--disable-gpu", "--hide-scrollbars", `--window-size=${width},${height}`, `--virtual-time-budget=${delay}`, `--screenshot=${path.resolve(outputPath)}`, target ];

        await runCommand(browserPath, args);

        if (tempFile) await fsp.rm(path.dirname(tempFile), { recursive: true, force: true });

        return {
            ok: true,
            outputPath: path.resolve(outputPath)
        };
    }

    async function pngToBase64() {
        const timestamp = Date.now();
        const png = await htmlToPng({ width: 1920, height: 1080, delay: 1500, url: payload.url, outputPath: path.join(os.tmpdir(), `screenshot-${timestamp}.png`) });
        const imageBuffer = fs.readFileSync(path.join(os.tmpdir(), `screenshot-${timestamp}.png`));
        return imageBuffer.toString("base64");
    }

    return await pngToBase64();
}
module.exports = { author, description, dependencies, enabled, name, run, version };