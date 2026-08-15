using AnasAI.Data;
using AnasAI.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;

namespace AnasAI.Pages.Admin;

public class LicensesModel : PageModel
{
    private readonly AppDbContext _context;

    public LicensesModel(AppDbContext context)
    {
        _context = context;
    }

    [BindProperty]
    public License License { get; set; } = new();

    public List<License> Licenses { get; set; } = new();

    public List<User> Users { get; set; } = new();

    public int AssignedLicenseCount { get; set; }


    // =========================
    // LOAD
    // =========================

    public async Task OnGetAsync()
    {
        await LoadDataAsync();
    }


    // =========================
    // ADD LICENSE
    // =========================

    public async Task<IActionResult> OnPostAddLicenseAsync()
    {
        if (!ModelState.IsValid)
        {
            await LoadDataAsync();
            return Page();
        }

        License.LicenseKey =
            GenerateLicenseKey();

        License.CreatedAt =
            DateTime.UtcNow;

        License.IsActive =
            true;

        _context.Licenses.Add(License);

        await _context.SaveChangesAsync();

        TempData["Success"] =
            "License created successfully!";

        return RedirectToPage();
    }


    // =========================
    // EDIT LICENSE
    // =========================

    public async Task<IActionResult> OnPostEditLicenseAsync(
        int id,
        string plan,
        DateTime expiresAt,
        bool imageAccess,
        bool voiceAccess,
        bool advancedAI)
    {
        var license =
            await _context.Licenses
                .FirstOrDefaultAsync(x => x.Id == id);

        if (license == null)
        {
            TempData["Error"] =
                "License not found.";

            return RedirectToPage();
        }

        license.Plan =
            plan;

        license.ExpiresAt =
            expiresAt;

        license.ImageAccess =
            imageAccess;

        license.VoiceAccess =
            voiceAccess;

        license.AdvancedAI =
            advancedAI;

        await _context.SaveChangesAsync();

        TempData["Success"] =
            "License updated successfully!";

        return RedirectToPage();
    }


    // =========================
    // ENABLE / DISABLE
    // =========================

    public async Task<IActionResult> OnPostToggleAsync(int id)
    {
        var license =
            await _context.Licenses
                .FirstOrDefaultAsync(x => x.Id == id);

        if (license == null)
        {
            TempData["Error"] =
                "License not found.";

            return RedirectToPage();
        }

        license.IsActive =
            !license.IsActive;

        await _context.SaveChangesAsync();

        TempData["Success"] =
            license.IsActive
                ? "License enabled successfully."
                : "License disabled successfully.";

        return RedirectToPage();
    }


    // =========================
    // DELETE
    // =========================

    public async Task<IActionResult> OnPostDeleteAsync(int id)
    {
        var license =
            await _context.Licenses
                .FirstOrDefaultAsync(x => x.Id == id);

        if (license == null)
        {
            TempData["Error"] =
                "License not found.";

            return RedirectToPage();
        }

        // Check if any user is using this license

        bool assigned =
            await _context.Users
                .AnyAsync(x => x.LicenseId == id);

        if (assigned)
        {
            TempData["Error"] =
                "This license is assigned to a user. Remove the assignment before deleting it.";

            return RedirectToPage();
        }

        _context.Licenses.Remove(license);

        await _context.SaveChangesAsync();

        TempData["Success"] =
            "License deleted successfully.";

        return RedirectToPage();
    }


    // =========================
    // LOAD ALL DATA
    // =========================

    private async Task LoadDataAsync()
    {
        // All licenses

        Licenses =
            await _context.Licenses
                .OrderByDescending(x => x.Id)
                .ToListAsync();


        // All users

        Users =
            await _context.Users
                .OrderBy(x => x.Username)
                .ToListAsync();


        // Number of licenses currently assigned

        AssignedLicenseCount =
            await _context.Users
                .Where(x => x.LicenseId != null)
                .Select(x => x.LicenseId)
                .Distinct()
                .CountAsync();
    }


    // =========================
    // LICENSE KEY
    // =========================

    private static string GenerateLicenseKey()
    {
        return
            $"ANAS-{Guid.NewGuid():N}"
                .ToUpperInvariant()
                .Substring(0, 19);
    }
}