using AnasAI.Data;
using AnasAI.Services;
using AnasAI.Services.Auth;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Razor Pages
builder.Services.AddRazorPages();

// Controllers
builder.Services.AddControllers();

// Session
builder.Services.AddDistributedMemoryCache();
builder.Services.AddSession(options =>
{
    options.IdleTimeout = TimeSpan.FromHours(8);
    options.Cookie.HttpOnly = true;
    options.Cookie.IsEssential = true;
});

// Anas AI
builder.Services.AddHttpClient<AIService>();
builder.Services.AddScoped<IAIService, AIService>();

// Authentication service
builder.Services.AddScoped<AuthService>();

// SQLite Database
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite("Data Source=anasai.db"));

var app = builder.Build();

// Seed database
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

    await SeedData.InitializeAsync(db);
}

// Error handling
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Error");
    app.UseHsts();
}

app.UseHttpsRedirection();

app.UseStaticFiles();

app.UseRouting();

// Session MUST be before Razor Pages
app.UseSession();

app.UseAuthorization();

// Endpoints
app.MapControllers();
app.MapRazorPages();

app.Run();