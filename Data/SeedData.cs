using AnasAI.Models;
using Microsoft.EntityFrameworkCore;

namespace AnasAI.Data;

public static class SeedData
{
    public static async Task InitializeAsync(
        AppDbContext db)
    {
        await db.Database.EnsureCreatedAsync();

        if (!await db.Admins.AnyAsync())
        {
            var admin = new Admin
            {
                Username = "admin",
                PasswordHash =
                    BCrypt.Net.BCrypt.HashPassword("AnasAdmin@2026"),
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            db.Admins.Add(admin);

            await db.SaveChangesAsync();
        }
    }
}