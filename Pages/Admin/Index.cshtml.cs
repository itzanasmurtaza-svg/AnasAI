using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace AnasAI.Pages.Admin;

public class IndexModel : PageModel
{
    private readonly IConfiguration _configuration;

    public IndexModel(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    [BindProperty]
    public string Username { get; set; } = "";

    [BindProperty]
    public string Password { get; set; } = "";

    public string ErrorMessage { get; set; } = "";

    public IActionResult OnGet()
    {
        // Admin login check
        if (HttpContext.Session.GetString("AnasAI_Admin") != "true")
        {
            return RedirectToPage("/Admin/Login");
        }

        return Page();
    }

    public IActionResult OnPost()
    {
        var adminUsername = _configuration["Admin:Username"];
        var adminPassword = _configuration["Admin:Password"];

        if (Username.Trim() == adminUsername &&
            Password == adminPassword)
        {
            HttpContext.Session.SetString(
                "AnasAI_Admin",
                "true"
            );

            return RedirectToPage("/Admin/Index");
        }

        ErrorMessage = "Invalid admin username or password.";

        return Page();
    }
}