import React, { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useClient } from './MobileState';
import {
    Brand,
    Button,
    Choices,
    Field,
    Gender,
    Icon,
    Panel
} from './MobileUI';
import { accountPerson, passwordIssue } from './mobileUtils';
import {
    discountCategory,
    operationsStore,
    personIssue
} from '../../../components/operations/operationsStore';

export function ClientLogin() {
    const c = useClient();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const submit = e => {
        e.preventDefault();

        c.run(async () => {
            if (c.preview) {
                await new Promise(resolve => setTimeout(resolve, 700));
                c.go('dashboard');
                return;
            }

            const data = await c.request('/auth/login', {
                method: 'POST',
                body: {
                    email: email.trim(),
                    password
                }
            });

            sessionStorage.setItem('token', data.token);
            localStorage.removeItem('token');
            localStorage.removeItem('user');

            let person = {};

            try {
                person = JSON.parse(
                    localStorage.getItem(`ggo-person:${data.user.id}`) || '{}'
                );
            } catch {
                // Discard an invalid device profile.
            }

            c.saveUser({ ...data.user, ...person }, data.token);
            c.setDraft(null);
            c.go('dashboard');
        });
    };

    return (
        <main className="ggo-page ggo-auth">
            <Brand />

            <div className="ggo-auth-intro">
                <h1>Welcome back</h1>
                <p>Log in to book your next ferry trip.</p>
            </div>

            <form className="ggo-form" onSubmit={submit}>
                <Field
                    label="Email"
                    icon="mail"
                    type="email"
                    placeholder="Enter your email"
                    autoComplete="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                />

                <Field
                    label="Password"
                    icon="lock"
                    type="password"
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                />

                <Link
                    className="ggo-forgot"
                    to={c.href('reset-password')}
                >
                    Forgot password?
                </Link>

                <Button type="submit" disabled={c.busy}>
                    {c.busy ? 'Signing in…' : 'Log in'}
                </Button>
            </form>

            <p className="ggo-auth-switch">
                New to Guimaras Go?{' '}
                <Link to={c.href('register')}>Create account</Link>
            </p>
        </main>
    );
}

