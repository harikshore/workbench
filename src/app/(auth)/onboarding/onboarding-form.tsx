"use client";

import { useState, useRef } from "react";
import { completeOnboarding } from "@/actions/user";
import { COUNTRIES } from "@/lib/countries";
import { useUploadThing } from "@/lib/uploadthing";
import { compressImage } from "@/lib/compress-image";

export function OnboardingForm({ defaultName }: { defaultName: string }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(defaultName);
  const [country, setCountry] = useState("");
  const [timezone, setTimezone] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const { startUpload } = useUploadThing("avatar", {
    onClientUploadComplete: (res) => {
      if (res?.[0]) {
        setAvatar(res[0].ufsUrl);
        setIsUploading(false);
      }
    },
    onUploadError: (err) => {
      setError(err.message || "Upload failed.");
      setIsUploading(false);
    },
  });

  const initials = (name || defaultName)
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setError("Please upload a PNG, JPG, or WebP image.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("Image must be under 2 MB.");
      return;
    }
    setError("");
    setIsUploading(true);
    try {
      const compressed = await compressImage(file);
      startUpload([compressed]);
    } catch {
      setError("Failed to process image.");
      setIsUploading(false);
    }
  }

  const selectedCountry = COUNTRIES.find((c) => c.code === country);
  const timezones = selectedCountry?.timezones || [];

  function handleCountryChange(code: string) {
    setCountry(code);
    const c = COUNTRIES.find((c) => c.code === code);
    if (c) setTimezone(c.timezones[0]);
    else setTimezone("");
  }

  async function handleSubmit() {
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    setError("");
    setIsPending(true);
    try {
      await completeOnboarding({
        name: name.trim(),
        country,
        timezone,
      });
      window.location.href = "/dashboard";
    } catch {
      setError("Something went wrong. Please try again.");
      setIsPending(false);
    }
  }

  async function handleSkip() {
    setIsPending(true);
    try {
      await completeOnboarding({
        name: name.trim() || defaultName,
        country: "",
        timezone: "",
      });
      window.location.href = "/dashboard";
    } catch {
      setError("Something went wrong.");
      setIsPending(false);
    }
  }

  const chevronIcon = (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="square"
      style={{
        position: "absolute",
        right: 12,
        top: "50%",
        transform: "translateY(-50%)",
        pointerEvents: "none",
      }}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-4)",
      }}
    >
      {/* Avatar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--space-4)",
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            flex: "none",
            background: avatar ? "transparent" : "var(--color-text)",
            color: "var(--color-bg)",
            display: "grid",
            placeItems: "center",
            fontWeight: 800,
            fontSize: 24,
            overflow: "hidden",
          }}
        >
          {avatar ? (
            <img
              src={avatar}
              alt=""
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          ) : (
            initials
          )}
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-1)",
            alignItems: "flex-start",
          }}
        >
          <label
            className="btn btn-secondary"
            style={{
              minHeight: 36,
              margin: 0,
              cursor: isUploading ? "wait" : "pointer",
              gap: 8,
              opacity: isUploading ? 0.6 : 1,
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="square"
            >
              <path d="M21 15v6H3v-6M17 8l-5-5-5 5M12 3v12" />
            </svg>
            {isUploading ? "Uploading..." : avatar ? "Replace" : "Upload photo"}
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleFileChange}
              disabled={isUploading}
              style={{ display: "none" }}
            />
          </label>
          <span className="text-muted" style={{ fontSize: 12 }}>
            PNG, JPG or WebP. 2 MB max.
          </span>
        </div>
      </div>
      {error && (error.includes("image") || error.includes("Upload") || error.includes("process")) && (
        <div
          style={{
            fontSize: 12,
            color: "var(--color-accent-700)",
            marginTop: -8,
          }}
        >
          {error}
        </div>
      )}

      {/* Name */}
      <div className="field">
        <label>Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
          placeholder="Ada Lovelace"
          className="input"
        />
        {error && error.includes("Name") && (
          <div
            style={{
              fontSize: 12,
              color: "var(--color-accent-700)",
              marginTop: 5,
            }}
          >
            {error}
          </div>
        )}
      </div>

      {/* Country */}
      <div className="field">
        <label>Country</label>
        <div style={{ position: "relative" }}>
          <select
            value={country}
            onChange={(e) => handleCountryChange(e.target.value)}
            className="input"
            style={{
              appearance: "none",
              WebkitAppearance: "none",
              paddingRight: 40,
            }}
          >
            <option value="">Select a country</option>
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
          {chevronIcon}
        </div>
      </div>

      {/* Timezone */}
      <div className="field">
        <label>Timezone</label>
        <div style={{ position: "relative" }}>
          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            disabled={!country}
            className="input"
            style={{
              appearance: "none",
              WebkitAppearance: "none",
              paddingRight: 40,
            }}
          >
            <option value="">
              {country ? "Select timezone" : "Select a country first"}
            </option>
            {timezones.map((tz) => (
              <option key={tz} value={tz}>
                {tz.replace(/_/g, " ")}
              </option>
            ))}
          </select>
          {chevronIcon}
        </div>
      </div>

      {error && !error.includes("Name") && (
        <div
          style={{
            fontSize: 12,
            color: "var(--color-accent-700)",
            marginTop: 5,
          }}
        >
          {error}
        </div>
      )}

      {/* Finish */}
      <button
        onClick={handleSubmit}
        disabled={isPending}
        className="btn btn-primary btn-block"
        style={{
          minHeight: 44,
          justifyContent: "space-between",
        }}
      >
        {isPending ? "Setting up..." : "Finish setup"}
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="square"
        >
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </button>

      {/* Skip */}
      <div
        style={{
          borderTop: "2px solid var(--color-divider)",
          paddingTop: "var(--space-4)",
          display: "flex",
          alignItems: "center",
          gap: "var(--space-2)",
          fontSize: 14,
          flexWrap: "wrap",
        }}
      >
        Not now?
        <button
          onClick={handleSkip}
          disabled={isPending}
          className="btn btn-ghost"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}
