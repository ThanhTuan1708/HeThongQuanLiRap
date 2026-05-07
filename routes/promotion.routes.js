const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const {
    validatePromotion,
    getPromotions,
    createPromotion,
    updatePromotion,
    deletePromotion
} = require('../controllers/promotion.controller');

router.get('/', getPromotions);
router.get('/validate', protect, validatePromotion);
router.post('/', protect, authorize('admin'), createPromotion);
router.put('/:promotionId', protect, authorize('admin'), updatePromotion);
router.delete('/:promotionId', protect, authorize('admin'), deletePromotion);

module.exports = router;