export function ClientRegister() {
    const c = useClient();
    const f = c.registration;

    const update = patch => {
        c.setRegistration({ ...f, ...patch });
    };

    const person = accountPerson(f);
    const eligible = discountCategory(person) !== 'Regular';

    // Password requirements update immediately as the user types.
    const passwordRules = useMemo(() => [
        {
            label: 'At least 8 characters',
            valid: f.password.length >= 8
        },
        {
            label: 'One uppercase letter (A–Z)',
            valid: /[A-Z]/.test(f.password)
        },
        {
            label: 'One lowercase letter (a–z)',
            valid: /[a-z]/.test(f.password)
        },
        {
            label: 'One number (0–9)',
            valid: /\d/.test(f.password)
        },
        {
            label: 'One special character (!@#$...)',
            valid: /[^A-Za-z0-9]/.test(f.password)
        }
    ], [f.password]);

    const takePhoto = () => {
        const issue = personIssue(person);

        if (issue) {
            c.setError(issue);
            return;
        }

        c.setPhoto(null);
        c.setPhotoPerson(person);
        c.setPhotoReturn('register');
        c.go('id-photo');
    };

    const handleAgeChange = e => {
        const value = e.target.value;

        if (
            value === '' ||
            (/^\d{1,3}$/.test(value) && Number(value) <= 120)
        ) {
            update({ age: value });
        }
    };

    const handlePhoneChange = e => {
        const digits = e.target.value
            .replace(/\D/g, '')
            .slice(0, 10);

        update({ phoneNumber: digits });
    };

    const submit = e => {
        e.preventDefault();

        c.run(async () => {
            const issue =
                personIssue(person) ||
                passwordIssue(f.password);

            if (issue) {
                throw new Error(issue);
            }

            if (f.password !== f.confirmPassword) {
                throw new Error('Your passwords do not match.');
            }

            if (f.age === '' || Number(f.age) < 0 || Number(f.age) > 120) {
                throw new Error('Please enter a valid age from 0 to 120.');
            }

            if (c.preview && eligible && !f.idPhoto) {
                c.setPhotoReturn('register');
                c.go('id-required');
                return;
            }

            if (c.preview) {
                await new Promise(resolve => setTimeout(resolve, 700));

                const value = {
                    ...f,
                    password: undefined,
                    confirmPassword: undefined,
                    idPhoto: undefined,
                    notificationsEnabled: true
                };

                c.saveUser(value);
                c.setDraft(null);

                if (eligible) {
                    operationsStore.requestID(
                        person,
                        f.idPhoto,
                        'Client account registration'
                    );
                }

                c.setRegistration({
                    ...f,
                    password: '',
                    confirmPassword: '',
                    idPhoto: ''
                });

                c.go('dashboard');
            } else {
                const data = await c.request('/auth/register', {
                    method: 'POST',
                    body: {
                        fullName: f.fullName.trim(),
                        email: f.email.trim(),
                        phoneNumber: `+63${f.phoneNumber}`,
                        password: f.password
                    }
                });

                localStorage.setItem(
                    `ggo-person:${data.user.id}`,
                    JSON.stringify({
                        age: f.age,
                        gender: f.gender,
                        category: f.category
                    })
                );

                c.setRegistration({
                    ...f,
                    password: '',
                    confirmPassword: '',
                    idPhoto: ''
                });

                c.go('login');
            }
        });
    };

    return (
        <main className="ggo-page ggo-auth">
            <Brand route />

            <div className="ggo-auth-intro">
                <h1>Create an account</h1>
                <p>Set up your account and passenger details once.</p>
            </div>

            <form className="ggo-form" onSubmit={submit}>
                <Field
                    label="Full name"
                    icon="user"
                    autoComplete="name"
                    placeholder="Enter your full name"
                    value={f.fullName}
                    onChange={e => update({ fullName: e.target.value })}
                    required
                />

                <div className="ggo-two">
                    <Field
                        label="Age"
                        icon="user"
                        type="number"
                        inputMode="numeric"
                        min="0"
                        max="120"
                        step="1"
                        placeholder="24"
                        value={f.age}
                        onChange={handleAgeChange}
                        required
                    />

                    <Gender
                        value={f.gender}
                        onChange={e => update({ gender: e.target.value })}
                    />
                </div>

                <Panel className="ggo-category">
                    <h3>Passenger category</h3>

                    <Choices
                        options={['Regular', 'Student', 'PWD']}
                        label="Passenger category"
                        value={f.category}
                        onChange={value =>
                            update({
                                category: value,
                                idPhoto: ''
                            })
                        }
                    />

                    <small>
                        {Number(f.age) >= 60
                            ? 'Age 60+ · ID photo and staff approval required.'
                            : 'Choose a passenger category.'}
                    </small>
                </Panel>

                {eligible && (
                    <Panel>
                        <h3>Your discount ID photo</h3>

                        <small>
                            Age 60+, Student or PWD: take a clear photo
                            of a valid ID. Staff must approve it before
                            the discount applies.
                        </small>

                        {c.preview ? (
                            <>
                                <p className="ggo-accent">
                                    {f.idPhoto
                                        ? 'ID photo attached'
                                        : 'ID photo required'}
                                </p>

                                <Button onClick={takePhoto}>
                                    {f.idPhoto
                                        ? 'Retake ID photo'
                                        : 'Take ID photo'}
                                </Button>
                            </>
                        ) : (
                            <p>
                                Discount verification is not available yet.
                                Your account can use the regular fare.
                            </p>
                        )}
                    </Panel>
                )}

                <Field
                    label="Email"
                    icon="mail"
                    type="email"
                    autoComplete="email"
                    placeholder="Enter your email"
                    value={f.email}
                    onChange={e => update({ email: e.target.value })}
                    required
                />

                <Field
                    label="Password"
                    icon="lock"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Create a password"
                    value={f.password}
                    onChange={e => update({ password: e.target.value })}
                    required
                />

                <div
                    className="ggo-password-rules"
                    aria-live="polite"
                    aria-label="Password requirements"
                >
                    {passwordRules.map(rule => (
                        <div
                            key={rule.label}
                            className={
                                rule.valid
                                    ? 'ggo-password-rule valid'
                                    : 'ggo-password-rule'
                            }
                        >
                            <span aria-hidden="true">
                                {rule.valid ? '✓' : '○'}
                            </span>

                            <span>{rule.label}</span>
                        </div>
                    ))}
                </div>

                <Field
                    label="Confirm password"
                    icon="lock"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Confirm your password"
                    value={f.confirmPassword}
                    onChange={e =>
                        update({ confirmPassword: e.target.value })
                    }
                    required
                />

                {!c.preview && (
                    <div className="ggo-field">
                        <label htmlFor="ggo-register-phone">
                            Phone number
                        </label>

                        <div className="ggo-input ggo-phone-input">
                            <span className="ggo-phone-prefix">+63</span>

                            <input
                                id="ggo-register-phone"
                                type="tel"
                                inputMode="numeric"
                                autoComplete="tel-national"
                                placeholder="9XXXXXXXXX"
                                value={f.phoneNumber}
                                onChange={handlePhoneChange}
                                maxLength={10}
                                required
                            />
                        </div>
                    </div>
                )}

                <Button type="submit" disabled={c.busy}>
                    {c.busy ? 'Creating account…' : 'Create account'}
                </Button>
            </form>

            <p className="ggo-auth-switch">
                Already have an account?{' '}
                <Link to={c.href('login')}>Log in</Link>
            </p>
        </main>
    );
}

