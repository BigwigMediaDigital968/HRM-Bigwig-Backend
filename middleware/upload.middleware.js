const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    let folder = "employees/documents";

    if (file.fieldname === "photo") folder = "employees/photos";
    if (file.fieldname === "aadhaar") folder = "employees/aadhaar";
    if (file.fieldname === "pan") folder = "employees/pan";

    return {
      folder,
      resource_type: file.mimetype === "application/pdf" ? "raw" : "image",
      allowed_formats: ["jpg", "png", "jpeg", "pdf"],
    };
  },
});

const upload = multer({ storage });

module.exports = upload;
