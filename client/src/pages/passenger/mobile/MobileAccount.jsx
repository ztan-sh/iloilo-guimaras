import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import QRCode from 'qrcode';
import { jsPDF } from 'jspdf';
import { useClient } from './MobileState';
import { Art, ArtworkStage, Button, Choices, Field, Footer, Gender, GenderPicker, Header, Icon, MobileDialog, NotificationBell, Panel, Progress, Row, Toggle } from './MobileUI';
import { canIssueTicket, discountAmountFor, money, passwordIssue, paymentState, todayInManila } from './mobileUtils';
import { formatTime, formatTimestamp } from '../../Staff/staffUtils';
import { passengerIdentity, personIssue } from '../../../components/operations/operationsStore';

export function ClientHistory({ tickets = false }) {
    const c = useClient(); const [filter, setFilter] = useState('All'); const [detailId, setDetailId] = useState(null);
    const list = c.bookings.filter(b => tickets ? canIssueTicket(b) : filter === 'All' || paymentState(b) === filter);
    const detail = c.bookings.find(b => b._id === detailId);
    const message = filter === 'Paid' ? 'Your payment is confirmed. Your QR ticket is ready for boarding.' : filter === 'Processing' ? 'Payment verification is underway. No ticket has been issued.' : filter === 'Failed' ? 'Unsuccessful payments do not issue a ticket. Choose a new trip when you are ready.' : 'A ticket is issued only after payment is confirmed.';
    return <main className="ggo-page ggo-has-nav"><Header toolbar={false} title={tickets ? 'My tickets' : 'Payment history'} description={tickets ? 'Keep your boarding pass ready for the gate.' : 'Check payments for your ferry tickets.'} /><div className="ggo-history-notice"><Icon name="card" /><p>{tickets ? 'Only confirmed bookings appear here. Check pending payments in payment history.' : message}</p></div>{!tickets && <Choices label="Payment status" options={['All', 'Paid', 'Processing', 'Failed']} value={filter} onChange={setFilter} />}<div className="ggo-list-caption"><strong>{tickets ? 'Boarding passes' : 'Recent payments'}</strong><small>{list.length} record{list.length === 1 ? '' : 's'}</small></div>
        <div className="ggo-record-list">{list.map(b => {
            const status = paymentState(b); const ready = canIssueTicket(b);
            const props = ready ? { as: Link, to: c.href(`boarding-pass?reference=${encodeURIComponent(b.bookingReference)}`), 'aria-label': `View boarding pass ${b.bookingReference}` } : { as: 'button', type: 'button', onClick: () => setDetailId(b._id), 'aria-label': `View ${status.toLowerCase()} payment ${b.bookingReference}` };
            const discount = discountAmountFor(b);
            return <Panel key={b._id} className="ggo-payment-record" {...props}><div className="ggo-record-top"><strong>{b.origin} → {b.destination}</strong><span className={`ggo-status ${status.toLowerCase()}`}>{status}</span></div><div className="ggo-record-top"><h2>{money(status === 'Paid' ? b.totalPaid ?? b.requiredAmount : b.requiredAmount)}</h2><small>{b.paymentMethod}</small></div>{discount > 0 && <small className="ggo-record-discount">Discount applied: −{money(discount)}</small>}<small>{formatTimestamp(b.createdAt, true)}</small><div className="ggo-record-bottom"><small>{b.bookingReference}</small><span className={ready ? 'ggo-paid' : status === 'Failed' ? 'ggo-failed' : 'ggo-accent'}>{ready ? 'View ticket →' : status === 'Failed' ? 'No ticket issued' : 'No ticket yet'}</span></div></Panel>;
        })}{!list.length && <Panel><h3>{tickets ? 'No confirmed tickets yet' : `No ${filter === 'All' ? '' : filter.toLowerCase() + ' '}payments yet`}</h3><p>Choose a crossing when you’re ready.</p><Button onClick={() => c.go('dashboard')}>Find a crossing</Button></Panel>}</div>
        {detail && <PaymentDetails booking={detail} onClose={() => setDetailId(null)} />}
    </main>;
}
function PaymentDetails({ booking, onClose }) {
    const c = useClient(); const status = paymentState(booking); const ready = canIssueTicket(booking);
    const title = status === 'Failed' ? 'Payment failed' : status === 'Processing' ? 'Payment processing' : 'Payment confirmed';
    const description = status === 'Failed' ? 'No payment was confirmed and no ticket was issued. Choose a new trip when you are ready.' : status === 'Processing' ? 'Your payment is being checked. Your ticket will be available after payment is confirmed.' : ready ? 'Your ticket is ready for boarding.' : 'No boarding pass is available for this booking. Contact terminal staff for help.';
    const discount = discountAmountFor(booking);
    return <MobileDialog title={title} onClose={onClose}><h2>{title}</h2><p className="ggo-payment-detail-reference">{booking.bookingReference} · {booking.paymentMethod} · {money(status === 'Paid' ? booking.totalPaid ?? booking.requiredAmount : booking.requiredAmount)}</p>{discount > 0 && <p>Discount applied: −{money(discount)}</p>}<p>{description}</p>{status === 'Failed' ? <><Button onClick={() => c.go('schedule')}>Choose a new trip</Button><button type="button" className="ggo-picker-cancel" onClick={onClose}>Close</button></> : <Button onClick={onClose}>Back to history</Button>}</MobileDialog>;
}
export function ClientConfirmation() {
    const c = useClient(); const [query] = useSearchParams(); const b = c.bookings.find(item => item.bookingReference === query.get('reference'));
    if (!b) return <main className="ggo-page"><Header title="Payment" description={c.loading ? 'Loading your payment…' : 'This payment could not be found.'} /><Button onClick={() => c.go('history')}>Payment history</Button></main>;
    const ready = canIssueTicket(b); const failed = paymentState(b) === 'Failed';
    return <main className="ggo-page ggo-confirmation"><Header title={ready ? 'Payment confirmed' : failed ? 'Payment unsuccessful' : 'Payment processing'} description={ready ? 'Your ferry ticket is ready.' : failed ? 'No ticket has been issued.' : 'Your payment is awaiting verification.'} /><Progress step={failed ? 2 : 3} /><div className="ggo-confirmation-message">{ready ? <Art file="10b89.svg" className="ggo-confetti" /> : <span className={`ggo-confirmation-symbol ${failed ? 'failed' : ''}`}>{failed ? '×' : '…'}</span>}<h2>{ready ? 'You’re ready to board.' : failed ? 'Choose another crossing.' : 'We’re checking your payment.'}</h2><p>{ready ? 'Show your QR ticket at the boarding gate.' : failed ? 'Check payment history for the transaction status.' : 'Your QR ticket will appear once payment is confirmed.'}</p></div><Panel><h3>Ticket details</h3><dl className="ggo-details"><div><dt>Reference</dt><dd>{b.bookingReference}</dd></div><div><dt>Passenger</dt><dd>{b.passengerName}</dd></div><div><dt>Status</dt><dd>{ready ? 'Payment confirmed' : paymentState(b)}</dd></div></dl></Panel>{ready && <Button onClick={() => c.go(`boarding-pass?reference=${encodeURIComponent(b.bookingReference)}`)}>View boarding pass</Button>}{failed && <Button onClick={() => c.go('schedule')}>Choose a new trip</Button>}<Row label="Payment history" icon="card" to={c.href('history')} /><Link className="ggo-text-link" to={c.href('dashboard')}>Back to home</Link></main>;
}
export function ClientPass() {
    const c = useClient(); const [query] = useSearchParams(); const b = c.bookings.find(item => item.bookingReference === query.get('reference')) || (!query.has('reference') ? c.bookings.find(canIssueTicket) : null);
    const download = () => c.run(async () => {
        const image = await QRCode.toDataURL(b.bookingReference, { width: 600, margin: 4, errorCorrectionLevel: 'H' });
        const pdf = new jsPDF({ unit: 'mm', format: [100, 220] });
        const amount = value => `PHP ${(Number(value) || 0).toFixed(2)}`;
        const discount = discountAmountFor(b);
        const totalPaid = Number(b.totalPaid ?? b.requiredAmount) || 0;
        pdf.setFontSize(19); pdf.text('Guimaras Go', 12, 18);
        pdf.setFontSize(12); pdf.text('Boarding pass and fare receipt', 12, 28);
        pdf.setFontSize(10);
        const details = [
            b.passengerName,
            `${b.origin} to ${b.destination}`,
            `${b.vesselName || b.ferryName || 'Ferry'} | ${b.date}`,
            `${formatTime(b.time)} | ${b.passengers} passenger(s)`,
            `Reference: ${b.bookingReference}`,
            `Queue: ${b.queueNumber || 'Pending confirmation'}`
        ];
        const detailLines = pdf.splitTextToSize(details.join('\n'), 76);
        pdf.text(detailLines, 12, 39);

        let y = 44 + detailLines.length * 5;
        pdf.setDrawColor(190); pdf.line(12, y, 88, y); y += 7;
        pdf.setFontSize(11); pdf.text('Fare paid', 12, y); y += 7;
        pdf.setFontSize(9);
        const fareRows = [
            ['Passenger fare', b.passengerFare],
            ...(discount > 0 ? [['Discount applied', -discount]] : []),
            ...(Number(b.motorcycleFare) > 0 ? [['Motorcycle fare', b.motorcycleFare]] : []),
            ...(Number(b.stampFee) > 0 ? [['Motorcycle stamp fee', b.stampFee]] : []),
            ['PPA fee', b.ppaFee]
        ];
        fareRows.forEach(([label, value]) => {
            pdf.text(String(label), 12, y);
            pdf.text(`${Number(value) < 0 ? '- ' : ''}${amount(Math.abs(Number(value) || 0))}`, 88, y, { align: 'right' });
            y += 5;
        });
        y += 1; pdf.setDrawColor(190); pdf.line(12, y, 88, y); y += 7;
        pdf.setFont('helvetica', 'bold'); pdf.setFontSize(10);
        pdf.text('Total paid', 12, y); pdf.text(amount(totalPaid), 88, y, { align: 'right' });
        pdf.setFont('helvetica', 'normal');
        pdf.addImage(image, 'PNG', 25, 145, 50, 50);
        pdf.setFontSize(8);
        pdf.text(c.preview ? 'PREVIEW SAMPLE - For testing only' : 'Show this QR at the boarding gate.', 12, 207);
        pdf.save(`${b.bookingReference}.pdf`);
    });
    return <main className="ggo-page ggo-has-nav ggo-boarding">
        <header className="ggo-pass-header"><Link className="ggo-pass-back" aria-label="Back to tickets" to={c.href('bookings')}><Icon name="back" /></Link><h1>Boarding pass</h1><NotificationBell /></header>
        {canIssueTicket(b) ? <>
            <div className={`ggo-pass-map ${b.origin === 'Guimaras' ? 'ggo-route-return' : ''}`} aria-hidden="true"><ArtworkStage width={354} height={118}><Art file="boarding-map-refined.png" width={352} height={120} className="ggo-pass-geography" /><Art file="8a938.svg" className="ggo-pass-route-line" /><Art file="boarding-pin-iloilo.png" width={18.5688} height={18.5688} className="ggo-pin-iloilo" /><Art file="boarding-pin-guimaras.png" width={20.1835} height={20.1835} className="ggo-pin-guimaras" /></ArtworkStage></div>
            <div className="ggo-pass-endpoints"><div><strong>{b.origin}</strong><small>Departure</small></div><span>25–35 min</span><div><strong>{b.destination}</strong><small>Arrival</small></div></div>
            <ArtworkStage width={354} height={144} className="ggo-pass-vessel"><Art file="e21d4.svg" className="ggo-pass-vessel-shape" /><div className="ggo-pass-times"><div><small>Departure</small><strong>{formatTime(b.time)}</strong></div><Art file="boarding-ferry.png" width={69} height={68} /><div><small>Arrival</small><strong>{b.arrivalTime ? formatTime(b.arrivalTime) : '—'}</strong></div></div><p className="ggo-pass-vessel-name">{b.vesselName || b.ferryName || 'Ferry'} · {b.date}</p></ArtworkStage>
            <Panel className="ggo-qr-panel"><div className="ggo-pass-person"><div><strong>{b.passengerName}</strong><small>{b.passengers} passenger{Number(b.passengers) === 1 ? '' : 's'}</small></div><span className="ggo-pass-person-icon"><Art file="9d2f0.svg" /></span></div><div className="ggo-pass-perforation"><ArtworkStage width={354} height={0}><Art file="b5f10.svg" /></ArtworkStage></div><QRCodeSVG value={b.bookingReference} size={220} level="H" marginSize={4} title={`Boarding code ${b.bookingReference}`} /><small className="ggo-pass-reference">{b.bookingReference}</small><strong className="ggo-pass-queue">{b.queueNumber || 'Queue assigned after payment confirmation'}</strong><small>Present this QR code to boarding staff.</small>{c.preview && <small>Preview sample · For testing only</small>}</Panel>
            <Button secondary disabled={c.busy} onClick={download}>{c.busy ? 'Preparing…' : 'Download boarding pass'}</Button>
        </> : <Panel><h2>No boarding pass available</h2><p>A verified payment and confirmed booking are required.</p><Button onClick={() => c.go('history')}>Payment history</Button></Panel>}
    </main>;
}

