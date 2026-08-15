using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace AnasAI.Pages.Admin;

public class LoginModel : PageModel
{
    [BindProperty]
    public string Username { get; set; } = "";

    [BindProperty]
    public string Password { get; set; } = "";

    public string ErrorMessage { get; set; } = "";

    public IActionResult OnPost()
    {
        Username = Username?.Trim() ?? "";
        Password = Password ?? "";

        if (string.IsNullOrWhiteSpace(Username) ||
            string.IsNullOrWhiteSpace(Password))
        {
            ErrorMessage = "Username and password are required.";
            return Page();
        }

        // Admin credentials
        if (Username.Equals("admin", StringComparison.OrdinalIgnoreCase) &&
            Password == "AnasAdmin@2026")
        {
            HttpContext.Session.SetString(
                "AnasAI_Admin",
                "true"
            );

           return Redirect("/Admin/Index");
        }

        ErrorMessage = "Invalid admin username or password.";

        return Page();
    }
}