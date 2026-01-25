import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Name is required"],
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: [true, "Password is required"],
            minlength: [6, "Password must be at least 6 characters long"],
        },
        role: {
            type: String,
            enum: ["employee", "admin", "manager", "auditor"],
            default: "employee",
        },
        department: {
            type: String,
            default: "General"
        },


        twoFactorSecret: { type: String, default: null },
        twoFactorEnabled: { type: Boolean, default: false },
        twoFactorBackupCodes: [{
            code: String,
            used: { type: Boolean, default: false }
        }],

        passwordResetToken: { type: String, default: null },
        passwordResetExpires: { type: Date, default: null },

        lastLoginAt: { type: Date, default: Date.now },
        lastLoginIp: { type: String, default: "" },
        failedLoginAttempts: { type: Number, default: 0 },
        accountLockedUntil: { type: Date, default: null }
    },
    {
        timestamps: true,
    }
);

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

userSchema.methods.comparePassword = async function (password) {
    return bcrypt.compare(password, this.password);
};

userSchema.methods.isLocked = function () {
    return this.accountLockedUntil && this.accountLockedUntil > new Date();
};

const User = mongoose.model("User", userSchema);
export default User;