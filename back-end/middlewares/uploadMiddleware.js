import multer from "multer";

const storage = multer.memoryStorage();

const allowedMimeTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
];

const allowedExtensions = [
    ".pdf",
    ".doc",
    ".docx"
];


const upload = multer({
    storage,
    limits: {
        fileSize: 1024 * 1024 * 2 // 2 MB
    },
    fileFilter: (req, file, cb) => {
        const fileName = file.originalname.toLowerCase();

        const hasValidExtension = allowedExtensions.some((ext) => 
        fileName.endsWith(ext)
        );

        const hasValidMimeType = allowedMimeTypes.includes(file.mimetype);

        if(!hasValidExtension && !hasValidMimeType) {
            return cb(new Error("Only PDF, DOC, and DOCX files are allowed."));
        }

        cb(null, true);
    }

})

export default upload;