export function ClientProfile() {
    const c = useClient();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await c.logout();
            navigate('/', { replace: true });
        } catch (error) {
            // Keep the existing logout error handling/state behavior.
            throw error;
        }
    };

    const [saving, setSaving] = useState(false);
    const [confirmLogout, setConfirmLogout] = useState(false);

    const toggleNotifications = () => {
        if (saving) return;

        setSaving(true);

        c.run(async () => {
            const enabled = !c.user.notificationsEnabled;

            if (!c.preview) {
                await c.request('/auth/notifications', {
                    method: 'PUT',
                    body: { enabled }
                });
            }

            c.saveUser({
                ...c.user,
                notificationsEnabled: enabled
            });
        }).finally(() => setSaving(false));
    };

    const profilePhoto = c.user.profilePhoto;

    return (
        <main className="ggo-page ggo-has-nav">
            <div className="ggo-profile-heading">
                <Header title="Profile" toolbar={false} />

                <button
                    className="ggo-logout"
                    onClick={() => setConfirmLogout(true)}
                >
                    Log out
                </button>
            </div>

            {confirmLogout && (
                <MobileDialog
                    title="Log out?"
                    onClose={() => setConfirmLogout(false)}
                    className="ggo-logout-dialog"
                >
                    <h2>Log out?</h2>
                    <p>Are you sure you want to log out of your account?</p>
                    <Button
                        orange
                        onClick={handleLogout}
                    >
                        Log out
                    </Button>

                    <Button
                        secondary
                        onClick={() => setConfirmLogout(false)}
                    >
                        Cancel
                    </Button>
                </MobileDialog>
            )}

            <div className="ggo-profile-person">
                <Link
                    aria-label="Edit profile details"
                    to={c.href('edit-profile')}
                >
                    {profilePhoto ? (
                        <img
                            className="ggo-account-avatar"
                            src={profilePhoto}
                            alt="Your profile"
                            width="88"
                            height="76"
                        />
                    ) : (
                        <Art
                            file="avatar-profile.png"
                            width="88"
                            height="76"
                        />
                    )}

                    <Art
                        className="ggo-edit-avatar"
                        file="af94a.svg"
                    />
                </Link>

                <div>
                    <h2>{c.user.fullName}</h2>
                    <small>{c.user.email}</small>
                </div>
            </div>

            {c.user.discountIdPhoto && (
                <Panel className="ggo-discount-id-profile">
                    <h3>{c.user.category || 'Discount'} ID photo</h3>
                    <p>Saved from your registration for discount verification.</p>
                    <img src={c.user.discountIdPhoto} alt="Your saved discount ID photo" />
                </Panel>
            )}

            <div className="ggo-profile-stats">
                {[
                    [
                        c.bookings.filter(canIssueTicket).length,
                        'Trips'
                    ],
                    [
                        c.bookings.length,
                        'Payments'
                    ],
                    [
                        c.bookings.filter(
                            b =>
                                canIssueTicket(b) &&
                                b.boardingStatus !== 'ON BOARD' &&
                                b.date >= todayInManila()
                        ).length,
                        'Active ticket'
                    ]
                ].map(([n, label]) => (
                    <div key={label}>
                        <strong>{n}</strong>
                        <small>{label}</small>
                    </div>
                ))}
            </div>

            <small className="ggo-section-label">General</small>

            <div className="ggo-rows">
                <Row
                    icon="pencil"
                    label="Edit profile"
                    to={c.href('edit-profile')}
                />

                <Row
                    icon="ticket"
                    label="My tickets"
                    to={c.href('bookings')}
                />

                <Row
                    icon="card"
                    label="Payment history"
                    to={c.href('history')}
                />
            </div>

            <small className="ggo-section-label">
                Preferences
            </small>

            <div className="ggo-rows">
                <div className="ggo-row">
                    <Icon name="bell" />
                    <span>Notifications</span>

                    <Toggle
                        label="Enable notifications"
                        value={
                            c.user.notificationsEnabled === true
                        }
                        onChange={toggleNotifications}
                    />
                </div>

                <Row
                    icon="language"
                    label="Language"
                    to={c.href('language')}
                >
                    <small>{c.language}</small>
                    <Icon name="chevron" />
                </Row>

                <div className="ggo-row">
                    <Icon name="moon" />
                    <span>Dark mode</span>

                    <Toggle
                        label="Dark mode"
                        value={c.dark}
                        onChange={() => c.setDark(!c.dark)}
                    />
                </div>
            </div>
        </main>
    );
}

