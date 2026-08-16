using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Diagnostics;
using System.Drawing;
using System.Globalization;
using System.IO;
using System.IO.Compression;
using System.Net;
using System.Reflection;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using System.Windows.Forms;
using Microsoft.Win32;

[assembly: AssemblyTitle("Goldfish Setup")]
[assembly: AssemblyDescription("Installs FreeCAD and the Goldfish direct-modelling workbench")]
[assembly: AssemblyCompany("Extruda")]
[assembly: AssemblyProduct("Goldfish Setup")]
[assembly: AssemblyCopyright("Copyright © 2026 Søren Frost Staal")]
[assembly: AssemblyVersion("0.2.9.0")]
[assembly: AssemblyFileVersion("0.2.9.0")]

namespace GoldfishSetup
{
    internal static class Program
    {
        [STAThread]
        private static void Main(string[] args)
        {
            ServicePointManager.SecurityProtocol = SecurityProtocolType.Tls12;

            if (args.Length == 1 && args[0].StartsWith("--diagnostics=", StringComparison.OrdinalIgnoreCase))
            {
                string reportPath = args[0].Substring("--diagnostics=".Length).Trim('"');
                File.WriteAllText(reportPath, InstallerEngine.RunDiagnostics(), Encoding.UTF8);
                return;
            }

            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Application.Run(new InstallerForm());
        }
    }

    internal sealed class InstallerForm : Form
    {
        private readonly bool danish;
        private readonly Label statusLabel;
        private readonly ProgressBar progressBar;
        private readonly Button installButton;
        private readonly Button closeButton;
        private bool installing;

