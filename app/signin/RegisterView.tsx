"use client";

import { useState, FormEvent } from "react";
import { StepInputConfig } from "../types/form";
import InputField from "@/app/components/form/InputField";
import SubmitButton from "@/app/components/form/SubmitButton";
import styles from "@/app/signin/SignInPage.module.css";
import { registerWithEmailPassword, validateClientPassword } from "@/app/lib/auth/authActions";
import { useRouter } from 'next/navigation';
import { isPasswordCommon } from "@/app/signin/actions";

interface RegisterViewProps {
    onToggleRegister: () => void;
    onError: (error: React.ReactNode | null) => void;
}

const registrationInputs: StepInputConfig[] = [
    {
      type: 'text',
      name: 'name',
      label: 'Name',
      placeholder: 'Enter your name',
    },
    {
      type: 'text',
      name: 'phone',
      label: 'Phone Number',
      placeholder: 'Enter your phone number',
    },
    {
      type: 'email',
      name: 'email',
      label: 'Email Address',
      placeholder: 'Enter your email',
      required: true,
    },
    {
      type: 'password',
      name: 'password',
      label: 'Password',
      placeholder: 'Make it secure...',
      required: true,
    },
];

const RegisterView: React.FC<RegisterViewProps> = ({ onToggleRegister, onError }) => {
    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        email: "",
        password: "",
    });
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        onError(null); // Clear previous errors
        setLoading(true);

        const { name, phone, email, password } = formData;

        // Validate email with RFC 5322 standard complaint regex
        const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailPattern.test(email.trim())) {
            onError("Invalid email address");
            setLoading(false);
            return;
        }
        const validationResult = await validateClientPassword(password.trim());
        if (!validationResult.success) {
            onError(validationResult.error);
            setLoading(false);
            return;
        }
        if (await isPasswordCommon(password.trim())) { // server side validation
            onError("Password is too common based on NIST 800-63 requirements. Please choose a stronger one.");
            setLoading(false);
            return;
        }
        const result = await registerWithEmailPassword(email.trim(), password.trim(), name.trim(), phone.trim());
        setLoading(false);

        if (!result.success) {
            onError(result.error);
            setLoading(false);
            return;
        } else {
            // Assuming successful registration/sign-in should redirect
            router.push("/select-role"); // Or your desired post-registration page
        }
    };

    return (
        <form className={styles.form} onSubmit={handleSubmit}>
            {registrationInputs.map(input => (
                <div className={styles.inputGroup} key={input.name}>
                    <label htmlFor={`${input.name}-register`} className={styles.label}>
                        {input.label}
                    </label>
                    <InputField
                        type={input.type as string}
                        id={`${input.name}-register`}
                        name={input.name}
                        placeholder={input.placeholder}
                        value={formData[input.name as keyof typeof formData]}
                        onChange={handleInputChange}
                        required={input.required}
                    />
                </div>
            ))}

            <div className={styles.submitWrapper}>
                <SubmitButton loading={loading} disabled={loading}>
                    Register
                </SubmitButton>
            </div>

            <button
                type="button"
                className={styles.toggleButton}
                onClick={onToggleRegister}
            >
                Already have an account? <span className={styles.linkText}>Sign In</span>
            </button>
        </form>
    );
};

export default RegisterView; 