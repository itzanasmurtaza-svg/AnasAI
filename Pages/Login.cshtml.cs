using AnasAI.Data;
using AnasAI.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;

namespace AnasAI.Pages;

public class LoginModel : PageModel
{
    private readonly AppDbContext _context;

    public LoginModel(AppDbContext context)
    {
        _context = context;
    }

    [BindProperty]
    public string Username { get; set; } = "";

    [BindProperty]
    public string Password { get; set; } = "";

    [BindProperty]
    public string LicenseKey { get; set; } = "";

    public string ErrorMessage { get; set; } = "";

    public async Task<IActionResult> OnPostAsync()
    {
        Username = Username.Trim();
        LicenseKey = LicenseKey.Trim().ToUpperInvariant();

        if (string.IsNullOrWhiteSpace(Username) ||
            string.IsNullOrWhiteSpace(Password) ||
            string.IsNullOrWhiteSpace(LicenseKey))
        {
            ErrorMessage = "Username, password and license key are required.";
            return Page();
        }

        var user = await _context.Users
            .Include(u => u.License)
            .FirstOrDefaultAsync(u =>
                u.Username.ToLower() == Username.ToLower());

        if (user == null)
        {
            ErrorMessage = "Invalid username or password.";
            return Page();
        }

        if (!user.IsActive)
        {
            ErrorMessage = "Your account is inactive.";
            return Page();
        }

        if (!VerifyPassword(Password, user.PasswordHash))
        {
            ErrorMessage = "Invalid username or password.";
            return Page();
        }

        if (user.License == null)
        {
            ErrorMessage = "No license is assigned to this account.";
            return Page();
        }

        if (!string.Equals(
                user.License.LicenseKey,
                LicenseKey,
                StringComparison.OrdinalIgnoreCase))
        {
            ErrorMessage = "Invalid license key.";
            return Page();
        }

        if (!user.License.IsActive)
        {
            ErrorMessage = "Your license is inactive.";
            return Page();
        }

        if (user.License.ExpiresAt <= DateTime.UtcNow)
        {
            ErrorMessage = "Your license has expired.";
            return Page();
        }

        HttpContext.Session.SetString(
            "AnasAI_UserId",
            user.Id.ToString());

        HttpContext.Session.SetString(
            "AnasAI_Username",
            user.Username);

        HttpContext.Session.SetString(
            "AnasAI_LicenseId",
            user.License.Id.ToString());

       return RedirectToPage("/Index");
    }

    private static bool VerifyPassword(
        string password,
        string storedPassword)
    {
        try
        {
            var parts = storedPassword.Split('.');

            if (parts.Length != 2)
                return false;

            byte[] salt = Convert.FromBase64String(parts[0]);
            byte[] storedHash = Convert.FromBase64String(parts[1]);

            byte[] calculatedHash =
                Rfc2898DeriveBytes.Pbkdf2(
                    password,
                    salt,
                    100_000,
                    HashAlgorithmName.SHA256,
                    32);

            return CryptographicOperations.FixedTimeEquals(
                calculatedHash,
                storedHash);
        }
        catch
        {
            return false;
        }
    }
}