        internal InstallerForm()
        {
            danish = CultureInfo.CurrentUICulture.TwoLetterISOLanguageName.Equals("da", StringComparison.OrdinalIgnoreCase);

            Text = "Goldfish Setup";
            ClientSize = new Size(660, 450);
            MinimumSize = new Size(676, 489);
            MaximumSize = new Size(850, 560);
            StartPosition = FormStartPosition.CenterScreen;
            BackColor = Color.FromArgb(248, 249, 250);
            Font = new Font("Segoe UI", 9.5F, FontStyle.Regular, GraphicsUnit.Point);

            Panel header = new Panel();
            header.Dock = DockStyle.Top;
            header.Height = 112;
            header.BackColor = Color.FromArgb(52, 58, 64);
            Controls.Add(header);

            Label brand = new Label();
            brand.AutoSize = true;
            brand.Location = new Point(34, 22);
            brand.Font = new Font("Segoe UI", 24F, FontStyle.Bold, GraphicsUnit.Point);
            brand.ForeColor = Color.FromArgb(189, 93, 56);
            brand.Text = "GOLDFISH";
            header.Controls.Add(brand);

            Label version = new Label();
            version.AutoSize = true;
            version.Location = new Point(38, 70);
            version.Font = new Font("Segoe UI", 10F, FontStyle.Regular, GraphicsUnit.Point);
            version.ForeColor = Color.White;
            version.Text = "FreeCAD 1.1.3  +  Goldfish 0.2.9";
            header.Controls.Add(version);

            Label heading = new Label();
            heading.AutoSize = true;
            heading.Location = new Point(38, 143);
            heading.Font = new Font("Segoe UI", 16F, FontStyle.Bold, GraphicsUnit.Point);
            heading.ForeColor = Color.FromArgb(52, 58, 64);
            heading.Text = T("Prøv direct modelling i FreeCAD", "Try direct modelling in FreeCAD");
            Controls.Add(heading);

            Label description = new Label();
            description.Location = new Point(40, 185);
            description.Size = new Size(575, 60);
            description.ForeColor = Color.FromArgb(82, 87, 92);
            description.Text = T(
                "Setup kontrollerer FreeCAD, installerer Goldfish og åbner workbenchen. Hvis FreeCAD 1.1.3 mangler, hentes den officielle Windows-version automatisk.",
                "Setup checks FreeCAD, installs Goldfish and opens the workbench. If FreeCAD 1.1.3 is missing, the official Windows version is downloaded automatically.");
            Controls.Add(description);

            statusLabel = new Label();
            statusLabel.Location = new Point(40, 261);
            statusLabel.Size = new Size(575, 24);
            statusLabel.ForeColor = Color.FromArgb(52, 58, 64);
            statusLabel.Text = T("Klar til installation", "Ready to install");
            Controls.Add(statusLabel);

            progressBar = new ProgressBar();
            progressBar.Location = new Point(40, 290);
            progressBar.Size = new Size(575, 18);
            progressBar.Style = ProgressBarStyle.Continuous;
            progressBar.Value = 0;
            Controls.Add(progressBar);

            Label sourceNote = new Label();
            sourceNote.Location = new Point(40, 324);
            sourceNote.Size = new Size(575, 40);
            sourceNote.Font = new Font("Segoe UI", 8.5F, FontStyle.Regular, GraphicsUnit.Point);
            sourceNote.ForeColor = Color.FromArgb(108, 117, 125);
            sourceNote.Text = T(
                "FreeCAD hentes fra FreeCAD-projektets officielle GitHub-release og kontrolleres før installation. Goldfish er open source under MIT-licensen.",
                "FreeCAD is downloaded from the FreeCAD project's official GitHub release and verified before installation. Goldfish is open source under the MIT licence.");
            Controls.Add(sourceNote);

            installButton = new Button();
            installButton.Location = new Point(40, 382);
            installButton.Size = new Size(190, 42);
            installButton.FlatStyle = FlatStyle.Flat;
            installButton.FlatAppearance.BorderSize = 0;
            installButton.BackColor = Color.FromArgb(189, 93, 56);
            installButton.ForeColor = Color.White;
            installButton.Font = new Font("Segoe UI", 10F, FontStyle.Bold, GraphicsUnit.Point);
            installButton.Text = T("Installer og start", "Install and launch");
            installButton.Click += InstallButtonClick;
            Controls.Add(installButton);

            closeButton = new Button();
            closeButton.Location = new Point(485, 382);
            closeButton.Size = new Size(130, 42);
            closeButton.FlatStyle = FlatStyle.Flat;
            closeButton.FlatAppearance.BorderColor = Color.FromArgb(173, 181, 189);
            closeButton.BackColor = Color.White;
            closeButton.ForeColor = Color.FromArgb(52, 58, 64);
            closeButton.Text = T("Luk", "Close");
            closeButton.Click += delegate { Close(); };
            Controls.Add(closeButton);

            AcceptButton = installButton;
            CancelButton = closeButton;
            FormClosing += InstallerFormClosing;
        }

        private string T(string da, string en)
        {
            return danish ? da : en;
        }

        private void InstallerFormClosing(object sender, FormClosingEventArgs e)
        {
            if (installing)
            {
                e.Cancel = true;
                MessageBox.Show(
                    this,
                    T("Vent venligst, mens installationen afsluttes.", "Please wait while installation completes."),
                    "Goldfish Setup",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Information);
            }
        }

        private async void InstallButtonClick(object sender, EventArgs e)
        {
            installing = true;
            installButton.Enabled = false;
            closeButton.Enabled = false;

            try
            {
                InstallResult result = await InstallerEngine.InstallAsync(UpdateProgress, danish);
                progressBar.Style = ProgressBarStyle.Continuous;
                progressBar.Value = 100;
                statusLabel.Text = T("Goldfish er installeret — FreeCAD starter nu.", "Goldfish is installed — FreeCAD is starting now.");
                installButton.Text = T("Installeret", "Installed");

                string message = T(
                    "Goldfish " + InstallerEngine.GoldfishVersion + " er installeret til FreeCAD " + result.FreeCadVersion + ".",
                    "Goldfish " + InstallerEngine.GoldfishVersion + " is installed for FreeCAD " + result.FreeCadVersion + ".");
                if (!String.IsNullOrEmpty(result.BackupPath))
                {
                    message += Environment.NewLine + Environment.NewLine + T("Den tidligere Goldfish-installation er gemt som backup.", "The previous Goldfish installation was kept as a backup.");
                }

                MessageBox.Show(this, message, "Goldfish Setup", MessageBoxButtons.OK, MessageBoxIcon.Information);
            }
            catch (Win32Exception ex)
            {
                ShowError(ex.NativeErrorCode == 1223
                    ? T("Installationen blev afbrudt, da Windows spurgte om tilladelse.", "Installation was cancelled when Windows requested permission.")
                    : ex.Message);
            }
            catch (Exception ex)
            {
                ShowError(ex.Message);
            }
            finally
            {
                installing = false;
                closeButton.Enabled = true;
            }
        }

