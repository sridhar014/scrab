import { Router } from 'express';
import { find, findByIdAndUpdate } from '../models/order';
const router = Router();

// List all orders with customer info
router.get('./orders', async (req, res) => {
  const orders = await find().populate('customer', 'mobile');
  res.json({ orders });
});

// Change order status
router.post('./order/:orderId/status', async (req, res) => {
  const { status } = req.body; // "Scheduled", "Completed", "Rejected"
  let order = await findByIdAndUpdate(req.params.orderId, { status }, { new: true });
  res.json({ success: true, order });
});

export default router;