export function ClientEditProfile() {
    const c = useClient();

    const [form, setForm] = useState({
        ...c.user,
        age: String(c.user.age ?? ''),
        profilePhoto: c.user.profilePhoto || ''
    });
    const needsDiscountId = ['Student', 'PWD'].includes(form.category) || Number(form.age) >= 60;

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');

    const update = patch => {
        setForm(current => ({
            ...current,
            ...patch
        }));
    };

    const handlePhotoChange = event => {
        const file = event.target.files?.[0];

        if (!file) return;

        if (!file.type.startsWith('image/')) {
            c.setError('Please select a valid image file.');
            event.target.value = '';
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            c.setError('Please choose an image smaller than 5 MB.');
            event.target.value = '';
            return;
        }

        c.setError('');

        const reader = new FileReader();

        reader.onload = () => {
            if (typeof reader.result === 'string') {
                update({
                    profilePhoto: reader.result
                });
            }
        };

        reader.onerror = () => {
            c.setError('Unable to read this image. Please try again.');
        };

        reader.readAsDataURL(file);
    };

    const handleDiscountIdChange = event => {
        const file = event.target.files?.[0];
        if (!file) return;
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
            c.setError('Choose a JPG, PNG or WebP ID photo.');
            event.target.value = '';
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            c.setError('Choose an ID photo smaller than 5 MB.');
            event.target.value = '';
            return;
        }
        c.setError('');
        const reader = new FileReader();
        reader.onload = () => {
            if (typeof reader.result === 'string') update({ discountIdPhoto: reader.result });
        };
        reader.onerror = () => c.setError('Unable to read this ID photo. Please try again.');
        reader.readAsDataURL(file);
    };

    const save = event => {
        event.preventDefault();

        c.run(async () => {
            const ageText = String(form.age ?? '');

            if (!/^\d{1,3}$/.test(ageText)) {
                throw new Error(
                    'Age must contain one to three digits.'
                );
            }

            const age = Number(ageText);

            if (!Number.isInteger(age) || age < 0 || age > 120) {
                throw new Error(
                    'Enter an age between 0 and 120.'
                );
            }

            const issue = personIssue({
                name: form.fullName,
                age,
                gender: form.gender,
                category: form.category
            });

            if (issue) throw new Error(issue);
            if (needsDiscountId && !form.discountIdPhoto) {
                throw new Error('Upload your Student, PWD or Senior ID photo before saving this profile.');
            }

            if (
                newPassword &&
                passwordIssue(newPassword)
            ) {
                throw new Error(passwordIssue(newPassword));
            }

            const updatedProfile = {
                ...c.user,
                ...form,
                age,
                profilePhoto: form.profilePhoto || ''
            };

            if (c.preview) {
                c.saveUser(updatedProfile);
                c.go('profile');
                return;
            }

            const result = await c.request('/auth/profile', {
                method: 'PUT',
                body: {
                    fullName: form.fullName,
                    email: form.email,
                    phoneNumber: form.phoneNumber,
                    age,
                    gender: form.gender,
                    category: form.category,
                    discountIdPhoto: needsDiscountId ? form.discountIdPhoto : '',
                    profilePhoto: form.profilePhoto || ''
                }
            });

            c.saveUser(
                {
                    ...result.user,
                    age,
                    gender: form.gender,
                    category: form.category
                },
                result.token
            );

            if (needsDiscountId) {
                const reviews = await c.request('/auth/discount-requests');
                c.setDiscountRequests((reviews.requests || []).map(item => {
                    const passenger = { id: item.passengerId, name: item.passengerName, age: item.age, gender: item.gender, category: item.category };
                    return { id: item._id, passenger, identity: passengerIdentity(passenger), photo: item.photo, status: item.status, reason: item.reason || '', source: item.source || '', requestId: item._id };
                }));
            }

            if (newPassword) {
                await c.request('/auth/password', {
                    method: 'PUT',
                    body: {
                        currentPassword,
                        newPassword
                    }
                });
            }

            c.go('profile');
        });
    };

    return (
        <main className="ggo-page ggo-has-footer">
            <Header
                title="Edit profile"
                toolbar={false}
                back="profile"
            />

            <div className="ggo-edit-profile-photo">
                {form.profilePhoto ? (
                    <img
                        className="ggo-account-avatar ggo-edit-profile-avatar"
                        src={form.profilePhoto}
                        alt="Profile photo preview"
                        width="100"
                        height="100"
                    />
                ) : (
                    <Art
                        className="ggo-edit-profile-avatar"
                        file="avatar-profile.png"
                        width="100"
                        height="100"
                    />
                )}

                <label
                    className="ggo-photo-upload"
                    htmlFor="ggo-profile-photo"
                >
                    {form.profilePhoto
                        ? 'Change photo'
                        : 'Add profile photo'}
                </label>

                <input
                    id="ggo-profile-photo"
                    className="ggo-photo-file-input"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                />

                {form.profilePhoto && (
                    <button
                        type="button"
                        className="ggo-photo-remove"
                        onClick={() => {
                            update({ profilePhoto: '' });
                        }}
                    >
                        Remove photo
                    </button>
                )}
            </div>

            <p className="ggo-profile-helper">
                Your photo is used on your profile. Age, gender, category and any ID photo are saved to your account.
            </p>

            <form
                id="ggo-profile-form"
                className="ggo-form"
                onSubmit={save}
            >
                <Field
                    label="Name"
                    icon="user"
                    value={form.fullName || ''}
                    onChange={e =>
                        update({ fullName: e.target.value })
                    }
                    required
                />

                <div className="ggo-two">
                    <div className="ggo-field">
                        <label htmlFor="ggo-profile-age">
                            Age
                        </label>

                        <div className="ggo-input">
                            <Icon name="user" />

                            <input
                                id="ggo-profile-age"
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]{1,3}"
                                maxLength={3}
                                value={form.age ?? ''}
                                onChange={e => {
                                    const age = e.target.value
                                        .replace(/\D/g, '')
                                        .slice(0, 3);

                                    update({ age });
                                }}
                                required
                            />
                        </div>
                    </div>

                    <Gender
                        value={form.gender || ''}
                        onChange={e =>
                            update({ gender: e.target.value })
                        }
                    />
                </div>

                <Choices
                    label="Profile passenger category"
                    options={['Regular', 'Student', 'PWD']}
                    value={form.category || 'Regular'}
                    onChange={value => update({
                        category: value,
                        ...(value !== form.category ? { discountIdPhoto: '' } : {})
                    })}
                />

                {(['Student', 'PWD'].includes(form.category) || Number(form.age) >= 60) && (
                    <Panel className="ggo-discount-id-profile ggo-edit-discount-id">
                        <h3>{Number(form.age) >= 60 ? 'Senior' : form.category} ID photo required</h3>
                        <p>Upload a clear photo of the ID used to verify this fare category. Staff will review it before a discount is approved.</p>
                        {form.discountIdPhoto && <img src={form.discountIdPhoto} alt="Discount ID photo preview" />}
                        <label className="ggo-photo-upload" htmlFor="ggo-discount-id-photo">
                            {form.discountIdPhoto ? 'Change ID photo' : 'Upload ID photo'}
                        </label>
                        <input
                            id="ggo-discount-id-photo"
                            className="ggo-photo-file-input"
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={handleDiscountIdChange}
                            required={!form.discountIdPhoto}
                        />
                    </Panel>
                )}

                <Field
                    label="Email"
                    icon="mail"
                    type="email"
                    value={form.email || ''}
                    onChange={e =>
                        update({ email: e.target.value })
                    }
                    required
                />

                {!c.preview && (
                    <Field
                        label="Phone number"
                        type="tel"
                        value={form.phoneNumber || ''}
                        onChange={e =>
                            update({
                                phoneNumber: e.target.value
                            })
                        }
                        required
                    />
                )}

                <Field
                    label="New password (optional)"
                    icon="lock"
                    type="password"
                    placeholder="Leave empty to keep your password"
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={e =>
                        setNewPassword(e.target.value)
                    }
                />

                {newPassword && !c.preview && (
                    <Field
                        label="Current password"
                        icon="lock"
                        type="password"
                        autoComplete="current-password"
                        value={currentPassword}
                        onChange={e =>
                            setCurrentPassword(e.target.value)
                        }
                        required
                    />
                )}
            </form>

            <Footer>
                <Button
                    form="ggo-profile-form"
                    type="submit"
                    disabled={c.busy}
                >
                    {c.busy ? 'Saving…' : 'Save changes'}
                </Button>
            </Footer>
        </main>
    );
}