        private void UpdateProgress(int percent, string danishText, string englishText)
        {
            if (InvokeRequired)
            {
                BeginInvoke(new Action<int, string, string>(UpdateProgress), percent, danishText, englishText);
                return;
            }

            statusLabel.Text = T(danishText, englishText);
            if (percent < 0)
            {
                progressBar.Style = ProgressBarStyle.Marquee;
                progressBar.MarqueeAnimationSpeed = 25;
            }
            else
            {
                progressBar.Style = ProgressBarStyle.Continuous;
                progressBar.Value = Math.Max(0, Math.Min(100, percent));
            }
        }

        private void ShowError(string details)
        {
            progressBar.Style = ProgressBarStyle.Continuous;
            progressBar.Value = 0;
            statusLabel.Text = T("Installationen blev ikke gennemført.", "Installation was not completed.");
            installButton.Enabled = true;
            MessageBox.Show(
                this,
                T("Goldfish kunne ikke installeres:\n\n", "Goldfish could not be installed:\n\n") + details,
                "Goldfish Setup",
                MessageBoxButtons.OK,
                MessageBoxIcon.Error);
        }
    }

    internal sealed class InstallResult
    {
        internal string FreeCadVersion;
        internal string BackupPath;
    }

    internal sealed class FreeCadInstallation
    {
        internal string ExePath;
        internal string CmdPath;
        internal string Version;
    }

    internal static class InstallerEngine
    {
        internal const string GoldfishVersion = "0.2.9";
        private const string MinimumFreeCadVersion = "1.1.3";
        private const string FreeCadDownloadUrl = "https://github.com/FreeCAD/FreeCAD/releases/download/1.1.3/FreeCAD_1.1.3-Windows-x86_64-py311-installer.exe";
        private const string FreeCadSha256 = "3de56676dedb7c68f4da9734c79abeaff9bbbf09f6a2c01df72a82beeee81c11";

        internal static async Task<InstallResult> InstallAsync(Action<int, string, string> progress, bool danish)
        {
            progress(5, "Kontrollerer FreeCAD...", "Checking FreeCAD...");
            FreeCadInstallation freeCad = FindCompatibleFreeCad();
            string tempRoot = Path.Combine(Path.GetTempPath(), "GoldfishSetup-" + Guid.NewGuid().ToString("N"));
            Directory.CreateDirectory(tempRoot);

            try
            {
                if (freeCad == null)
                {
                    string installerPath = Path.Combine(tempRoot, "FreeCAD-1.1.3-installer.exe");
                    await DownloadFreeCad(installerPath, progress);

                    progress(-1, "Kontrollerer den officielle FreeCAD-pakke...", "Verifying the official FreeCAD package...");
                    string actualHash = ComputeSha256(installerPath);
                    if (!actualHash.Equals(FreeCadSha256, StringComparison.OrdinalIgnoreCase))
                    {
                        throw new InvalidDataException(danish
                            ? "Kontrolsummen for FreeCAD passer ikke. Filen er ikke blevet kørt."
                            : "The FreeCAD checksum did not match. The file was not run.");
                    }

                    progress(-1, "Installerer FreeCAD 1.1.3 — godkend Windows-dialogen...", "Installing FreeCAD 1.1.3 — approve the Windows prompt...");
                    await Task.Run(delegate { InstallFreeCad(installerPath, danish); });
                    freeCad = FindCompatibleFreeCad();
                    if (freeCad == null)
                    {
                        throw new InvalidOperationException(danish
                            ? "FreeCAD 1.1.3 blev ikke fundet efter installationen."
                            : "FreeCAD 1.1.3 was not found after installation.");
                    }
                }

                progress(86, "Installerer Goldfish " + GoldfishVersion + "...", "Installing Goldfish " + GoldfishVersion + "...");
                string userDataPath = QueryFreeCadConfig(freeCad.CmdPath, "UserAppData");
                if (String.IsNullOrWhiteSpace(userDataPath))
                {
                    throw new InvalidOperationException(danish
                        ? "FreeCADs brugermappe kunne ikke findes."
                        : "FreeCAD's user folder could not be located.");
                }

                string backupPath = InstallGoldfishPayload(userDataPath);

                progress(94, "Aktiverer Goldfish-workbenchen...", "Activating the Goldfish workbench...");
                ConfigureGoldfishWorkbench(freeCad.CmdPath, tempRoot, danish);

                progress(98, "Starter FreeCAD med Goldfish...", "Starting FreeCAD with Goldfish...");
                ProcessStartInfo startInfo = new ProcessStartInfo(freeCad.ExePath);
                startInfo.UseShellExecute = true;
                Process.Start(startInfo);

                InstallResult result = new InstallResult();
                result.FreeCadVersion = freeCad.Version;
                result.BackupPath = backupPath;
                return result;
            }
            finally
            {
                TryDeleteDirectory(tempRoot);
            }
        }

