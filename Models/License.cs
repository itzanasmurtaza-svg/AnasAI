namespace AnasAI.Models;

public class License
{
    public int Id { get; set; }

    public string LicenseKey { get; set; } = "";

    public string Plan { get; set; } = "Free";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime ExpiresAt { get; set; }

    public bool IsActive { get; set; } = true;

    public bool ImageAccess { get; set; } = false;

    public bool VoiceAccess { get; set; } = false;

    public bool AdvancedAI { get; set; } = false;
}