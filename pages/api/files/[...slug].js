import { createRouter } from 'next-connect';
import multer from 'multer';
import { uploadFile, downloadFile, deleteFile } from '../../../src/server/services/storageService';
import fs from 'fs';

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
    await uploadFile(file.path, destination || file.originalname);
    fs.unlinkSync(file.path); // Clean up the temporary file
    res.status(200).json({ message: 'File uploaded successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get(async (req, res) => {
  const { slug } = req.query;
  const [fileName, ...destinationParts] = slug;
  const destination = destinationParts.join('/');

  try {
    await downloadFile(fileName, `./public/downloads/${destination || fileName}`);
    res.status(200).json({ message: 'File downloaded successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete(async (req, res) => {
  const { slug } = req.query;
  const [fileName] = slug;

  try {
    await deleteFile(fileName);
    res.status(200).json({ message: 'File deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export const config = {
  api: {
    bodyParser: false,
  },
};

export default router.handler();