        private static async Task DownloadFreeCad(string installerPath, Action<int, string, string> progress)
        {
            using (WebClient client = new WebClient())
            {
                client.Headers.Add(HttpRequestHeader.UserAgent, "GoldfishSetup/" + GoldfishVersion);
                client.DownloadProgressChanged += delegate(object sender, DownloadProgressChangedEventArgs e)
                {
                    int mappedProgress = 8 + (int)Math.Round(e.ProgressPercentage * 0.70);
                    string downloaded = FormatMegabytes(e.BytesReceived);
                    string total = FormatMegabytes(e.TotalBytesToReceive);
                    progress(mappedProgress,
                        "Henter FreeCAD 1.1.3 — " + downloaded + " af " + total + " MB",
                        "Downloading FreeCAD 1.1.3 — " + downloaded + " of " + total + " MB");
                };
                await client.DownloadFileTaskAsync(new Uri(FreeCadDownloadUrl), installerPath);
            }
        }

        private static string FormatMegabytes(long bytes)
        {
            if (bytes <= 0)
            {
                return "?";
            }
            return (bytes / 1024D / 1024D).ToString("0", CultureInfo.InvariantCulture);
        }

        private static void InstallFreeCad(string installerPath, bool danish)
        {
            ProcessStartInfo info = new ProcessStartInfo(installerPath);
            info.Arguments = "/S";
            info.UseShellExecute = true;
            info.Verb = "runas";
            Process process = Process.Start(info);
            process.WaitForExit();
            if (process.ExitCode != 0)
            {
                throw new InvalidOperationException((danish ? "FreeCAD-installationen sluttede med fejlkode " : "FreeCAD installation ended with error code ") + process.ExitCode + ".");
            }
        }

        private static string InstallGoldfishPayload(string userDataPath)
        {
            string moduleRoot = Path.Combine(userDataPath, "Mod");
            Directory.CreateDirectory(moduleRoot);
            string destination = Path.Combine(moduleRoot, "Goldfish");
            string staging = Path.Combine(moduleRoot, ".Goldfish-install-" + Guid.NewGuid().ToString("N"));
            string backup = null;

            Directory.CreateDirectory(staging);
            try
            {
                ExtractEmbeddedPayload(staging);
                if (!File.Exists(Path.Combine(staging, "InitGui.py")) || !File.Exists(Path.Combine(staging, "package.xml")))
                {
                    throw new InvalidDataException("Goldfish payload is incomplete.");
                }

                if (Directory.Exists(destination))
                {
                    backup = Path.Combine(moduleRoot, "Goldfish.backup-" + DateTime.Now.ToString("yyyyMMdd-HHmmss", CultureInfo.InvariantCulture) + "-" + Guid.NewGuid().ToString("N").Substring(0, 6));
                    Directory.Move(destination, backup);
                }

                try
                {
                    Directory.Move(staging, destination);
                }
                catch
                {
                    if (!Directory.Exists(destination) && !String.IsNullOrEmpty(backup) && Directory.Exists(backup))
                    {
                        Directory.Move(backup, destination);
                    }
                    throw;
                }

                return backup;
            }
            finally
            {
                if (Directory.Exists(staging))
                {
                    TryDeleteDirectoryWithin(staging, moduleRoot);
                }
            }
        }

