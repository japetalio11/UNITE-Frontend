"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Link } from "@heroui/link";
import { Select, SelectItem } from "@heroui/select";
import { Check } from "@gravity-ui/icons";

export default function SignUp() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "";
  const [showModal, setShowModal] = useState(false);
  const [recaptchaChecked, setRecaptchaChecked] = useState(false);

  const [provinces, setProvinces] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [municipalities, setMunicipalities] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    First_Name: "",
    Middle_Name: "",
    Last_Name: "",
    Phone_Number: "",
    Province: "",
    District: "",
    Municipality: "",
    Organization_Institution: "",
    Email: "",
    roleId: "",
    organizationId: "",
  });

  const update = (patch: Partial<typeof formData>) =>
    setFormData((p) => ({ ...p, ...patch }));

  const prioritize = (items: any[], priorities: string[] = []) => {
    if (!Array.isArray(items) || items.length === 0) return items;
    const set = new Set(priorities);
    const first = items.filter((i) => set.has(i?.name));
    const rest = items.filter((i) => !set.has(i?.name));
    return [...first, ...rest];
  };

  // Fetch provinces, roles, and organizations on mount
  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        const res = await fetch(`${API_URL}/api/locations/provinces`);
        const data = await res.json();
        if (data.success) setProvinces(data.data);
      } catch (err) {
        console.error("Failed to fetch provinces", err);
      }
    };

    const fetchRoles = async () => {
      try {
        const res = await fetch(`${API_URL}/api/public/roles/stakeholder`);
        const data = await res.json();
        if (data.success) setRoles(data.data);
      } catch (err) {
        console.error("Failed to fetch roles", err);
      }
    };

    const fetchOrganizations = async () => {
      try {
        const res = await fetch(`${API_URL}/api/public/organizations`);
        const data = await res.json();
        if (data.success) setOrganizations(data.data);
      } catch (err) {
        console.error("Failed to fetch organizations", err);
      }
    };

    fetchProvinces();
    fetchRoles();
    fetchOrganizations();
  }, [API_URL]);

  // Fetch districts when province changes
  useEffect(() => {
    if (formData.Province) {
      const fetchDistricts = async () => {
        try {
          const res = await fetch(
            `${API_URL}/api/locations/provinces/${formData.Province}/districts`
          );
          const data = await res.json();
          if (data.success) setDistricts(data.data);
        } catch (err) {
          console.error("Failed to fetch districts", err);
        }
      };
      fetchDistricts();
      update({ District: "", Municipality: "" });
      setMunicipalities([]);
    } else {
      setDistricts([]);
      setMunicipalities([]);
      update({ District: "", Municipality: "" });
    }
  }, [formData.Province, API_URL]);

  // Fetch municipalities when district changes
  useEffect(() => {
    if (formData.District) {
      const fetchMunicipalities = async () => {
        try {
          const res = await fetch(
            `${API_URL}/api/locations/districts/${formData.District}/municipalities`
          );
          const data = await res.json();
          if (data.success) setMunicipalities(data.data);
        } catch (err) {
          console.error("Failed to fetch municipalities", err);
        }
      };
      fetchMunicipalities();
      update({ Municipality: "" });
    } else {
      setMunicipalities([]);
      update({ Municipality: "" });
    }
  }, [formData.District, API_URL]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate required fields
    if (!formData.First_Name.trim() || !formData.Last_Name.trim() || 
        !formData.Email.trim() || !formData.Phone_Number.trim() ||
        !formData.roleId || !formData.organizationId) {
      setError("Please fill in all required fields");
      return;
    }

    if (!recaptchaChecked) {
      setError("Please verify that you are not a robot");
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        firstName: formData.First_Name,
        middleName: formData.Middle_Name || null,
        lastName: formData.Last_Name,
        email: formData.Email,
        phoneNumber: formData.Phone_Number,
        roleId: formData.roleId,
        organizationId: formData.organizationId,
        organization: formData.Organization_Institution || null,
        province: formData.Province,
        district: formData.District,
        municipality: formData.Municipality,
      };

      const res = await fetch(`${API_URL}/api/signup-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const body = await res.json().catch(() => ({}));

      if (!res.ok) throw new Error(body.message || "Registration failed");

      setShowModal(true);
    } catch (err: any) {
      setError(err?.message || "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = () => {
    // Add your Google OAuth logic here
    console.log("Google signup clicked");
  };

  return (
    <div className="w-full max-w-[600px] mx-auto px-4 py-4 sm:py-6">
      {/* Title */}
      <h1 className="text-3xl sm:text-4xl font-semibold text-danger mb-4 sm:mb-6">Sign up</h1>

      {/* Form */}
      <form className="space-y-3 sm:space-y-4" onSubmit={handleFormSubmit}>
        {/* Name Fields - Side by Side */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label
              className="text-sm font-medium mb-1.5 block text-default-900"
              htmlFor="first-name"
            >
              First name <span className="text-danger">*</span>
            </label>
            <Input
              id="first-name"
              placeholder="First name"
              value={formData.First_Name}
              variant="bordered"
              classNames={{
                input: "text-sm placeholder:text-default-400",
                inputWrapper:
                  "border-default-300 hover:border-default-400 bg-default-50",
              }}
              size="md"
              onChange={(e) => update({ First_Name: e.target.value })}
              isDisabled={isLoading}
              required
            />
          </div>
          <div>
            <label
              className="text-sm font-medium mb-1.5 block text-default-900"
              htmlFor="last-name"
            >
              Last name <span className="text-danger">*</span>
            </label>
            <Input
              id="last-name"
              placeholder="Last name"
              value={formData.Last_Name}
              variant="bordered"
              classNames={{
                input: "text-sm placeholder:text-default-400",
                inputWrapper:
                  "border-default-300 hover:border-default-400 bg-default-50",
              }}
              size="md"
              onChange={(e) => update({ Last_Name: e.target.value })}
              isDisabled={isLoading}
              required
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label
            className="text-sm font-medium mb-1.5 block text-default-900"
            htmlFor="email"
          >
            Email address <span className="text-danger">*</span>
          </label>
          <Input
            id="email"
            type="email"
            placeholder="Enter your email address"
            value={formData.Email}
            variant="bordered"
            classNames={{
              input: "text-sm placeholder:text-default-400",
              inputWrapper:
                "border-default-300 hover:border-default-400 bg-default-50",
            }}
            size="md"
            onChange={(e) => update({ Email: e.target.value })}
            isDisabled={isLoading}
            required
          />
        </div>

        {/* Mobile Number */}
        <div>
          <label
            className="text-sm font-medium mb-1.5 block text-default-900"
            htmlFor="phone-number"
          >
            Mobile number <span className="text-danger">*</span>
          </label>
          <Input
            id="phone-number"
            placeholder="Enter your mobile number"
            value={formData.Phone_Number}
            variant="bordered"
            classNames={{
              input: "text-sm placeholder:text-default-400",
              inputWrapper:
                "border-default-300 hover:border-default-400 bg-default-50",
            }}
            size="md"
            onChange={(e) => update({ Phone_Number: e.target.value })}
            isDisabled={isLoading}
            required
          />
        </div>

        {/* Account Type (Role) */}
        <div>
          <label
            className="text-sm font-medium mb-1.5 block text-default-900"
            htmlFor="role"
          >
            Account type <span className="text-danger">*</span>
          </label>
          <Select
            id="role"
            placeholder="Select your account type"
            selectedKeys={formData.roleId ? [formData.roleId] : []}
            radius="md"
            size="md"
            variant="bordered"
            classNames={{
              trigger:
                "border-default-300 hover:border-default-400 data-[hover=true]:border-default-400 bg-default-50",
              value: "text-sm",
            }}
            onChange={(e) => {
              const val = e.target.value;
              update({ roleId: val });
            }}
            isDisabled={isLoading}
            required
          >
            {roles.map((role) => (
              <SelectItem key={role._id}>{role.name}</SelectItem>
            ))}
          </Select>
        </div>

        {/* Organization Type */}
        <div>
          <label
            className="text-sm font-medium mb-1.5 block text-default-900"
            htmlFor="organization"
          >
            Organization type <span className="text-danger">*</span>
          </label>
          <Select
            id="organization"
            placeholder="Select your organization type"
            selectedKeys={
              formData.organizationId ? [formData.organizationId] : []
            }
            radius="md"
            size="md"
            variant="bordered"
            classNames={{
              trigger:
                "border-default-300 hover:border-default-400 data-[hover=true]:border-default-400 bg-default-50",
              value: "text-sm",
            }}
            onChange={(e) => {
              const val = e.target.value;
              update({ organizationId: val });
            }}
            isDisabled={isLoading}
            required
          >
            {organizations.map((org) => (
              <SelectItem key={org._id}>{org.name}</SelectItem>
            ))}
          </Select>
        </div>

        {/* reCAPTCHA */}
        <div className="bg-default-100 border border-default-300 rounded-lg p-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <input
              type="checkbox"
              className="w-5 h-5 border-2 border-default-400 rounded cursor-pointer"
              checked={recaptchaChecked}
              onChange={(e) => setRecaptchaChecked(e.target.checked)}
            />
            <span className="text-sm text-default-700">I'm not a robot</span>
          </div>
          <div className="flex flex-col items-end">
            <div className="w-7 h-7 bg-blue-500 rounded flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                <path
                  d="M10 2L3 5.5V9C3 13.142 6.134 17.186 10 18.5C13.866 17.186 17 13.142 17 9V5.5L10 2Z"
                  fill="white"
                />
                <path
                  d="M10 2L3 5.5V9C3 13.142 6.134 17.186 10 18.5C13.866 17.186 17 13.142 17 9V5.5L10 2Z"
                  stroke="white"
                  strokeWidth="1"
                />
              </svg>
            </div>
            <div className="flex gap-1 mt-0.5">
              <a
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline"
              >
                Privacy
              </a>
              <span className="text-xs text-default-400">·</span>
              <a
                href="https://policies.google.com/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline"
              >
                Terms
              </a>
            </div>
            <span className="text-[10px] text-default-400">
              reCAPTCHA
            </span>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Submit Button */}
        <Button
          className="w-full text-white font-semibold"
          color="danger"
          size="md"
          type="submit"
          isLoading={isLoading}
        >
          Let's get you started
        </Button>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-default-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-default-500">or</span>
          </div>
        </div>

        {/* Google Sign Up */}
        <Button
          className="w-full font-medium border-default-300"
          variant="bordered"
          size="md"
          type="button"
          onClick={handleGoogleSignup}
          startContent={
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M19.6 10.23c0-.82-.1-1.42-.25-2.05H10v3.72h5.5c-.15.96-.74 2.31-2.04 3.22v2.45h3.16c1.89-1.73 2.98-4.3 2.98-7.34z"
                fill="#4285F4"
              />
              <path
                d="M13.46 15.13c-.83.59-1.96 1-3.46 1-2.64 0-4.88-1.74-5.68-4.15H1.07v2.52C2.72 17.75 6.09 20 10 20c2.7 0 4.96-.89 6.62-2.42l-3.16-2.45z"
                fill="#34A853"
              />
              <path
                d="M3.99 10c0-.69.12-1.35.32-1.97V5.51H1.07A9.973 9.973 0 000 10c0 1.61.39 3.14 1.07 4.49l3.24-2.52c-.2-.62-.32-1.28-.32-1.97z"
                fill="#FBBC05"
              />
              <path
                d="M10 3.88c1.88 0 3.13.81 3.85 1.48l2.84-2.76C14.96.99 12.7 0 10 0 6.09 0 2.72 2.25 1.07 5.51l3.24 2.52C5.12 5.62 7.36 3.88 10 3.88z"
                fill="#EA4335"
              />
            </svg>
          }
        >
          Sign up with Google
        </Button>
      </form>

      {/* Sign In Link */}
      <div className="mt-4 text-center text-sm text-default-600">
        Already have an account?{" "}
        <Link
          className="text-danger font-medium hover:opacity-80 transition-opacity"
          href="/auth/signin"
        >
          Sign in
        </Link>
      </div>

      {/* Success Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-8 max-w-md w-full shadow-xl">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-default-900 mb-3">
                Registration Successful!
              </h3>
              <p className="text-sm text-default-600 mb-6 leading-relaxed">
                Your sign-up request has been submitted successfully. It is now
                pending coordinator approval. You will be notified via email
                once it's approved, and you'll receive a link to activate your
                account and set your password.
              </p>
              <Button
                className="w-full text-white font-semibold"
                color="danger"
                size="md"
                onClick={() => {
                  setShowModal(false);
                  router.push("/");
                }}
              >
                Go to Home
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}