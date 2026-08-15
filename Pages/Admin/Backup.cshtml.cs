using AnasAI.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace AnasAI.Pages.Admin;

public class BackupModel : PageModel
{
    private readonly AppDbContext _context;
    private readonly IWebHostEnvironment _environment;

    public BackupModel(
        AppDbContext context,
        IWebHostEnvironment environment)
    {
        _context = context;
        _environment = environment;
    }

    public string DatabaseSize { get; set; } = "Unknown";

    public string? LastBackup { get; set; }

    public List<BackupInfo> Backups { get; set; } = new();


    // =========================
    // LOAD BACKUP PAGE
    // =========================

    public async Task OnGetAsync()
    {
        await LoadBackupDataAsync();
    }


    // =========================
    // CREATE DATABASE BACKUP
    // =========================

    public async Task<IActionResult> OnPostCreateBackupAsync()
    {
        try
        {
            string databasePath = GetDatabasePath();

            if (!System.IO.File.Exists(databasePath))
            {
                TempData["BackupError"] =
                    "Database file was not found.";

                return RedirectToPage();
            }


            // Backup folder

            string backupFolder =
                Path.Combine(
                    _environment.ContentRootPath,
                    "Backups");

            Directory.CreateDirectory(backupFolder);


            // Unique backup filename

            string fileName =
                $"AnasAI_{DateTime.Now:yyyy-MM-dd_HH-mm-ss}.db";

            string backupPath =
                Path.Combine(
                    backupFolder,
                    fileName);


            // Copy SQLite database

            await using (
                var source = new FileStream(
                    databasePath,
                    FileMode.Open,
                    FileAccess.Read,
                    FileShare.ReadWrite))
            {
                await using (
                    var destination = new FileStream(
                        backupPath,
                        FileMode.CreateNew,
                        FileAccess.Write,
                        FileShare.None))
                {
                    await source.CopyToAsync(destination);
                }
            }


            TempData["BackupSuccess"] =
                $"Backup created successfully: {fileName}";
        }
        catch (Exception ex)
        {
            TempData["BackupError"] =
                "Backup failed: " + ex.Message;
        }


        return RedirectToPage();
    }


    // =========================
    // LOAD BACKUP INFORMATION
    // =========================

    private async Task LoadBackupDataAsync()
    {
        string databasePath = GetDatabasePath();


        // Database size

        if (System.IO.File.Exists(databasePath))
        {
            var info =
                new FileInfo(databasePath);

            DatabaseSize =
                FormatFileSize(info.Length);
        }


        // Backup folder

        string backupFolder =
            Path.Combine(
                _environment.ContentRootPath,
                "Backups");


        if (!Directory.Exists(backupFolder))
        {
            await Task.CompletedTask;
            return;
        }


        // Get latest 10 backups

        var files =
            Directory
                .GetFiles(
                    backupFolder,
                    "*.db")
                .OrderByDescending(
    System.IO.File.GetCreationTimeUtc)
                .Take(10)
                .ToList();


        foreach (var file in files)
        {
            var info =
                new FileInfo(file);

            Backups.Add(
                new BackupInfo
                {
                    FileName = info.Name,

                    CreatedAt =
                        info.CreationTimeUtc,

                    Size =
                        FormatFileSize(info.Length)
                });
        }


        // Latest backup

        if (Backups.Count > 0)
        {
            LastBackup =
                Backups[0]
                    .CreatedAt
                    .ToLocalTime()
                    .ToString(
                        "dd MMM yyyy, hh:mm tt");
        }


        await Task.CompletedTask;
    }


    // =========================
    // DATABASE PATH
    // =========================

    private string GetDatabasePath()
    {
        return Path.Combine(
            _environment.ContentRootPath,
            "anasai.db");
    }


    // =========================
    // FILE SIZE
    // =========================

    private static string FormatFileSize(long bytes)
    {
        if (bytes < 1024)
            return $"{bytes} B";

        if (bytes < 1024 * 1024)
            return $"{bytes / 1024d:F1} KB";

        if (bytes < 1024 * 1024 * 1024)
            return $"{bytes / (1024d * 1024d):F1} MB";

        return
            $"{bytes / (1024d * 1024d * 1024d):F1} GB";
    }


    // =========================
    // BACKUP MODEL
    // =========================

    public class BackupInfo
    {
        public string FileName { get; set; } = "";

        public DateTime CreatedAt { get; set; }

        public string Size { get; set; } = "";
    }
}