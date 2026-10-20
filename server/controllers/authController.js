const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
const DiscountRequest = require("../models/DiscountRequest");
const { sendPasswordResetEmail } = require("../services/emailService");
const { issueSession } = require("../utils/authSession");

// ========================================
// CREATE TOKEN
// ========================================

const createToken = (user) => {
    return jwt.sign(
        {
            userId: user._id.toString(),
            email: user.email
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "1d"
        }
    );
};

// ========================================
// PASSWORD STRENGTH VALIDATION
// ========================================

const isStrongPassword = (password) => {
    return (
        typeof password === "string" &&
        password.length >= 8 &&
        /[A-Z]/.test(password) &&
        /[a-z]/.test(password) &&
        /\d/.test(password) &&
        /[^A-Za-z0-9]/.test(password)
    );
};

const requestPasswordReset = async (req, res) => {
    try {
        const email = typeof req.body.email === "string"
            ? req.body.email.trim().toLowerCase()
            : "";

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ message: "Enter a valid email address." });
        }

        const emailConfigured = Boolean(
            process.env.RESEND_API_KEY && process.env.EMAIL_FROM
        );
        const clientUrl = (
            process.env.CLIENT_URL ||
            (process.env.NODE_ENV === "production"
                ? "https://iloilo-guimaras.vercel.app"
                : "http://localhost:5173")
        ).replace(/\/+$/, "");
        const isLocalClientUrl = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(clientUrl);
        const devLinkEnabled =
            process.env.ENABLE_DEV_PASSWORD_RESET_LINK === "true" &&
            process.env.NODE_ENV !== "production" &&
            isLocalClientUrl;

        if (!emailConfigured && !devLinkEnabled) {
            return res.status(503).json({
                message: "Password reset email is not configured yet. Please contact the terminal for account help."
            });
        }

        const user = await User.findOne({ email });
        if (user) {
            const resetToken = crypto.randomBytes(32).toString("hex");
            const tokenHash = crypto.createHash("sha256").update(resetToken).digest("hex");
            user.passwordResetTokenHash = tokenHash;
            user.passwordResetExpiresAt = new Date(Date.now() + 30 * 60 * 1000);
            await user.save();

            const resetUrl = `${clientUrl}/reset-password?token=${encodeURIComponent(resetToken)}`;
            let emailSent = false;

            if (emailConfigured) {
                const result = await sendPasswordResetEmail({
                    to: user.email,
                    passengerName: user.fullName,
                    resetUrl
                });
                emailSent = result.sent;

                if (!emailSent) {
                    console.error("Password reset email was not sent:", result.reason);
                }
            }

            if (devLinkEnabled && !emailSent) {
                return res.status(200).json({
                    message: "A local password reset link is ready.",
                    devResetUrl: resetUrl
                });
            }
        }

        // Keep the response the same for known and unknown email addresses.
        return res.status(200).json({
            message: "If an account matches that email, a password reset link will arrive shortly. The link expires in 30 minutes."
        });
    } catch (error) {
        console.error("Password Reset Request Error:", error);
        return res.status(500).json({ message: "Unable to process the reset request right now. Please try again." });
    }
};

const resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body || {};
        if (typeof token !== "string" || !/^[a-f0-9]{64}$/i.test(token)) {
            return res.status(400).json({ message: "This reset link is invalid or has expired. Request a new one." });
        }

        if (typeof newPassword !== "string" || !isStrongPassword(newPassword)) {
            return res.status(400).json({
                message: "Password must be at least 8 characters and include an uppercase letter, lowercase letter, number, and special character."
            });
        }

        const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
        const user = await User.findOne({
            passwordResetTokenHash: tokenHash,
            passwordResetExpiresAt: { $gt: new Date() }
        }).select("+passwordResetTokenHash +passwordResetExpiresAt");

        if (!user) {
            return res.status(400).json({ message: "This reset link is invalid or has expired. Request a new one." });
        }

        if (await bcrypt.compare(newPassword, user.password)) {
            return res.status(400).json({ message: "Choose a password different from your current password." });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const updated = await User.findOneAndUpdate(
            {
                _id: user._id,
                passwordResetTokenHash: tokenHash,
                passwordResetExpiresAt: { $gt: new Date() }
            },
            {
                $set: { password: hashedPassword },
                $unset: { passwordResetTokenHash: 1, passwordResetExpiresAt: 1 }
            },
            { new: true }
        );

        if (!updated) {
            return res.status(400).json({ message: "This reset link is invalid or has expired. Request a new one." });
        }

        return res.status(200).json({ message: "Your password has been changed. You can now log in." });
    } catch (error) {
        console.error("Password Reset Confirmation Error:", error);
        return res.status(500).json({ message: "Unable to reset the password right now. Please try again." });
    }
};


