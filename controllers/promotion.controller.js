const Promotion = require('../models/promotion');
const PromotionUsage = require('../models/promotionUsage');
const { sendSuccess, sendError } = require('../utils/response');

exports.validatePromotion = async (req, res, next) => {
    try {
        const { code } = req.query;

        if (!code) return sendError(res, 'Vui long nhap ma khuyen mai.', 400);

        const promo = await Promotion.findOne({
            code: code.toUpperCase(),
            status: 'active',
            validFrom: { $lte: new Date() },
            validTo: { $gte: new Date() }
        });

        if (!promo) {
            return sendError(res, 'Ma khuyen mai khong hop le hoac da het han.', 404);
        }

        if (promo.usageLimit && promo.usedCount >= promo.usageLimit) {
            return sendError(res, 'Ma khuyen mai da het luot su dung.', 422);
        }

        if (req.user) {
            const userUsageCount = await PromotionUsage.countDocuments({
                promotion: promo._id,
                user: req.user._id
            });
            if (promo.perUserLimit && userUsageCount >= promo.perUserLimit) {
                return sendError(res, 'Ban da su dung het luot cho ma nay.', 422);
            }
        }

        sendSuccess(res, {
            code: promo.code,
            name: promo.name,
            discountType: promo.discountType,
            discountValue: promo.discountValue,
            maxDiscount: promo.maxDiscount,
            minOrderValue: promo.minOrderValue,
            validTo: promo.validTo
        }, 'Ma khuyen mai hop le');
    } catch (err) {
        next(err);
    }
};

exports.getPromotions = async (req, res, next) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;
        const pageNumber = parseInt(page, 10);
        const limitNumber = parseInt(limit, 10);
        const query = {};

        if (req.user?.role === 'admin') {
            if (status) query.status = status;
        } else {
            query.status = status || 'active';
            query.validTo = { $gte: new Date() };
        }

        const promotions = await Promotion.find(query)
            .sort({ validTo: 1, createdAt: -1 })
            .skip((pageNumber - 1) * limitNumber)
            .limit(limitNumber);

        const total = await Promotion.countDocuments(query);

        sendSuccess(res, {
            promotions,
            pagination: {
                page: pageNumber,
                limit: limitNumber,
                total,
                totalPages: Math.ceil(total / limitNumber)
            }
        });
    } catch (err) {
        next(err);
    }
};

exports.createPromotion = async (req, res, next) => {
    try {
        const promotion = await Promotion.create(req.body);
        sendSuccess(res, { promotion }, 'Promotion created', 201);
    } catch (err) {
        next(err);
    }
};

exports.updatePromotion = async (req, res, next) => {
    try {
        const promotion = await Promotion.findByIdAndUpdate(
            req.params.promotionId,
            req.body,
            { new: true, runValidators: true }
        );
        if (!promotion) return sendError(res, 'Khuyen mai khong ton tai.', 404);
        sendSuccess(res, { promotion }, 'Promotion updated');
    } catch (err) {
        next(err);
    }
};

exports.deletePromotion = async (req, res, next) => {
    try {
        const promotion = await Promotion.findByIdAndUpdate(
            req.params.promotionId,
            { status: 'inactive' },
            { new: true }
        );
        if (!promotion) return sendError(res, 'Khuyen mai khong ton tai.', 404);
        sendSuccess(res, { promotion }, 'Promotion deactivated');
    } catch (err) {
        next(err);
    }
};