export function ClientReset() {
    const c = useClient();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [complete, setComplete] = useState(false);
    const [devResetUrl, setDevResetUrl] = useState(() =>
        sessionStorage.getItem('ggo-dev-password-reset-link') || ''
    );
    const [searchParams] = useSearchParams();
    const resetToken = searchParams.get('token') || '';
    const resetting = Boolean(resetToken);
    const sent = c.path === 'reset-sent';

    const submitResetRequest = e => {
        e.preventDefault();
        c.run(async () => {
            if (c.preview) {
                await new Promise(resolve => setTimeout(resolve, 500));
            } else {
                const data = await c.request('/auth/password-reset/request', {
                    method: 'POST',
                    body: { email: email.trim() }
                });
                const localResetUrl = data.devResetUrl || '';
                setDevResetUrl(localResetUrl);
                if (localResetUrl) {
                    sessionStorage.setItem('ggo-dev-password-reset-link', localResetUrl);
                } else {
                    sessionStorage.removeItem('ggo-dev-password-reset-link');
                }
            }
            c.go('reset-sent');
        });
    };

    const submitNewPassword = e => {
        e.preventDefault();
        if (password !== confirmPassword) {
            c.setError('The passwords do not match.');
            return;
        }

        c.run(async () => {
            await c.request('/auth/password-reset/confirm', {
                method: 'POST',
                body: { token: resetToken, newPassword: password }
            });
            sessionStorage.removeItem('ggo-dev-password-reset-link');
            setDevResetUrl('');
            setComplete(true);
        });
    };

    return (
        <main className="ggo-reset-screen">
            <section className="ggo-reset-dialog">
                {(sent || complete) && (
                    <span className="ggo-success-icon">
                        <Icon name="check" />
                    </span>
                )}

                <h1>
                    {complete
                        ? 'Password updated'
                        : resetting
                            ? 'Choose a new password'
                            : sent
                                ? 'Check your inbox'
                                : 'Reset your password'}
                </h1>

                <p>
                    {complete
                        ? 'Your password has been changed. You can now log in with your new password.'
                        : resetting
                            ? 'Create a new password for your GuimarasGo account.'
                            : sent
                                ? devResetUrl
                                    ? 'Use the local reset link below to choose a new password. It expires in 30 minutes.'
                                    : 'If an account matches that email, a reset link will arrive shortly. The link expires in 30 minutes.'
                                : 'Enter your account email and we’ll send a reset link.'}
                </p>

                {sent && devResetUrl && (
                    <a className="ggo-reset-dev-link" href={devResetUrl}>
                        Open local password reset link
                    </a>
                )}

                {resetting && !complete && (
                    <form className="ggo-form" onSubmit={submitNewPassword}>
                        <Field
                            label="New password"
                            type="password"
                            icon="lock"
                            placeholder="Enter a new password"
                            autoComplete="new-password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                        />
                        <Field
                            label="Confirm new password"
                            type="password"
                            icon="lock"
                            placeholder="Enter the new password again"
                            autoComplete="new-password"
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            required
                        />
                        <small>Use at least 8 characters with uppercase and lowercase letters, a number, and a symbol.</small>
                        <Button type="submit" disabled={c.busy}>
                            {c.busy ? 'Updating…' : 'Change password'}
                        </Button>
                    </form>
                )}

                {!resetting && !sent && !complete && (
                    <form
                        className="ggo-form"
                        onSubmit={submitResetRequest}
                    >
                        <Field
                            label="Email"
                            type="email"
                            icon="mail"
                            placeholder="Enter your email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                        />

                        <Button
                            type="submit"
                            disabled={c.busy}
                        >
                            {c.busy ? 'Sending…' : 'Send reset link'}
                        </Button>
                    </form>
                )}

                {(sent || complete) ? (
                    <Link className="ggo-button" to={c.href('login')}>
                        Back to log in
                    </Link>
                ) : (
                    <Link className="ggo-text-link" to={c.href('login')}>
                        Back to log in
                    </Link>
                )}
            </section>
        </main>
    );
}
