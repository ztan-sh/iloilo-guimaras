const Staff = require("../models/Staff");


// =========================================================
// CREATE STAFF
// =========================================================

const createStaff = async (req, res) => {

    try {

        const {
            name,
            email,
            password,
            confirmPassword
        } = req.body;


        // =====================================================
        // VALIDATION
        // =====================================================

        if (
            !name ||
            !email ||
            !password ||
            !confirmPassword
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Please complete all required fields."
            });
        }


        // =====================================================
        // CHECK PASSWORD
        // =====================================================

        if (password !== confirmPassword) {

            return res.status(400).json({
                success: false,
                message:
                    "Passwords do not match."
            });
        }


        // =====================================================
        // PASSWORD LENGTH
        // =====================================================

        if (password.length < 8) {

            return res.status(400).json({
                success: false,
                message:
                    "Password must be at least 8 characters."
            });
        }


        // =====================================================
        // NORMALIZE EMAIL
        // =====================================================

        const normalizedEmail =
            email.trim().toLowerCase();


        // =====================================================
        // CHECK EXISTING STAFF
        // =====================================================

        const existingStaff =
            await Staff.findOne({
                email: normalizedEmail
            });


        if (existingStaff) {

            return res.status(409).json({
                success: false,
                message:
                    "A staff account with this email already exists."
            });
        }


        // =====================================================
        // CREATE STAFF
        // =====================================================
        //
        // IMPORTANT:
        // Do NOT hash the password here.
        //
        // Staff.js already contains the bcrypt
        // pre-save middleware that hashes it.
        //
        // =====================================================

        const staff =
            await Staff.create({

                name:
                    name.trim(),

                email:
                    normalizedEmail,

                password:
                    password,

                role:
                    "staff",

                isActive:
                    true
            });


        // =====================================================
        // RESPONSE
        // =====================================================

        return res.status(201).json({

            success: true,

            message:
                "Staff account created successfully.",

            staff: {

                id:
                    staff._id,

                name:
                    staff.name,

                email:
                    staff.email,

                role:
                    staff.role,

                isActive:
                    staff.isActive
            }
        });

    } catch (error) {

        console.error(
            "Create staff error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to create staff account."
        });
    }
};


// =========================================================
// GET ALL STAFF
// =========================================================

const getAllStaff = async (req, res) => {

    try {

        const staff =
            await Staff.find()
                .select("-password")
                .sort({
                    createdAt: -1
                });


        return res.status(200).json({

            success: true,

            count:
                staff.length,

            staff

        });

    } catch (error) {

        console.error(
            "Get staff error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to retrieve staff accounts."
        });
    }
};


// =========================================================
// GET SINGLE STAFF
// =========================================================

const getStaffById = async (req, res) => {

    try {

        const staff =
            await Staff.findById(
                req.params.id
            ).select("-password");


        if (!staff) {

            return res.status(404).json({
                success: false,
                message:
                    "Staff account not found."
            });
        }


        return res.status(200).json({

            success: true,

            staff

        });

    } catch (error) {

        console.error(
            "Get staff by ID error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to retrieve staff account."
        });
    }
};


// =========================================================
// ACTIVATE STAFF
// =========================================================

const activateStaff = async (req, res) => {

    try {

        const staff =
            await Staff.findById(
                req.params.id
            );


        if (!staff) {

            return res.status(404).json({
                success: false,
                message:
                    "Staff account not found."
            });
        }


        staff.isActive = true;

        await staff.save();


        return res.status(200).json({

            success: true,

            message:
                "Staff account activated successfully.",

            staff: {

                id:
                    staff._id,

                name:
                    staff.name,

                email:
                    staff.email,

                role:
                    staff.role,

                isActive:
                    staff.isActive
            }
        });

    } catch (error) {

        console.error(
            "Activate staff error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to activate staff account."
        });
    }
};


// =========================================================
// DEACTIVATE STAFF
// =========================================================

const deactivateStaff = async (req, res) => {

    try {

        const staff =
            await Staff.findById(
                req.params.id
            );


        if (!staff) {

            return res.status(404).json({
                success: false,
                message:
                    "Staff account not found."
            });
        }


        staff.isActive = false;

        await staff.save();


        return res.status(200).json({

            success: true,

            message:
                "Staff account deactivated successfully.",

            staff: {

                id:
                    staff._id,

                name:
                    staff.name,

                email:
                    staff.email,

                role:
                    staff.role,

                isActive:
                    staff.isActive
            }
        });

    } catch (error) {

        console.error(
            "Deactivate staff error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to deactivate staff account."
        });
    }
};


// =========================================================
// DELETE STAFF
// =========================================================

const deleteStaff = async (req, res) => {

    try {

        const staff =
            await Staff.findById(
                req.params.id
            );


        if (!staff) {

            return res.status(404).json({
                success: false,
                message:
                    "Staff account not found."
            });
        }


        await Staff.findByIdAndDelete(
            req.params.id
        );


        return res.status(200).json({

            success: true,

            message:
                "Staff account deleted successfully."

        });

    } catch (error) {

        console.error(
            "Delete staff error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to delete staff account."
        });
    }
};




// =========================================================
// UPDATE STAFF
// =========================================================
// Allows an Administrator to update a staff member's name,
// email, and/or password. Staff.js hashes a changed password
// automatically through its pre-save middleware.
// =========================================================

const updateStaff = async (req, res) => {

    try {

        const {
            name,
            email,
            password,
            confirmPassword
        } = req.body;

        const staff = await Staff.findById(req.params.id);

        if (!staff) {
            return res.status(404).json({
                success: false,
                message: "Staff account not found."
            });
        }

        if (name !== undefined) {
            const trimmedName = String(name).trim();

            if (!trimmedName) {
                return res.status(400).json({
                    success: false,
                    message: "Staff name cannot be empty."
                });
            }

            staff.name = trimmedName;
        }

        if (email !== undefined) {
            const normalizedEmail = String(email).trim().toLowerCase();
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (!emailPattern.test(normalizedEmail)) {
                return res.status(400).json({
                    success: false,
                    message: "Please enter a valid email address."
                });
            }

            const existingStaff = await Staff.findOne({
                email: normalizedEmail,
                _id: { $ne: staff._id }
            });

            if (existingStaff) {
                return res.status(409).json({
                    success: false,
                    message: "A staff account with this email already exists."
                });
            }

            staff.email = normalizedEmail;
        }

        if (password !== undefined && password !== "") {
            if (password.length < 8) {
                return res.status(400).json({
                    success: false,
                    message: "Password must be at least 8 characters."
                });
            }

            if (password !== confirmPassword) {
                return res.status(400).json({
                    success: false,
                    message: "Passwords do not match."
                });
            }

            staff.password = password;
        }

        await staff.save();

        return res.status(200).json({
            success: true,
            message: "Staff account updated successfully.",
            staff: {
                id: staff._id,
                name: staff.name,
                email: staff.email,
                role: staff.role,
                isActive: staff.isActive
            }
        });

    } catch (error) {

        console.error("Update staff error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to update staff account."
        });
    }
};

// =========================================================
// EXPORT
// =========================================================

module.exports = {

    createStaff,

    getAllStaff,

    getStaffById,

    updateStaff,

    activateStaff,

    deactivateStaff,

    deleteStaff

};