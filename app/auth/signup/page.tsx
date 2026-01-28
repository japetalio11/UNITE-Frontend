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
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<"next" | "prev">("next");
  const [isLoading, setIsLoading] = useState(false);
  const [validatingCode, setValidatingCode] = useState(false);
  const [showSuccessAnim, setShowSuccessAnim] = useState(false);
  const [registrationError, setRegistrationError] = useState<string | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [codeValidated, setCodeValidated] = useState(false);
  const [validatedData, setValidatedData] = useState<any>(null);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "";
  const [showModal, setShowModal] = useState(false);

  const [provinces, setProvinces] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [municipalities, setMunicipalities] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [emailSent, setEmailSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);

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
    Verification_Code: "",
    roleId: "",
    organizationId: "",
  });

  const update = (patch: Partial<typeof formData>) =>
    setFormData((p) => ({ ...p, ...patch }));

  // Helper to move priority-named items to the top of a list while preserving
  // the relative order of the remaining items.
  const prioritize = (items: any[], priorities: string[] = []) => {
    if (!Array.isArray(items) || items.length === 0) return items;
    const set = new Set(priorities);
    const first = items.filter((i) => set.has(i?.name));
    const rest = items.filter((i) => !set.has(i?.name));
    return [...first, ...rest];
  };

  const validateStep = () => {
    if (step === 0) {
      return !!(
        formData.First_Name.trim() &&
        formData.Last_Name.trim() &&
        formData.Phone_Number.trim() &&
        formData.Email.trim()
      );
    }
    if (step === 1) {
      return !!(formData.roleId && formData.organizationId);
    }
    if (step === 2) {
      return !!(formData.Province && formData.District && formData.Municipality);
    }
    if (step === 3) {
      return !!formData.Email.trim() && emailVerified;
    }
    return true;
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
          const res = await fetch(`${API_URL}/api/locations/provinces/${formData.Province}/districts`);
          const data = await res.json();
          if (data.success) setDistricts(data.data);
        } catch (err) {
          console.error("Failed to fetch districts", err);
        }
      };
      fetchDistricts();
      // Clear district and municipality
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
          const res = await fetch(`${API_URL}/api/locations/districts/${formData.District}/municipalities`);
          const data = await res.json();
          if (data.success) setMunicipalities(data.data);
        } catch (err) {
          console.error("Failed to fetch municipalities", err);
        }
      };
      fetchMunicipalities();
      // Clear municipality
      update({ Municipality: "" });
    } else {
      setMunicipalities([]);
      update({ Municipality: "" });
    }
  }, [formData.District, API_URL]);

  const sendVerificationCode = async () => {
    if (!formData.Email.trim()) return;
    setValidatingCode(true);
    setError(null);
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

      if (!res.ok) throw new Error(body.message || "Failed to send code");
      setEmailSent(true);
      setShowSuccessAnim(true);
      setTimeout(() => setShowSuccessAnim(false), 1400);
    } catch (err: any) {
      setError(err?.message || "Failed to send code");
    } finally {
      setValidatingCode(false);
    }
  };

  const verifyCode = async () => {
    if (!formData.Verification_Code.trim()) return;
    setValidatingCode(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/signup-requests/verify-email?token=${encodeURIComponent(formData.Verification_Code)}`);
      const body = await res.json().catch(() => ({}));

      if (!res.ok) throw new Error(body.message || "Invalid code");
      setEmailVerified(true);
      setCodeValidated(true);
      setShowSuccessAnim(true);
      setTimeout(() => setShowSuccessAnim(false), 1400);
      // advance to final step (thank you) after successful verification
      setTimeout(() => setStep(4), 600);
    } catch (err: any) {
      setError(err?.message || "Invalid code");
      setCodeValidated(false);
    } finally {
      setValidatingCode(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!validateStep()) {
      setError("Please complete required fields for this step.");
      return;
    }
    // advance through steps; final step index is 4 (thank you)
    if (step < 4) {
      setDirection("next");
      setStep((s) => s + 1);
      return;
    }
    // final action on step 4: show success modal
    setRegistrationSuccess(true);
    setShowModal(true);
  };

  return (
    <div className="w-full max-w-[400px] mx-auto">
      {step < 4 && (
        <div className="space-y-1 mb-8">
          <h1 className="text-2xl font-semibold text-danger">Sign Up</h1>
          <p className="text-sm text-default-800">
            Enter your details to get started
          </p>
        </div>
      )}
      <form className="space-y-6" onSubmit={handleFormSubmit}>
        <div className="relative min-h-[380px] pb-40">
          {/* Step 1 - Identity */}
          <div
            className={`absolute inset-0 ${step === 0 ? "block" : "hidden"}`}
          >
            <div className="space-y-6 pb-20">
              <div>
                <label
                  className="text-sm font-medium mb-1.5 block"
                  htmlFor="first-name"
                >
                  First name <span className="text-danger ml-1">*</span>
                </label>
                <Input
                  id="first-name"
                  value={formData.First_Name}
                  variant="bordered"
                  classNames={{
                    input: "text-sm",
                    inputWrapper: "border-default-200 hover:border-default-400",
                  }}
                  size="md"
                  onChange={(e) => update({ First_Name: e.target.value })}
                  isDisabled={isLoading}
                />
              </div>
              <div>
                <label
                  className="text-sm font-medium mb-1.5 block"
                  htmlFor="middle-name"
                >
                  Middle name
                </label>
                <Input
                  id="middle-name"
                  value={formData.Middle_Name}
                  variant="bordered"
                  classNames={{
                    input: "text-sm",
                    inputWrapper: "border-default-200 hover:border-default-400",
                  }}
                  size="md"
                  onChange={(e) => update({ Middle_Name: e.target.value })}
                  isDisabled={isLoading}
                />
              </div>
              <div>
                <label
                  className="text-sm font-medium mb-1.5 block"
                  htmlFor="last-name"
                >
                  Last name <span className="text-danger ml-1">*</span>
                </label>
                <Input
                  id="last-name"
                  value={formData.Last_Name}
                  variant="bordered"
                  classNames={{
                    input: "text-sm",
                    inputWrapper: "border-default-200 hover:border-default-400",
                  }}
                  size="md"
                  onChange={(e) => update({ Last_Name: e.target.value })}
                  isDisabled={isLoading}
                />
              </div>
              <div>
                <label
                  className="text-sm font-medium mb-1.5 block"
                  htmlFor="phone-number"
                >
                  Phone number <span className="text-danger ml-1">*</span>
                </label>
                <Input
                  id="phone-number"
                  value={formData.Phone_Number}
                  variant="bordered"
                  classNames={{
                    input: "text-sm",
                    inputWrapper: "border-default-200 hover:border-default-400",
                  }}
                  size="md"
                  onChange={(e) => update({ Phone_Number: e.target.value })}
                  isDisabled={isLoading}
                />
              </div>
              <div>
                <label
                  className="text-sm font-medium mb-1.5 block"
                  htmlFor="email"
                >
                  Email <span className="text-danger ml-1">*</span>
                </label>
                <Input
                  id="email"
                  type="email"
                  value={formData.Email}
                  variant="bordered"
                  classNames={{
                    input: "text-sm",
                    inputWrapper: "border-default-200 hover:border-default-400",
                  }}
                  size="md"
                  onChange={(e) => update({ Email: e.target.value })}
                  isDisabled={isLoading}
                />
              </div>
            </div>
          </div>

          {/* Step 2 - Role & Organization */}
          <div
            className={`absolute inset-0 ${step === 1 ? "block" : "hidden"}`}
          >
            <div className="space-y-6 pb-20">
              <div>
                <label className="text-sm font-medium mb-1.5 block" htmlFor="role">Role <span className="text-danger ml-1">*</span></label>
                <Select
                  id="role"
                  placeholder="Select Role"
                  selectedKeys={formData.roleId ? [formData.roleId] : []}
                  radius="md"
                  size="md"
                  variant="bordered"
                  classNames={{
                    trigger: "border-default-200 hover:border-default-400 data-[hover=true]:border-default-400",
                  }}
                  onChange={(e) => {
                    const val = e.target.value;
                    update({ roleId: val });
                  }}
                  isDisabled={isLoading}
                >
                  {roles.map((role) => (
                    <SelectItem key={role._id}>{role.name}</SelectItem>
                  ))}
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block" htmlFor="organization">Organization <span className="text-danger ml-1">*</span></label>
                <Select
                  id="organization"
                  placeholder="Select Organization"
                  selectedKeys={formData.organizationId ? [formData.organizationId] : []}
                  radius="md"
                  size="md"
                  variant="bordered"
                  classNames={{
                    trigger: "border-default-200 hover:border-default-400 data-[hover=true]:border-default-400",
                  }}
                  onChange={(e) => {
                    const val = e.target.value;
                    update({ organizationId: val });
                  }}
                  isDisabled={isLoading}
                >
                  {organizations.map((org) => (
                    <SelectItem key={org._id}>{org.name}</SelectItem>
                  ))}
                </Select>
              </div>
            </div>
          </div>

          {/* Step 3 - Location */}
          <div
            className={`absolute inset-0 ${step === 2 ? "block" : "hidden"}`}
          >
            <div className="space-y-6 pb-20">
              <div>
                <label className="text-sm font-medium mb-1.5 block" htmlFor="province">Province <span className="text-danger ml-1">*</span></label>
                <Select
                  id="province"
                  placeholder="Select Province"
                  selectedKeys={formData.Province ? [formData.Province] : []}
                  radius="md"
                  size="md"
                  variant="bordered"
                  classNames={{
                    trigger: "border-default-200 hover:border-default-400 data-[hover=true]:border-default-400",
                  }}
                  onChange={(e) => {
                    const val = e.target.value;
                    update({ Province: val, District: "", Municipality: "" });
                  }}
                  isDisabled={isLoading}
                >
                  {provinces.map((prov) => (
                    <SelectItem key={prov._id}>{prov.name}</SelectItem>
                  ))}
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block" htmlFor="district">District / City <span className="text-danger ml-1">*</span></label>
                <Select
                  id="district"
                  placeholder="Select District / Category"
                  selectedKeys={formData.District ? [formData.District] : []}
                  radius="md"
                  size="md"
                  variant="bordered"
                  classNames={{
                    trigger: "border-default-200 hover:border-default-400 data-[hover=true]:border-default-400",
                  }}
                  isDisabled={!formData.Province || isLoading}
                  onChange={(e) => {
                    const val = e.target.value;
                    update({ District: val, Municipality: "" });
                  }}
                >
                  {prioritize(districts, ["Blood Service Facilities", "NGO's & Gov't Agencies"]).map((dist) => (
                    <SelectItem key={dist._id}>{dist.name}</SelectItem>
                  ))}
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block" htmlFor="municipality">Municipality / City <span className="text-danger ml-1">*</span></label>
                <Select
                  id="municipality"
                  placeholder="Select City / Municipality / Type"
                  selectedKeys={formData.Municipality ? [formData.Municipality] : []}
                  radius="md"
                  size="md"
                  variant="bordered"
                  classNames={{
                    trigger: "border-default-200 hover:border-default-400 data-[hover=true]:border-default-400",
                  }}
                  isDisabled={!formData.District || isLoading}
                  onChange={(e) => update({ Municipality: e.target.value })}
                >
                  {municipalities.map((mun) => (
                    <SelectItem key={mun._id}>{mun.name}</SelectItem>
                  ))}
                </Select>
              </div>
              <div>
                <label
                  className="text-sm font-medium mb-1.5 block"
                  htmlFor="organization-institution"
                >
                  Organization / Institution
                </label>
                <Input
                  id="organization-institution"
                  value={formData.Organization_Institution}
                  variant="bordered"
                  classNames={{
                    input: "text-sm",
                    inputWrapper: "border-default-200 hover:border-default-400",
                  }}
                  size="md"
                  onChange={(e) =>
                    update({ Organization_Institution: e.target.value })
                  }
                  isDisabled={isLoading}
                />
              </div>
            </div>
          </div>

          {/* Step 4 - Email Verification */}
          <div className={`absolute inset-0 ${step === 3 ? "block" : "hidden"}`}>
            <div className="pb-20">
              <div className="space-y-4">
                <h2 className="text-3xl font-semibold text-danger">Enter your code</h2>
                <p className="text-sm text-default-800">Enter the code sent to your email {formData.Email ? formData.Email.replace(/(.{1})(.*)(@.*)/, (m,p1,p2,p3)=> p1 + '*'.repeat(Math.max(0,p2.length)) + p3) : ''}</p>

                <div className="mt-4 p-4 bg-white rounded-md">
                  <div className="mt-4 flex items-center justify-center gap-3">
                    {Array.from({ length: 6 }).map((_, i) => {
                      const digit = formData.Verification_Code?.[i] || "";
                      return (
                        <div key={i} className="flex items-center">
                          <input
                            className="w-12 h-12 text-center border border-default-200 rounded-md text-lg bg-white hover:border-default-400 focus:border-danger focus:outline-none focus:ring-1 focus:ring-danger"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => {
                              const v = e.target.value.replace(/[^0-9]/g, "");
                              const arr = (formData.Verification_Code || "").padEnd(6, "").split("").slice(0,6);
                              arr[i] = v ? v[0] : "";
                              update({ Verification_Code: arr.join("").trim() });
                              if (v && i < 5) {
                                const next = document.getElementById(`code-${i+1}`) as HTMLInputElement | null;
                                next?.focus();
                              }
                            }}
                            onPaste={(e: React.ClipboardEvent<HTMLInputElement>) => {
                              e.preventDefault();
                              const paste = e.clipboardData?.getData("text") || "";
                              const digits = paste.replace(/\D/g, "");
                              if (!digits) return;
                              // populate starting at current index
                              const arr = (formData.Verification_Code || "").padEnd(6, "").split("").slice(0,6);
                              for (let j = 0; j < digits.length && i + j < 6; j++) {
                                arr[i + j] = digits[j];
                              }
                              const newCode = arr.join("").trim();
                              update({ Verification_Code: newCode });
                              const lastFilled = Math.min(5, i + digits.length - 1);
                              setTimeout(() => {
                                const el = document.getElementById(`code-${lastFilled}`) as HTMLInputElement | null;
                                el?.focus();
                              }, 0);
                            }}
                            id={`code-${i}`}
                            onKeyDown={(e) => {
                              if (e.key === "Backspace") {
                                const arr = (formData.Verification_Code || "").padEnd(6, "").split("").slice(0,6);
                                arr[i] = "";
                                update({ Verification_Code: arr.join("").trim() });
                                if (i > 0) {
                                  const prev = document.getElementById(`code-${i-1}`) as HTMLInputElement | null;
                                  prev?.focus();
                                }
                              }
                            }}
                          />
                          {i === 2 && <div className="mx-2 text-xl text-default-400">-</div>}
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-4 text-sm text-default-800 text-center">
                    <span>Didn't receive a code? </span>
                    <button
                      className="text-sm font-medium text-danger underline"
                      type="button"
                      onClick={() => {
                        setError(null);
                        sendVerificationCode();
                      }}
                      disabled={validatingCode}
                    >
                      Resend
                    </button>
                  </div>

                  <div className="mt-6 space-y-3">
                    <Button
                      className="w-full text-white"
                      color="danger"
                      type="button"
                      onClick={() => {
                        if (!emailSent) sendVerificationCode();
                        else verifyCode();
                      }}
                      isDisabled={!formData.Email.trim() || validatingCode || (emailSent && emailVerified)}
                      isLoading={validatingCode}
                    >
                      {!emailSent ? "Send Verification Code" : emailVerified ? "Code Verified" : "Verify"}
                    </Button>
                    <Button
                      className="w-full border border-default-200 bg-transparent text-default-800 hover:bg-default-100"
                      variant="bordered"
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setDirection("prev");
                        setStep((s) => Math.max(0, s - 1));
                      }}
                    >
                      Back
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 5 (index 4) - Thank you / final step shown after verification */}
          <div className={`absolute inset-0 ${step === 4 ? "block" : "hidden"}`}>
            <div className="flex items-center justify-center min-h-[380px]">
              <div className="max-w-md w-full text-center px-4">
                <h2 className="text-3xl font-semibold text-danger mb-4">Thank you</h2>
                <p className="text-sm text-default-800 mb-4">Your signup request has been submitted and is pending approval.</p>
                <p className="text-sm text-default-600 mb-6">We are currently reviewing your request and will notify you via email once your account has been confirmed and approved.</p>
                <p className="text-sm text-default-600 mb-6">After approval, you will receive an email with a link to activate your account and set your password.</p>
                <p className="text-sm text-default-600 mb-6">We appreciate your interest in UNITE and look forward to working with you as part of our ecosystem.</p>
                <div className="mb-6">
                  <Button
                    className="w-full text-white"
                    color="danger"
                    onClick={() => {
                      // final complete registration action: show success modal
                      setShowModal(true);
                    }}
                  >
                    Complete Registration
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {error && <div className="text-sm text-red-600">{error}</div>}

        {/* Hide bottom navigation when on verification step (step 3) or final step (step 4) */}
        {step !== 3 && step !== 4 && (
          <div className="flex items-center gap-3">
            {step > 0 ? (
              <Button
                className="border border-default-200 bg-transparent text-default-800 hover:bg-default-100"
                variant="bordered"
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDirection("prev");
                  setStep((s) => Math.max(0, s - 1));
                }}
              >
                Back
              </Button>
            ) : (
              <div />
            )}
            <div className="flex-1">
              <Button
                className="w-full text-white"
                color="danger"
                isLoading={isLoading}
                size="md"
                type="submit"
              >
                {step < 4 ? "Next" : "Complete Registration"}
              </Button>
            </div>
          </div>
        )}
      </form>

      <div className="mt-6 text-center text-sm text-default-800">
        Already have an account?{" "}
        <Link
          className="text-danger font-medium hover:opacity-80 transition-opacity"
          href="/auth/signin"
        >
          Sign in
        </Link>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-transparent flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <Check className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-default-900 mb-2">
                Registration Successful!
              </h3>
              <p className="text-sm text-default-800 mb-6">
                Your sign-up request has been submitted successfully. It is now pending coordinator approval. You will be notified via email once it's approved, and you'll receive a link to activate your account and set your password.
              </p>
              <Button
                className="w-full text-white"
                color="danger"
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