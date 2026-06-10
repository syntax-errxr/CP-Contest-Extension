Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
currentFolder = fso.GetParentFolderName(WScript.ScriptFullName)
WshShell.CurrentDirectory = currentFolder
WshShell.Run "cmd.exe /c """ & currentFolder & "\run_project.bat""", 0, false
