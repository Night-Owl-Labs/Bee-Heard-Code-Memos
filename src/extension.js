/* eslint-disable */
// @ts-ignore
const vscode = require("vscode");
/* eslint-enable */
const path = require("path");
const fs = require("fs");
const { execSync } = require("child_process");
/* eslint-disable */
// @ts-ignore
const record = require("node-record-lpcm16");
/* eslint-enable */

let recording = false;
let audioStream;
let fileStream;
let recordButton;
let outputChannel;
let recordingMessage;
let maxDurationTimeout;

/* eslint-disable */
// @ts-ignore
async function activate(context) {
/* eslint-enable */
  try {
    await checkSoxInstalled();
  } catch (error) {
    vscode.window.showErrorMessage(error.message);
    return;
  }

  outputChannel = vscode.window.createOutputChannel("Bee Heard");
  outputChannel.appendLine("Bee Heard: Code Memos extension is now active!");
  // outputChannel.show(true);

  const startRecordingCommand = vscode.commands.registerCommand(
    "beeHeard.newCodeMemo",
    startRecording
  );
  const stopRecordingCommand = vscode.commands.registerCommand(
    "beeHeard.endCodeMemo",
    stopRecording
  );
  const configureSavePathCommand = vscode.commands.registerCommand(
    "beeHeard.configureSavePath",
    configureSavePath
  );
  const resetSavePathCommand = vscode.commands.registerCommand(
    "beeHeard.resetSavePath",
    resetSavePath
  );
  const setMaxDurationCommand = vscode.commands.registerCommand(
    "beeHeard.setMaxDuration",
    setMaxDuration
  );

  context.subscriptions.push(startRecordingCommand);
  context.subscriptions.push(stopRecordingCommand);
  context.subscriptions.push(configureSavePathCommand);
  context.subscriptions.push(resetSavePathCommand);
  context.subscriptions.push(setMaxDurationCommand);

  recordButton = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  );
  recordButton.text = "$(record) New Code Memo";
  recordButton.command = "beeHeard.newCodeMemo";
  recordButton.show();
  context.subscriptions.push(recordButton);

  outputChannel.appendLine("Record button created and shown");

  // Notify user of the default save path
  const defaultSavePath = getSavePath();
  outputChannel.appendLine(`Default save path: ${defaultSavePath}`);
  //vscode.window.showInformationMessage(`Code Memos will be saved to: ${defaultSavePath}`);
}

async function checkSoxInstalled() {
  try {
    const result = execSync("which sox").toString().trim();
    if (!result) {
      throw new Error("Code Memo - Sox is not installed or not found in PATH.");
    }
    console.log(`Sox found at: ${result}`);
    //vscode.window.showInformationMessage(`Code Memo - Sox found at: ${result}`);

    // Add the SoX directory to the PATH environment variable
    const soxDir = path.dirname(result);
    process.env.PATH = `${soxDir}:${process.env.PATH}`;
    console.log("Updated PATH:", process.env.PATH);
  } catch (error) {
    throw new Error("Code Memo - Sox is not installed or not found in PATH.");
  }
}

function configureSavePath() {
  vscode.window
    .showOpenDialog({ canSelectFolders: true, canSelectMany: false })
    .then((folderUri) => {
      if (folderUri && folderUri[0]) {
        const newPath = folderUri[0].fsPath + "/code_memos";
        vscode.workspace
          .getConfiguration()
          .update(
            "beeHeard.savePath",
            newPath,
            vscode.ConfigurationTarget.Global
          );
        vscode.window.showInformationMessage(
          `Code Memo - Save path set to: ${newPath}`
        );
      }
    });
}

function resetSavePath() {
  const defaultPath = "${workspaceFolder}/code_memos";
  vscode.workspace
    .getConfiguration()
    .update(
      "beeHeard.savePath",
      defaultPath,
      vscode.ConfigurationTarget.Global
    );
  vscode.window.showInformationMessage(
    "Code Memo - Save path reset to default workspace folder"
  );
}

function getSavePath() {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders || workspaceFolders.length === 0) {
    throw new Error("Code Memo - No workspace folder open. Please open a folder or workspace in VSCode.");
  }

  const configuredPath = vscode.workspace
    .getConfiguration()
    .get("beeHeard.savePath");
  return configuredPath.replace(
    "${workspaceFolder}",
    workspaceFolders[0].uri.fsPath
  );
}

