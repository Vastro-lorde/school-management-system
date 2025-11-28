import { createRouter } from 'next-connect';
import multer from 'multer';
import fs from 'fs';
import { uploadImage } from '../../../src/server/services/cloudinaryService';

const upload = multer({
  storage: multer.diskStorage({
    destination: './public/uploads',
    filename: (req, file, cb) => cb(null, file.originalname),
  }),
});

const router = createRouter();

router.use(upload.single('file'));

router.post(async (req, res) => {
  const { file } = req;
  const { destination } = req.body;

  if (!file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  try {
    const folder = destination || 'avatars';
    const { url, publicId } = await uploadImage(file.path, folder);
    fs.unlinkSync(file.path); // Clean up the temporary file
    res.status(200).json({ message: 'File uploaded successfully', url, publicId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Download and delete endpoints are not needed for Cloudinary in this flow,
// but kept as stubs in case of future extension.
router.get(async (_req, res) => {
  return res.status(501).json({ error: 'Not implemented' });
});

router.delete(async (_req, res) => {
  return res.status(501).json({ error: 'Not implemented' });
});

export const config = {
  api: {
    bodyParser: false,
  },
};

export default router.handler();
