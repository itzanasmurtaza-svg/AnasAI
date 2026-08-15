using AnasAI.Data;
using AnasAI.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using System.Text;

namespace AnasAI.Pages.Admin;

public class UsersModel : PageModel
{
    private readonly AppDbContext _context;

    public UsersModel(AppDbContext context)
    {
        _context = context;
    }

    public List<User> Users { get; set; } = new();

    public List<License> Licenses { get; set; } = new();

    [BindProperty]
    public string NewUsername { get; set; } = "";

    [BindProperty]
    public string NewPassword { get; set; } = "";

    [BindProperty]
    public int? NewLicenseId { get; set; }

    public string Message { get; set; } = "";

    public async Task OnGetAsync()
    {
        await LoadDataAsync();
    }

    public async Task<IActionResult> OnPostAddUserAsync()
    {
        if (string.IsNullOrWhiteSpace(NewUsername))
        {
            Message = "Username is required.";
            await LoadDataAsync();
            return Page();
        }

        if (string.IsNullOrWhiteSpace(NewPassword))
        {
            Message = "Password is required.";
            await LoadDataAsync();
            return Page();
        }

        var username = NewUsername.Trim();

        var existingUser = await _context.Users
            .FirstOrDefaultAsync(u => u.Username == username);

        if (existingUser != null)
        {
            Message = "Username already exists.";
            await LoadDataAsync();
            return Page();
        }

        var user = new User
        {
            Username = username,
            PasswordHash = HashPassword(NewPassword),
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            LicenseId = NewLicenseId
        };

        _context.Users.Add(user);

        await _context.SaveChangesAsync();

        return RedirectToPage();
    }

    private async Task LoadDataAsync()
    {
        Users = await _context.Users
            .Include(u => u.License)
            .OrderByDescending(u => u.CreatedAt)
            .ToListAsync();

        Licenses = await _context.Licenses
            .Where(l => l.IsActive)
            .OrderBy(l => l.Plan)
            .ToListAsync();
    }

    private static string HashPassword(string password)
    {
        byte[] salt = RandomNumberGenerator.GetBytes(16);

        byte[] hash = Rfc2898DeriveBytes.Pbkdf2(
            password,
            salt,
            100_000,
            HashAlgorithmName.SHA256,
            32
        );

        return $"{Convert.ToBase64String(salt)}.{Convert.ToBase64String(hash)}";
    }
}