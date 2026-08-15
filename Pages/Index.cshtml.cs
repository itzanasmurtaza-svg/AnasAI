using AnasAI.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;

namespace AnasAI.Pages;

public class IndexModel : PageModel
{
    private readonly AppDbContext _db;

    public string CurrentUsername { get; private set; } = "User";

    public string CurrentPlan { get; private set; } = "Free";

    public IndexModel(AppDbContext db)
    {
        _db = db;
    }

    public async Task<IActionResult> OnGetAsync()
    {
        // ==========================================
        // GET LOGGED-IN USER SESSION
        // ==========================================

        var userId =
            HttpContext.Session.GetString("AnasAI_UserId");

        var username =
            HttpContext.Session.GetString("AnasAI_Username");

        var licenseId =
            HttpContext.Session.GetString("AnasAI_LicenseId");


        // ==========================================
        // USER NOT LOGGED IN
        // ==========================================

        if (string.IsNullOrWhiteSpace(userId) ||
            string.IsNullOrWhiteSpace(username) ||
            string.IsNullOrWhiteSpace(licenseId))
        {
            return RedirectToPage("/Login");
        }


        // ==========================================
        // USERNAME
        // ==========================================

        CurrentUsername =
            username.Trim();


        // ==========================================
        // LICENSE / PLAN
        // ==========================================

        if (int.TryParse(
                licenseId,
                out int parsedLicenseId))
        {
            var license =
                await _db.Licenses
                    .AsNoTracking()
                    .FirstOrDefaultAsync(
                        x => x.Id == parsedLicenseId);

            if (license != null &&
                !string.IsNullOrWhiteSpace(
                    license.Plan))
            {
                CurrentPlan =
                    license.Plan.Trim();
            }
        }


        // ==========================================
        // SHOW PAGE
        // ==========================================

        return Page();
    }
}