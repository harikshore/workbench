export interface Country {
  code: string;
  name: string;
  timezones: string[];
}

export const COUNTRIES: Country[] = [
  { code: "AU", name: "Australia", timezones: ["Australia/Sydney", "Australia/Melbourne", "Australia/Perth"] },
  { code: "BR", name: "Brazil", timezones: ["America/Sao_Paulo"] },
  { code: "CA", name: "Canada", timezones: ["America/Toronto", "America/Vancouver", "America/Edmonton"] },
  { code: "CN", name: "China", timezones: ["Asia/Shanghai"] },
  { code: "FR", name: "France", timezones: ["Europe/Paris"] },
  { code: "DE", name: "Germany", timezones: ["Europe/Berlin"] },
  { code: "IN", name: "India", timezones: ["Asia/Kolkata"] },
  { code: "ID", name: "Indonesia", timezones: ["Asia/Jakarta"] },
  { code: "IE", name: "Ireland", timezones: ["Europe/Dublin"] },
  { code: "IT", name: "Italy", timezones: ["Europe/Rome"] },
  { code: "JP", name: "Japan", timezones: ["Asia/Tokyo"] },
  { code: "MX", name: "Mexico", timezones: ["America/Mexico_City"] },
  { code: "NL", name: "Netherlands", timezones: ["Europe/Amsterdam"] },
  { code: "NZ", name: "New Zealand", timezones: ["Pacific/Auckland"] },
  { code: "NG", name: "Nigeria", timezones: ["Africa/Lagos"] },
  { code: "PK", name: "Pakistan", timezones: ["Asia/Karachi"] },
  { code: "PH", name: "Philippines", timezones: ["Asia/Manila"] },
  { code: "SG", name: "Singapore", timezones: ["Asia/Singapore"] },
  { code: "ZA", name: "South Africa", timezones: ["Africa/Johannesburg"] },
  { code: "KR", name: "South Korea", timezones: ["Asia/Seoul"] },
  { code: "ES", name: "Spain", timezones: ["Europe/Madrid"] },
  { code: "SE", name: "Sweden", timezones: ["Europe/Stockholm"] },
  { code: "AE", name: "United Arab Emirates", timezones: ["Asia/Dubai"] },
  { code: "GB", name: "United Kingdom", timezones: ["Europe/London"] },
  { code: "US", name: "United States", timezones: ["America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles"] },
];
