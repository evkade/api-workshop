# Setup troubleshooting

Problems you might run into when setting up the project, and how to fix them. If you are stuck, ask a coach.

## Check that your setup works

Run these from the project folder:

```sh
node -v        # should be v20.6.0 or later
npm install
npm test
```

If every test fails with a message like `Task 1: GET /api/sessions/:id is not done yet`, your setup works. The tasks are just not done yet.

## `node` or `npm` is not found

You need Node.js. npm comes with it, so there is nothing else to install. Download the LTS version from [nodejs.org](https://nodejs.org), install it, then open a new terminal and run `node -v`.

## Node is older than 20.6

`npm run dev` may still start and the page may look fine, but `npm test` fails with:

```
node: bad option: --import
```

Install the LTS version from [nodejs.org](https://nodejs.org), or with a version manager:

- macOS and Linux: [nvm](https://github.com/nvm-sh/nvm), then `nvm install --lts`
- Windows: [nvm-windows](https://github.com/coreybutler/nvm-windows) or [fnm](https://github.com/Schniz/fnm)

Open a new terminal afterwards and check `node -v` again.

### `node -v` still shows the old version

You probably have two versions installed, and the old one comes first. On macOS and Linux, `which -a node` lists every `node` on your computer in the order they are used. Remove the old one, or make sure the new one comes first in your `PATH`.

## You can't install anything on your laptop

The installer from nodejs.org usually needs admin rights. A version manager like [nvm](https://github.com/nvm-sh/nvm) or [fnm](https://github.com/Schniz/fnm) installs Node in your home folder and does not.

If that does not work either, ask a coach. You can pair with someone whose setup works.

## `npm install` fails or hangs

`npm install` downloads packages from the internet. A company network or proxy can block it, and the event wifi can be slow when everyone installs at the same time. Try another network, for example a hotspot from your phone, or install before the event.

## Port 3000 is already in use

If another app uses port 3000, the server stops with an error that contains `EADDRINUSE`. Close the other app, or start the server on another port:

```sh
# macOS and Linux
PORT=3001 npm run dev

# Windows PowerShell
$env:PORT=3001; npm run dev
```

Then open <http://localhost:3001>. The tests are not affected: they always start their own server on a free port.

## You don't have git

On the [GitHub page](https://github.com/evkade/api-workshop), click **Code → Download ZIP** and unzip it. Then continue with `npm install`.

## `curl` on Windows

The `curl` examples in the README are written for macOS and Linux terminals.

- In PowerShell, a line ends with `` ` `` instead of `\` when the command continues on the next line. Or write the whole command on one line.
- In Windows PowerShell, `curl` can mean a different command. Type `curl.exe` instead.

You can also use the frontend at <http://localhost:3000>, which works the same everywhere.