// ========================================
// PROFILE PHOTO VALIDATION / FIELD COMPATIBILITY
// ========================================

const normalizeProfilePicture = (value) => {
    if (value === undefined) return undefined;
    if (value === null || value === "") return "";

    if (typeof value !== "string") {
        throw new Error("Profile photo must be a valid image string.");
    }

    const photo = value.trim();

    // Allow a hosted image URL/path, or a base64 image data URL.
    if (/^(https?:\/\/|\/)/i.test(photo)) {
        if (photo.length > 2048) {
            throw new Error("Profile photo URL is too long.");
        }
        return photo;
    }

    const match = photo.match(
        /^data:image\/(png|jpeg|jpg|webp|gif);base64,([A-Za-z0-9+/=\r\n]+)$/i
    );

    if (!match) {
        throw new Error("Profile photo must be a supported image.");
    }

    // Limit decoded image data to 5 MB to avoid oversized MongoDB documents.
    const encodedData = match[2].replace(/\s/g, "");
    const decodedBytes = Math.floor(encodedData.length * 3 / 4);

    if (decodedBytes > 5 * 1024 * 1024) {
        throw new Error("Profile photo must be 5 MB or smaller.");
    }

    return `data:image/${match[1].toLowerCase()};base64,${encodedData}`;
};

const profilePhotoFields = (user) => ({
    profilePicture: user.profilePicture || "",
    // Keep compatibility with frontend components using profilePhoto.
    profilePhoto: user.profilePicture || "",
    age: user.age ?? "",
    gender: user.gender || "",
    category: user.category || "Regular",
    discountIdPhoto: user.discountIdPhoto || ""
});

// ========================================
// REGISTER
// ========================================

const register = async (req, res) => {
    try {

        const {
            fullName,
            email,
            phoneNumber,
            password,
            age,
            gender,
            category = "Regular",
            discountIdPhoto = ""
        } = req.body;

        if (
            typeof fullName !== "string" ||
            typeof email !== "string" ||
            typeof phoneNumber !== "string" ||
            typeof password !== "string" ||
            !fullName.trim() ||
            !email.trim() ||
            !phoneNumber.trim() ||
            !password
        ) {
            return res.status(400).json({
                message:
                    "Please complete all required fields."
            });
        }

        // Password strength validation
        if (!isStrongPassword(password)) {
            return res.status(400).json({
                message:
                    "Password must be at least 8 characters and include an uppercase letter, lowercase letter, number, and special character."
            });
        }

        const normalizedCategory = ["Regular", "Student", "PWD"].includes(category) ? category : "";
        const normalizedAge = age === undefined || age === "" ? undefined : Number(age);
        const needsIdPhoto = normalizedCategory === "Student" || normalizedCategory === "PWD" || (normalizedAge ?? 0) >= 60;
        let normalizedDiscountIdPhoto = "";
        try {
            normalizedDiscountIdPhoto = normalizeProfilePicture(discountIdPhoto) || "";
        } catch (photoError) {
            return res.status(400).json({ message: photoError.message });
        }
        if (!normalizedCategory || (normalizedAge !== undefined && (!Number.isInteger(normalizedAge) || normalizedAge < 0 || normalizedAge > 120)) || (gender !== undefined && (typeof gender !== "string" || !gender.trim()))) {
            return res.status(400).json({ message: "Enter a valid age, gender and passenger category." });
        }
        if (needsIdPhoto && !normalizedDiscountIdPhoto) {
            return res.status(400).json({ message: "Upload a clear photo of your Student, PWD or senior ID before creating your account." });
        }

        const normalizedEmail =
            email.trim().toLowerCase();

        // Check existing email
        const existingUser =
            await User.findOne({
                email: normalizedEmail
            });

        if (existingUser) {
            return res.status(409).json({
                message:
                    "Email is already registered."
            });
        }

        // Hash password
        const hashedPassword =
            await bcrypt.hash(
                password,
                10
            );

        // Create user
        const user = await User.create({
            fullName:
                fullName.trim(),

            email:
                normalizedEmail,

            phoneNumber:
                phoneNumber.trim(),

            age: normalizedAge,
            gender: typeof gender === "string" ? gender.trim() : "",
            category: normalizedCategory,
            discountIdPhoto: normalizedDiscountIdPhoto,
            password:
                hashedPassword
        });

        if (needsIdPhoto) {
            await DiscountRequest.findOneAndUpdate(
                { userId: user._id, passengerId: String(user._id) },
                { $set: { passengerName: user.fullName, age: normalizedAge, gender: user.gender || "Unspecified", category: normalizedAge >= 60 ? "Senior" : normalizedCategory, photo: normalizedDiscountIdPhoto, source: "Account registration", status: "pending", reason: "" } },
                { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
            );
        }

        return res.status(201).json({
            message: "Account created successfully. You can now sign in.",

            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                phoneNumber: user.phoneNumber,
                ...profilePhotoFields(user)
            }
        });

    } catch (error) {

        console.error(
            "Registration Error:",
            error
        );

        return res.status(500).json({
            message:
                "Server error during registration."
        });
    }
};