export function ClientLanguage() {
    const c = useClient(); const [selected, setSelected] = useState(c.language);
    return <main className="ggo-page ggo-has-footer"><Header title="Language" description="Choose your preferred app language." toolbar={false} back="profile" /><div className="ggo-language-choices">{['English', 'Filipino', 'Hiligaynon'].map(value => <button key={value} className={selected === value ? 'selected' : ''} aria-pressed={selected === value} onClick={() => setSelected(value)}>{value}<span className="ggo-radio" /></button>)}</div>{selected !== 'English' && <p className="ggo-language-note">Your preference will be saved. The interface is currently available in English.</p>}<Footer><Button onClick={() => { c.setLanguage(selected); c.go('profile'); }}>Done</Button></Footer></main>;
}
export function ClientNotifications() {
    const c = useClient(); const [filter, setFilter] = useState('All'); const [selected, setSelected] = useState(null); const unread = c.events.filter(e => !(e.serverRead || c.read.includes(e.id))); const events = filter === 'Unread' ? unread : c.events;
    const open = event => { c.markRead([event.id]); setSelected(event); };
    return <main className="ggo-page ggo-has-footer"><Header title="Notifications" description="Booking, payment and ID-review updates." toolbar={false} back="dashboard" /><p className="ggo-notification-count">{unread.length} unread</p><Choices label="Notification filter" options={['All', 'Unread']} value={filter} onChange={setFilter} /><div className="ggo-notification-list">{events.map(e => <button key={e.id} className={`ggo-notification ${(e.serverRead || c.read.includes(e.id)) ? '' : 'unread'}`} onClick={() => open(e)}><Icon name={e.type === 'discount' ? 'user' : e.type === 'booking_cancelled' ? 'bell' : 'ticket'} /><div><h3>{e.title}</h3><p>{e.detail}</p><small>{e.type === 'booking_cancelled' ? 'Booking update' : e.requestId ? 'ID review update' : 'Notification'} · {formatTimestamp(e.time, true)}</small></div>{!(e.serverRead || c.read.includes(e.id)) && <Art file="1dc49.svg" className="ggo-event-dot" />}</button>)}{!events.length && <Panel><h2>You’re all caught up.</h2><p>{filter === 'Unread' ? 'No unread updates.' : 'Your booking and ID updates will appear here.'}</p></Panel>}</div><Footer><Button disabled={!unread.length} onClick={() => c.markRead(unread.map(e => e.id))}>Mark all as read</Button></Footer>{selected && <MobileDialog title={selected.title || 'Notification'} onClose={() => setSelected(null)} className="ggo-notification-dialog"><div className="ggo-notification-dialog-content"><h2>{selected.title || 'Notification'}</h2><time>{formatTimestamp(selected.time, true)}</time><div className="ggo-notification-dialog-message">{selected.detail || 'You have a new notification.'}</div><Button onClick={() => setSelected(null)}>Close</Button></div></MobileDialog>}</main>;
}
export function ClientAge() {
    const c = useClient(); const [value, setValue] = useState(String(c.registration.age || ''));
    return <main className="ggo-page ggo-has-footer"><Header title="Passenger age" description="Enter their age. Ages 60 and above require a valid ID photo for staff approval." toolbar={false} /><Field label="Age" type="text" inputMode="numeric" pattern="[0-9]{1,3}" maxLength={3} value={value} onChange={e => setValue(e.target.value.replace(/\D/g, '').slice(0, 3))} /><small>A passenger discount applies only after staff approval.</small><div className="ggo-age-keypad">{['1', '2', '3', '4', '5', '6', '7', '8', '9', 'Clear', '0'].map(key => <button key={key} onClick={() => setValue(key === 'Clear' ? '' : (value + key).slice(0, 3))}>{key}</button>)}</div><Footer><Button onClick={() => { if (!value || !Number.isInteger(Number(value)) || Number(value) > 120) return c.setError('Enter an age between 0 and 120.'); c.setRegistration({ ...c.registration, age: Number(value) }); c.go('register'); }}>Done</Button><Button secondary onClick={() => c.go('register')}>Cancel</Button></Footer></main>;
}

export function ClientGender() {
    const c = useClient();
    return <GenderPicker value={c.registration.gender || (c.preview ? c.user.gender : '')} onSave={gender => { c.setRegistration({ ...c.registration, gender, ...(gender !== c.registration.gender ? { idPhoto: '' } : {}) }); c.go('register'); }} onCancel={() => c.go('register')} />;
}
