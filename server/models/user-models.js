const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
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
      minlength: 6,
      select: false,
    },
    phone: {
      type: String,
      default: "",
      trim: true,
    },
    role: {
      type: String,
      enum: ["user", "owner", "admin"],
      default: "user",
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    profileImage: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: "users",
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

userSchema.virtual("username")
  .get(function getUsername() {
    return this.name;
  })
  .set(function setUsername(value) {
    this.name = value;
  });

userSchema.pre("save", async function () {
  if (!this.role || this.isAdmin) {
    this.role = this.isAdmin ? "admin" : "user";
  }

  this.isAdmin = this.role === "admin";

  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

userSchema.methods.generateToken = async function () {
  try {
    return jwt.sign(
      {
        userId: this._id.toString(),
        email: this.email,
        role: this.role || (this.isAdmin ? "admin" : "user"),
        isAdmin: this.isAdmin || this.role === "admin",
      },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );
  } catch (error) {
    console.error("generateToken error:", error);
    throw new Error("Failed to generate auth token");
  }
};

userSchema.methods.generateAuthToken = async function () {
  return this.generateToken();
};

const User = mongoose.models.User || mongoose.model("User", userSchema);

User.syncLegacyAdminRoles = async function syncLegacyAdminRoles() {
  await this.updateMany(
    { isAdmin: true, role: { $ne: "admin" } },
    { $set: { role: "admin" } }
  );
};

module.exports = User;