// ========================================
// LOGIN
// ========================================

const login = async (req, res) => {
    try {

        const {
            email,
            password
        } = req.body;

        // ========================================
        // BASIC VALIDATION
        // ========================================

        if (
            typeof email !== "string" ||
            typeof password !== "string" ||
            !email.trim() ||
            !password
        ) {
            return res.status(400).json({
                message:
                    "Email and password are required."
            });
        }

        // ========================================
        // NORMALIZE EMAIL
        // ========================================

        const normalizedEmail =
            email.trim().toLowerCase();

        // ========================================
        // FIND USER
        // ========================================

        const user =
            await User.findOne({
                email: normalizedEmail
            });

        // ========================================
        // USER NOT FOUND
        // ========================================

        if (!user) {
            return res.status(401).json({
                message:
                    "Invalid email or password."
            });
        }

        // ========================================
        // PASSWORD VALIDATION
        // ========================================

        if (
            typeof user.password !== "string" ||
            !user.password
        ) {
            return res.status(401).json({
                message:
                    "Invalid email or password."
            });
        }

        // ========================================
        // MAKE SURE PASSWORD IS A BCRYPT HASH
        // ========================================

        const isBcryptHash =
            /^\$2[aby]\$\d{2}\$/.test(
                user.password
            );

        if (!isBcryptHash) {
            console.error(
                `Login rejected: password for ${normalizedEmail} is not stored as a bcrypt hash.`
            );

            return res.status(401).json({
                message:
                    "Invalid email or password."
            });
        }

        // ========================================
        // COMPARE PASSWORD
        // ========================================

        const passwordMatch =
            await bcrypt.compare(
                password,
                user.password
            );

        // ========================================
        // REJECT WRONG PASSWORD
        // ========================================

        if (!passwordMatch) {
            return res.status(401).json({
                message:
                    "Invalid email or password."
            });
        }

        // ========================================
        // CREATE JWT
        // ========================================

        const token =
            createToken(user);

        // ========================================
        // LOGIN SUCCESS
        // ========================================

        return res.status(200).json({
            message:
                "Login successful.",

            ...issueSession(req, res, token, "user"),

            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                phoneNumber:
                    user.phoneNumber,
                ...profilePhotoFields(user),
                notificationsEnabled:
                    user.notificationsEnabled === true
            }
        });

    } catch (error) {

        console.error(
            "Login Error:",
            error
        );

        return res.status(500).json({
            message:
                "Server error during login."
        });
    }
};

// ========================================
// GET CURRENT USER
// ========================================

const getMe = async (req, res) => {
    try {

        const userId =
            req.user.userId;

        const user =
            await User.findById(userId)
                .select("-password");

        if (!user) {
            return res.status(404).json({
                message:
                    "User account not found."
            });
        }

        return res.status(200).json({
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                phoneNumber:
                    user.phoneNumber,
                ...profilePhotoFields(user),
                notificationsEnabled:
                    user.notificationsEnabled === true
            }
        });

    } catch (error) {

        console.error(
            "Get Current User Error:",
            error
        );

        return res.status(500).json({
            message:
                "Server error while getting user information."
        });
    }
};


