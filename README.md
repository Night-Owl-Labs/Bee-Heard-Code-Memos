<div align="center">
    <a href="https://beeheard.com" target="_blank">
        <img src="./docs/images/icon.png" width="250" height="250"/>
    </a>
</div>
<h1 align="center">Bee Heard: Code Memos</h1>

Bee Heard: Code Memos is a <a href="https://code.visualstudio.com/" target="_blank">Visual Studio Code</a> extension that allows you to record voice memos directly within VSCode. The recorded memos are saved as audio files in a specified directory. 

_It's a great tool to record todos, issues, or mental notes in a voice format to revisit later._

## Features

- Record voice memos directly within VSCode.
- Configure save path for voice memos.
- Set maximum recording duration.
- Automatically organize memos by date.

## Installation

1. **Install the extension**:
    - You can install the extension from the [VSCode Marketplace](https://marketplace.visualstudio.com/).

2. **Install SoX**:
    - SoX (Sound eXchange) is required to record audio using the `node-record-lpcm16` library. You need to install SoX on your system for the extension to work correctly.

### Install SoX on macOS

To install SoX on macOS, use Homebrew:
```sh
brew install sox
```

### Install SoX on Windows

To install SoX on Windows, download the installer for Sox on [SourceForge](https://sourceforge.net/projects/sox/) and follow the installation instructions.

### Install SoX on Linux

To install SoX on Linux, use your distribution's package manager. For example, on Debian-based systems:
```sh
sudo apt-get install sox
```

## Granting Microphone Access

You'll need to ensure that VSCode has microphone access for the extension to work.
When you run the extension, after installing SoX, you should get prompted for VSCode microphone access.
If you're not prompted, you might already have VSCode in your microphone permissions, in that case, you'll need to ensure its enabled.

### Granting Microphone Access on macOS:

1. Open System Preferences.
2. Go to Security & Privacy.
3. Select the Privacy tab.
4. Select Microphone in the left sidebar.
5. Ensure that Visual Studio Code (or code) is listed and checked in the list of applications allowed to access the microphone.

### Granting Microphone Access on Windows:

1. Open Settings.
2. Go to Privacy.
3. Select Microphone in the left sidebar.
5. Ensure that the toggle for "Allow apps to access your microphone" is turned on.
6. Scroll down and ensure that Visual Studio Code is listed and has access to the microphone.

### Granting Microphone Access on Linux:

1. Open a terminal window.
2. Use the appropriate command for your Linux distribution to open the privacy settings. For example, on Ubuntu, you can use the command gnome-control-center privacy to open the privacy settings.
3. Ensure that the microphone access is granted to applications as needed.

## Usage

* After installing the extension and SoX, open a folder in VSCode.
* Use the ``>Bee Heard: New Code Memo`` command from the command palette or click the ``New Code Memo`` button in the status bar to start recording.
* Use the Bee Heard: End Code Memo command from the command palette or click the End Code Memo button in the status bar to stop recording.
The recorded memos will be saved in the configured directory.

## About

A copy of the `ABOUT.md` file will be placed in the `code_memos` directory when it is created.

## Commands

**>Bee Heard: New Code Memo** (`beeHeard.newCodeMemo`): Start recording a new code memo.
**>Bee Heard: End Code Memo** (`beeHeard.endCodeMemo`): Stop the ongoing code memo recording.
**>Bee Heard: Configure Save Path** (`beeHeard.configureSavePath`): Set a custom directory where code memos will be saved.
**>Bee Heard: Reset Save Path** (`beeHeard.resetSavePath`): Reset the save path to the default directory.
**>Bee Heard: Set Max Duration** (`beeHeard.setMaxDuration`): Set the maximum duration for recordings.

## Configuration

- `beeHeard.savePath`: The default path where voice memos will be saved. Default: `${workspaceFolder}/code_memos`.
- `beeHeard.maxDuration`: The maximum recording duration in seconds. Default: 300 seconds (5 minutes). Set to 0 for unlimited recording.

## Changelog

Please refer to the [Changelog](.github/CHANGELOG.md) file in this repository for updates, changes, and more detailed information about the project.

## Disclaimer

No data is collected with this application, it is entirely local to your machine.

## Additional Information

- [Main GitHub Repository](https://github.com/Night-Owl-Labs/Bee-Heard-Code-Memos)
- [Visit Our Website](https://beeheard.com)

## License

[MIT License](./LICENSE)
