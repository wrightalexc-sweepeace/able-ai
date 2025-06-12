"use client";

import { useState, FormEvent } from "react";
import InputField from "@/app/components/form/InputField";
import SubmitButton from "@/app/components/form/SubmitButton";
import styles from "@/app/signin/SignInPage.module.css";
import { useRouter } from 'next/navigation';
import { registerUserAction } from "@/actions/auth/signup";

interface RegisterViewProps {
    onToggleRegister: () => void;
    onError: (error: React.ReactNode | null) => void;
}

const RegisterView: React.FC<RegisterViewProps> = ({ onToggleRegister, onError }) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        onError(null); // Clear previous errors
        setLoading(true);

        // Validate email with RFC 5322 standard complaint regex
        const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailPattern.test(email.trim())) {
            onError("Invalid email address");
            setLoading(false);
            return;
        }
        const result = await registerUserAction({email: email.trim(), password: password.trim(), name: name.trim(), phone: phone.trim()});
        setLoading(false);

        if (!result.ok) {
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
            <div className={styles.inputGroup}>
                <label htmlFor="name" className={styles.label}>
                    Name
                </label>
                <InputField
                    type="text"
                    id="name-register"
                    name="name-register"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setName(e.target.value)
                    }
                />
            </div>
            <div className={styles.inputGroup}>
                <label htmlFor="phone" className={styles.label}>
                    Phone Number
                </label>
                <InputField
                    type="text"
                    id="phone-register"
                    name="phone-register"
                    placeholder="Enter your phone number"
                    value={phone}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setPhone(e.target.value)
                    }
                />
            </div>
            <div className={styles.inputGroup}>
                <label htmlFor="email" className={styles.label}>
                    Email Address
                </label>
                <InputField
                    type="email"
                    id="email-register"
                    name="email-register"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setEmail(e.target.value)
                    }
                    required
                />
            </div>
            <div className={styles.inputGroup}>
                <label htmlFor="password" className={styles.label}>
                    Password
                </label>
                <InputField
                    type="password"
                    id="password-register"
                    name="password-register"
                    placeholder="Make it secure..."
                    value={password}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setPassword(e.target.value)
                    }
                    required
                />
            </div>

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