// ========================================
// UPDATE PROFILE
// ========================================

const updateProfile = async (req, res) => {
    try {

        const userId =
            req.user.userId;

        const {
            fullName,
            email,
            phoneNumber,
            age,
            gender,
            category,
            discountIdPhoto
        } = req.body;

        const submittedProfilePicture =
            req.body?.profilePicture !== undefined
                ? req.body.profilePicture
                : req.body?.profilePhoto;

        let normalizedProfilePicture;
        try {
            normalizedProfilePicture =
                normalizeProfilePicture(submittedProfilePicture);
        } catch (photoError) {
            return res.status(400).json({
                message: photoError.message
            });
        }

        // Validation
        if (
            typeof fullName !== "string" ||
            typeof email !== "string" ||
            typeof phoneNumber !== "string" ||
            !fullName.trim() ||
            !email.trim() ||
            !phoneNumber.trim()
        ) {
            return res.status(400).json({
                message:
                    "Full name, email and phone number are required."
            });
        }

        const normalizedEmail =
            email.trim().toLowerCase();

        // Check duplicate email
        const existingUser =
            await User.findOne({
                email: normalizedEmail,

                _id: {
                    $ne: userId
                }
            });

        if (existingUser) {
            return res.status(409).json({
                message:
                    "That email address is already being used by another account."
            });
        }

        const currentUser = await User.findById(userId);
        if (!currentUser) {
            return res.status(404).json({ message: "User account not found." });
        }

        const profileFieldsSupplied =
            age !== undefined || gender !== undefined || category !== undefined || discountIdPhoto !== undefined;
        let normalizedPassengerProfile = {};
        let normalizedDiscountIdPhoto = currentUser.discountIdPhoto || "";
        let needsDiscountId = false;

        if (profileFieldsSupplied) {
            const normalizedAge = Number(age);
            const normalizedGender = String(gender || "").trim();
            const normalizedCategory = String(category || "").trim();
            if (!Number.isInteger(normalizedAge) || normalizedAge < 0 || normalizedAge > 120 || !normalizedGender || normalizedGender.length > 40 || !["Regular", "Student", "PWD"].includes(normalizedCategory)) {
                return res.status(400).json({ message: "Enter a valid age, gender and passenger category." });
            }
            try {
                normalizedDiscountIdPhoto = normalizeProfilePicture(discountIdPhoto) ?? normalizedDiscountIdPhoto;
            } catch (photoError) {
                return res.status(400).json({ message: photoError.message });
            }
            needsDiscountId = normalizedAge >= 60 || ["Student", "PWD"].includes(normalizedCategory);
            if (needsDiscountId && !normalizedDiscountIdPhoto) {
                return res.status(400).json({ message: "Upload a clear Student, PWD or Senior ID photo before saving this profile." });
            }
            normalizedPassengerProfile = {
                age: normalizedAge,
                gender: normalizedGender,
                category: normalizedCategory,
                discountIdPhoto: normalizedDiscountIdPhoto
            };
        }

        // Update MongoDB
        const user =
            await User.findByIdAndUpdate(
                userId,
                {
                    fullName:
                        fullName.trim(),

                    email:
                        normalizedEmail,
                    phoneNumber:
                        phoneNumber.trim(),
                    ...normalizedPassengerProfile,
                    ...(normalizedProfilePicture !== undefined
                        ? { profilePicture: normalizedProfilePicture }
                        : {})
                },
                {
                    returnDocument: "after",
                    runValidators: true
                }
            );

        if (!user) {
            return res.status(404).json({
                message:
                    "User account not found."
            });
        }

        const profileNeedsReview = profileFieldsSupplied && needsDiscountId && (
            normalizedDiscountIdPhoto !== (currentUser.discountIdPhoto || "") ||
            Number(currentUser.age) !== Number(user.age) ||
            currentUser.gender !== user.gender ||
            currentUser.category !== user.category
        );
        const existingProfileRequest = needsDiscountId
            ? await DiscountRequest.findOne({ userId: user._id, passengerId: String(user._id) }).select("_id").lean()
            : null;
        if (profileNeedsReview || (needsDiscountId && !existingProfileRequest)) {
            const reviewCategory = Number(user.age) >= 60 ? "Senior" : user.category;
            await DiscountRequest.findOneAndUpdate(
                { userId: user._id, passengerId: String(user._id) },
                { $set: {
                    passengerName: user.fullName,
                    age: user.age,
                    gender: user.gender,
                    category: reviewCategory,
                    photo: user.discountIdPhoto,
                    source: "Account profile update",
                    status: "pending",
                    reason: "",
                    reviewedBy: "",
                    reviewedAt: null
                } },
                { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
            );
        }

        const token = createToken(user);

        return res.status(200).json({
            message:
                "Profile updated successfully.",

            ...issueSession(req, res, token, "user"),

            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                phoneNumber:
                    user.phoneNumber,
                ...profilePhotoFields(user),
                notificationsEnabled:
                    user.notificationsEnabled === true
            }
        });

    } catch (error) {

        console.error(
            "Update Profile Error:",
            error
        );

        return res.status(500).json({
            message:
                "Server error while updating profile."
        });
    }
};


