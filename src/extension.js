const vscode = require("vscode");
const path = require("path");
const fs = require("fs");
const record = require("node-record-lpcm16");

let recording = false;
let audioStream;
let fileStream;
let recordButton;
let outputChannel;
let recordingMessage;
let maxDurationTimeout;

function activate(context) {
  outputChannel = vscode.window.createOutputChannel("Bee Heard");
  outputChannel.appendLine("Bee Heard: Code Memos extension is now active!");
  outputChannel.show(true);

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
          `Code Memos save path set to: ${newPath}`
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
    "Code Memos save path reset to default workspace folder"
  );
}

function getSavePath() {
  const configuredPath = vscode.workspace
    .getConfiguration()
    .get("beeHeard.savePath");
  return configuredPath.replace(
    "${workspaceFolder}",
    vscode.workspace.workspaceFolders[0].uri.fsPath
  );
}

function startRecording() {
  if (recording) {
    vscode.window.showErrorMessage(
      "Code Memo - Recording is already in progress"
    );
    return;
  }

  vscode.window.showInformationMessage("Code Memo - Recording Started..."); // Show popup for recording started
  recording = true;
  recordButton.text = "$(primitive-square) End Code Memo";
  recordButton.command = "beeHeard.endCodeMemo";

  outputChannel.appendLine("Recording started...");
  recordingMessage = vscode.window.setStatusBarMessage(
    "$(record) Recording..."
  );

  const date = new Date().toISOString().split("T")[0]; // Get current date in YYYY-MM-DD format
  const audioDir = path.join(getSavePath(), date);

  if (!fs.existsSync(audioDir)) {
    fs.mkdirSync(audioDir, { recursive: true });
    copyAboutFile(audioDir); // Copy ABOUT.md when creating the folder
  }

  const files = fs
    .readdirSync(audioDir)
    .filter((file) => file.endsWith(".wav"));
  const nextIndex = files.length + 1;
  const audioFilePath = path.join(audioDir, `memo_${date}_${nextIndex}.wav`);

  fileStream = fs.createWriteStream(audioFilePath, { encoding: "binary" });

  audioStream = record
    .record({
      sampleRate: 16000,
      threshold: 0,
      verbose: true,
      recordProgram: "rec",
      silence: "10.0",
    })
    .stream()
    .on("error", (err) => {
      console.error(`Recording error: ${err.message}`);
    })
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
  vscode.window.showInformationMessage("Code Memo - Recording Stopped"); // Show popup for recording stopped

  if (audioStream) {
    audioStream.unpipe(fileStream); // Unpipe the audio stream from the file stream
    audioStream.destroy(); // Destroy the audio stream to stop recording
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
          "Invalid input for maximum recording duration"
        );
      }
    });
}

function copyAboutFile(destinationDir) {
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