function getLocalDateString() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based, so add 1
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function startRecording() {
  if (recording) {
    vscode.window.showErrorMessage(
      "Code Memo - Recording is already in progress"
    );
    return;
  }

  vscode.window.showInformationMessage("Code Memo - Recording Started...");
  recording = true;
  recordButton.text = "$(primitive-square) End Code Memo";
  recordButton.command = "beeHeard.endCodeMemo";

  outputChannel.appendLine("Recording started...");
  recordingMessage = vscode.window.setStatusBarMessage(
    "$(record) Recording..."
  );

  try {
    const date = getLocalDateString();
    const audioDir = path.join(getSavePath(), date);

    if (!fs.existsSync(audioDir)) {
      fs.mkdirSync(audioDir, { recursive: true });
      copyAboutFile(audioDir);
    }

    const files = fs
      .readdirSync(audioDir)
      .filter((file) => file.endsWith(".wav"));
    const nextIndex = files.length + 1;
    const audioFilePath = path.join(audioDir, `memo_${date}_${nextIndex}.wav`);

    fileStream = fs.createWriteStream(audioFilePath, { encoding: "binary" });

    const env = { ...process.env };

    audioStream = record
      .record({
        sampleRate: 16000,
        threshold: 0,
        verbose: true,
        recordProgram: "sox",
        silence: "10.0",
        env, // Pass the modified environment to the recording process
      })
      .stream()
      //.on("error", (err) => {
        // outputChannel.appendLine(`Recording error: ${err.message}`); // Uncomment to DEBUG
      //})
      .on("data", (chunk) => {
        outputChannel.appendLine(`Recording data chunk: ${chunk.length} bytes`);
      });

    audioStream.pipe(fileStream);

    outputChannel.appendLine(`Recording to file: ${audioFilePath}`);

    // Set maximum duration timeout
    const maxDuration = vscode.workspace
      .getConfiguration()
      .get("beeHeard.maxDuration");
    if (maxDuration > 0) {
      maxDurationTimeout = setTimeout(stopRecording, maxDuration * 1000);
    }
  } catch (error) {
    outputChannel.appendLine(`Error during recording setup: ${error.message}`);
    stopRecording();
  }
}

function stopRecording() {
  if (!recording) {
    vscode.window.showErrorMessage("Code Memo - No recording in progress");
    return;
  }

  recording = false;
  recordButton.text = "$(record) New Code Memo";
  recordButton.command = "beeHeard.newCodeMemo";

  outputChannel.appendLine("Recording stopped.");

  if (recordingMessage) {
    recordingMessage.dispose();
  }
  vscode.window.showInformationMessage("Code Memo - Recording Stopped");

  if (audioStream) {
    audioStream.unpipe(fileStream);
    audioStream.destroy();
    fileStream.end(() => {
      outputChannel.appendLine("Recording ended.");
    });
  }

  if (maxDurationTimeout) {
    clearTimeout(maxDurationTimeout);
  }
}

function setMaxDuration() {
  vscode.window
    .showInputBox({
      prompt:
        "The maximum recording duration in seconds (default is 300 seconds, 5 minutes). Set to 0 for unlimited recording.",
    })
    .then((value) => {
      const maxDuration = parseInt(value, 10);
      if (!isNaN(maxDuration)) {
        vscode.workspace
          .getConfiguration()
          .update(
            "beeHeard.maxDuration",
            maxDuration,
            vscode.ConfigurationTarget.Global
          );
        vscode.window.showInformationMessage(
          `Code Memo - Maximum recording duration set to: ${maxDuration} seconds`
        );
      } else {
        vscode.window.showErrorMessage(
          "Code Memo - Invalid input for maximum recording duration"
        );
      }
    });
}

/* eslint-disable */
// @ts-ignore
function copyAboutFile(destinationDir) {
  /* eslint-enable */
  const sourceFile = path.join(__dirname, "../ABOUT.md");
  const destFile = path.join(destinationDir, "../ABOUT.md");

  if (!fs.existsSync(destFile)) {
    fs.copyFileSync(sourceFile, destFile);
    outputChannel.appendLine(`Copied ABOUT.md to ${destinationDir}`);
  }
}

function deactivate() {
  if (recording) {
    stopRecording();
  }
  if (outputChannel) {
    outputChannel.dispose();
  }
}

module.exports = {
  activate,
  deactivate,
};