// ========================================
// CHANGE PASSWORD
// ========================================

const changePassword = async (req, res) => {
    try {

        const userId =
            req.user.userId;

        const {
            currentPassword,
            newPassword
        } = req.body;

        // Validation
        if (
            typeof currentPassword !== "string" ||
            typeof newPassword !== "string" ||
            !currentPassword ||
            !newPassword
        ) {
            return res.status(400).json({
                message:
                    "Current password and new password are required."
            });
        }

        if (!isStrongPassword(newPassword)) {
            return res.status(400).json({
                message:
                    "New password must be at least 8 characters and include an uppercase letter, lowercase letter, number, and special character."
            });
        }

        // Find user
        const user =
            await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                message:
                    "User account not found."
            });
        }

        // Make sure stored password is bcrypt
        const isBcryptHash =
            typeof user.password === "string" &&
            /^\$2[aby]\$\d{2}\$/.test(
                user.password
            );

        if (!isBcryptHash) {
            return res.status(401).json({
                message:
                    "Password verification failed."
            });
        }

        // Verify OLD password
        const currentPasswordMatch =
            await bcrypt.compare(
                currentPassword,
                user.password
            );

        if (!currentPasswordMatch) {
            return res.status(401).json({
                message:
                    "Current password is incorrect."
            });
        }

        // Prevent same password
        const samePassword =
            await bcrypt.compare(
                newPassword,
                user.password
            );

        if (samePassword) {
            return res.status(400).json({
                message:
                    "Your new password must be different from your current password."
            });
        }

        // Hash NEW password
        const hashedPassword =
            await bcrypt.hash(
                newPassword,
                10
            );

        // SAVE NEW PASSWORD TO MONGODB
        user.password =
            hashedPassword;

        await user.save();

        // Create fresh token
        const token =
            createToken(user);

        return res.status(200).json({
            message:
                "Password updated successfully.",

            ...issueSession(req, res, token, "user")
        });

    } catch (error) {

        console.error(
            "Change Password Error:",
            error
        );

        return res.status(500).json({
            message:
                "Server error during password change."
        });
    }
};


// ========================================
// UPDATE NOTIFICATION PREFERENCE
// ========================================

const updateNotificationPreference = async (req, res) => {
    try {
        const userId =
            req.user.userId;

        const enabled =
            req.body?.enabled;

        if (typeof enabled !== "boolean") {
            return res.status(400).json({
                message:
                    "Notification preference must be true or false."
            });
        }

        const user =
            await User.findByIdAndUpdate(
                userId,
                {
                    notificationsEnabled:
                        enabled
                },
                {
                    returnDocument: "after",
                    runValidators: true
                }
            ).select("-password");

        if (!user) {
            return res.status(404).json({
                message:
                    "User account not found."
            });
        }

        return res.status(200).json({
            message:
                enabled
                    ? "Notifications enabled successfully."
                    : "Notifications disabled successfully.",
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                phoneNumber:
                    user.phoneNumber,
                ...profilePhotoFields(user),
                notificationsEnabled:
                    user.notificationsEnabled === true
            }
        });
    } catch (error) {
        console.error(
            "Update Notification Preference Error:",
            error
        );

        return res.status(500).json({
            message:
                "Server error while updating notification preference."
        });
    }
};


// ========================================
// EXPORT
// ========================================

module.exports = {
    register,
    login,
    requestPasswordReset,
    resetPassword,
    getMe,
    updateProfile,
    changePassword,
    updateNotificationPreference
};
