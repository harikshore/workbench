"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { updateProfile, removeAvatar } from "@/actions/user";
import { useUploadThing } from "@/lib/uploadthing";
import { compressImage } from "@/lib/compress-image";
import { COUNTRIES } from "@/lib/countries";

interface ProfileUser {
  name: string;
  email: string;
  avatar: string | null;
  country: string;
  timezone: string;
  emailVerified: boolean;
}

export function ProfileForm({ user }: { user: ProfileUser }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(user.name);
  const [country, setCountry] = useState(user.country);
  const [timezone, setTimezone] = useState(user.timezone);
  const [avatar, setAvatar] = useState<string | null>(user.avatar);
  const [isPending, setIsPending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [error, setError] = useState("");

  const { startUpload } = useUploadThing("avatar", {
    onClientUploadComplete: (res) => {
      if (res?.[0]) {
        setAvatar(res[0].ufsUrl);
        setIsUploading(false);
        router.refresh();
      }
    },
    onUploadError: (err) => {
      setError(err.message || "Upload failed.");
      setIsUploading(false);
    },
  });

  const selectedCountry = COUNTRIES.find((c) => c.code === country);
  const timezones = selectedCountry?.timezones || [];

  const dirty =
    name !== user.name ||
    country !== user.country ||
    timezone !== user.timezone;

  const initials = (name || user.email.split("@")[0])
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  function handleCountryChange(code: string) {
    setCountry(code);
    const c = COUNTRIES.find((c) => c.code === code);
    if (c) setTimezone(c.timezones[0]);
    else setTimezone("");
    setStatus("idle");
  }

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

  async function handleRemoveAvatar() {
    setIsUploading(true);
    try {
      await removeAvatar();
      setAvatar(null);
      router.refresh();
    } catch {
      setError("Failed to remove avatar.");
    } finally {
      setIsUploading(false);
    }
  }

  function handleDiscard() {
    setName(user.name);
    setCountry(user.country);
    setTimezone(user.timezone);
    setError("");
    setStatus("idle");
  }

  async function handleSave() {
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    setError("");
    setIsPending(true);
    try {
      await updateProfile({
        name: name.trim(),
        country,
        timezone,
      });
      setStatus("saved");
      router.refresh();
      setTimeout(() => setStatus("idle"), 3000);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
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

  const sectionStyle: React.CSSProperties = {
    display: "flex",
    flexWrap: "wrap",
    gap: "var(--space-4) var(--space-8)",
    borderTop: "2px solid var(--color-divider)",
    padding: "var(--space-6) 0",
  };

  const labelColStyle: React.CSSProperties = {
    flex: "1 1 200px",
    maxWidth: 280,
  };

  const fieldColStyle: React.CSSProperties = {
    flex: "2 1 320px",
    minWidth: 0,
    maxWidth: 480,
    display: "flex",
    flexDirection: "column",
    gap: "var(--space-4)",
  };

  return (
    <div style={{ maxWidth: 800 }}>
      {/* Hero */}
      <section
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-2)",
          paddingBottom: "var(--space-6)",
        }}
      >
        <h6 className="text-muted" style={{ margin: "0 0 var(--space-1)" }}>
          Account
        </h6>
        <h1 style={{ margin: 0, fontSize: "clamp(32px,5vw,56px)" }}>
          Profile
        </h1>
        <p className="text-muted" style={{ margin: 0, maxWidth: "52ch" }}>
          How you appear across the lab. Changes apply everywhere as soon as you
          save.
        </p>
      </section>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          borderBottom: "2px solid var(--color-divider)",
        }}
      >
        {/* Avatar */}
        <div style={sectionStyle}>
          <div style={labelColStyle}>
            <div style={{ fontWeight: 800, fontSize: 16 }}>Avatar</div>
            <p
              className="text-muted"
              style={{ margin: "4px 0 0", fontSize: 13 }}
            >
              Shown in the sidebar and anywhere your name appears.
            </p>
          </div>
          <div style={fieldColStyle}>
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
                  width: 96,
                  height: 96,
                  flex: "none",
                  background: avatar ? "transparent" : "var(--color-text)",
                  color: "var(--color-bg)",
                  display: "grid",
                  placeItems: "center",
                  fontWeight: 800,
                  fontSize: 32,
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
                <div
                  style={{
                    display: "flex",
                    gap: "var(--space-2)",
                    flexWrap: "wrap",
                  }}
                >
                  <label
                    className="btn btn-secondary"
                    style={{
                      minHeight: 40,
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
                    {isUploading
                      ? "Uploading..."
                      : avatar
                        ? "Replace"
                        : "Upload photo"}
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleFileChange}
                      disabled={isUploading}
                      style={{ display: "none" }}
                    />
                  </label>
                  {avatar && !isUploading && (
                    <button
                      type="button"
                      className="btn btn-ghost"
                      style={{ color: "var(--color-text)" }}
                      onClick={handleRemoveAvatar}
                    >
                      Remove
                    </button>
                  )}
                </div>
                <span className="text-muted" style={{ fontSize: 12 }}>
                  PNG, JPG or WebP. 2 MB max.
                </span>
              </div>
            </div>
            {error && (error.includes("image") || error.includes("Upload") || error.includes("remove")) && (
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
        </div>

        {/* Personal details */}
        <div style={sectionStyle}>
          <div style={labelColStyle}>
            <div style={{ fontWeight: 800, fontSize: 16 }}>
              Personal details
            </div>
            <p
              className="text-muted"
              style={{ margin: "4px 0 0", fontSize: 13 }}
            >
              Your name is how the lab greets you.
            </p>
          </div>
          <div style={fieldColStyle}>
            <div className="field">
              <label>Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setStatus("idle");
                }}
                autoComplete="name"
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
            <div className="field">
              <label>Email</label>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--space-2)",
                }}
              >
                <input
                  type="email"
                  value={user.email}
                  readOnly
                  className="input"
                  style={{ flex: 1, minWidth: 0, opacity: 0.7 }}
                />
                {user.emailVerified && (
                  <span
                    style={{
                      flex: "none",
                      display: "inline-flex",
                      alignItems: "center",
                      fontSize: 11,
                      letterSpacing: "0.02em",
                      padding: "3px 10px",
                      border: "1px solid var(--color-accent)",
                      color: "var(--color-accent)",
                    }}
                  >
                    Verified
                  </span>
                )}
              </div>
              <div
                className="text-muted"
                style={{ fontSize: 12, marginTop: 5 }}
              >
                This is the address you sign in with.
              </div>
            </div>
          </div>
        </div>

        {/* Location */}
        <div style={sectionStyle}>
          <div style={labelColStyle}>
            <div style={{ fontWeight: 800, fontSize: 16 }}>Location</div>
            <p
              className="text-muted"
              style={{ margin: "4px 0 0", fontSize: 13 }}
            >
              Used for local times across the lab.
            </p>
          </div>
          <div style={fieldColStyle}>
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
            <div className="field">
              <label>Timezone</label>
              <div style={{ position: "relative" }}>
                <select
                  value={timezone}
                  onChange={(e) => {
                    setTimezone(e.target.value);
                    setStatus("idle");
                  }}
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
          </div>
        </div>
      </div>

      {/* Actions */}
      <section
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--space-3)",
          flexWrap: "wrap",
          marginTop: "var(--space-4)",
        }}
      >
        <button
          onClick={handleSave}
          disabled={!dirty || isPending}
          className="btn btn-primary"
          style={{ minHeight: 44, gap: 32, margin: 0 }}
        >
          {isPending ? "Saving..." : "Save changes"}
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
        <button
          onClick={handleDiscard}
          disabled={!dirty || isPending}
          className="btn btn-ghost"
          style={{ color: "var(--color-text)" }}
        >
          Discard
        </button>
        {status === "saved" && (
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "var(--color-text)",
            }}
          >
            Saved
          </span>
        )}
      </section>
    </div>
  );
}
