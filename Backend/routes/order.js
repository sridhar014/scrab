import { Router } from 'express';
import { create, find } from '../models/order';
import multer, { diskStorage } from 'multer';
const router = Router();

const storage = diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage: storage });

// Place new order
router.post('/new', upload.array('photos', 5), async (req, res) => {
  const { userId, category, weight, date, time } = req.body;
  if (!userId || !category || !weight || !date || !time || !req.files.length) return res.status(400).json({error: "All fields required"});
  
  const photos = req.files.map(f => f.path);
  const order = await create({ customer: userId, category, weight, date, time, photos });
  res.json({ success: true, order });
});

// Get order history
router.get('/my-orders/:userId', async (req, res) => {
  const orders = await find({ customer: req.params.userId }).sort('-_id');
  res.json({ orders });
});

export default router;
