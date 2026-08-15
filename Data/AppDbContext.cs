using AnasAI.Models;
using Microsoft.EntityFrameworkCore;

namespace AnasAI.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(
        DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();

    public DbSet<License> Licenses => Set<License>();

    public DbSet<Admin> Admins => Set<Admin>();
}