        private static void ExtractEmbeddedPayload(string destination)
        {
            Assembly assembly = Assembly.GetExecutingAssembly();
            using (Stream resource = assembly.GetManifestResourceStream("Goldfish.zip"))
            {
                if (resource == null)
                {
                    throw new InvalidDataException("The embedded Goldfish package is missing.");
                }

                using (ZipArchive archive = new ZipArchive(resource, ZipArchiveMode.Read, false))
                {
                    string root = Path.GetFullPath(destination) + Path.DirectorySeparatorChar;
                    foreach (ZipArchiveEntry entry in archive.Entries)
                    {
                        string relative = entry.FullName.Replace('/', Path.DirectorySeparatorChar);
                        string target = Path.GetFullPath(Path.Combine(destination, relative));
                        if (!target.StartsWith(root, StringComparison.OrdinalIgnoreCase))
                        {
                            throw new InvalidDataException("Unsafe path in the embedded Goldfish package.");
                        }

                        if (String.IsNullOrEmpty(entry.Name))
                        {
                            Directory.CreateDirectory(target);
                        }
                        else
                        {
                            string parent = Path.GetDirectoryName(target);
                            if (!String.IsNullOrEmpty(parent))
                            {
                                Directory.CreateDirectory(parent);
                            }
                            entry.ExtractToFile(target, true);
                        }
                    }
                }
            }
        }

        private static void ConfigureGoldfishWorkbench(string freeCadCmd, string tempRoot, bool danish)
        {
            string scriptPath = Path.Combine(tempRoot, "activate-goldfish.py");
            string script =
                "import FreeCAD as App\n" +
                "general = App.ParamGet(\"User parameter:BaseApp/Preferences/General\")\n" +
                "general.SetString(\"AutoloadModule\", \"GoldfishWorkbench\")\n" +
                "general.SetString(\"LastModule\", \"GoldfishWorkbench\")\n" +
                "App.ParamGet(\"User parameter:BaseApp/Preferences/Mod/Start\").SetBool(\"ShowOnStartup\", False)\n" +
                "App.saveParameter()\n";
            File.WriteAllText(scriptPath, script, new UTF8Encoding(false));

            ProcessStartInfo info = new ProcessStartInfo(freeCadCmd);
            info.Arguments = QuoteArgument(scriptPath);
            info.WorkingDirectory = Path.GetDirectoryName(freeCadCmd);
            info.UseShellExecute = false;
            info.CreateNoWindow = true;
            info.RedirectStandardOutput = true;
            info.RedirectStandardError = true;
            Process process = Process.Start(info);
            string output = process.StandardOutput.ReadToEnd();
            string error = process.StandardError.ReadToEnd();
            process.WaitForExit();
            if (process.ExitCode != 0)
            {
                throw new InvalidOperationException((danish ? "Goldfish kunne ikke aktiveres i FreeCAD. " : "Goldfish could not be activated in FreeCAD. ") + output + " " + error);
            }
        }

