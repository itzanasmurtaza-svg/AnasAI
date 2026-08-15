using AnasAI.Data;
using AnasAI.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace AnasAI.Services.Auth;

public class AuthService
{
    private readonly AppDbContext _db;
    private readonly PasswordHasher<User> _passwordHasher;

    public AuthService(AppDbContext db)
    {
        _db = db;
        _passwordHasher = new PasswordHasher<User>();
    }

    public async Task<User?> LoginAsync(
        string username,
        string password)
    {
        if (string.IsNullOrWhiteSpace(username) ||
            string.IsNullOrWhiteSpace(password))
        {
            return null;
        }

        var user = await _db.Users
            .Include(x => x.License)
            .FirstOrDefaultAsync(x =>
                x.Username == username);

        if (user == null || !user.IsActive)
        {
            return null;
        }

        if (user.License == null ||
            !user.License.IsActive ||
            user.License.ExpiresAt <= DateTime.UtcNow)
        {
            return null;
        }

        var result =
            _passwordHasher.VerifyHashedPassword(
                user,
                user.PasswordHash,
                password);

        if (result ==
            PasswordVerificationResult.Failed)
        {
            return null;
        }

        return user;
    }

    public async Task<bool> UsernameExistsAsync(
        string username)
    {
        return await _db.Users.AnyAsync(x =>
            x.Username == username);
    }

    public async Task<User> CreateUserAsync(
        string username,
        string password,
        License license)
    {
        var user = new User
        {
            Username = username.Trim(),
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            License = license
        };

        user.PasswordHash =
            _passwordHasher.HashPassword(
                user,
                password);

        _db.Users.Add(user);

        await _db.SaveChangesAsync();

        return user;
    }
}