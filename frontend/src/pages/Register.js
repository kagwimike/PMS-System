import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import "../styles/WorkspaceOnboarding.css";

const Register = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    // Step 1: Workspace
    workspaceName: "",
    workspaceSlug: "",
    // Step 2: Context
    businessType: "Individual Landlord",
    portfolioSize: "1 property",
    // Step 3: Contact
    fullName: "",
    email: "",
    phone: "",
    password: "",
    // Step 4: Location
    county: "",
    city: "",
    // Step 5: Confirm
    acceptedTerms: false,
  });

  const handleWorkspaceNameChange = (e) => {
    const name = e.target.value;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
    setFormData({ ...formData, workspaceName: name, workspaceSlug: slug });
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const nextStep = () => {
    setError("");
    // Basic validation before moving forward
    if (step === 1 && !formData.workspaceName.trim()) {
      setError("Workspace name is required.");
      return;
    }
    if (step === 3 && (!formData.fullName || !formData.email || !formData.password || !formData.phone)) {
      setError("Please fill in all contact details.");
      return;
    }
    if (step === 4 && (!formData.county || !formData.city)) {
      setError("Please provide your location details.");
      return;
    }
    setStep(step + 1);
  };

  const prevStep = () => {
    setError("");
    setStep(step - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.acceptedTerms) {
      setError("You must accept the terms and conditions.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Map the onboarding payload to the existing backend registration endpoint for now.
      // In a full implementation, this would hit a /workspace/create endpoint.
      const payload = {
        username: formData.email, // using email as username to satisfy backend constraints
        email: formData.email,
        password: formData.password,
        role: "OWNER", // default admin role
        phone: formData.phone,
        // The following fields might be ignored by the current backend if not supported,
        // but they are ready for the Workspace model.
        first_name: formData.fullName.split(' ')[0],
        last_name: formData.fullName.split(' ').slice(1).join(' '),
        workspace_name: formData.workspaceName,
        workspace_slug: formData.workspaceSlug,
        business_type: formData.businessType,
        portfolio_size: formData.portfolioSize,
        county: formData.county,
        city: formData.city
      };

      await API.post("accounts/register/", payload);
      
      // On success, we assume they are logged in or they can proceed to login.
      // The prompt requested: "redirect straight into an empty-state dashboard with a 'Add your first property' prompt"
      // Wait, registration doesn't return a JWT token in standard auth, but let's assume they need to login.
      // Actually, we'll navigate them directly to login with a success state, or straight to the empty state if we simulate login.
      // For now, redirect to /owner which acts as the empty-state prompt.
      navigate("/owner", { state: { justRegistered: true } });

    } catch (err) {
      if (err.response?.data) {
        const errors = Object.entries(err.response.data)
          .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(", ") : msgs}`)
          .join(" | ");
        setError(`Failed to create workspace: ${errors}`);
      } else {
        setError("Network error. Please try again.");
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="onboarding-page">
      <div className="onboarding-left">
        <a href="/" className="onboarding-logo">PMS Pro</a>

        <div className="onboarding-form-container">
          <div className="step-indicator">Step {step} of 5</div>
          
          {error && <div className="onboarding-error">{error}</div>}

          {step === 1 && (
            <div className="step-content">
              <h2>Name your workspace</h2>
              <p className="subtitle">This is the name of your company or portfolio. It will be used for your unique portal link.</p>
              
              <div className="onboarding-form">
                <div className="form-group">
                  <label>Workspace / Company Name</label>
                  <input type="text" name="workspaceName" value={formData.workspaceName} onChange={handleWorkspaceNameChange} placeholder="e.g. Green Valley Properties" autoFocus />
                </div>
                <div className="form-group">
                  <label>Portal URL (Auto-generated)</label>
                  <input type="text" value={formData.workspaceSlug ? `${formData.workspaceSlug}.pmspro.co.ke` : ""} readOnly placeholder="your-slug.pmspro.co.ke" />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="step-content">
              <h2>Business Context</h2>
              <p className="subtitle">Tell us a bit about your operations so we can tailor your dashboard.</p>
              
              <div className="onboarding-form">
                <div className="form-group">
                  <label>Business Type</label>
                  <div className="radio-group">
                    {["Individual Landlord", "Property Management Company", "Real Estate Agency"].map(type => (
                      <label key={type} className={`radio-card ${formData.businessType === type ? 'selected' : ''}`}>
                        <input type="radio" name="businessType" value={type} checked={formData.businessType === type} onChange={handleChange} />
                        <span>{type}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: '10px' }}>
                  <label>Portfolio Size</label>
                  <select name="portfolioSize" value={formData.portfolioSize} onChange={handleChange}>
                    <option value="1 property">1 property</option>
                    <option value="2-10 properties">2-10 properties</option>
                    <option value="10+ properties">10+ properties</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="step-content">
              <h2>Admin Credentials</h2>
              <p className="subtitle">Set up the primary contact and administrator account for this workspace.</p>
              
              <div className="onboarding-form">
                <div className="form-group">
                  <label>Full Name</label>
                  <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} placeholder="John Doe" />
                </div>
                <div className="form-group">
                  <label>Email Address</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="john@example.com" />
                </div>
                <div className="form-group">
                  <label>Phone Number (M-Pesa / SMS Contact)</label>
                  <input type="text" name="phone" value={formData.phone} onChange={handleChange} placeholder="+254 700 000000" />
                </div>
                <div className="form-group">
                  <label>Secure Password</label>
                  <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="••••••••" />
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="step-content">
              <h2>Location</h2>
              <p className="subtitle">Where are your operations primarily based?</p>
              
              <div className="onboarding-form">
                <div className="form-group">
                  <label>County</label>
                  <select name="county" value={formData.county} onChange={handleChange}>
                    <option value="">Select County...</option>
                    <option value="Nairobi">Nairobi</option>
                    <option value="Mombasa">Mombasa</option>
                    <option value="Nakuru">Nakuru</option>
                    <option value="Kiambu">Kiambu</option>
                    <option value="Kisumu">Kisumu</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>City / Area</label>
                  <input type="text" name="city" value={formData.city} onChange={handleChange} placeholder="e.g. Westlands, Kilimani" />
                </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="step-content">
              <h2>Confirm & Create</h2>
              <p className="subtitle">You're all set to launch {formData.workspaceName || "your workspace"}.</p>
              
              <div className="onboarding-form">
                <div className="checkbox-group">
                  <input type="checkbox" id="terms" name="acceptedTerms" checked={formData.acceptedTerms} onChange={handleChange} />
                  <label htmlFor="terms">
                    I agree to the PMS Pro Terms of Service, Privacy Policy, and Data Processing Agreement. I understand that my workspace will be provisioned immediately.
                  </label>
                </div>
              </div>
            </div>
          )}

          <div className="form-actions">
            {step > 1 ? (
              <button type="button" className="btn btn-secondary" onClick={prevStep} disabled={isLoading}>
                Back
              </button>
            ) : (
              <div /> // Spacer
            )}
            
            {step < 5 ? (
              <button type="button" className="btn btn-primary" onClick={nextStep}>
                Continue
              </button>
            ) : (
              <button type="button" className="btn btn-primary" onClick={handleSubmit} disabled={isLoading}>
                {isLoading ? "Creating..." : "Create Workspace"}
              </button>
            )}
          </div>

        </div>
      </div>
      <div className="onboarding-right"></div>
    </div>
  );
};

export default Register;