        private static FreeCadInstallation FindCompatibleFreeCad()
        {
            List<string> candidates = FindFreeCadCandidates();
            FreeCadInstallation best = null;
            foreach (string exe in candidates)
            {
                string cmd = Path.Combine(Path.GetDirectoryName(exe), "FreeCADCmd.exe");
                if (!File.Exists(exe) || !File.Exists(cmd))
                {
                    continue;
                }

                string version = QueryFreeCadConfig(cmd, "ExeVersion");
                if (!IsCompatibleVersion(version))
                {
                    continue;
                }

                FreeCadInstallation candidate = new FreeCadInstallation();
                candidate.ExePath = exe;
                candidate.CmdPath = cmd;
                candidate.Version = version;
                if (best == null || CompareVersions(candidate.Version, best.Version) > 0)
                {
                    best = candidate;
                }
            }
            return best;
        }

        private static List<string> FindFreeCadCandidates()
        {
            List<string> candidates = new List<string>();
            AddCandidate(candidates, Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), "FreeCAD 1.1", "bin", "FreeCAD.exe"));
            AddCandidate(candidates, Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), "FreeCAD 1.1.3", "bin", "FreeCAD.exe"));
            AddCandidate(candidates, Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Programs", "FreeCAD 1.1", "bin", "FreeCAD.exe"));

            AddCandidatesFromProgramFolder(candidates, Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles));
            AddCandidatesFromProgramFolder(candidates, Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86));
            AddCandidatesFromRegistry(candidates, RegistryHive.LocalMachine, RegistryView.Registry64);
            AddCandidatesFromRegistry(candidates, RegistryHive.LocalMachine, RegistryView.Registry32);
            AddCandidatesFromRegistry(candidates, RegistryHive.CurrentUser, RegistryView.Registry64);
            AddCandidatesFromRegistry(candidates, RegistryHive.CurrentUser, RegistryView.Registry32);
            return candidates;
        }

        private static void AddCandidatesFromProgramFolder(List<string> candidates, string root)
        {
            if (String.IsNullOrEmpty(root) || !Directory.Exists(root))
            {
                return;
            }
            try
            {
                foreach (string directory in Directory.GetDirectories(root, "FreeCAD*", SearchOption.TopDirectoryOnly))
                {
                    AddCandidate(candidates, Path.Combine(directory, "bin", "FreeCAD.exe"));
                }
            }
            catch
            {
            }
        }

        private static void AddCandidatesFromRegistry(List<string> candidates, RegistryHive hive, RegistryView view)
        {
            try
            {
                using (RegistryKey baseKey = RegistryKey.OpenBaseKey(hive, view))
                using (RegistryKey uninstall = baseKey.OpenSubKey(@"SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall"))
                {
                    if (uninstall == null)
                    {
                        return;
                    }
                    foreach (string name in uninstall.GetSubKeyNames())
                    {
                        using (RegistryKey entry = uninstall.OpenSubKey(name))
                        {
                            if (entry == null)
                            {
                                continue;
                            }
                            string displayName = entry.GetValue("DisplayName") as string;
                            if (String.IsNullOrEmpty(displayName) || displayName.IndexOf("FreeCAD", StringComparison.OrdinalIgnoreCase) < 0)
                            {
                                continue;
                            }
                            string location = entry.GetValue("InstallLocation") as string;
                            if (!String.IsNullOrEmpty(location))
                            {
                                AddCandidate(candidates, Path.Combine(location, "bin", "FreeCAD.exe"));
                                AddCandidate(candidates, Path.Combine(location, "FreeCAD.exe"));
                            }
                        }
                    }
                }
            }
            catch
            {
            }
        }

        private static void AddCandidate(List<string> candidates, string path)
        {
            if (String.IsNullOrEmpty(path))
            {
                return;
            }
            foreach (string existing in candidates)
            {
                if (existing.Equals(path, StringComparison.OrdinalIgnoreCase))
                {
                    return;
                }
            }
            candidates.Add(path);
        }

        private static string QueryFreeCadConfig(string freeCadCmd, string name)
        {
            try
            {
                ProcessStartInfo info = new ProcessStartInfo(freeCadCmd);
                info.Arguments = "--get-config " + name;
                info.WorkingDirectory = Path.GetDirectoryName(freeCadCmd);
                info.UseShellExecute = false;
                info.CreateNoWindow = true;
                info.RedirectStandardOutput = true;
                info.RedirectStandardError = true;
                Process process = Process.Start(info);
                string output = process.StandardOutput.ReadToEnd();
                process.StandardError.ReadToEnd();
                process.WaitForExit();
                if (process.ExitCode != 0)
                {
                    return null;
                }
                string[] lines = output.Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries);
                return lines.Length == 0 ? null : lines[lines.Length - 1].Trim();
            }
            catch
            {
                return null;
            }
        }

        private static bool IsCompatibleVersion(string version)
        {
            return CompareVersions(version, MinimumFreeCadVersion) >= 0;
        }

        private static int CompareVersions(string left, string right)
        {
            Version leftVersion;
            Version rightVersion;
            if (!Version.TryParse(NormalizeVersion(left), out leftVersion) || !Version.TryParse(NormalizeVersion(right), out rightVersion))
            {
                return -1;
            }
            return leftVersion.CompareTo(rightVersion);
        }

        private static string NormalizeVersion(string value)
        {
            if (String.IsNullOrEmpty(value))
            {
                return "0.0.0";
            }
            Match match = Regex.Match(value, @"\d+(?:\.\d+){1,3}");
            return match.Success ? match.Value : "0.0.0";
        }

        private static string ComputeSha256(string path)
        {
            using (SHA256 sha = SHA256.Create())
            using (FileStream stream = File.OpenRead(path))
            {
                byte[] hash = sha.ComputeHash(stream);
                StringBuilder builder = new StringBuilder(hash.Length * 2);
                foreach (byte value in hash)
                {
                    builder.Append(value.ToString("x2", CultureInfo.InvariantCulture));
                }
                return builder.ToString();
            }
        }

        private static string QuoteArgument(string value)
        {
            return "\"" + value.Replace("\"", "\\\"") + "\"";
        }

        private static void TryDeleteDirectory(string path)
        {
            TryDeleteDirectoryWithin(path, Path.GetTempPath());
        }

        private static void TryDeleteDirectoryWithin(string path, string allowedRoot)
        {
            try
            {
                string fullPath = Path.GetFullPath(path);
                string rootPath = Path.GetFullPath(allowedRoot).TrimEnd(Path.DirectorySeparatorChar) + Path.DirectorySeparatorChar;
                if (fullPath.StartsWith(rootPath, StringComparison.OrdinalIgnoreCase) && Directory.Exists(fullPath))
                {
                    Directory.Delete(fullPath, true);
                }
            }
            catch
            {
            }
        }

        internal static string RunDiagnostics()
        {
            StringBuilder report = new StringBuilder();
            report.AppendLine("Goldfish Setup diagnostics");
            report.AppendLine("Setup version: " + GoldfishVersion);
            report.AppendLine("OS: " + Environment.OSVersion);
            report.AppendLine("64-bit OS: " + Environment.Is64BitOperatingSystem);

            string tempRoot = Path.Combine(Path.GetTempPath(), "GoldfishSetup-diagnostics-" + Guid.NewGuid().ToString("N"));
            Directory.CreateDirectory(tempRoot);
            try
            {
                ExtractEmbeddedPayload(tempRoot);
                string packageFile = Path.Combine(tempRoot, "package.xml");
                bool payloadOk = File.Exists(Path.Combine(tempRoot, "InitGui.py")) &&
                    File.Exists(packageFile) &&
                    File.ReadAllText(packageFile).Contains("<version>" + GoldfishVersion + "</version>");
                report.AppendLine("Embedded payload: " + (payloadOk ? "OK" : "FAILED"));
            }
            finally
            {
                TryDeleteDirectory(tempRoot);
            }

            FreeCadInstallation freeCad = FindCompatibleFreeCad();
            if (freeCad == null)
            {
                report.AppendLine("Compatible FreeCAD: not found");
            }
            else
            {
                report.AppendLine("Compatible FreeCAD: " + freeCad.Version);
                report.AppendLine("Executable: " + freeCad.ExePath);
                report.AppendLine("User data: " + QueryFreeCadConfig(freeCad.CmdPath, "UserAppData"));
            }
            return report.ToString();
        }
    }
}
