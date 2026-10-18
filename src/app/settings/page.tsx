"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  Loader2,
  LockKeyhole,
  Mail,
  UserRound,
  Camera,
  LogOut,
  ChevronDown,
  Pencil,
  Trash2,
} from "lucide-react";
import AccountLayout, { accountCard } from "@/components/AccountLayout";
import {
  changePassword,
  getProfileData,
  updateEmail,
  changeUsername,
  uploadProfilePicture,
  deleteProfilePicture,
  type ProfileData,
} from "@/lib/user";

import { logout } from "@/lib/auth";
import { goeyToast } from "goey-toast";

const inputClass =
  "w-full min-w-0 bg-paper border-2 border-ink rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink disabled:opacity-60";
type Section = "username" | "email" | "password" | "picture";

export default function SettingsPage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState<Section | null>(null);
  const pending = useRef(false);
  const pictureInput = useRef<HTMLInputElement>(null);
  const [pictureFile, setPictureFile] = useState<File | null>(null);
  const [picturePreview, setPicturePreview] = useState<string | null>(null);
  const [failedPicture, setFailedPicture] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isDeletingPicture, setIsDeletingPicture] = useState(false);
  const busy = saving !== null || isLoggingOut;
  const pictureSource = picturePreview ?? profile?.profilePicture;

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError(null);
    getProfileData()
      .then((result) => {
        if (!result.success || !result.data)
          throw new Error(result.message || "Unable to load your settings.");
        if (active) {
          setProfile(result.data);
          setUsername(result.data.username);
          setEmail(result.data.email);
        }
      })
      .catch((err) => {
        if (active)
          setLoadError(err.message || "Unable to load your settings.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [attempt]);

  useEffect(() => {
    if (!pictureFile) {
      setPicturePreview(null);
      return;
    }
    const previewUrl = URL.createObjectURL(pictureFile);
    setPicturePreview(previewUrl);
    setFailedPicture(null);
    return () => URL.revokeObjectURL(previewUrl);
  }, [pictureFile]);

  async function save(event: FormEvent<HTMLFormElement>, section: Section) {
    event.preventDefault();
    if (pending.current || !profile) return;
    if (
      (section === "email" && !emailPassword) ||
      (section === "password" && !currentPassword)
    ) {
      goeyToast.error("Enter your current password to verify your identity.");
      return;
    }
    if (section === "password" && newPassword !== confirmPassword) {
      goeyToast.error("Your new passwords don't match.");
      return;
    }
    pending.current = true;
    setSaving(section);
    try {
      const result =
        section === "username"
          ? await changeUsername(username.trim())
          : section === "email"
            ? await updateEmail(email.trim(), emailPassword)
            : await changePassword({ currentPassword, newPassword });
      if (!result.success)
        throw new Error(result.message || "Your changes could not be saved.");
      if (section === "username") {
        setProfile(
          (previous) => previous && { ...previous, username: username.trim() },
        );
        setUsername(username.trim());
      } else if (section === "email") {
        setProfile(
          (previous) => previous && { ...previous, email: email.trim() },
        );
        setEmail(email.trim());
        setEmailPassword("");
      } else {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
      goeyToast.success(section === "password"
            ? "Your password has been changed."
            : section === "email" ? "Your email has been updated." : "Your username has been updated.");
    } catch (err) {
      goeyToast.error(err instanceof Error
            ? err.message
            : "Unable to save changes. Please try again.");
    } finally {
      pending.current = false;
      setSaving(null);
    }
  }

  async function savePicture(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending.current || !pictureFile || !profile) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(pictureFile.type)) {
      goeyToast.error("Choose a JPG, PNG, or WebP image.");
      return;
    }
    pending.current = true;
    setSaving("picture");
    try {
      const result = await uploadProfilePicture(pictureFile);
      if (!result.success || !result.data?.profilePicture)
        throw new Error(
          result.message || "Unable to update your profile picture.",
        );
      const url = result.data.profilePicture;
      setProfile(
        (previous) => previous && { ...previous, profilePicture: url },
      );
      setFailedPicture(null);
      setPictureFile(null);
      if (pictureInput.current) pictureInput.current.value = "";
      goeyToast.success("Your profile picture has been updated.");
    } catch (err) {
      goeyToast.error(err instanceof Error
            ? err.message
            : "Unable to upload your picture. Please try again.");
    } finally {
      pending.current = false;
      setSaving(null);
    }
  }

  async function removePicture() {
    if (pending.current || !profile?.profilePicture) return;
    pending.current = true;
    setSaving("picture");
    setIsDeletingPicture(true);
    try {
      const result = await deleteProfilePicture();
      if (!result.success) throw new Error(result.message || "Unable to delete your profile picture.");
      setProfile(previous => previous && { ...previous, profilePicture: undefined });
      setFailedPicture(null);
      setPictureFile(null);
      if (pictureInput.current) pictureInput.current.value = "";
      goeyToast.success("Your profile picture has been removed.");
    } catch (err) {
      goeyToast.error(err instanceof Error ? err.message : "Unable to delete your picture. Please try again.");
    } finally {
      pending.current = false;
      setSaving(null);
      setIsDeletingPicture(false);
    }
  }

  async function handleLogout() {
    if (pending.current) return;
    pending.current = true;
    setIsLoggingOut(true);
    await logout();
    window.location.replace("/login");
  }

  function saveButton(section: Section, label: string, unchanged = false) {
    return (
      <button
        type="submit"
        disabled={busy || unchanged}
        className="button-3d button-lime justify-center w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {saving === section ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Saving...
          </>
        ) : (
          label
        )}
      </button>
    );
  }

  return (
    <AccountLayout
      title="Settings"
      description="Manage your profile and keep your account secure."
      profile={profile ?? undefined}
    >
      {loading ? (
        <div className={`${accountCard} flex items-center gap-3`} role="status">
          <Loader2 className="w-5 h-5 animate-spin" />
          Loading your settings...
        </div>
      ) : loadError || !profile ? (
        <section className={accountCard}>
          <p role="alert">{loadError || "Your settings are unavailable."}</p>
          <button
            className="button-3d mt-5"
            onClick={() => setAttempt((value) => value + 1)}
          >
            Try again
          </button>
        </section>
      ) : (
        <div className="space-y-8">
          <details
            id="profile-settings"
            aria-labelledby="profile-settings-heading"
            className="group scroll-mt-28"
          >
            <summary className="bg-lilac/30 border-2 border-ink rounded-2xl p-5 sm:p-6 flex items-center justify-between gap-4 cursor-pointer list-none [&::-webkit-details-marker]:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink focus-visible:ring-offset-4">
              <div>
                <h2
                  id="profile-settings-heading"
                  className="font-extrabold text-2xl flex items-center gap-2"
                >
                  <UserRound className="w-6 h-6" />
                  Profile Settings
                </h2>
              </div>
              <ChevronDown
                aria-hidden="true"
                className="w-5 h-5 shrink-0 transition-transform group-open:rotate-180"
              />
            </summary>
            <div className="grid md:grid-cols-2 gap-5 items-start mt-5">
              <article className={`${accountCard} min-w-0`}>
                <h3 className="font-extrabold text-lg flex items-center gap-2">
                  <Camera className="w-5 h-5 text-pink" />
                  Change Profile Picture
                </h3>
                <p className="text-sm text-muted mt-2 mb-5">
                  Add a familiar face to your quiz adventures.
                </p>
                <form
                  id="picture-form"
                  onSubmit={savePicture}
                  className="space-y-4"
                  aria-busy={saving === "picture"}
                >
                    <div className="relative mx-auto w-32 h-32 mb-8">
                    <div className="w-full h-full rounded-full overflow-hidden border-2 border-ink bg-lilac/30">
{pictureSource &&
                  failedPicture !== pictureSource ? (
                    <img
                      src={pictureSource}
                      alt={`${profile.username} profile picture`}
                      onError={() =>
                        setFailedPicture(pictureSource ?? null)
                      }
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div
                      role="img"
                      aria-label="Profile picture placeholder"
                      className="w-full h-full bg-lime flex items-center justify-center font-extrabold text-3xl"
                    >
                      {Array.from(
                        profile.username || profile.firstName || "Q",
                      )[0].toUpperCase()}
                    </div>
                  )}
                    </div>
{profile.profilePicture && <div className="absolute inset-0 pointer-events-none">
                      <button type="button" aria-label="Edit profile picture" title="Edit profile picture" disabled={busy} onClick={() => pictureInput.current?.click()} className="absolute -bottom-1 -left-1 pointer-events-auto w-11 h-11 flex items-center justify-center rounded-full bg-lilac text-ink ring-[5px] ring-white hover:bg-lime focus-visible:outline focus-visible:outline-2 focus-visible:outline-pink transition-colors disabled:opacity-50 disabled:cursor-not-allowed"><Pencil className="w-4 h-4" aria-hidden="true" /></button>
                      <button type="button" aria-label="Delete profile picture" title="Delete profile picture" disabled={busy} onClick={removePicture} className="absolute -bottom-1 -right-1 pointer-events-auto w-11 h-11 flex items-center justify-center rounded-full bg-paper text-pink ring-[5px] ring-white hover:bg-pink/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-pink transition-colors disabled:opacity-50 disabled:cursor-not-allowed">{isDeletingPicture ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Trash2 className="w-4 h-4" aria-hidden="true" />}</button>
                    </div>}
                    </div>
                  <label
                    htmlFor="profile-picture"
                    className="block text-sm font-bold"
                  >
                    Choose a picture
                    <input
                      ref={pictureInput}
                      id="profile-picture"
                      name="profilePicture"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      required
                      disabled={busy}
                      onChange={(event) => {
                        setPictureFile(event.target.files?.[0] ?? null);
                      }}
                      aria-describedby="picture-help"
                        className="block w-full min-w-0 mt-2 rounded-xl border-2 border-ink bg-paper p-2 text-xs sm:text-sm font-dm-mono text-muted shadow-[3px_3px_0_#16151d] file:mr-3 file:cursor-pointer file:rounded-lg file:border-2 file:border-ink file:bg-lilac file:px-3 file:py-2 file:text-xs file:font-extrabold file:text-ink hover:file:bg-lime focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink focus-visible:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:file:cursor-not-allowed"
                    />
                  </label>
                  <p id="picture-help" className="text-xs text-muted">
                    JPG, PNG, or WebP. Preview your selection here, then upload to save it.
                  </p>
                  {saveButton("picture", "Upload Picture", !pictureFile)}
                </form>
              </article>
              <article className={`${accountCard} min-w-0`}>
                <h3 className="font-extrabold text-lg flex items-center gap-2">
                  <UserRound className="w-5 h-5 text-pink" />
                  Change Username
                </h3>
                <p className="text-sm text-muted mt-2 mb-5">
                  Choose the public name your fellow quizzers see.
                </p>
                <form
                  id="username-form"
                  onSubmit={(event) => save(event, "username")}
                  className="space-y-4"
                  aria-busy={saving === "username"}
                >
                  <label className="block text-sm font-bold" htmlFor="username">
                    Username
                    <input
                      id="username"
                      name="username"
                      autoComplete="username"
                      required
                      value={username}
                      onChange={(event) => setUsername(event.target.value)}
                      disabled={busy}
                      className={`${inputClass} mt-2`}
                    />
                  </label>
                  {saveButton(
                    "username",
                    "Change Username",
                    !username.trim() || username.trim() === profile.username,
                  )}
                </form>
              </article>
            </div>
          </details>
          <details
            id="account-settings"
            aria-labelledby="account-settings-heading"
            className="group scroll-mt-28"
          >
            <summary className="bg-lime/20 border-2 border-ink rounded-2xl p-5 sm:p-6 flex items-center justify-between gap-4 cursor-pointer list-none [&::-webkit-details-marker]:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink focus-visible:ring-offset-4">
              <div>
                <h2
                  id="account-settings-heading"
                  className="font-extrabold text-2xl flex items-center gap-2"
                >
                  <LockKeyhole className="w-6 h-6" />
                  Account Settings
                </h2>
              </div>
              <ChevronDown
                aria-hidden="true"
                className="w-5 h-5 shrink-0 transition-transform group-open:rotate-180"
              />
            </summary>
            <div className="grid lg:grid-cols-2 gap-5 items-start mt-5">
              <article className={`${accountCard} min-w-0`}>
                <h3 className="font-extrabold text-lg flex items-center gap-2">
                  <LockKeyhole className="w-5 h-5 text-pink" />
                  Change Password
                </h3>
                <p className="text-sm text-muted mt-2 mb-5">
                  Verify your current password, then choose a new one with at
                  least 6 characters.
                </p>
                <form
                  id="password-form"
                  onSubmit={(event) => save(event, "password")}
                  className="space-y-4"
                  aria-busy={saving === "password"}
                >
                  <label
                    className="block text-sm font-bold"
                    htmlFor="current-password"
                  >
                    Current password
                    <input
                      id="current-password"
                      name="currentPassword"
                      type="password"
                      autoComplete="current-password"
                      required
                      value={currentPassword}
                      onChange={(event) =>
                        setCurrentPassword(event.target.value)
                      }
                      disabled={busy}
                      className={`${inputClass} mt-2`}
                    />
                  </label>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <label
                      className="block text-sm font-bold"
                      htmlFor="new-password"
                    >
                      New password
                      <input
                        id="new-password"
                        name="newPassword"
                        minLength={6}
                        type="password"
                        autoComplete="new-password"
                        required
                        value={newPassword}
                        onChange={(event) => setNewPassword(event.target.value)}
                        disabled={busy}
                        className={`${inputClass} mt-2`}
                      />
                    </label>
                    <label
                      className="block text-sm font-bold"
                      htmlFor="confirm-password"
                    >
                      Confirm new password
                      <input
                        id="confirm-password"
                        name="confirmPassword"
                        type="password"
                        autoComplete="new-password"
                        required
                        value={confirmPassword}
                        onChange={(event) =>
                          setConfirmPassword(event.target.value)
                        }
                        disabled={busy}
                        className={`${inputClass} mt-2`}
                      />
                    </label>
                  </div>
                  {saveButton("password", "Change Password")}
                </form>
              </article>
              <article className={`${accountCard} min-w-0`}>
                <h3 className="font-extrabold text-lg flex items-center gap-2">
                  <Mail className="w-5 h-5 text-pink" />
                  Change Email
                </h3>
                <p className="text-sm text-muted mt-2 mb-5">
                  Confirm your identity with your current password to update
                  your email.
                </p>
                <form
                  id="email-form"
                  onSubmit={(event) => save(event, "email")}
                  className="space-y-4"
                  aria-busy={saving === "email"}
                >
                  <label
                    className="block text-sm font-bold"
                    htmlFor="email-address"
                  >
                    Email address
                    <input
                      id="email-address"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      disabled={busy}
                      className={`${inputClass} mt-2`}
                    />
                  </label>
                  <label
                    className="block text-sm font-bold"
                    htmlFor="email-password"
                  >
                    Current password
                    <input
                      id="email-password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      required
                      value={emailPassword}
                      onChange={(event) => setEmailPassword(event.target.value)}
                      disabled={busy}
                      className={`${inputClass} mt-2`}
                    />
                  </label>
                  {saveButton(
                    "email",
                    "Change Email",
                    email.trim() === profile.email,
                  )}
                </form>
              </article>
            </div>
          </details>
        </div>
      )}
      <section
        className= "fixed inset-x-0 bottom-0 z-20 bg-paper px-4 sm:px-8 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
        aria-label="Logout"
      >
        
        <button
          type="button"
          onClick={handleLogout}
          disabled={busy}
          className="button-3d justify-center w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoggingOut ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <LogOut className="w-4 h-4" />
          )}
          {isLoggingOut ? "Logging out..." : "Logout"}
        </button>
      </section>
    </AccountLayout>
  );
}
