param([Parameter(Mandatory=$true)][string]$SqlFile)
# Reads the Supabase personal access token from Windows Credential Manager
# and executes the SQL in $SqlFile against the remote project via the
# official Supabase Management API. The token is never printed.
$ErrorActionPreference = "Stop"
$sig = @"
using System;
using System.Runtime.InteropServices;
public class CredRdr {
  [DllImport("advapi32.dll", SetLastError=true, CharSet=CharSet.Unicode)]
  public static extern bool CredRead(string target, int type, int flags, out IntPtr credential);
  [DllImport("advapi32.dll")] public static extern void CredFree(IntPtr cred);
  [StructLayout(LayoutKind.Sequential)]
  public struct CREDENTIAL {
    public int Flags; public int Type; public IntPtr TargetName; public IntPtr Comment;
    public long LastWritten; public int CredentialBlobSize; public IntPtr CredentialBlob;
    public int Persist; public int AttributeCount; public IntPtr Attributes;
    public IntPtr TargetAlias; public IntPtr UserName;
  }
  public static string Read(string target) {
    IntPtr p;
    if(!CredRead(target,1,0,out p)) return null;
    var c = (CREDENTIAL)Marshal.PtrToStructure(p, typeof(CREDENTIAL));
    byte[] b = new byte[c.CredentialBlobSize];
    Marshal.Copy(c.CredentialBlob, b, 0, c.CredentialBlobSize);
    CredFree(p);
    string u16 = System.Text.Encoding.Unicode.GetString(b);
    string u8 = System.Text.Encoding.UTF8.GetString(b);
    return (u16.StartsWith("sbp_") ? u16 : u8);
  }
}
"@
Add-Type -TypeDefinition $sig
$tok = [CredRdr]::Read("Supabase CLI:supabase")
if (-not $tok) { Write-Error "No token"; exit 1 }
$ref = "rfyuggtvailwsasykwxh"
$sql = [string](Get-Content -Raw -Encoding UTF8 $SqlFile)
Add-Type -AssemblyName System.Web.Extensions
$ser = New-Object System.Web.Script.Serialization.JavaScriptSerializer
$dict = New-Object 'System.Collections.Generic.Dictionary[string,object]'
$dict.Add("query", $sql)
$body = $ser.Serialize($dict)
$bytes = [System.Text.Encoding]::UTF8.GetBytes($body)
$resp = Invoke-RestMethod -Method Post -Uri "https://api.supabase.com/v1/projects/$ref/database/query" `
  -Headers @{ Authorization = "Bearer $tok" } -ContentType "application/json" -Body $bytes
$resp | ConvertTo-Json -Depth 10
